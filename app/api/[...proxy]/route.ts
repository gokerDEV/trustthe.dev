import { auth } from '@/auth.config';
import { getClientCredentialsToken } from '@/lib/auth/token-manager';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.KODKAFA_API_URL!;
const AUTH_SECRET = process.env.AUTH_SECRET!;

// Client-credentials'ın kullanılabileceği public GET uçları (whitelist)
const PUBLIC_GET_ALLOWLIST: RegExp[] = [
  /^posts(\/.*)?$/, // posts, posts/:id, posts/... gibi
  /^categories(\/.*)?$/,
  // ekle...
];

// Hop-by-hop ve istemediğimiz başlıkları süzmek için
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

function normalizePath(
  fromParams: string[] | undefined,
  req: NextRequest
): string {
  if (fromParams && fromParams.length > 0) return fromParams.join('/');
  // /api/proxy/… deseninden arta kalan path’i al
  // const raw = req.nextUrl.pathname.replace(/^\/api\/proxy\//, '');
  // return raw.replace(/^\[\.{3}proxy\]\//, '');

  return req.nextUrl.pathname.replace('/api/', '');
}

function isPublicGetEligible(method: string, path: string): boolean {
  if (method !== 'GET') return false;
  const clean = path.replace(/^\/+/, '');
  return PUBLIC_GET_ALLOWLIST.some((re) => re.test(clean));
}

function sanitizeRequestHeaders(incoming: Headers): Headers {
  const headers = new Headers();

  // Güvenli kopyalama (bazı başlıkları atla)
  incoming.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === 'cookie') return;
    if (k === 'authorization') return;
    if (k === 'host') return;
    if (HOP_BY_HOP.has(k)) return;

    // Accept / Content-* gibi başlıklar geçebilir
    headers.set(key, value);
  });

  return headers;
}

function filterUpstreamResponseHeaders(up: Headers): Headers {
  const headers = new Headers();
  up.forEach((value, key) => {
    const k = key.toLowerCase();
    if (HOP_BY_HOP.has(k)) return;
    // Genellikle backend’den gelen Set-Cookie’yi FE’ye taşımak istemeyiz (BFF cookie alanı server’a ait)
    if (k === 'set-cookie') return;
    headers.set(key, value);
  });
  return headers;
}

// Basit Origin koruması (state-changing isteklerde)
function assertCsrfLikeGuard(req: NextRequest) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return;

  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (!origin || !host) throw new Error('origin_missing');

  try {
    const u = new URL(origin);
    if (u.host !== host) throw new Error('origin_mismatch');
  } catch {
    throw new Error('origin_invalid');
  }

  // Ek olarak özel header zorunluluğu (ör. BFF çağrısı olduğunu kanıtlamak için)
  if (req.headers.get('x-bff') !== '1') throw new Error('bff_header_missing');
}

async function proxyToBackend(
  req: NextRequest,
  method: string,
  params?: Promise<{ proxy?: string[] }> | { proxy?: string[] }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const path = normalizePath(resolvedParams?.proxy, req);
  // const backendUrl = `${API_BASE.replace(/\/+$/, '')}/${path}${req.nextUrl.search}`;

  const searchParams = req.nextUrl.search;
  const backendUrl = `${API_BASE}/${path}${searchParams}`;

  // ---- CSRF-like guard (yalnız state-changing) ----
  // GET istekleri için CSRF guard'ı atla (build time'da sorun çıkarabilir)
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      assertCsrfLikeGuard(req);
    } catch (e) {
      if (e instanceof Error) {
        return NextResponse.json(
          { error: 'forbidden', reason: e.message },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  // ---- Session & JWT (NextAuth) ----
  // Build time'da auth() çağrısı timeout'a düşebilir, bu yüzden timeout ekliyoruz
  let session = null;
  let token = null;

  try {
    // Build time'da request context olmayabilir, bu yüzden timeout ile koruyoruz
    const authPromise = Promise.all([
      auth().catch(() => null),
      getToken({ req, secret: AUTH_SECRET }).catch(() => null),
    ]);

    const authTimeout = new Promise<[null, null]>((resolve) => {
      setTimeout(() => resolve([null, null]), 2000); // 2 saniye timeout
    });

    const [sessionResult, tokenResult] = await Promise.race([
      authPromise,
      authTimeout,
    ]);
    session = sessionResult ?? null;
    token = tokenResult ?? null;
  } catch {
    // Auth hatası - build time'da normal, client_credentials kullanacağız
  }

  let bearer: string | undefined;

  // Öncelik: Kullanıcı access_token
  if (session && token?.access_token && typeof token.expires_at === 'number') {
    if (token.expires_at > Date.now()) {
      bearer = String(token.access_token);
    }
  }

  // Yoksa, yalnız whitelist GET uçlarında client_credentials
  if (!bearer && isPublicGetEligible(method, path)) {
    try {
      // Client credentials için de timeout ekliyoruz
      const tokenPromise = getClientCredentialsToken();
      const tokenTimeout = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 5000); // 5 saniye timeout
      });

      bearer = await Promise.race([tokenPromise, tokenTimeout]);
    } catch {
      // public token alamadık → yetkisiz kabul edeceğiz
    }
  }

  // Authorization yoksa → 401
  if (!bearer) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // ---- Headers ----
  const headers = sanitizeRequestHeaders(req.headers);
  headers.set('authorization', `Bearer ${bearer}`);
  // İsterseniz BFF izi:
  headers.set('x-forwarded-by', 'bff');

  // Content-Type / Body: GET/HEAD dışındakilerde forward
  const hasBody = !(method === 'GET' || method === 'HEAD');
  const init: RequestInit = {
    method,
    headers,
    cache: 'no-store',
    // @ts-expect-error Node fetch duplex hint
    duplex: hasBody ? 'half' : undefined,
    body: hasBody ? req.body : undefined,
    signal: undefined,
  };

  // ---- Timeout ----
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  init.signal = controller.signal;

  let upstream: Response;
  try {
    upstream = await fetch(backendUrl, init);
  } catch (error) {
    clearTimeout(timeout);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'bad_gateway',
        message: 'API backend unreachable',
        details: msg,
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }

  // Kullanıcı token’ı ile gittiysek ve 401 aldıysak, aynen ilet (NextAuth sonraki isteklerde refresh’i dener)
  if (upstream.status === 401 && session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // ---- Response headers filtrasyonu ----
  const respHeaders = filterUpstreamResponseHeaders(upstream.headers);

  // (Opsiyonel) Public GET’lerde cache başlıklarını burada set edebilirsin:
  // if (isPublicGetEligible(method, path) && upstream.ok) {
  //   respHeaders.set('cache-control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=60');
  // }

  // 204 vb. gövdeler için body null olabilir → doğrudan aktar
  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

// ---- Route exports ----
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  return proxyToBackend(req, 'GET', params);
}
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  return proxyToBackend(req, 'POST', params);
}
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  return proxyToBackend(req, 'PUT', params);
}
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  return proxyToBackend(req, 'PATCH', params);
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  return proxyToBackend(req, 'DELETE', params);
}

// async function handleRequest(
//   request: NextRequest,
//   method: string,
//   params: { proxy?: string[] }
// ) {
//   // Reconstruct path from catch-all route params or use pathname
//   let path: string;

//   if (params?.proxy && params.proxy.length > 0) {
//     // Path from catch-all route params
//     path = params.proxy.join('/');
//   } else {
//     // Fallback: extract from pathname (remove /api/ prefix)
//     path = request.nextUrl.pathname.replace('/api/', '');
//     // Remove [...proxy] segment if present in pathname (shouldn't happen, but just in case)
//     if (path.startsWith('[...proxy]/')) {
//       path = path.replace('[...proxy]/', '');
//     }
//   }

//   const searchParams = request.nextUrl.search;
//   const backendUrl = `${process.env.KODKAFA_API_URL}/${path}${searchParams}`;

//   // Get NextAuth session and JWT token
//   // auth() triggers JWT callback which handles token refresh automatically
//   const session = await auth();

//   // Get JWT token - this reads the JWT cookie which may have been refreshed by auth()
//   const token = await getToken({
//     req: request,
//     secret: process.env.AUTH_SECRET,
//   });

//   let accessToken: string | undefined;

//   // If user is authenticated, get access_token from JWT token
//   // NextAuth JWT callback (in auth.config.ts) handles token refresh automatically
//   // with a 30-second buffer before expiry
//   if (session && token?.access_token) {
//     const tokenAccessToken = token.access_token as string;

//     // Check if access_token is valid (not empty string - auth.config.ts sets it to '' on refresh failure)
//     if (tokenAccessToken && tokenAccessToken.length > 0) {
//       const expiresAt = typeof token.expires_at === 'number' ? token.expires_at : 0;
//       const now = Date.now();

//       // Use token if it's valid (expires_at > now) or if expires_at is 0 (might indicate refresh in progress)
//       // Note: expires_at = 0 in auth.config.ts means token was cleared, so we check tokenAccessToken first
//       if (expiresAt > now) {
//         accessToken = tokenAccessToken;
//         const timeUntilExpiry = Math.round((expiresAt - now) / 1000);
//         console.log(
//           'Proxy: User access token valid, expires in',
//           timeUntilExpiry,
//           'seconds'
//         );
//       } else if (expiresAt === 0) {
//         // expires_at = 0 means token was cleared (refresh failed) - don't use it
//         console.log('Proxy: User access token was cleared (refresh failed) - using OAuth token');
//       } else {
//         // Token expired and wasn't refreshed - NextAuth JWT callback should handle this
//         // but if it didn't, we'll fall back to OAuth client credentials
//         console.log(
//           'Proxy: User access token expired',
//           Math.round((now - expiresAt) / 1000),
//           'seconds ago - falling back to OAuth token'
//         );
//       }
//     } else {
//       console.log('Proxy: User access token is empty - using OAuth token');
//     }
//   }

//   // Get OAuth API token for public endpoints (when no user token available)
//   // This is for public content that doesn't require user authentication
//   let apiOAuthToken: string | undefined;
//   if (!accessToken) {
//     try {
//       apiOAuthToken = await getAccessToken();
//       console.log('Proxy: Using OAuth client credentials token for public content');
//     } catch (error) {
//       console.error('Proxy: Failed to get OAuth token for API:', error);
//     }
//   }

//   const headers = new Headers(request.headers);
//   headers.delete('cookie'); // Do not forward client cookies to backend

//   // Set Authorization header: user token if available, otherwise OAuth API token (like server-side)
//   if (accessToken) {
//     headers.set('Authorization', `Bearer ${accessToken}`);
//     console.log(
//       'Proxy: Authorization header set with user token length:',
//       accessToken.length
//     );
//   } else if (apiOAuthToken) {
//     headers.set('Authorization', `Bearer ${apiOAuthToken}`);
//     console.log(
//       'Proxy: Authorization header set with API OAuth token length:',
//       apiOAuthToken.length
//     );
//   } else {
//     console.log('Proxy: No access token available');
//   }

//   try {
//     const response = await fetch(backendUrl, {
//       method,
//       headers,
//       body: request.body,
//       // @ts-expect-error - duplex is required for streaming request body in Next.js 13+ but not in standard fetch types
//       duplex: 'half',
//     });

//     if (response.status === 401 && accessToken) {
//       // User token was used but backend rejected it
//       // NextAuth will handle token refresh on next request
//       const errorResponse = NextResponse.json(
//         { error: 'Backend authentication failed' },
//         { status: 401 }
//       );
//       return errorResponse;
//     }

//     // Re-stream the response body back to the client
//     return new NextResponse(response.body, {
//       status: response.status,
//       statusText: response.statusText,
//       headers: response.headers,
//     });
//   } catch (error: unknown) {
//     const errorMessage =
//       error instanceof Error && error.cause
//         ? String(error.cause)
//         : String(error);
//     console.error(
//       `BFF Proxy Error: Failed to connect to backend at ${backendUrl}. Details: ${errorMessage}`
//     );
//     return NextResponse.json(
//       {
//         error: 'Bad Gateway',
//         message: 'The API backend is not reachable.',
//         details: errorMessage,
//       },
//       { status: 502 }
//     );
//   }
// }

// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ proxy?: string[] }> }
// ) {
//   const resolvedParams = await params;
//   return handleRequest(request, 'GET', resolvedParams);
// }

// export async function POST(
//   request: NextRequest,
//   { params }: { params: Promise<{ proxy?: string[] }> }
// ) {
//   const resolvedParams = await params;
//   return handleRequest(request, 'POST', resolvedParams);
// }

// export async function PUT(
//   request: NextRequest,
//   { params }: { params: Promise<{ proxy?: string[] }> }
// ) {
//   const resolvedParams = await params;
//   return handleRequest(request, 'PUT', resolvedParams);
// }

// export async function PATCH(
//   request: NextRequest,
//   { params }: { params: Promise<{ proxy?: string[] }> }
// ) {
//   const resolvedParams = await params;
//   return handleRequest(request, 'PATCH', resolvedParams);
// }

// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: Promise<{ proxy?: string[] }> }
// ) {
//   const resolvedParams = await params;
//   return handleRequest(request, 'DELETE', resolvedParams);
// }

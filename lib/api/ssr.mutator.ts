import { getClientCredentialsToken } from '@/lib/auth/token-manager';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface FetchOptions<TBody>
  extends Omit<RequestInit, 'method' | 'headers' | 'body'> {
  method?: HttpMethod;
  headers?: HeadersInit;
  params?: QueryParams;
  body?: TBody;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  cache?: RequestCache;
}

/**
 * Type helper to pass next.revalidate and cache through RequestInit
 * Used when calling generated SSR functions that accept RequestInit
 */
export type FetchOptionsWithNext = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: RequestCache;
};

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.append(k, String(v));
  });
  const q = usp.toString();
  return q.length > 0 ? `?${q}` : '';
}

function isProxyUrl(url: string): boolean {
  return url.startsWith('/api/');
}

function convertProxyUrlToBackendUrl(proxyUrl: string): string {
  // /api/posts/goker.me/by-slug/goker -> posts/goker.me/by-slug/goker
  const path = proxyUrl.replace(/^\/api\//, '');
  const apiBase = process.env.KODKAFA_API_URL;
  if (!apiBase) {
    throw new Error('KODKAFA_API_URL environment variable is required');
  }
  return `${apiBase.replace(/\/+$/, '')}/${path}`;
}

export async function ssrMutator<TResponse, TBody = unknown>(
  url: string,
  options?: FetchOptions<TBody>
): Promise<TResponse> {
  const query = buildQuery(options?.params);
  const method = options?.method ?? (options?.body ? 'POST' : 'GET');

  // SSR context'te proxy URL'lerini backend'e direkt çevir
  // Bu, production build'de kendi sunucusuna istek yapma sorununu çözer
  if (isProxyUrl(url)) {
    const backendUrl = convertProxyUrlToBackendUrl(url);
    const targetUrl = `${backendUrl}${query}`;

    // SSR'da client credentials token kullan
    const headers = new Headers();
    if (options?.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers.set(key, value);
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers.set(key, value);
        });
      } else {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (value) {
            headers.set(
              key,
              Array.isArray(value) ? value.join(', ') : String(value)
            );
          }
        });
      }
    }

    if (!headers.has('authorization')) {
      // Lazy token loading - only fetch when needed
      // This prevents DYNAMIC_SERVER_USAGE errors during static generation
      const token = await getClientCredentialsToken();
      headers.set('authorization', `Bearer ${token}`);
    }

    // Determine cache strategy:
    // - If next.revalidate is provided, use 'default' to allow static generation
    // - If cache is explicitly set, use it
    // - Otherwise, default to 'no-store' for dynamic requests
    // Note: For external API calls, 'default' allows Next.js to statically generate
    // the page even though the fetch itself won't be cached by Next.js
    const cacheStrategy: RequestCache =
      options?.cache ??
      (options?.next?.revalidate !== undefined &&
      options.next.revalidate !== false
        ? 'default'
        : 'no-store');

    const init: RequestInit = {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      cache: cacheStrategy,
    };

    const res = await fetch(targetUrl, init);
    const ct = res.headers.get('content-type') ?? '';

    if (ct.includes('application/json')) {
      const json = await res.json();
      return {
        status: res.status,
        data: json,
      } as TResponse;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    return {
      status: res.status,
      data: await res.text(),
    } as unknown as TResponse;
  }

  // Proxy URL değilse, mevcut davranışı koru (relative URL için)
  // Bu durumda Next.js'in internal fetch'i kullanılır
  const absoluteUrl =
    url.startsWith('http://') || url.startsWith('https://')
      ? url
      : url.startsWith('/')
        ? url
        : `/${url}`;

  const init: RequestInit = {
    method,
    headers: options?.headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  };

  const res = await fetch(`${absoluteUrl}${query}`, {
    ...init,
    next: options?.next,
    cache: options?.cache,
  });
  const ct = res.headers.get('content-type') ?? '';

  if (ct.includes('application/json')) {
    const json = await res.json();
    return {
      status: res.status,
      data: json,
    } as TResponse;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return {
    status: res.status,
    data: await res.text(),
  } as unknown as TResponse;
}

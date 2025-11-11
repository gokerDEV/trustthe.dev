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

function getBaseUrl(): string {
  // Build time ve runtime için base URL
  // Vercel'de VERCEL_URL kullanılır, local'de localhost
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  // Default: localhost (development ve build time için)
  return 'http://localhost:3000';
}

function toAbsoluteUrl(url: string): string {
  // Zaten mutlak URL ise olduğu gibi döndür
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Relative URL'yi mutlak URL'ye çevir
  const baseUrl = getBaseUrl();
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;

  console.log('baseUrl', baseUrl);
  console.log('cleanUrl', cleanUrl);
  return `${baseUrl}${cleanUrl}`;
}

export async function ssrMutator<TResponse, TBody = unknown>(
  url: string,
  options?: FetchOptions<TBody>
): Promise<TResponse> {
  const query = buildQuery(options?.params);

  console.log('url', url);
  const absoluteUrl = toAbsoluteUrl(url);
  const init: RequestInit = {
    method: options?.method ?? (options?.body ? 'POST' : 'GET'),
    headers: options?.headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    // SSR tarafında token yönetimi BFF'de; cache politika kontrolü burada:
    // cache: 'no-store',
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
    // Response'u { status, data } formatına çevir
    return {
      status: res.status,
      data: json,
    } as TResponse;
  }

  // JSON olmayan response'lar için
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return {
    status: res.status,
    data: await res.text(),
  } as unknown as TResponse;
}

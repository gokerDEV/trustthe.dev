'use client';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/** RequestInit ile uyumlu + ekstra 'params' alanı; 'body' tipi RequestInit ile uyumlu */
export type BffRequestInit = Omit<
  RequestInit,
  'body' | 'method' | 'headers'
> & {
  method?: HttpMethod;
  headers?: HeadersInit;
  params?: QueryParams;
  body?: BodyInit | null | undefined;
};

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    usp.append(k, String(v));
  }
  const q = usp.toString();
  return q ? `?${q}` : '';
}

export async function clientMutator<TResponse>(
  url: string,
  options?: BffRequestInit
): Promise<TResponse> {
  const query = buildQuery(options?.params);

  // Header’ları oluştur
  const headers = new Headers(options?.headers);
  const hasBody = options?.body !== undefined && options?.body !== null;

  if (hasBody) {
    // FormData ise content-type otomatik belirlenir → elle set etme
    const isFormData =
      typeof FormData !== 'undefined' && options!.body instanceof FormData;
    if (!isFormData && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    if (isFormData && headers.has('content-type')) {
      headers.delete('content-type');
    }
  }

  const init: RequestInit = {
    method: options?.method ?? (hasBody ? 'POST' : 'GET'),
    headers,
    body: options?.body, // BodyInit | null | undefined
    credentials: options?.credentials ?? 'include',
    cache: options?.cache ?? 'no-store',
    integrity: options?.integrity,
    keepalive: options?.keepalive,
    mode: options?.mode,
    redirect: options?.redirect,
    referrer: options?.referrer ?? undefined,
    referrerPolicy: options?.referrerPolicy,
    signal: options?.signal,
    // 'window' alanını hiç set etmiyoruz (tarayıcı iç kullanım)
  };

  const res = await fetch(url + query, init);
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

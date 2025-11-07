import { getAccessToken } from '@/lib/auth/token-manager';

const API_URL = process.env.API_URL || 'http://localhost:3388';

export const customInstance = async <T>(
  url: string,
  config: RequestInit & { next?: { revalidate?: number | false };
  cache?: RequestCache; }
): Promise<T> => {
  const token = await getAccessToken();

  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    next: {
      revalidate: config.next?.revalidate, 
      ...config.next,
    },
    cache: config.cache,
  });

  const data = await response.json();
  const headers = response.headers;

  // Return response object with status and data matching Orval's expected format
  return {
    data,
    status: response.status,
    headers,
  } as T;
};

/**
 * Client-side mutator for React Query hooks
 * Routes all requests through the BFF proxy pattern
 */
export const customInstance = async <T>(
  url: string,
  config: RequestInit & {
    next?: { revalidate?: number | false };
    cache?: RequestCache;
  }
): Promise<T> => {
  // Remove leading slash if present and construct proxy URL
  // Next.js catch-all route app/api/[...proxy]/route.ts matches /api/{path}
  // The [...proxy] is just the param name, not part of the actual URL
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  const proxyUrl = `/api/${cleanUrl}`;

  const response = await fetch(proxyUrl, {
    ...config,
    headers: {
      ...config.headers,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Request failed',
    }));
    throw error;
  }

  const data = await response.json();
  const headers = response.headers;

  // Return response object with status and data matching Orval's expected format
  return {
    data,
    status: response.status,
    headers,
  } as T;
};

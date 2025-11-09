import { getClientCredentialsToken } from '@/app/lib/auth-utils';
import { deleteSession, getSession, updateSession } from '@/app/lib/session';
import { authControllerRefresh } from '@/kodkafa/client/user-authentication-management/user-authentication-management';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to refresh the token directly
async function refreshSessionToken(): Promise<string | null> {
  const session = await getSession();
  if (!session?.refresh_token) {
    await deleteSession();
    return null;
  }

  try {
    const apiToken = await getClientCredentialsToken();

    const refreshResponse = await authControllerRefresh({
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });

    if (refreshResponse.status !== 200) {
      console.error('Proxy: Token refresh failed.');
      await deleteSession();
      return null;
    }

    const tokens = refreshResponse.data;
    const updatedSession = await updateSession({
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || session.refresh_token,
      expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
    });

    return updatedSession?.access_token || null;
  } catch (error) {
    console.error('Proxy: Internal refresh error:', error);
    await deleteSession();
    return null;
  }
}

async function handleRequest(
  request: NextRequest,
  method: string,
  params?: { proxy?: string[] }
) {
  // Reconstruct path from catch-all route params or use pathname
  let path: string;

  if (params?.proxy && params.proxy.length > 0) {
    // Path from catch-all route params
    path = params.proxy.join('/');
  } else {
    // Fallback: extract from pathname (remove /api/ prefix)
    path = request.nextUrl.pathname.replace('/api/', '');
    // Remove [...proxy] segment if present in pathname (shouldn't happen, but just in case)
    if (path.startsWith('[...proxy]/')) {
      path = path.replace('[...proxy]/', '');
    }
  }

  const searchParams = request.nextUrl.search;
  const backendUrl = `${process.env.KODKAFA_API_URL}/${path}${searchParams}`;

  // Get JWT session
  const session = await getSession();
  let accessToken: string | undefined;

  if (session) {
    const now = Date.now();
    const timeUntilExpiry = Math.round((session.expires_at - now) / 1000);

    if (session.expires_at > now) {
      accessToken = session.access_token;
      console.log(
        'Proxy: Access token valid, expires in',
        timeUntilExpiry,
        'seconds'
      );
    } else {
      console.log(
        'Proxy: Access token expired',
        Math.abs(timeUntilExpiry),
        'seconds ago, attempting refresh.'
      );
      const newAccessToken = await refreshSessionToken();
      if (newAccessToken) {
        accessToken = newAccessToken;
        console.log('Proxy: Token refresh successful');
      } else {
        console.log('Proxy: Token refresh failed, clearing session');
        // Refresh failed, clear cookie and return 401
        const response = NextResponse.json(
          { error: 'Session expired' },
          { status: 401 }
        );
        return response;
      }
    }
  }

  const headers = new Headers(request.headers);
  headers.delete('cookie'); // Do not forward client cookies to backend
  headers.set('X-Api-Token', process.env.KODKAFA_CLIENT_ID!);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
    console.log(
      'Proxy: Authorization header set with token length:',
      accessToken.length
    );
  } else {
    console.log('Proxy: No access token available');
  }

  try {
    const response = await fetch(backendUrl, {
      method,
      headers,
      body: request.body,
      // @ts-expect-error - duplex is required for streaming request body in Next.js 13+ but not in standard fetch types
      duplex: 'half',
    });

    if (response.status === 401 && session) {
      // Don't delete session here - let React Query handle refresh
      const errorResponse = NextResponse.json(
        { error: 'Backend authentication failed' },
        { status: 401 }
      );
      return errorResponse;
    }

    // Re-stream the response body back to the client
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error && error.cause
        ? String(error.cause)
        : String(error);
    console.error(
      `BFF Proxy Error: Failed to connect to backend at ${backendUrl}. Details: ${errorMessage}`
    );
    return NextResponse.json(
      {
        error: 'Bad Gateway',
        message: 'The API backend is not reachable.',
        details: errorMessage,
      },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, 'GET', resolvedParams);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, 'POST', resolvedParams);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, 'PUT', resolvedParams);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, 'PATCH', resolvedParams);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ proxy?: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, 'DELETE', resolvedParams);
}

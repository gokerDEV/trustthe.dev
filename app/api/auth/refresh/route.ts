import { deleteSession, getSession, updateSession } from '@/app/lib/session';
import { getClientCredentialsToken } from '@/app/lib/auth-utils';
import { authControllerRefresh } from '@/kodkafa/client/user-authentication-management/user-authentication-management';
import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  // Get JWT session from cookie
  const session = await getSession();

  if (!session) {
    console.log('Refresh: No session found in JWT cookie');
    return NextResponse.json({ error: 'No session found' }, { status: 401 });
  }

  if (!session.refresh_token) {
    console.log('Refresh: No refresh token available, deleting session');
    await deleteSession();
    return NextResponse.json(
      { error: 'No refresh token available' },
      { status: 401 }
    );
  }

  console.log('Refresh: Starting token refresh for JWT session');

  try {
    // Step 1: Get API token via client credentials
    console.log('Refresh: Getting client credentials token');
    const apiToken = await getClientCredentialsToken();

    console.log('Refresh: Client credentials successful');

    // Step 2: Use refresh token to get a new access token
    console.log('Refresh: Using refresh token to get new access token');
    const refreshResponse = await authControllerRefresh({
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        refresh_token: session.refresh_token,
      }),
    });

    if (refreshResponse.status !== 200) {
      console.error(
        'Token refresh failed:',
        refreshResponse.status,
        refreshResponse.data
      );
      await deleteSession();
      const response = NextResponse.json(
        { error: 'Token refresh failed' },
        { status: 401 }
      );
      response.cookies.delete('session_id');
      return response;
    }

    const tokens = refreshResponse.data;
    console.log('Refresh: Token refresh successful');

    // Update session with new tokens
    const newExpiresAt = Date.now() + (tokens.expires_in || 3600) * 1000;
    const updatedSession = await updateSession({
      access_token: tokens.access_token || '',
      // The backend might return a new refresh token (for refresh token rotation)
      refresh_token: tokens.refresh_token || session.refresh_token,
      expires_at: newExpiresAt,
    });

    if (updatedSession) {
      console.log('Refresh: Session updated successfully');
      console.log(
        'Refresh: New expires_at:',
        new Date(newExpiresAt).toISOString()
      );
      console.log('Refresh: Current time:', new Date().toISOString());
      console.log(
        'Refresh: Time until expiry:',
        Math.round((newExpiresAt - Date.now()) / 1000),
        'seconds'
      );

      return NextResponse.json({
        success: true,
        expires_at: updatedSession.expires_at,
        expires_in: tokens.expires_in,
        expires_at_iso: new Date(newExpiresAt).toISOString(),
      });
    } else {
      console.error('Refresh: Failed to update session');
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

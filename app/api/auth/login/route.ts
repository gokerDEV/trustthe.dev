import { getClientCredentialsToken } from '@/app/lib/auth-utils';
import { createSession } from '@/app/lib/session';
import type { LoginDto } from '@/kodkafa/client/schemas';
import { authControllerLogin } from '@/kodkafa/client/user-authentication-management/user-authentication-management';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, remember = false } = body;

    // Backend accepts username field which can be email, username, or phone
    const loginData: LoginDto = {
      username: username || email, // backend expects 'username' field for all identifiers
      password,
      remember,
    };

    // Check environment variables
    if (
      !process.env.KODKAFA_API_URL ||
      !process.env.KODKAFA_CLIENT_ID ||
      !process.env.KODKAFA_CLIENT_SECRET
    ) {
      console.error('Missing environment variables:', {
        KODKAFA_API_URL: !!process.env.KODKAFA_API_URL,
        KODKAFA_CLIENT_ID: !!process.env.KODKAFA_CLIENT_ID,
        KODKAFA_CLIENT_SECRET: !!process.env.KODKAFA_CLIENT_SECRET,
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Step 1: Exchange client credentials for API access token
    const apiToken = await getClientCredentialsToken();

    console.log('Login: Client credentials successful');
    console.log('Login: API token received:', apiToken ? 'YES' : 'NO');
    console.log('Login: API token length:', apiToken ? apiToken.length : 0);

    // Step 2: Login with email/password using API token
    const loginResponse = await authControllerLogin(loginData, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (loginResponse.status !== 200) {
      const error =
        'data' in loginResponse && 'message' in loginResponse.data
          ? (loginResponse.data as { message?: string }).message
          : 'Invalid credentials';

      // In development, return full error details
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json(
          {
            error,
            details: loginResponse.data,
          },
          { status: loginResponse.status }
        );
      }

      return NextResponse.json({ error }, { status: loginResponse.status });
    }

    const tokens = loginResponse.data;

    // BFF Pattern: Store tokens in JWT session cookie
    const expiresAt = Date.now() + (tokens.expires_in || 3600) * 1000;

    // Create JWT session with tokens
    await createSession({
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || '',
      expires_at: expiresAt,
    });

    console.log('Login: JWT session created successfully');
    console.log('Login: Expires at:', new Date(expiresAt).toISOString());
    console.log('Login: Current time:', new Date().toISOString());
    console.log(
      'Login: Time until expiry:',
      Math.round((expiresAt - Date.now()) / 1000),
      'seconds'
    );
    console.log(
      'Login: Token expires_in from backend:',
      tokens.expires_in,
      'seconds'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

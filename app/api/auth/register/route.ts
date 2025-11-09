import { createSession } from '@/app/lib/session';
import { getClientCredentialsToken } from '@/app/lib/auth-utils';
import { authControllerRegister } from '@/kodkafa/client/user-authentication-management/user-authentication-management';
import type { RegisterDto } from '@/kodkafa/client/schemas';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, username } = await request.json();

    if (
      !process.env.KODKAFA_API_URL ||
      !process.env.KODKAFA_CLIENT_ID ||
      !process.env.KODKAFA_CLIENT_SECRET
    ) {
      console.error('Missing environment variables for registration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Step 1: Exchange client credentials for API access token
    const apiToken = await getClientCredentialsToken();

    // Step 2: Register new user using API token
    const registerData: RegisterDto = {
      email,
      password,
      name,
      username,
    };

    const registerResponse = await authControllerRegister(registerData, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (registerResponse.status !== 201) {
      const error =
        'data' in registerResponse && 'message' in registerResponse.data
          ? (registerResponse.data as { message?: string }).message
          : 'Registration failed';
      return NextResponse.json({ error }, { status: registerResponse.status });
    }

    const tokens = registerResponse.data;

    if (
      !tokens?.access_token ||
      !tokens?.refresh_token ||
      !tokens?.expires_in
    ) {
      console.error('Registration response missing tokens:', tokens);
      return NextResponse.json(
        { error: 'Invalid registration response' },
        { status: 500 }
      );
    }

    const expiresAt = Date.now() + tokens.expires_in * 1000;

    await createSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
    });

    console.log('Registration: Session created successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

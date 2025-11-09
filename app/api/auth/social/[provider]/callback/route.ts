import { getClientCredentialsToken } from '@/app/lib/auth-utils';
import { createSession } from '@/app/lib/session';
import type { SocialCallbackDto } from '@/kodkafa/client/schemas';
import { socialAuthControllerSocialAuthCallback } from '@/kodkafa/client/social-authentication/social-authentication';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  // Validate provider
  if (provider !== 'google' && provider !== 'github' && provider !== 'apple') {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=invalid_provider`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=no_code`
    );
  }

  try {
    // Step 1: Get API token via client credentials
    const apiToken = await getClientCredentialsToken();

    // Step 2: Handle social auth callback using API token
    const callbackData: SocialCallbackDto = {
      code,
      state: state || '',
    };

    const response = await socialAuthControllerSocialAuthCallback(
      provider as 'google' | 'github' | 'apple',
      callbackData,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (response.status !== 200) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=callback_failed`
      );
    }

    const authData = response.data;

    // BFF Pattern: Store tokens in JWT session cookie
    // AuthDto uses camelCase: accessToken, expiresIn
    const expiresAt = Date.now() + (authData.expiresIn || 3600) * 1000;

    await createSession({
      access_token: authData.accessToken || '',
      refresh_token: '', // Social auth might not return refresh token
      expires_at: expiresAt,
    });

    const redirectResponse = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    );

    return redirectResponse;
  } catch (error) {
    console.error('Social callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=internal_error`
    );
  }
}

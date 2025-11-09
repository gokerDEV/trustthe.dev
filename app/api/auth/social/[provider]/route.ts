import { getClientCredentialsToken } from '@/app/lib/auth-utils';
import { socialAuthControllerGetSocialAuthUrl } from '@/kodkafa/client/social-authentication/social-authentication';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  // Validate provider
  if (provider !== 'google' && provider !== 'github' && provider !== 'apple') {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  try {
    // Step 1: Get API token via client credentials
    const apiToken = await getClientCredentialsToken();

    // Step 2: Get social auth URL using API token
    const response = await socialAuthControllerGetSocialAuthUrl(
      provider as 'google' | 'github' | 'apple',
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (response.status !== 200) {
      return NextResponse.json(
        { error: 'Failed to initiate social login' },
        { status: response.status }
      );
    }

    const { url } = response.data;
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Social login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { getClientCredentialsToken } from '@/app/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Step 1: Exchange client credentials for API access token
    const apiToken = await getClientCredentialsToken();

    // Step 2: Resend verification email using API token
    // Note: This endpoint is not in orval client, using direct fetch
    const resendResponse = await fetch(
      `${process.env.KODKAFA_API_URL}/auth/resend-verification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!resendResponse.ok) {
      // If the specific endpoint doesn't exist, try using recovery as fallback
      const fallbackResponse = await fetch(
        `${process.env.KODKAFA_API_URL}/auth/recovery`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!fallbackResponse.ok) {
        const error = await fallbackResponse.json();
        return NextResponse.json(
          {
            error: error.message || 'Failed to resend verification email',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

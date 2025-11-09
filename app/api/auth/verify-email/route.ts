import { getClientCredentialsToken } from '@/app/lib/auth-utils';
import { createSession } from '@/app/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Step 1: Exchange client credentials for API access token
    const apiToken = await getClientCredentialsToken();

    // Step 2: Verify email using API token
    // Note: This endpoint is not in orval client, using direct fetch
    const verifyResponse = await fetch(
      `${process.env.KODKAFA_API_URL}/auth/verify-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          token,
          email,
        }),
      }
    );

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      return NextResponse.json(
        { error: error.message || 'Failed to verify email' },
        { status: 400 }
      );
    }

    const result = await verifyResponse.json();

    // If the verification returns tokens, store them in session
    if (result.access_token && result.refresh_token) {
      const expiresAt = Date.now() + (result.expires_in || 3600) * 1000;
      await createSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_at: expiresAt,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: result.user,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

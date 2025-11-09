import { getClientCredentialsToken } from '@/app/lib/auth-utils';
import type { RecoveryDto } from '@/kodkafa/client/schemas';
import { authControllerRecovery } from '@/kodkafa/client/user-authentication-management/user-authentication-management';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Step 1: Exchange client credentials for API access token
    const apiToken = await getClientCredentialsToken();

    // Step 2: Request password recovery using API token
    const recoveryData: RecoveryDto = { email };
    const recoveryResponse = await authControllerRecovery(recoveryData, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (recoveryResponse.status !== 200) {
      const error =
        'data' in recoveryResponse && 'message' in recoveryResponse.data
          ? (recoveryResponse.data as { message?: string }).message
          : 'Failed to send recovery email';
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Recovery email sent successfully',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

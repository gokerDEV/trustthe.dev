import { getClientCredentialsToken } from '@/app/lib/auth-utils';
import type { AuthControllerResetPasswordBody } from '@/kodkafa/client/schemas';
import { authControllerResetPassword } from '@/kodkafa/client/user-authentication-management/user-authentication-management';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Step 1: Exchange client credentials for API access token
    const apiToken = await getClientCredentialsToken();

    // Step 2: Reset password using API token
    const resetData: AuthControllerResetPasswordBody = {
      token,
      password,
    };

    const resetResponse = await authControllerResetPassword(resetData, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (resetResponse.status !== 200) {
      const error =
        'data' in resetResponse && 'message' in resetResponse.data
          ? (resetResponse.data as { message?: string }).message
          : 'Failed to reset password';
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

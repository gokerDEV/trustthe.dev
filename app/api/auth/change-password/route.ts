import { getClientCredentialsToken } from '@/app/lib/auth-utils';
import { getSession } from '@/app/lib/session';
import type { UpdatePasswordDto } from '@/kodkafa/client/schemas';
import { authControllerChangePassword } from '@/kodkafa/client/user-authentication-management/user-authentication-management';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password, newPassword } = await request.json();

    if (!password || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get the session
    const session = await getSession();

    if (!session?.access_token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Step 1: Exchange client credentials for API access token
    const apiToken = await getClientCredentialsToken();

    // Step 2: Change password using API token
    const changePasswordData: UpdatePasswordDto = {
      password,
      newPassword,
    };

    const changePasswordResponse = await authControllerChangePassword(
      changePasswordData,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'X-User-Token': session.access_token, // Pass user's access token for authentication
        },
      }
    );

    if (changePasswordResponse.status !== 200) {
      const error =
        'data' in changePasswordResponse &&
        'message' in changePasswordResponse.data
          ? (changePasswordResponse.data as { message?: string }).message
          : 'Failed to change password';
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

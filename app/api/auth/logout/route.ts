import { signOut } from '@/auth.config';
import { authControllerLogout } from '@/kodkafa/ssr/user-authentication-management/user-authentication-management';
import { getClientCredentialsToken } from '@/lib/auth/token-manager';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // const session = await auth();
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    // Backend logout if we have access token
    if (token?.access_token) {
      try {
        const apiToken = await getClientCredentialsToken();
        await authControllerLogout({
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'X-User-Token': token.access_token,
          },
        });
      } catch (error) {
        // Ignore backend logout errors, we still want to clear session
        console.error('Backend logout error:', error);
      }
    }

    // Sign out from NextAuth
    await signOut({ redirect: false });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    // Try to sign out anyway
    try {
      await signOut({ redirect: false });
    } catch {
      // Ignore
    }
    return NextResponse.json({ success: true });
  }
}

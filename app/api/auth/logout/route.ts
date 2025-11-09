import { getClientCredentialsToken } from '@/app/lib/auth-utils';
import { deleteSession, getSession } from '@/app/lib/session';
import { authControllerLogout } from '@/kodkafa/client/user-authentication-management/user-authentication-management';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const session = await getSession();

    if (session?.access_token) {
      try {
        const apiToken = await getClientCredentialsToken();
        await authControllerLogout({
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'X-User-Token': session.access_token,
          },
        });
      } catch (error) {
        // Ignore backend logout errors, we still want to clear session
        console.error('Backend logout error:', error);
      }
    }

    await deleteSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    await deleteSession();
    return NextResponse.json({ success: true });
  }
}

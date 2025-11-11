import { signIn } from '@/auth.config';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, remember = false } = body;

    const result = await signIn('credentials', {
      username: username || email,
      email,
      password,
      remember: String(remember),
      redirect: false,
    });

    if (!result || 'error' in result) {
      const error =
        result && 'error' in result ? result.error : 'Invalid credentials';

      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ error, details: result }, { status: 401 });
      }

      return NextResponse.json({ error }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

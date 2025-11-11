import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  }
}

// src/auth.config.ts
import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth';
import { UserInfoResponseDto } from './kodkafa/schemas';

function KodkafaProvider(
  options: OAuthUserConfig<UserInfoResponseDto>
): OAuthConfig<UserInfoResponseDto> {
  const tokenUrl = `${process.env.KODKAFA_API_URL}/oauth/token`;
  const clientId = options.clientId ?? process.env.KODKAFA_CLIENT_ID!;
  const clientSecret =
    options.clientSecret ?? process.env.KODKAFA_CLIENT_SECRET!;

  return {
    id: 'kodkafa',
    name: 'KODKAFA',
    type: 'oauth',
    version: '2.0',
    checks: ['pkce', 'state'],
    authorization: {
      url: `${process.env.KODKAFA_API_URL}/oauth/authorize`,
      params: {
        scope: 'basic:read basic:write openid profile email offline_access',
        response_type: 'code',
      },
    },
    token: {
      url: tokenUrl,
      async request({ params, checks }) {
        const redirectUri =
          typeof params.redirect_uri === 'string'
            ? params.redirect_uri
            : String(params.redirect_uri);

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: String(params.code),
            redirect_uri: redirectUri,
            client_id: clientId,
            code_verifier: String(checks.code_verifier),
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(JSON.stringify(error));
        }

        const tokens = await response.json();

        return {
          tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            token_type: tokens.token_type,
          },
        };
      },
    },
    userinfo: `${process.env.KODKAFA_API_URL}/oauth/userinfo`,
    profile(profile: UserInfoResponseDto) {
      return {
        id: profile.sub as string,
        email: profile.email as string | undefined,
        name: profile.name as string | undefined,
        image: profile.picture as string | undefined,
        given_name: profile.given_name as string | undefined,
        family_name: profile.family_name as string | undefined,
        preferred_username: profile.preferred_username as string | undefined,
      };
    },
    ...options,
  };
}

export const authConfig: NextAuthOptions = {
  providers: [
    KodkafaProvider({
      clientId: process.env.KODKAFA_CLIENT_ID!,
      clientSecret: process.env.KODKAFA_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt', // JWE by default
    maxAge: 60 * 60, // 1 saat
  },
  // Refresh token rotasyonu: IDP refresh token veriyorsa jwt callback ile yönetin
  callbacks: {
    async jwt({ token, account, profile }) {
      // İlk login → access_token/refresh_token kaydet
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        const expiresIn =
          typeof account.expires_in === 'number' ? account.expires_in : 3600;
        token.expires_at = Date.now() + expiresIn * 1000;

        // Profile bilgilerini token'a ekle
        if (profile && 'sub' in profile) {
          const userProfile = profile as UserInfoResponseDto;
          token.sub = userProfile.sub;
          token.email = userProfile.email;
          token.name = userProfile.name;
          token.picture = userProfile.picture;
        }
      }

      // Token süresi dolmuşsa refresh et (30 saniye buffer)
      const expiresAt =
        typeof token.expires_at === 'number' ? token.expires_at : 0;
      if (expiresAt && Date.now() > expiresAt - 30_000 && token.refresh_token) {
        try {
          const res = await fetch(
            `${process.env.KODKAFA_API_URL}/oauth/token`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${process.env.KODKAFA_CLIENT_ID}:${process.env.KODKAFA_CLIENT_SECRET}`).toString('base64')}`,
              },
              body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: String(token.refresh_token),
              }),
              cache: 'no-store',
            }
          );

          if (res.ok) {
            const json = (await res.json()) as {
              access_token: string;
              refresh_token?: string; // Rotation - yeni refresh token
              expires_in?: number;
            };

            token.access_token = json.access_token;
            const newExpiresIn =
              typeof json.expires_in === 'number' ? json.expires_in : 3600;
            token.expires_at = Date.now() + newExpiresIn * 1000;

            // Refresh token rotation - yeni token varsa güncelle
            if (json.refresh_token) {
              token.refresh_token = json.refresh_token;
            }

            // Yeni access token ile userinfo'yu fetch et
            try {
              const userInfoRes = await fetch(
                `${process.env.KODKAFA_API_URL}/oauth/userinfo`,
                {
                  headers: {
                    Authorization: `Bearer ${json.access_token}`,
                  },
                }
              );

              if (userInfoRes.ok) {
                const userInfo = await userInfoRes.json();
                token.sub = userInfo.sub;
                token.email = userInfo.email;
                token.name = userInfo.name;
                token.picture = userInfo.picture;
              }
            } catch {
              // UserInfo fetch hatası - ignore
            }
          } else {
            // Refresh başarısız → token'ları temizle
            token.access_token = '';
            token.refresh_token = '';
            token.expires_at = 0;
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          token.access_token = '';
          token.refresh_token = '';
          token.expires_at = 0;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Session'a user bilgilerini ekle
      if (token.sub) {
        session.user = {
          ...session.user,
          id: String(token.sub),
          email: token.email ?? session.user?.email ?? null,
          name: token.name ?? session.user?.name ?? null,
          image: token.picture ?? session.user?.image ?? null,
        };
      }

      // Access token client'a verilmemeli (BFF pattern)
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

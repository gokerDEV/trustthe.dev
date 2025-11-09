import { oAuthControllerToken } from '@/kodkafa/client/oauth-2-1/oauth-2-1';
import type { OAuthTokenRequestDto } from '@/kodkafa/client/schemas';

/**
 * Get API access token using client credentials grant
 * Used internally by BFF to authenticate with backend API
 */
export async function getClientCredentialsToken(): Promise<string> {
  if (!process.env.KODKAFA_CLIENT_ID || !process.env.KODKAFA_CLIENT_SECRET) {
    throw new Error('Missing KODKAFA_CLIENT_ID or KODKAFA_CLIENT_SECRET');
  }

  const tokenRequest: OAuthTokenRequestDto = {
    grant_type: 'client_credentials',
    client_id: process.env.KODKAFA_CLIENT_ID,
    client_secret: process.env.KODKAFA_CLIENT_SECRET,
  };

  const response = await oAuthControllerToken(tokenRequest);

  if (response.status !== 200) {
    throw new Error('Failed to obtain API access token');
  }

  return response.data.access_token;
}

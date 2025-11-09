/**
 * Get API access token using client credentials grant
 * Used internally by BFF to authenticate with backend API
 * Uses direct fetch to avoid circular dependency with proxy route
 */
export async function getClientCredentialsToken(): Promise<string> {
  if (!process.env.KODKAFA_CLIENT_ID || !process.env.KODKAFA_CLIENT_SECRET) {
    throw new Error('Missing KODKAFA_CLIENT_ID or KODKAFA_CLIENT_SECRET');
  }

  if (!process.env.KODKAFA_API_URL) {
    throw new Error('Missing KODKAFA_API_URL');
  }

  const authString = Buffer.from(
    `${process.env.KODKAFA_CLIENT_ID}:${process.env.KODKAFA_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${process.env.KODKAFA_API_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authString}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `Failed to obtain API access token: ${response.status} ${errorText}`
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
    token_type?: string;
  };

  if (!data.access_token) {
    throw new Error('API token response missing access_token');
  }

  return data.access_token;
}

/**
 * OAuth 2.1 Token Manager (Client Credentials)
 *
 * Token contains projectId in JWT - backend extracts it automatically.
 * NO projectId needed in request paths.
 */
class OAuthTokenManager {
  private static instance: OAuthTokenManager;
  private currentToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly apiUrl: string;

  private constructor() {
    this.apiUrl = process.env.KODKAFA_API_URL || '';
    this.clientId = process.env.KODKAFA_CLIENT_ID || '';
    this.clientSecret = process.env.KODKAFA_CLIENT_SECRET || '';

    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'KODKAFA_CLIENT_ID and KODKAFA_CLIENT_SECRET environment variables are required'
      );
    }
  }

  static getInstance(): OAuthTokenManager {
    if (!OAuthTokenManager.instance) {
      OAuthTokenManager.instance = new OAuthTokenManager();
    }
    return OAuthTokenManager.instance;
  }

  async getToken(): Promise<string> {
    const now = Date.now();
    const bufferTime = 60000; // 1 minute buffer

    if (this.currentToken && now < this.tokenExpiry - bufferTime) {
      return this.currentToken;
    }

    const authString = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString('base64');

    const response = await fetch(`${this.apiUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authString}`,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (!response.ok) {
      await response.json().catch(() => ({}));
      throw new Error(`OAuth token request failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    this.currentToken = data.access_token;
    this.tokenExpiry = now + data.expires_in * 1000;
    return this.currentToken;
  }
}

// Lazy getter to prevent module-level instantiation
// This prevents environment variable access when module is imported on client side
let tokenManagerInstance: OAuthTokenManager | null = null;

function getTokenManager(): OAuthTokenManager {
  if (!tokenManagerInstance) {
    tokenManagerInstance = OAuthTokenManager.getInstance();
  }
  return tokenManagerInstance;
}

export async function getClientCredentialsToken(): Promise<string> {
  return getTokenManager().getToken();
}

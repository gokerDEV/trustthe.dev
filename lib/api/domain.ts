/**
 * Domain Configuration Helper
 *
 * Single source of truth for API domain parameter.
 * Used across all Posts API calls.
 */
export function getApiDomain(): string {
  const domain = process.env.DOMAIN;
  if (!domain) {
    throw new Error('DOMAIN environment variable is required');
  }
  return domain;
}

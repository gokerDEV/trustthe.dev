// src/config/metadata.config.ts
// Central configuration for metadata generation

/**
 * Site-wide configuration settings.
 * Replace placeholder values with your actual site information.
 */
const domain = process.env.DOMAIN || 'goker.art';
const url = `https://${domain}`;
export const siteConfig = {
  // --- Basic Site Info ---
  domainName: domain, // Your domain
  baseUrl: url, // Base URL
  siteName: domain, // Human-readable site name
  defaultLocale: 'en_US', // Default language/region
  defaultDescription:
    "I'm oil-free piece of fried eggs, determined to cling on the floor and completely contrary from the whole...",
  // --- Default Images (provide paths relative to your public folder or use absolute URLs) ---
  defaultOgImage: `/default.png`,
  defaultSchemaImage: `/default.png`, // Can be same or different

  // --- Author Info (Default author for posts) ---
  author: {
    name: 'goker', // Default author name
    url: 'https://goker.art/goker', // Link to default author profile/page
  },

  // --- Twitter Info ---
  twitter: {
    handle: '@gokerART', // Your site's or main author's Twitter handle
    // Recommended card type for content-rich pages
    cardType: 'summary_large_image' as const,
  },

  // --- Organization Info (for Schema.org Publisher/Organization) ---
  organization: {
    name: 'goker', // Your company or brand name
    url, // Your organization's primary URL
    logo: `/logo.png`, // Path to your organization's logo (relative to public or absolute URL)
  },
};

/**
 * Helper function to generate an absolute URL from a potentially relative path.
 * Ensures proper handling of slashes.
 * @param path Relative path (e.g., /my-page, my-image.png) or absolute path.
 * @returns Absolute URL string.
 */
export function getAbsoluteUrl(path: string): string {
  if (!path) return siteConfig.baseUrl;
  // If path is already absolute, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Ensure path starts with a single slash
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  // Combine and clean up potential double slashes (except after protocol)
  return `${siteConfig.baseUrl}${sanitizedPath}`.replace(/([^:]\/)\/+/g, '$1');
}

export function getOgImageUrl(path: string): string {
  return `${siteConfig.baseUrl}/api/og-image?src=${encodeURIComponent(path)}`;
}

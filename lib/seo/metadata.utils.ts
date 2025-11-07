// src/lib/metadata/metadata.utils.ts
// Utility functions for metadata generation

import type { PostDto } from '@/api/client/schemas';
import { BASE_URL, OG_HEIGHT, OG_WIDTH, SITE_NAME } from '@/config/constants';
import { getImages } from '@/lib/image.utils';
import type { ImageData } from './metadata.types'; // Adjust path
import { asUrl } from './url-slug.utils';
// Assuming your image utility exists and exports getImages function
// import { getImages as fetchImagesFromData } from './imageUtils';
export function getAbsoluteUrl(path: string): string {
  if (!path) return BASE_URL;
  // If path is already absolute, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Ensure path starts with a single slash
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  // Combine and clean up potential double slashes (except after protocol)
  return `${BASE_URL}${sanitizedPath}`.replace(/([^:]\/)\/+/g, '$1');
}

export function getOgImageUrl(path: string): string {
  return `${BASE_URL}/api/og-image?src=${encodeURIComponent(path)}`;
}
// /**
//  * Extracts a concise description from markdown or text content.
//  * Tries to avoid cutting words and removes basic markdown.
//  * @param content Raw markdown or text content.
//  * @param defaultDescription Fallback description if content is empty.
//  * @param maxLength Target maximum length for the description.
//  * @returns Formatted description string.
//  */
// export function getPageDescription(
//   content?: string | null,
//   defaultDescription: string = DEFAULT_DESCRIPTION,
//   maxLength: number = 160
// ): string {
//   if (!content) return defaultDescription;

//   // Basic markdown stripping (improve as needed)
//   const text = content
//     .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
//     .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Keep link text
//     .replace(/[`*#_~>|]/g, '') // Remove common markdown chars
//     .replace(/\s+/g, ' ') // Normalize whitespace
//     .trim();

//   if (text.length <= maxLength) return text;

//   // Truncate intelligently
//   const truncated = text.substring(0, maxLength);
//   // Find the last space within the truncated string
//   const lastSpaceIndex = truncated.lastIndexOf(' ');
//   // Cut at the last space if found, otherwise cut at maxLength
//   const finalTruncated =
//     lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated;

//   return `${finalTruncated}...`;
// }

/**
 * Generates the page title, appending the site name if a specific title exists.
 * @param dataTitle Title extracted from data.
 * @param siteName Site name from config.
 * @returns Formatted page title string.
 */
export function getPageTitle(
  title?: string | null,
  siteName: string = SITE_NAME
): string {
  const cleanTitle = title?.trim();
  return cleanTitle ? `${siteName} - ${cleanTitle}` : siteName;
}

/**
 * Generates a description for tag listing pages.
 * @param tagName The tag name to generate description for.
 * @returns Formatted description string.
 */
export function getPageDescription(
  description: string,
  siteName: string = SITE_NAME
): string {
  return `${description} on ${siteName}`;
}

/**
 * Creates the canonical URL for a given slug relative to the base URL.
 * Ensures proper URL formatting.
 * @param baseUrl Base URL from config.
 * @param slug Page slug (can be empty for homepage).
 * @returns Absolute canonical URL string.
 */
export function getCanonicalUrl(baseUrl: string, slug?: string | null): string {
  const path = slug ? `/${asUrl(slug)}` : '';
  return getAbsoluteUrl(path || '/'); // Use getAbsoluteUrl for consistency, ensure root has '/'
}

/**
 * Gets primary image data (URL, dimensions, alt text) for metadata.
 * @param data The page data object.
 * @param defaultImagePath Path to the default image.
 * @param altTextBase Base text for alt attribute if specific alt isn't found.
 * @returns ImageData object with absolute URL.
 */
export function getImageData(
  data: PostDto | undefined,
  defaultImagePath: string,
  altTextBase?: string | null
): ImageData {
  const { cover } = data ? getImages(data) : { cover: null };
  const imgSrc = cover?.src || defaultImagePath;
  const altText = cover?.altText || data?.title || altTextBase || SITE_NAME;

  return {
    imageUrl: getOgImageUrl(imgSrc), // Ensure URL is absolute
    imageWidth: OG_WIDTH,
    imageHeight: OG_HEIGHT,
    imageAlt: altText.trim(),
  };
}

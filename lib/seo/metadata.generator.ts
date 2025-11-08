// src/lib/metadata/metaGenerator.ts
// Generates the Next.js Metadata object, focusing on Open Graph & Twitter Cards

import {
  AUTHOR_NAME,
  AUTHOR_URL,
  BASE_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_LOCALE,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  TWITTER_CARD_TYPE,
  TWITTER_HANDLE,
} from '@/config/constants';
import type { PostDto } from '@/kodkafa/client/schemas';
import { Metadata } from 'next';
import { OgType } from './metadata.types'; // Adjust path
import { getCanonicalUrl, getImageData, getPageTitle } from './metadata.utils'; // Adjust path
/**
 * Options for configuring the metadata generation process.
 * Allows overriding defaults per-page if necessary.
 */
interface Options {
  ogType?: OgType;
  authorName?: string;
  authorUrl?: string;
  twitterHandle?: string;
  twitterCardType?: 'summary' | 'summary_large_image' | 'app' | 'player';
  updatedAt?: string; // Allow passing specific update time
  slug?: string;
  title?: string;
  description?: string;
}

/**
 * Generates the complete Next.js Metadata object for a given page/data.
 * Includes Core metadata, Open Graph, and Twitter Card information.
 *
 * @param data The page-specific data (e.g., from API) or null for generic pages.
 * @param options Configuration overrides for this specific page.
 * @returns A Next.js Metadata object.
 */
export function metadataGenerator(
  data: PostDto | undefined,
  options: Options = {}
): Metadata {
  // --- Determine configuration ---
  const {
    ogType = 'website', // Default determined by caller or fallback here
    authorName = AUTHOR_NAME,
    authorUrl = AUTHOR_URL,
    twitterHandle = TWITTER_HANDLE,
    twitterCardType = TWITTER_CARD_TYPE,
    updatedAt,
  } = options;

  // --- Extract common data points using utils ---
  const pageSlug = options.slug || data?.slug || '';
  const canonicalUrl = getCanonicalUrl(BASE_URL, pageSlug);
  const title = options.title || getPageTitle(data?.title, SITE_NAME);
  const description =
    options.description || data?.description || DEFAULT_DESCRIPTION;
  // Use OG image default here
  const { imageUrl, imageWidth, imageHeight, imageAlt } = getImageData(
    data,
    DEFAULT_OG_IMAGE,
    data?.title || SITE_NAME
  );

  const publishedTime = data?.createdAt;
  // Use passed updatedAt > data.updatedAt > data.createdAt
  const modifiedTime = updatedAt || data?.updatedAt || publishedTime;
  const tags = data?.tags || [];
  // const category = data?.categories?.[0]; // Get the first category if available

  // Determine OG type - use 'article' for blog posts, 'website' for pages
  // If ogType is explicitly set to 'article', use it; otherwise auto-detect for posts
  const finalOgType =
    ogType === 'article'
      ? 'article'
      : data && data.type === 'post'
        ? 'article'
        : ogType;

  // --- Build Open Graph Object ---
  const openGraphData: Metadata['openGraph'] = {
    title: data?.title || SITE_NAME, // Use specific title or site name
    description: description,
    url: canonicalUrl, // Should be the canonical URL
    siteName: SITE_NAME,
    locale: DEFAULT_LOCALE,
    type: finalOgType,
    ...(imageUrl && {
      images: [
        // OG images should be absolute URLs
        {
          url: imageUrl, // Provided by getImageData as absolute
          ...(imageWidth && { width: imageWidth }),
          ...(imageHeight && { height: imageHeight }),
          alt: imageAlt,
        },
        // Optionally add more images here if your getImageData provides them
      ],
    }),
  };

  // --- Build Twitter Card Object ---
  const twitterData: Metadata['twitter'] = {
    card: twitterCardType,
    site: twitterHandle, // Site's main handle
    creator: twitterHandle, // Handle of the content creator (can override if needed)
    title: title, // Use the full page title
    description: description,
    ...(imageUrl && { images: [imageUrl] }),
  };

  // --- Assemble Final Metadata Object ---
  const metaData: Metadata = {
    // Core metadata
    metadataBase: new URL(BASE_URL), // Required for resolving relative URLs
    title: title,
    description: description,
    alternates: {
      canonical: canonicalUrl, // Use absolute canonical URL
      // Add hreflang alternates here if needed
    },
    // Optional: Add keywords if they have value for you (ignored by Google)
    ...(tags.length > 0 && { keywords: tags }),

    // Structured Data placeholders (for Next.js inference if not using JSON-LD script)
    // Not strictly necessary if using the JSON-LD script method, but can be included.
    ...(ogType === 'article' &&
      authorName && { authors: [{ name: authorName, url: authorUrl }] }),
    ...(publishedTime && { publishedTime }), // Note: Only works for ISO strings
    ...(modifiedTime && { modifiedTime }), // Note: Only works for ISO strings

    // Assign generated OG and Twitter data
    openGraph: openGraphData,
    twitter: twitterData,

    // Robots meta tags for crawl control
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // verification: { google: 'YOUR_GOOGLE_VERIFICATION_CODE' },
  };

  return metaData;
}

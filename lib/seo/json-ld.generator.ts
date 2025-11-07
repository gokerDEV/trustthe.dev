// src/lib/metadata/jsonLdGenerator.ts
// Generates JSON-LD objects for Schema.org structured data

import type { PostDto } from '@/api/client/schemas';
import {
  AUTHOR_NAME,
  AUTHOR_URL,
  BASE_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_SCHEMA_IMAGE,
  ORGANIZATION_NAME,
  ORGANIZATION_URL,
  SITE_NAME,
} from '@/config/constants';
import {
  AboutPage,
  Article,
  BlogPosting,
  BreadcrumbList,
  CollectionPage,
  ContactPage,
  Dataset,
  ImageObject,
  ListItem,
  NewsArticle,
  Organization,
  Person,
  SoftwareSourceCode,
  TechArticle,
  Thing,
  VisualArtwork,
  WebPage,
  WebSite,
  WithContext,
} from 'schema-dts';
import { ImageData } from './metadata.types'; // Adjust path
import {
  getAbsoluteUrl,
  getCanonicalUrl,
  getImageData,
} from './metadata.utils'; //

// --- Helper Functions for Building Schema Parts ---

/** Builds an ImageObject schema. */
function buildImageObjectSchema(
  imageData: ImageData | null
): ImageObject | undefined {
  if (!imageData?.imageUrl) return undefined;

  const imageObject: ImageObject = {
    '@type': 'ImageObject',
    url: imageData.imageUrl,
  };

  // if (imageData.imageWidth) {
  //     imageObject.width = imageData.imageWidth as SchemaValue<IdReference | Distance | QuantitativeValue, "width">;
  // }
  // if (imageData.imageHeight) {
  //     imageObject.height = imageData.imageHeight as SchemaValue<IdReference | Distance | QuantitativeValue, "height">;
  // }

  return imageObject;
}

/** Builds a Person or Organization schema for author/publisher. */
function buildEntitySchema<T extends Person | Organization>(
  type: T extends Person ? 'Person' : 'Organization',
  name: string,
  url?: string
): WithContext<T> {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': type,
    name: name,
    ...(url && { url: url }),
  } as unknown as WithContext<T>;

  // if (type === "Organization" && logoUrl) {
  //     const orgSchema = baseSchema as WithContext<Organization>;
  //     orgSchema.image = {
  //         "@type": "ImageObject",
  //         "url": getAbsoluteUrl(logoUrl)
  //     };
  // }

  return baseSchema;
}

/** Builds a BreadcrumbList schema. */
function buildBreadcrumbListSchema(
  data: PostDto | null | undefined,
  isHomePage: boolean = false,
  isCatalog: boolean = false
): BreadcrumbList | undefined {
  if (!data) return undefined;

  const pageTitle = data.title;
  const category = data.categories?.[0];
  const canonicalUrl = getCanonicalUrl(BASE_URL, data.slug);

  const items: ListItem[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: BASE_URL,
    },
  ];

  if (category?.slug) {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: category.title,
      item: getAbsoluteUrl(category.slug),
    });
  }

  const isCategoryPage = isCatalog || data.type === 'category';
  const hasTitle = !!pageTitle;

  if (!isHomePage && hasTitle && (!category || !isCategoryPage)) {
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: pageTitle,
      item: canonicalUrl,
    });
  }

  if (items.length > 1) {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: items,
    };
  }
  return undefined;
}

// --- Main JSON-LD Generator Function ---

export type SchemaType =
  | 'Article'
  | 'BlogPosting'
  | 'NewsArticle'
  | 'TechArticle'
  | 'Dataset'
  | 'SoftwareSourceCode'
  | 'VisualArtwork'
  | 'WebPage'
  | 'CollectionPage'
  | 'AboutPage'
  | 'ContactPage'
  | 'Person'
  | 'WebSite';

export interface JsonLdGeneratorOptions {
  schemaType: SchemaType;
  authorName?: string;
  authorUrl?: string;
  updatedAt?: string;
  isHomePage?: boolean;
  isCatalog?: boolean;
}

type SchemaMap = {
  [K in SchemaType]: WithContext<
    K extends 'Article'
      ? Article
      : K extends 'BlogPosting'
        ? BlogPosting
        : K extends 'NewsArticle'
          ? NewsArticle
          : K extends 'TechArticle'
            ? TechArticle
            : K extends 'Dataset'
              ? Dataset
              : K extends 'SoftwareSourceCode'
                ? SoftwareSourceCode
                : K extends 'VisualArtwork'
                  ? VisualArtwork
                  : K extends 'WebPage'
                    ? WebPage
                    : K extends 'CollectionPage'
                      ? CollectionPage
                      : K extends 'AboutPage'
                        ? AboutPage
                        : K extends 'ContactPage'
                          ? ContactPage
                          : K extends 'Person'
                            ? Person
                            : K extends 'WebSite'
                              ? WebSite
                              : Thing
  >;
};

/**
 * Generates the primary JSON-LD object for the page based on its type and data.
 *
 * @param data The page-specific data or null.
 * @param options Configuration options including the determined schemaType.
 * @returns A JSON-LD object (implementing JsonLd for structure).
 */
export function jsonLdGenerator(
  data: PostDto | undefined,
  options: JsonLdGeneratorOptions
): SchemaMap[SchemaType] | null {
  if (!data) return null;

  const {
    schemaType,
    authorName = AUTHOR_NAME,
    authorUrl = AUTHOR_URL,
    isHomePage = false,
    isCatalog = false,
  } = options;

  const pageSlug = data.slug;
  const canonicalUrl = getCanonicalUrl(BASE_URL, pageSlug);
  if (!canonicalUrl) return null;

  const pageTitle = data.title;
  const description = data.description || DEFAULT_DESCRIPTION;
  const publishedTime = data.createdAt;
  const modifiedTime = options.updatedAt || data.updatedAt || publishedTime;
  const tags = data.tags || [];
  const category = data.categories?.[0];

  const imageData = getImageData(
    data,
    DEFAULT_SCHEMA_IMAGE,
    pageTitle || SITE_NAME
  );
  const imageObjectSchema = buildImageObjectSchema(imageData);
  const authorSchema = buildEntitySchema<Person>(
    'Person',
    authorName,
    authorUrl
  );
  const publisherSchema = buildEntitySchema<Organization>(
    'Organization',
    ORGANIZATION_NAME,
    ORGANIZATION_URL
  );
  const breadcrumbSchema = buildBreadcrumbListSchema(
    data,
    isHomePage,
    isCatalog
  );

  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    url: canonicalUrl,
    isPartOf: {
      '@type': 'WebSite',
      url: BASE_URL,
      name: SITE_NAME,
    },
    publisher: publisherSchema,
    ...(imageObjectSchema && { image: imageObjectSchema }),
    ...(breadcrumbSchema &&
      [
        'WebPage',
        'Article',
        'BlogPosting',
        'NewsArticle',
        'CollectionPage',
        'Dataset',
        'SoftwareSourceCode',
        'VisualArtwork',
        'AboutPage',
        'ContactPage',
        'TechArticle',
      ].includes(schemaType) && { breadcrumb: breadcrumbSchema }),
  } as unknown as SchemaMap[SchemaType];

  if (
    [
      'Article',
      'BlogPosting',
      'NewsArticle',
      'Dataset',
      'SoftwareSourceCode',
      'VisualArtwork',
      'TechArticle',
    ].includes(schemaType)
  ) {
    if (!pageTitle) return null;

    Object.assign(baseSchema, {
      headline: pageTitle,
      description: description,
      ...(publishedTime && { datePublished: publishedTime }),
      ...(modifiedTime && { dateModified: modifiedTime }),
      author: authorSchema,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      ...(tags.length > 0 && { keywords: tags.join(', ') }),
    });
  } else if (
    ['WebPage', 'CollectionPage', 'AboutPage', 'ContactPage'].includes(
      schemaType
    )
  ) {
    Object.assign(baseSchema, {
      name: pageTitle || SITE_NAME,
      description: description,
    });
  } else if (schemaType === 'Person') {
    Object.assign(baseSchema, {
      name: pageTitle || authorName,
      description: description,
      ...(authorUrl && { url: authorUrl }),
    });
  } else if (schemaType === 'WebSite') {
    Object.assign(baseSchema, {
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      url: BASE_URL,
    });
  }

  if (
    ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle'].includes(
      schemaType
    ) &&
    category?.title
  ) {
    const articleSchema = baseSchema as unknown as WithContext<
      Article | BlogPosting | NewsArticle | TechArticle
    >;
    articleSchema.articleSection = category.title;
  }

  if (
    schemaType === 'CollectionPage' &&
    !(baseSchema as unknown as WithContext<CollectionPage>).name
  ) {
    const collectionSchema =
      baseSchema as unknown as WithContext<CollectionPage>;
    collectionSchema.name = `${category?.title || 'Collection'} - ${SITE_NAME}`;
  }

  return baseSchema;
}

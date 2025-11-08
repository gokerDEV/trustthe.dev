import type { PostDto } from '@/kodkafa/client/schemas';
import {
  jsonLdGenerator,
  JsonLdGeneratorOptions,
  SchemaType,
} from '@/lib/seo/json-ld.generator';
import { JSX } from 'react';

interface JsonLdProps {
  data: PostDto | null;
  options: JsonLdGeneratorOptions;
  className?: string;
}

export function JsonLd({
  data,
  options,
  className,
}: JsonLdProps): JSX.Element | null {
  const jsonLd = jsonLdGenerator(data ?? undefined, options);

  if (!jsonLd) return null;

  return (
    <script
      type='application/ld+json'
      className={className}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Helper function to create a JsonLd component with specific schema type
export function createJsonLdComponent(schemaType: SchemaType) {
  return function SpecificJsonLd({
    data,
    options,
    className,
  }: Omit<JsonLdProps, 'options'> & {
    options?: Omit<JsonLdGeneratorOptions, 'schemaType'>;
  }): JSX.Element | null {
    return (
      <JsonLd
        data={data}
        options={{ ...options, schemaType }}
        className={className}
      />
    );
  };
}

// Pre-defined components for common schema types
export const ArticleJsonLd = createJsonLdComponent('Article');
export const BlogPostingJsonLd = createJsonLdComponent('BlogPosting');
export const NewsArticleJsonLd = createJsonLdComponent('NewsArticle');
export const TechArticleJsonLd = createJsonLdComponent('TechArticle');
export const WebPageJsonLd = createJsonLdComponent('WebPage');
export const CollectionPageJsonLd = createJsonLdComponent('CollectionPage');
export const AboutPageJsonLd = createJsonLdComponent('AboutPage');
export const ContactPageJsonLd = createJsonLdComponent('ContactPage');
export const PersonJsonLd = createJsonLdComponent('Person');
export const WebSiteJsonLd = createJsonLdComponent('WebSite');

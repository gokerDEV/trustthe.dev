import { abstractCategories } from '@/config/navigation';
import type { CategoryDto } from '@/kodkafa/schemas';

const abstractCategoriesRegex = abstractCategories.map((i) => i[0]).join('|');
const abstractCategoriesPrefixRegex = abstractCategories
  .map((i) => i[1])
  .join('|');
export function asSlug(url: string) {
  return url.replace(new RegExp(`^(${abstractCategoriesRegex})(\/|-)`), '$1-');
}

export function asUrl(slug: string = '', prefix?: string) {
  return ((prefix ? prefix + '/' : '') + slug).replace(
    new RegExp(`^(${abstractCategoriesRegex})(\/|-)`),
    '$1/'
  );
}

export function asPrefix(slug: string) {
  return slug.replace(new RegExp(`${abstractCategoriesPrefixRegex}`), '');
}

export function tagPrefix(
  tags?: string[],
  categories?: readonly CategoryDto[]
) {
  // if (tags?.includes('Art History')) {
  //   return `art-history`
  // }

  if (categories?.find((i) => i?.slug === 'writings')) {
    return `writings`;
  }

  return undefined;
}

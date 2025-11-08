import type { PostDto, PostFileDto } from '@/kodkafa/client/schemas';
import { imageTypes } from './types';

export function getImages(note: Partial<PostDto> | null) {
  const images = note?.files?.filter((i) =>
    imageTypes.includes(String(i?.type))
  );

  const cover = images?.length
    ? (images[0] as PostFileDto)
    : { src: '/placeholder.jpg', altText: note?.title || '' };

  return {
    cover,
    images,
  };
}

export function getDescription(md?: string) {
  if (!md) return '';

  const lines = md
    .split('\n')
    .map((l) => l.trim())
    .filter(
      (l) =>
        !!l && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('!')
    );

  const paragraph = lines.find((l) => /^[a-zA-Z0-9]/.test(l));

  if (!paragraph) return '';

  // Remove markdown formatting (bold, italics, code, links)
  const clean = paragraph
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/`(.*?)`/g, '$1') // inline code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // [text](url)
    .replace(/<[^>]*>/g, ''); // strip html

  return clean.length > 160 ? clean.slice(0, 157) + '...' : clean;
}

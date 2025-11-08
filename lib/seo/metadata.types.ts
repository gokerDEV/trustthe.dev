// src/lib/metadata/metadata.types.ts
// Type definitions for metadata generation

/**
 * Open Graph types supported by the generator.
 * Based on standard OGP types.
 */
export type OgType =
  | 'website'
  | 'article'
  | 'profile'
  | 'book'
  | 'music.song'
  | 'music.album'
  | 'music.playlist'
  | 'music.radio_station'
  | 'video.movie'
  | 'video.episode'
  | 'video.tv_show'
  | 'video.other';

/**
 * Represents the structure of image data extracted for metadata.
 */
export interface ImageData {
  imageUrl: string; // Absolute URL
  imageWidth?: number;
  imageHeight?: number;
  imageAlt: string;
}

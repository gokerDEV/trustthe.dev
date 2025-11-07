import { OG_HEIGHT, OG_WIDTH } from '@/config/constants';
import { NextRequest } from 'next/server';
import sharp from 'sharp';

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('src');
  if (!imageUrl) return new Response('Missing image src', { status: 400 });

  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'OG-Image-Proxy' },
      next: { revalidate: 60 * 60 * 24 * 7 }, // 1 week CDN cache
    });

    if (!res.ok) {
      return new Response(`Failed to fetch image: ${res.statusText}`, {
        status: res.status,
      });
    }

    const buffer = await res.arrayBuffer();

    // Optimize image using Sharp
    const optimizedImage = await sharp(Buffer.from(buffer))
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 }) // Convert to WebP with good quality
      .toBuffer();

    return new Response(new Uint8Array(optimizedImage), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=604800, immutable',
        'Content-Length': optimizedImage.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return new Response('Error processing image', { status: 500 });
  }
}

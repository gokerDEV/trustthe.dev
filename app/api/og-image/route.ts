import { OG_HEIGHT, OG_WIDTH } from '@/config/constants';
import { NextRequest } from 'next/server';
import sharp from 'sharp';

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP
const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB

// Allowed image URL patterns (whitelist approach)
const ALLOWED_DOMAINS = process.env.OG_IMAGE_ALLOWED_DOMAINS
  ? process.env.OG_IMAGE_ALLOWED_DOMAINS.split(',').map((d) => d.trim())
  : [];

function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Must be HTTP or HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // If whitelist is configured, check against it
    if (ALLOWED_DOMAINS.length > 0) {
      return ALLOWED_DOMAINS.some(
        (domain) =>
          parsedUrl.hostname === domain ||
          parsedUrl.hostname.endsWith(`.${domain}`)
      );
    }

    // Otherwise, allow any valid HTTP/HTTPS URL
    // But block localhost and private IPs for security
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIp(request: NextRequest): string {
  // Try various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('src');
  if (!imageUrl) {
    return new Response('Missing image src', { status: 400 });
  }

  // Optional: Check client_id for additional security
  const clientId = request.nextUrl.searchParams.get('client_id');
  if (process.env.OG_IMAGE_REQUIRE_AUTH === 'true') {
    const expectedClientId = process.env.KODKAFA_CLIENT_ID;
    if (!clientId || clientId !== expectedClientId) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  // Validate image URL
  if (!isValidImageUrl(imageUrl)) {
    return new Response('Invalid image URL', { status: 400 });
  }

  // Rate limiting
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp)) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Validate request origin (optional, can be configured)
  const origin =
    request.headers.get('origin') || request.headers.get('referer');
  if (process.env.OG_IMAGE_ALLOWED_ORIGINS) {
    const allowedOrigins = process.env.OG_IMAGE_ALLOWED_ORIGINS.split(',').map(
      (o) => o.trim()
    );
    if (origin && !allowedOrigins.some((allowed) => origin.includes(allowed))) {
      return new Response('Origin not allowed', { status: 403 });
    }
  }

  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'OG-Image-Proxy' },
      next: { revalidate: 60 * 60 * 24 * 7 }, // 1 week CDN cache
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!res.ok) {
      return new Response(`Failed to fetch image: ${res.statusText}`, {
        status: res.status,
      });
    }

    // Check content length before downloading
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
      return new Response('Image too large', { status: 413 });
    }

    const buffer = await res.arrayBuffer();

    // Check actual size
    if (buffer.byteLength > MAX_IMAGE_SIZE) {
      return new Response('Image too large', { status: 413 });
    }

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
    if (process.env.NODE_ENV === 'development') {
      console.error('Error processing image:', error);
    }
    return new Response('Error processing image', { status: 500 });
  }
}

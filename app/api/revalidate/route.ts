import { abstractCategories } from '@/config/navigation';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

type RevalidateType = 'path' | 'sitemap' | 'all';

export async function POST(request: NextRequest) {
  try {
    // Get client_id from request body or query parameter
    const body = await request.json().catch(() => ({}));
    const clientId =
      body.client_id || request.nextUrl.searchParams.get('client_id');
    const type = (body.type ||
      request.nextUrl.searchParams.get('type') ||
      'path') as RevalidateType;
    const path = body.path || request.nextUrl.searchParams.get('path') || '/';

    // Validate client_id
    const expectedClientId = process.env.KODKAFA_CLIENT_ID;

    if (!clientId || clientId !== expectedClientId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing client_id' },
        { status: 401 }
      );
    }

    const revalidatedPaths: string[] = [];

    // Revalidate path if type is 'path' or 'all'
    if (type === 'path' || type === 'all') {
      // Process path with abstract categories
      let processedPath = path;
      abstractCategories.forEach(([category, prefix]) => {
        processedPath = processedPath.replace(
          `/${category}/`,
          `/${prefix ? prefix + '-' : ''}`
        );
      });

      revalidatePath(processedPath);
      revalidatedPaths.push(processedPath);
    }

    // Revalidate sitemap if type is 'sitemap' or 'all'
    if (type === 'sitemap' || type === 'all') {
      // Next.js automatically generates /sitemap.xml (index) and /sitemap/[id].xml
      const sitemapPaths = [
        '/sitemap.xml',
        '/sitemap/0.xml', // Static pages
        '/sitemap/1.xml', // First posts page where new posts appear
      ];

      sitemapPaths.forEach((sitemapPath) => {
        revalidatePath(sitemapPath);
        revalidatedPaths.push(sitemapPath);
      });
    }

    return NextResponse.json({
      revalidated: true,
      type,
      paths: revalidatedPaths,
      now: Date.now(),
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error revalidating:', error);
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to revalidate',
      },
      { status: 500 }
    );
  }
}

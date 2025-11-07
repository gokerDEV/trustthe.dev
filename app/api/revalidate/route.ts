import { abstractCategories } from '@/config/navigation';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get client_id from request body or query parameter
    const body = await request.json().catch(() => ({}));
    const clientId =
      body.client_id || request.nextUrl.searchParams.get('client_id');
    const path = body.path || request.nextUrl.searchParams.get('path') || '/';

    // Validate client_id
    const expectedClientId = process.env.KODKAFA_CLIENT_ID;

    if (!clientId || clientId !== expectedClientId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing client_id' },
        { status: 401 }
      );
    }

    // Process path with abstract categories
    let processedPath = path;
    abstractCategories.forEach(([category, prefix]) => {
      processedPath = processedPath.replace(
        `/${category}/`,
        `/${prefix ? prefix + '-' : ''}`
      );
    });

    revalidatePath(processedPath);
    return NextResponse.json({
      revalidated: true,
      path: processedPath,
      now: Date.now(),
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error revalidating path:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to revalidate path' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Untuk memastikan Socket.io dapat bekerja dengan baik
  // dengan menambahkan header yang diperlukan
  if (request.nextUrl.pathname.startsWith('/api/socket') || 
      request.nextUrl.pathname.startsWith('/api/socketio') ||
      request.nextUrl.pathname.startsWith('/socket.io')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-middleware-cache', 'no-cache');
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
} 
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Daftar path yang memerlukan autentikasi
const protectedPaths = [
  '/dashboard-admin',
  '/dashboard-admin/availability',
  '/dashboard-admin/cell-down',
  '/dashboard-admin/user-management',
  '/dashboard-admin/approval',
  '/dashboard-admin/crud',
  '/dashboard-admin/data',
  '/dashboard-admin/logs',
];

// Daftar path yang hanya bisa diakses super admin
const superAdminPaths = [
  '/dashboard-admin/user-management',
];

// Daftar path yang hanya bisa diakses admin dan super admin
const adminPaths = [
  '/dashboard-admin/approval',
  '/dashboard-admin/crud',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Cek apakah path memerlukan autentikasi
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Ambil token dari cookie atau header
  const authToken = request.cookies.get('authToken')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Jika tidak ada token, redirect ke login
  if (!authToken) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Untuk path yang memerlukan role tertentu, verifikasi di client-side
  // karena middleware tidak bisa mengakses Firestore secara langsung
  // AuthGuard akan menangani verifikasi role di client-side
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

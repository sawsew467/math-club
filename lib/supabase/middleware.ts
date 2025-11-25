import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make your application
  // vulnerable to security issues.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isStudentExamPage = request.nextUrl.pathname.startsWith('/student');
  // Note: Teacher pages use localStorage auth (not Supabase), so we don't protect them here.
  // The teacher dashboard handles its own auth check on the client side.

  // If user is not logged in and trying to access student protected routes
  if (!user && isStudentExamPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access auth pages, redirect to exams
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/exams';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

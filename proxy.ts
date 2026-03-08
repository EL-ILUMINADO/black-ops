import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/proxy';

export async function proxy(request: NextRequest) {
  
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  if (!allowedMethods.includes(request.method)) {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

 
  const response = await updateSession(request);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let supabaseDomain = '';
  try {
    supabaseDomain = new URL(supabaseUrl).hostname;
  } catch (error) {
    console.error("Invalid Supabase URL in environment variables", error);
  }

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://${supabaseDomain} wss://${supabaseDomain};
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim(); 


  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Clickjacking protection
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevents the browser from trying to guess MIME types (stops malicious uploads disguising as images)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Only send referral data if going to another HTTPS site on the same origin
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Forces the browser to ONLY use HTTPS for the next year, even if the user types http://
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Device Lockdown: We are a text chat. We have no business accessing cameras or mics.
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
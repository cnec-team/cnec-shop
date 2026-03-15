import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { locales, defaultLocale, localePattern, type Locale } from '@/lib/i18n/config';

const { auth } = NextAuth(authConfig);

// Country code -> locale mapping for IP-based (geo) detection
const countryToLocale: Record<string, Locale> = {
  KR: 'ko',
  JP: 'ja',
  US: 'en',
  GB: 'en',
  AU: 'en',
  CA: 'en',
  NZ: 'en',
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CL: 'es',
  CO: 'es',
  IT: 'it',
  RU: 'ru',
  KZ: 'ru',
  UZ: 'ru',
  AE: 'ar',
  SA: 'ar',
  KW: 'ar',
  QA: 'ar',
  BH: 'ar',
  CN: 'zh',
  TW: 'zh',
  HK: 'zh',
  FR: 'fr',
  BR: 'pt',
  PT: 'pt',
  DE: 'de',
  AT: 'de',
  CH: 'de',
};

function detectLocaleFromGeo(request: any): Locale | null {
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('cloudfront-viewer-country') ||
    request.headers.get('x-country-code');

  if (!country) return null;

  const locale = countryToLocale[country.toUpperCase()];
  return locale || null;
}

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

// Build regex patterns dynamically from config
const LP = localePattern;
const loginPageRegex = new RegExp(`^/(${LP})/(brand|creator|buyer)/login`);
const signupPageRegex = new RegExp(`^/(${LP})/(buyer)/signup`);
const generalLoginRegex = new RegExp(`^/(${LP})/login`);
const generalSignupRegex = new RegExp(`^/(${LP})/signup`);
const adminRouteRegex = new RegExp(`^/(${LP})/admin`);
const brandRouteRegex = new RegExp(`^/(${LP})/brand`);
const creatorRouteRegex = new RegExp(`^/(${LP})/creator`);
const buyerRouteRegex = new RegExp(`^/(${LP})/buyer`);

export default auth(async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Handle shop routes (/@username) - rewrite to /username (strip @)
  const shopRouteRegex = new RegExp(`^/(${LP})/@([a-zA-Z0-9_]+)(.*)$`);
  const shopMatch = pathname.match(shopRouteRegex);
  if (shopMatch) {
    const locale = shopMatch[1];
    const username = shopMatch[2];
    const rest = shopMatch[3] || '';
    const newUrl = new URL(`/${locale}/${username}${rest}`, request.url);
    return NextResponse.rewrite(newUrl);
  }

  // Handle /@username without locale prefix - redirect to default locale
  if (pathname.startsWith('/@')) {
    const rest = pathname.slice(2);
    return NextResponse.redirect(
      new URL(`/${defaultLocale}/${rest}`, request.url)
    );
  }

  // Geo-based locale detection
  const hasLocalePrefix = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (!hasLocalePrefix && pathname === '/') {
    const geoLocale = detectLocaleFromGeo(request);
    if (geoLocale && geoLocale !== defaultLocale) {
      return NextResponse.redirect(new URL(`/${geoLocale}`, request.url));
    }
  }

  // Get auth session from NextAuth
  const user = request.auth?.user;

  // Auth pages should be accessible without authentication
  const isAuthPage =
    loginPageRegex.test(pathname) ||
    signupPageRegex.test(pathname) ||
    generalLoginRegex.test(pathname) ||
    generalSignupRegex.test(pathname);

  // Protected routes - require authentication (exclude auth pages)
  const protectedPaths = ['/admin', '/brand', '/creator', '/buyer'];
  const isProtectedRoute = !isAuthPage && protectedPaths.some((path) => {
    const pattern = new RegExp(`^/(${LP})${path}`);
    return pattern.test(pathname);
  });

  if (isProtectedRoute && !user) {
    const locale = pathname.split('/')[1] || defaultLocale;
    const returnUrl = encodeURIComponent(pathname);

    if (buyerRouteRegex.test(pathname)) {
      return NextResponse.redirect(
        new URL(`/${locale}/buyer/login?returnUrl=${returnUrl}`, request.url)
      );
    }
    return NextResponse.redirect(
      new URL(`/${locale}/login?returnUrl=${returnUrl}`, request.url)
    );
  }

  // Role-based access control (exclude auth pages)
  if (user && !isAuthPage) {
    const userRole = user.role;

    if (adminRouteRegex.test(pathname) && userRole !== 'super_admin') {
      const locale = pathname.split('/')[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    if (brandRouteRegex.test(pathname) && userRole !== 'brand_admin') {
      const locale = pathname.split('/')[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    if (creatorRouteRegex.test(pathname) && userRole !== 'creator') {
      const locale = pathname.split('/')[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    if (buyerRouteRegex.test(pathname) && userRole !== 'buyer') {
      const locale = pathname.split('/')[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  // Apply i18n middleware
  return intlMiddleware(request);
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

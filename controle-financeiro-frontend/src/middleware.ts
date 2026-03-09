import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/auth"];

function isTokenExpired(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payloadBase64 = parts[1];
    const payloadString = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadString);
    
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true; 
    }
    return false; 
  } catch (e) {
    return true; 
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.includes(pathname);
  const token = request.cookies.get("token")?.value;

  const hasValidToken = token && !isTokenExpired(token);

  if (!hasValidToken && !isPublicRoute) {
    const response = NextResponse.redirect(new URL("/auth", request.url));
    response.cookies.delete("token");
    return response;
  }

  if (hasValidToken && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
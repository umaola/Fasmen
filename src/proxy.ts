import { NextResponse, type NextRequest } from "next/server";
import { decrypt, COOKIE_NAME } from "@/lib/session";

const protectedRoutes = ["/dashboard"];

export async function proxy(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));

    if (!isProtectedRoute) {
      return NextResponse.next();
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await decrypt(token) : null;

    if (!session?.userId) {
      return NextResponse.redirect(new URL("/login", request.nextUrl));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Proxy middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};


import { NextResponse, type NextRequest } from "next/server";
import { decrypt, COOKIE_NAME } from "@/lib/session";

const protectedRoutes = ["/dashboard"];

export async function proxy(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));

    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await decrypt(token) : null;

    if (isProtectedRoute && !session?.userId) {
      return NextResponse.redirect(new URL("/login", request.nextUrl));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Proxy middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

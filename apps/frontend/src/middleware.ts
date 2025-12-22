import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // Debug: Log all cookies

  // Try to get token with both possible secrets
  const secret = process.env.NEXTAUTH_SECRET || "fallback_secret";

  const token = await getToken({
    req,
    secret: secret,
  });

  const signinUrl = new URL("/signin", req.url);

  if (token && token.userId && req.nextUrl.pathname === "/signin") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if ((!token || !token.userId) && req.nextUrl.pathname !== "/signin") {
    console.log("User not authenticated, redirecting to signin");
    return NextResponse.redirect(signinUrl);
  }
  console.log("Final token:", token);

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/canvas",
    "/canvas/:path*",
    "/signin",
    "/signin/:path*",
  ],
};

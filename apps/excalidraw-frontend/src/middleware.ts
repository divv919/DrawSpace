import { NextRequest, NextResponse } from "next/server";
import JWT_SECRET from "@repo/backend-common/config";
import * as jose from "jose";

import jwt from "jsonwebtoken";
export function middleware(req: NextRequest, res: NextResponse) {
  const token = req.cookies.get("authToken")?.value;
  console.log({ token });
  if (!token) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }
  try {
    console.log("about to decode");
    const secret = new TextEncoder().encode(JWT_SECRET);
    const decoded = jose.jwtVerify(token, secret);
    if (!decoded) {
      console.log("undecoded");
      return NextResponse.redirect(new URL("/signin", req.url));
    }
    console.log("decoded");
  } catch (err) {
    console.log("error decoding", err);

    return NextResponse.redirect(new URL("/signin", req.url));
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/canvas", "/canvas/:path*"],
};

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { E2E_COOKIE_NAME } from "@/lib/e2e-constants";

export const proxy = auth((request) => {
  const e2eEmail = process.env.E2E_AUTH_EMAIL?.toLowerCase();
  const cookieEmail = request.cookies.get(E2E_COOKIE_NAME)?.value.toLowerCase();
  const hasE2eSession =
    process.env.NODE_ENV !== "production" && Boolean(e2eEmail) && cookieEmail === e2eEmail;

  if (hasE2eSession) {
    return NextResponse.next();
  }

  if (!request.auth && request.nextUrl.pathname !== "/signin") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|api/e2e-login|_next/static|_next/image|favicon.ico).*)",
  ],
};

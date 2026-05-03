import { NextResponse } from "next/server";
import { isAllowedEmail } from "@/auth";
import { E2E_COOKIE_NAME } from "@/lib/e2e-auth";

export async function GET(request: Request) {
  const email = process.env.E2E_AUTH_EMAIL?.toLowerCase();
  if (process.env.NODE_ENV === "production" || !email || !isAllowedEmail(email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(E2E_COOKIE_NAME, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}

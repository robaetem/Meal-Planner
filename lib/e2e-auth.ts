import { cookies } from "next/headers";
import { isAllowedEmail } from "@/auth";
import { E2E_COOKIE_NAME } from "./e2e-constants";

export { E2E_COOKIE_NAME };

export async function getE2eIdentity() {
  if (process.env.NODE_ENV === "production") return null;
  const email = process.env.E2E_AUTH_EMAIL?.toLowerCase();
  if (!email || !isAllowedEmail(email)) return null;

  const cookieStore = await cookies();
  const cookieEmail = cookieStore.get(E2E_COOKIE_NAME)?.value.toLowerCase();
  if (cookieEmail !== email) return null;

  return {
    email,
    name: "E2E Robin",
    image: null,
  };
}

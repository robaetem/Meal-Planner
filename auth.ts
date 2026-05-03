import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const allowedEmails = new Set(
  (process.env.AUTH_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

function profileEmail(profile: unknown) {
  if (!profile || typeof profile !== "object") return null;
  const record = profile as Record<string, unknown>;
  const candidates = [record.email, record.preferred_username, record.upn];
  const email = candidates.find((value): value is string => typeof value === "string");
  return email ?? null;
}

export function isAllowedEmail(email: string | null | undefined) {
  return typeof email === "string" && allowedEmails.has(email.toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google,
    MicrosoftEntraID({
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "google" && profile && "email_verified" in profile) {
        if (profile.email_verified !== true) return false;
      }

      return isAllowedEmail(user.email ?? profileEmail(profile));
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
});

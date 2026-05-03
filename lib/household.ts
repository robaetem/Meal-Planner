import { redirect } from "next/navigation";
import { auth, isAllowedEmail } from "@/auth";
import { prisma } from "./db";
import { getE2eIdentity } from "./e2e-auth";

export async function requireHousehold() {
  const session = await auth();
  const e2eIdentity = await getE2eIdentity();
  if (!session?.user?.email && !e2eIdentity) redirect("/signin");

  const email = (session?.user?.email ?? e2eIdentity?.email ?? "").toLowerCase();
  if (!isAllowedEmail(email)) redirect("/signin?error=AccessDenied");
  const name = session?.user?.name ?? e2eIdentity?.name ?? null;
  const image = session?.user?.image ?? e2eIdentity?.image ?? null;

  const user = await prisma.appUser.upsert({
    where: { email },
    update: {
      name: name ?? undefined,
      image: image ?? undefined,
    },
    create: {
      email,
      name,
      image,
    },
  });

  const existingMembership = await prisma.householdMember.findFirst({
    where: { userId: user.id },
    include: { household: true },
  });

  if (existingMembership) {
    return {
      user,
      household: existingMembership.household,
      session: session ?? { user: { email, name, image } },
    };
  }

  const household = await prisma.household.create({
    data: {
      name: "Appartement",
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  return { user, household, session: session ?? { user: { email, name, image } } };
}

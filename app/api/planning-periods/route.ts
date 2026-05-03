import { NextResponse } from "next/server";
import { auth, isAllowedEmail } from "@/auth";
import { periodColor } from "@/lib/colors";
import { prisma } from "@/lib/db";
import { fromDateKey } from "@/lib/date-utils";
import { getE2eIdentity } from "@/lib/e2e-auth";

async function getHouseholdForApi() {
  const session = await auth();
  const e2eIdentity = await getE2eIdentity();
  if (!session?.user?.email && !e2eIdentity) return null;

  const email = (session?.user?.email ?? e2eIdentity?.email ?? "").toLowerCase();
  if (!isAllowedEmail(email)) return null;
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

  const membership = await prisma.householdMember.findFirst({
    where: { userId: user.id },
    include: { household: true },
  });
  if (membership) return membership.household;

  return prisma.household.create({
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
}

export async function POST(request: Request) {
  const household = await getHouseholdForApi();
  if (!household) {
    return NextResponse.json({ error: "Niet aangemeld" }, { status: 401 });
  }

  const body = (await request.json()) as {
    startDate?: string;
    endDate?: string;
  };

  if (!body.startDate || !body.endDate) {
    return NextResponse.json({ error: "Start- en einddatum zijn verplicht" }, { status: 400 });
  }

  const startDate =
    body.startDate <= body.endDate ? fromDateKey(body.startDate) : fromDateKey(body.endDate);
  const endDate =
    body.startDate <= body.endDate ? fromDateKey(body.endDate) : fromDateKey(body.startDate);
  const periodCount = await prisma.planningPeriod.count({
    where: { householdId: household.id },
  });
  const planningPeriod = await prisma.planningPeriod.create({
    data: {
      householdId: household.id,
      startDate,
      endDate,
      color: periodColor(periodCount),
    },
  });

  return NextResponse.json({ id: planningPeriod.id });
}

import Link from "next/link";
import { AppShell } from "@/app/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatRange } from "@/lib/date-utils";
import { prisma } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { calculateShoppingItems, formatQuantity } from "@/lib/shopping";
import { cn } from "@/lib/utils";

export default async function ShoppingPage() {
  const { household, session } = await requireHousehold();
  const periods = await prisma.planningPeriod.findMany({
    where: { householdId: household.id },
    include: {
      plannedMeals: {
        include: {
          recipe: { include: { ingredients: true } },
          freezerItem: true,
        },
      },
      shoppingListItems: { orderBy: [{ checked: "asc" }, { sortOrder: "asc" }] },
    },
    orderBy: { startDate: "desc" },
    take: 6,
  });

  return (
    <AppShell active="boodschappen" userName={session.user?.name}>
      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div>
          <p className="text-sm text-muted-foreground">Collect & Go</p>
          <h1 className="text-2xl font-semibold tracking-tight">Boodschappen</h1>
        </div>

        {periods.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {periods.map((period) => {
            const calculatedItems = calculateShoppingItems(period.plannedMeals);
            return (
              <Card key={period.id}>
                <CardHeader>
                  <CardTitle>{formatRange(period.startDate, period.endDate)}</CardTitle>
                  <Link
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
                    href={`/planningen/${period.id}`}
                  >
                    Planning openen
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {[...calculatedItems.slice(0, 8), ...period.shoppingListItems].map((item) => (
                      <div
                        className={cn(
                          "flex items-center justify-between gap-3 text-sm",
                          "checked" in item && item.checked && "text-muted-foreground line-through",
                        )}
                        key={"key" in item ? item.key : item.id}
                      >
                        <span className="truncate">{item.name}</span>
                        <Badge variant="secondary">
                          {formatQuantity(item.quantity, item.unit ?? "")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Nog geen boodschappenlijsten</EmptyTitle>
              <EmptyDescription>
                Maak een planning om automatisch ingredienten te zien.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>
    </AppShell>
  );
}

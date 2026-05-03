import { AppShell } from "./components/app-shell";
import { PlanningCalendar } from "./components/planning-calendar";
import { prisma } from "@/lib/db";
import {
  calendarWindow,
  formatRange,
  toDateKey,
} from "@/lib/date-utils";
import { requireHousehold } from "@/lib/household";

function plannedMealLabel(plannedMeal: {
  eater: string;
  robinPortions: number;
  amberPortions: number;
  recipe: { name: string } | null;
  freezerItem: { name: string } | null;
}) {
  const mealName = plannedMeal.recipe?.name ?? plannedMeal.freezerItem?.name ?? "Onbekend";
  if (plannedMeal.eater === "ROBIN") return `Robin: ${mealName}`;
  if (plannedMeal.eater === "AMBER") return `Amber: ${mealName}`;

  const portions = [
    plannedMeal.robinPortions ? `${plannedMeal.robinPortions}R` : null,
    plannedMeal.amberPortions ? `${plannedMeal.amberPortions}A` : null,
  ]
    .filter(Boolean)
    .join(" + ");
  return portions ? `${mealName} (${portions})` : mealName;
}

export default async function Home() {
  const { household, session } = await requireHousehold();
  const { start, end, days } = calendarWindow(new Date(), 8);

  const periods = await prisma.planningPeriod.findMany({
    where: {
      householdId: household.id,
      startDate: { lte: end },
      endDate: { gte: start },
    },
    include: {
      plannedMeals: {
        include: {
          recipe: { select: { name: true } },
          freezerItem: { select: { name: true } },
        },
        orderBy: [{ date: "asc" }, { eater: "asc" }],
      },
    },
    orderBy: { startDate: "asc" },
  });

  const summaries = new Map<string, string[]>();
  for (const period of periods) {
    for (const plannedMeal of period.plannedMeals) {
      const key = toDateKey(plannedMeal.date);
      const lines = summaries.get(key) ?? [];
      lines.push(plannedMealLabel(plannedMeal));
      summaries.set(key, lines);
    }
  }

  return (
    <AppShell active="kalender" userName={session.user?.name}>
      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Planning</p>
          <h1 className="text-2xl font-semibold tracking-tight">Kalender</h1>
          <p className="text-sm text-muted-foreground">
            Sleep over dagen om meteen een nieuwe planning te maken.
          </p>
        </div>

        <PlanningCalendar
          days={days.map((day) => ({
            key: toDateKey(day),
            dayNumber: day.getUTCDate(),
            weekday: new Intl.DateTimeFormat("nl-BE", { weekday: "short" }).format(day),
            isToday: toDateKey(day) === toDateKey(new Date()),
          }))}
          periods={periods.map((period) => ({
            id: period.id,
            startDate: toDateKey(period.startDate),
            endDate: toDateKey(period.endDate),
            color: period.color,
            rangeLabel: formatRange(period.startDate, period.endDate),
            collectAndGoPickupDate: period.collectAndGoPickupDate
              ? toDateKey(period.collectAndGoPickupDate)
              : null,
          }))}
          summaries={Array.from(summaries.entries()).map(([date, lines]) => ({
            date,
            lines,
          }))}
        />
      </main>
    </AppShell>
  );
}

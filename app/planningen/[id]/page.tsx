import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import {
  addManualShoppingItem,
  clearDayPlanning,
  deleteManualShoppingItem,
  deletePlanningPeriod,
  planSameMeal,
  planSplitMeal,
  toggleManualShoppingItem,
  updatePlanningPeriodSettings,
} from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  dateInputValue,
  eachDate,
  formatDutchDate,
  formatRange,
  toDateKey,
} from "@/lib/date-utils";
import { prisma } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { calculateShoppingItems, formatQuantity } from "@/lib/shopping";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, CheckIcon, Trash2Icon, XIcon } from "lucide-react";

type MealOption = {
  value: string;
  label: string;
};

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function MealSelect({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: MealOption[];
  defaultValue?: string;
}) {
  return (
    <select className={selectClassName} defaultValue={defaultValue ?? ""} name={name}>
      <option value="">Kies maaltijd</option>
      <optgroup label="Maaltijden">
        {options
          .filter((option) => option.value.startsWith("recipe:"))
          .map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </optgroup>
      <optgroup label="Diepvries">
        {options
          .filter((option) => option.value.startsWith("freezer:"))
          .map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </optgroup>
    </select>
  );
}

function plannedMealText(plannedMeal: {
  eater: string;
  robinPortions: number;
  amberPortions: number;
  recipe: { name: string } | null;
  freezerItem: { name: string } | null;
}) {
  const mealName = plannedMeal.recipe?.name ?? plannedMeal.freezerItem?.name ?? "Onbekend";
  const freezer = plannedMeal.freezerItem ? " uit diepvries" : "";
  if (plannedMeal.eater === "ROBIN") return `Robin: ${mealName}${freezer}`;
  if (plannedMeal.eater === "AMBER") return `Amber: ${mealName}${freezer}`;
  const parts = [
    plannedMeal.robinPortions ? `${plannedMeal.robinPortions}x Robin` : null,
    plannedMeal.amberPortions ? `${plannedMeal.amberPortions}x Amber` : null,
  ]
    .filter(Boolean)
    .join(" + ");
  return `${mealName}${freezer}${parts ? ` (${parts})` : ""}`;
}

export default async function PlanningPeriodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { household, session } = await requireHousehold();
  const period = await prisma.planningPeriod.findFirst({
    where: { id, householdId: household.id },
    include: {
      plannedMeals: {
        include: {
          recipe: {
            include: {
              ingredients: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
            },
          },
          freezerItem: true,
        },
        orderBy: [{ date: "asc" }, { eater: "asc" }],
      },
      shoppingListItems: { orderBy: [{ checked: "asc" }, { sortOrder: "asc" }] },
    },
  });

  if (!period) notFound();

  const recipes = await prisma.recipe.findMany({
    where: { householdId: household.id },
    orderBy: { name: "asc" },
  });
  const usedFreezerIdsInPeriod = period.plannedMeals
    .map((plannedMeal) => plannedMeal.freezerItemId)
    .filter((freezerItemId): freezerItemId is string => Boolean(freezerItemId));
  const freezerItems = await prisma.freezerItem.findMany({
    where: {
      householdId: household.id,
      OR: [{ usedAt: null }, { id: { in: usedFreezerIdsInPeriod } }],
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const mealOptions: MealOption[] = [
    ...recipes.map((recipe) => ({
      value: `recipe:${recipe.id}`,
      label: recipe.name,
    })),
    ...freezerItems.map((item) => ({
      value: `freezer:${item.id}`,
      label: `${item.name} (${item.robinPortions}R/${item.amberPortions}A)`,
    })),
  ];
  const plannedMealsByDate = new Map<string, typeof period.plannedMeals>();
  for (const plannedMeal of period.plannedMeals) {
    const key = toDateKey(plannedMeal.date);
    plannedMealsByDate.set(key, [...(plannedMealsByDate.get(key) ?? []), plannedMeal]);
  }
  const calculatedItems = calculateShoppingItems(period.plannedMeals);

  return (
    <AppShell active="kalender" userName={session.user?.name}>
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div className="flex items-center justify-between gap-3 lg:col-span-2">
          <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href="/">
            <ArrowLeftIcon data-icon="inline-start" />
            Terug
          </Link>
          <form action={deletePlanningPeriod}>
            <input name="planningPeriodId" type="hidden" value={period.id} />
            <Button size="sm" type="submit" variant="destructive">
              <Trash2Icon data-icon="inline-start" />
              Verwijderen
            </Button>
          </form>
        </div>

        <section className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Planning</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {formatRange(period.startDate, period.endDate)}
            </h1>
          </div>

          <Card>
            <CardContent>
              <form action={updatePlanningPeriodSettings}>
                <input name="planningPeriodId" type="hidden" value={period.id} />
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="collectAndGoPickupDate">
                      Collect & Go afhaaldag
                    </FieldLabel>
                    <Input
                      id="collectAndGoPickupDate"
                      defaultValue={dateInputValue(period.collectAndGoPickupDate)}
                      name="collectAndGoPickupDate"
                      type="date"
                    />
                  </Field>
                  <Button type="submit">Opslaan</Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            {eachDate(period.startDate, period.endDate).map((day) => {
              const dateKey = toDateKey(day);
              const plannedMeals = plannedMealsByDate.get(dateKey) ?? [];
              const sameMeal = plannedMeals.find((plannedMeal) => plannedMeal.eater === "BOTH");
              const robinMeal = plannedMeals.find((plannedMeal) => plannedMeal.eater === "ROBIN");
              const amberMeal = plannedMeals.find((plannedMeal) => plannedMeal.eater === "AMBER");

              return (
                <Card key={dateKey} size="sm">
                  <CardHeader className="flex flex-row items-center justify-between gap-3">
                    <CardTitle>{formatDutchDate(day)}</CardTitle>
                    <form action={clearDayPlanning}>
                      <input name="planningPeriodId" type="hidden" value={period.id} />
                      <input name="date" type="hidden" value={dateKey} />
                      <Button size="sm" type="submit" variant="ghost">
                        Leegmaken
                      </Button>
                    </form>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-4">
                    {plannedMeals.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {plannedMeals.map((plannedMeal) => (
                          <Badge key={plannedMeal.id} variant="secondary">
                            {plannedMealText(plannedMeal)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nog niets gepland.</p>
                    )}

                    <div className="grid gap-3 xl:grid-cols-2">
                      <form action={planSameMeal} className="flex flex-col gap-3 rounded-lg border p-3">
                      <input name="planningPeriodId" type="hidden" value={period.id} />
                      <input name="date" type="hidden" value={dateKey} />
                      <h3 className="text-sm font-medium">Samen</h3>
                      <MealSelect
                        defaultValue={
                          sameMeal?.recipeId
                            ? `recipe:${sameMeal.recipeId}`
                            : sameMeal?.freezerItemId
                              ? `freezer:${sameMeal.freezerItemId}`
                              : undefined
                        }
                        name="mealSelection"
                        options={mealOptions}
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field>
                          <FieldLabel>Robin</FieldLabel>
                          <Input
                            defaultValue={sameMeal?.robinPortions ?? 1}
                            min="0"
                            name="robinPortions"
                            type="number"
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Amber</FieldLabel>
                          <Input
                            defaultValue={sameMeal?.amberPortions ?? 1}
                            min="0"
                            name="amberPortions"
                            type="number"
                          />
                        </Field>
                      </div>
                      <Button type="submit" variant="secondary">
                        Samen opslaan
                      </Button>
                    </form>

                    <form action={planSplitMeal} className="flex flex-col gap-3 rounded-lg border p-3">
                      <input name="planningPeriodId" type="hidden" value={period.id} />
                      <input name="date" type="hidden" value={dateKey} />
                      <h3 className="text-sm font-medium">Apart</h3>
                      <Field>
                        <FieldLabel>Robin eet</FieldLabel>
                        <MealSelect
                          defaultValue={
                            robinMeal?.recipeId
                              ? `recipe:${robinMeal.recipeId}`
                              : robinMeal?.freezerItemId
                                ? `freezer:${robinMeal.freezerItemId}`
                                : undefined
                          }
                          name="robinMealSelection"
                          options={mealOptions}
                        />
                      </Field>
                      <input defaultValue={1} name="robinPortions" type="hidden" />
                      <Field>
                        <FieldLabel>Amber eet</FieldLabel>
                        <MealSelect
                          defaultValue={
                            amberMeal?.recipeId
                              ? `recipe:${amberMeal.recipeId}`
                              : amberMeal?.freezerItemId
                                ? `freezer:${amberMeal.freezerItemId}`
                                : undefined
                          }
                          name="amberMealSelection"
                          options={mealOptions}
                        />
                      </Field>
                      <input defaultValue={1} name="amberPortions" type="hidden" />
                      <Button type="submit" variant="secondary">
                        Apart opslaan
                      </Button>
                    </form>
                  </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Boodschappenlijst</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Berekend</h3>
            {calculatedItems.length > 0 ? (
              <div className="flex flex-col gap-2">
                {calculatedItems.map((item) => (
                  <div className="flex items-center justify-between gap-3 text-sm" key={item.key}>
                    <span className="truncate">{item.name}</span>
                    <Badge variant="secondary">{formatQuantity(item.quantity, item.unit)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Nog geen ingredienten</EmptyTitle>
                  <EmptyDescription>
                    Kies maaltijden om de lijst automatisch te berekenen.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </section>

          <Separator />

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Manueel</h3>
            {period.shoppingListItems.length > 0 ? (
              <div className="flex flex-col gap-2">
                {period.shoppingListItems.map((item) => (
                  <div className="flex items-center gap-2 text-sm" key={item.id}>
                    <form action={toggleManualShoppingItem}>
                      <input name="planningPeriodId" type="hidden" value={period.id} />
                      <input name="shoppingItemId" type="hidden" value={item.id} />
                      <Button aria-label="Afgevinkt wijzigen" size="icon-sm" type="submit" variant="outline">
                        {item.checked ? <CheckIcon data-icon="inline-start" /> : null}
                      </Button>
                    </form>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate",
                        item.checked && "text-muted-foreground line-through",
                      )}
                    >
                      {item.name}
                    </span>
                    <Badge variant="secondary">
                      {formatQuantity(item.quantity, item.unit ?? "")}
                    </Badge>
                    <form action={deleteManualShoppingItem}>
                      <input name="planningPeriodId" type="hidden" value={period.id} />
                      <input name="shoppingItemId" type="hidden" value={item.id} />
                      <Button aria-label="Item verwijderen" size="icon-sm" type="submit" variant="ghost">
                        <XIcon data-icon="inline-start" />
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Geen manuele items.</p>
            )}

            <form action={addManualShoppingItem}>
              <input name="planningPeriodId" type="hidden" value={period.id} />
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="manualName">Item</FieldLabel>
                  <Input id="manualName" name="name" required />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="manualQuantity">Aantal</FieldLabel>
                    <Input id="manualQuantity" name="quantity" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="manualUnit">Eenheid</FieldLabel>
                    <Input id="manualUnit" name="unit" />
                  </Field>
                </div>
                <Button type="submit">Toevoegen</Button>
              </FieldGroup>
            </form>
          </section>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}

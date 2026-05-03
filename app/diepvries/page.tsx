import { AppShell } from "@/app/components/app-shell";
import { createFreezerItem, deleteFreezerItem } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { dateInputValue } from "@/lib/date-utils";
import { prisma } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { XIcon } from "lucide-react";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function FreezerPage() {
  const { household, session } = await requireHousehold();
  const [recipes, freezerItems] = await Promise.all([
    prisma.recipe.findMany({
      where: { householdId: household.id },
      orderBy: { name: "asc" },
    }),
    prisma.freezerItem.findMany({
      where: { householdId: household.id, usedAt: null },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <AppShell active="diepvries" userName={session.user?.name}>
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[320px_1fr]">
        <div className="lg:col-span-2">
          <p className="text-sm text-muted-foreground">Voorraad</p>
          <h1 className="text-2xl font-semibold tracking-tight">Diepvries</h1>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Toevoegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createFreezerItem}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="recipeId">Gekoppelde maaltijd</FieldLabel>
                  <select className={selectClassName} id="recipeId" name="recipeId">
                    <option value="">Geen</option>
                    {recipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="name">Naam</FieldLabel>
                  <Input id="name" name="name" placeholder="bv. Chili potje" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="category">Categorie</FieldLabel>
                  <select className={selectClassName} id="category" name="category">
                    <option value="Potjes">Potjes</option>
                    <option value="Groenten">Groenten</option>
                    <option value="Vlees">Vlees</option>
                    <option value="Andere">Andere</option>
                  </select>
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="robinPortions">Robin-porties</FieldLabel>
                    <Input
                      id="robinPortions"
                      defaultValue={1}
                      min="0"
                      name="robinPortions"
                      type="number"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="amberPortions">Amber-porties</FieldLabel>
                    <Input
                      id="amberPortions"
                      defaultValue={1}
                      min="0"
                      name="amberPortions"
                      type="number"
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="frozenAt">Ingevroren op</FieldLabel>
                  <Input
                    id="frozenAt"
                    defaultValue={dateInputValue(new Date())}
                    name="frozenAt"
                    type="date"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="notes">Notities</FieldLabel>
                  <Textarea id="notes" name="notes" rows={3} />
                </Field>
                <Button type="submit">Toevoegen aan diepvries</Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="p-0">
            {freezerItems.length > 0 ? (
              freezerItems.map((item) => (
                <div
                  className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  key={item.id}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.name}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="secondary">
                      {item.category ?? "Geen categorie"} · {item.robinPortions}R/
                      {item.amberPortions}A
                      </Badge>
                    </div>
                  </div>
                  <form action={deleteFreezerItem}>
                    <input name="freezerItemId" type="hidden" value={item.id} />
                    <Button aria-label="Diepvriesitem verwijderen" size="icon-sm" type="submit" variant="ghost">
                      <XIcon data-icon="inline-start" />
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Geen beschikbare diepvriesmaaltijden</EmptyTitle>
                  <EmptyDescription>
                    Voeg potjes toe die later geen ingredienten moeten toevoegen.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}

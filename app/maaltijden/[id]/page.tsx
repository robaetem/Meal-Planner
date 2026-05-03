import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/app/components/app-shell";
import {
  addRecipeIngredient,
  deleteRecipe,
  deleteRecipeIngredient,
  updateRecipe,
} from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, Trash2Icon, XIcon } from "lucide-react";

const scopeLabels = {
  ROBIN: "Per Robin-portie",
  AMBER: "Per Amber-portie",
  PREPARATION: "Per bereiding",
};

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { household, session } = await requireHousehold();
  const recipe = await prisma.recipe.findFirst({
    where: { id, householdId: household.id },
    include: {
      ingredients: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
  });

  if (!recipe) notFound();

  return (
    <AppShell active="maaltijden" userName={session.user?.name}>
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div className="flex items-center justify-between gap-3 lg:col-span-2">
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href="/maaltijden"
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Terug
          </Link>
          <form action={deleteRecipe}>
            <input name="recipeId" type="hidden" value={recipe.id} />
            <Button size="sm" type="submit" variant="destructive">
              <Trash2Icon data-icon="inline-start" />
              Verwijderen
            </Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{recipe.name}</CardTitle>
            <CardDescription>Basisgegevens en instructies.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateRecipe}>
              <input name="recipeId" type="hidden" value={recipe.id} />
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Naam</FieldLabel>
                  <Input id="name" defaultValue={recipe.name} name="name" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">Notities</FieldLabel>
                  <Textarea
                    id="description"
                    defaultValue={recipe.description ?? ""}
                    name="description"
                    rows={3}
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="prepMinutes">Voorbereiding</FieldLabel>
                    <Input
                      id="prepMinutes"
                      defaultValue={recipe.prepMinutes ?? ""}
                      name="prepMinutes"
                      placeholder="min"
                      type="number"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="cookMinutes">Kooktijd</FieldLabel>
                    <Input
                      id="cookMinutes"
                      defaultValue={recipe.cookMinutes ?? ""}
                      name="cookMinutes"
                      placeholder="min"
                      type="number"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tags">Tags</FieldLabel>
                    <Input id="tags" defaultValue={recipe.tags ?? ""} name="tags" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sourceUrl">Bron</FieldLabel>
                    <Input
                      id="sourceUrl"
                      defaultValue={recipe.sourceUrl ?? ""}
                      name="sourceUrl"
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="instructions">Instructies</FieldLabel>
                  <Textarea
                    id="instructions"
                    defaultValue={recipe.instructions ?? ""}
                    name="instructions"
                    rows={6}
                  />
                </Field>
                <Button type="submit">Maaltijd opslaan</Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Ingredienten</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {recipe.ingredients.length > 0 ? (
              <div className="flex flex-col">
                {recipe.ingredients.map((ingredient) => (
                  <div className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0" key={ingredient.id}>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{ingredient.name}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {ingredient.quantity ?? "?"} {ingredient.unit ?? ""}
                        </Badge>
                        <Badge variant="outline">{scopeLabels[ingredient.scope]}</Badge>
                      </div>
                    </div>
                    <form action={deleteRecipeIngredient}>
                      <input name="recipeId" type="hidden" value={recipe.id} />
                      <input name="ingredientId" type="hidden" value={ingredient.id} />
                      <Button aria-label="Ingredient verwijderen" size="icon-sm" type="submit" variant="ghost">
                        <XIcon data-icon="inline-start" />
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Nog geen ingredienten</EmptyTitle>
                  <EmptyDescription>
                    Voeg toe wat nodig is per Robin-portie, Amber-portie of bereiding.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            <Separator />

            <form action={addRecipeIngredient}>
              <input name="recipeId" type="hidden" value={recipe.id} />
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="scope">Type</FieldLabel>
                  <select className={selectClassName} id="scope" name="scope">
                    <option value="ROBIN">Per Robin-portie</option>
                    <option value="AMBER">Per Amber-portie</option>
                    <option value="PREPARATION">Per bereiding</option>
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="ingredientName">Ingredient</FieldLabel>
                  <Input id="ingredientName" name="name" required />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="quantity">Hoeveelheid</FieldLabel>
                    <Input id="quantity" name="quantity" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="unit">Eenheid</FieldLabel>
                    <Input id="unit" name="unit" placeholder="g, stuk, ml" />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="notes">Notities</FieldLabel>
                  <Input id="notes" name="notes" />
                </Field>
                <Button type="submit" variant="secondary">
                  Ingredient toevoegen
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}

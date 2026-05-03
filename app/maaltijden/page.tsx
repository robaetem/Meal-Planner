import Link from "next/link";
import { AppShell } from "@/app/components/app-shell";
import { createRecipe } from "@/app/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/db";
import { requireHousehold } from "@/lib/household";
import { cn } from "@/lib/utils";

export default async function MealsPage() {
  const { household, session } = await requireHousehold();
  const recipes = await prisma.recipe.findMany({
    where: { householdId: household.id },
    include: { ingredients: true },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell active="maaltijden" userName={session.user?.name}>
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[320px_1fr]">
        <div className="lg:col-span-2">
          <p className="text-sm text-muted-foreground">Database</p>
          <h1 className="text-2xl font-semibold tracking-tight">Maaltijden</h1>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Nieuwe maaltijd</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createRecipe}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Naam</FieldLabel>
                  <Input id="name" name="name" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">Notities</FieldLabel>
                  <Textarea id="description" name="description" rows={4} />
                </Field>
                <Button type="submit">Maaltijd maken</Button>
              </FieldGroup>
          </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="p-0">
            {recipes.length > 0 ? (
              recipes.map((recipe) => (
                <Link
                  className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-muted/50"
                  href={`/maaltijden/${recipe.id}`}
                  key={recipe.id}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{recipe.name}</div>
                    <div className="mt-1">
                      <Badge variant="secondary">
                        {recipe.ingredients.length} ingredienten
                      </Badge>
                    </div>
                  </div>
                  <span className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                    Openen
                  </span>
                </Link>
              ))
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Nog geen maaltijden</EmptyTitle>
                  <EmptyDescription>
                    Maak je eerste maaltijd om ze later in een planning te gebruiken.
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

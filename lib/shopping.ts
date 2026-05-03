import type { IngredientScope } from "@/lib/generated/prisma/enums";

type Ingredient = {
  scope: IngredientScope;
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
};

type PlannedMealForShopping = {
  assignmentType: "RECIPE" | "FREEZER";
  robinPortions: number;
  amberPortions: number;
  recipe: {
    ingredients: Ingredient[];
  } | null;
};

export type CalculatedShoppingItem = {
  key: string;
  name: string;
  quantity: number | null;
  unit: string;
  notes: string[];
};

function addItem(
  items: Map<string, CalculatedShoppingItem>,
  ingredient: Ingredient,
  multiplier: number,
) {
  if (multiplier <= 0) return;

  const unit = ingredient.unit?.trim() ?? "";
  const key = `${ingredient.name.trim().toLowerCase()}|${unit.toLowerCase()}`;
  const existing = items.get(key);
  const quantity =
    typeof ingredient.quantity === "number" ? ingredient.quantity * multiplier : null;

  if (!existing) {
    items.set(key, {
      key,
      name: ingredient.name,
      quantity,
      unit,
      notes: ingredient.notes ? [ingredient.notes] : [],
    });
    return;
  }

  if (existing.quantity !== null && quantity !== null) {
    existing.quantity += quantity;
  } else {
    existing.quantity = null;
  }

  if (ingredient.notes && !existing.notes.includes(ingredient.notes)) {
    existing.notes.push(ingredient.notes);
  }
}

export function calculateShoppingItems(plannedMeals: PlannedMealForShopping[]) {
  const items = new Map<string, CalculatedShoppingItem>();

  for (const plannedMeal of plannedMeals) {
    if (plannedMeal.assignmentType === "FREEZER") continue;
    if (!plannedMeal.recipe) continue;

    for (const ingredient of plannedMeal.recipe.ingredients) {
      if (ingredient.scope === "ROBIN") {
        addItem(items, ingredient, plannedMeal.robinPortions);
      }
      if (ingredient.scope === "AMBER") {
        addItem(items, ingredient, plannedMeal.amberPortions);
      }
      if (ingredient.scope === "PREPARATION") {
        addItem(items, ingredient, 1);
      }
    }
  }

  return Array.from(items.values()).sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export function formatQuantity(quantity: number | null, unit: string) {
  if (quantity === null) return unit ? `? ${unit}` : "?";
  const rounded = Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(2);
  return unit ? `${rounded} ${unit}` : rounded;
}

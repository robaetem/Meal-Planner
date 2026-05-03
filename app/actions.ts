"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { fromDateKey } from "@/lib/date-utils";
import { requireHousehold } from "@/lib/household";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function signInWithMicrosoft() {
  await signIn("microsoft-entra-id", { redirectTo: "/" });
}

export async function signOutCurrentUser() {
  await signOut({ redirectTo: "/signin" });
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value.length > 0 ? value : null;
}

function intValue(formData: FormData, key: string) {
  const value = Number.parseInt(stringValue(formData, key), 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function floatValue(formData: FormData, key: string) {
  const raw = stringValue(formData, key).replace(",", ".");
  if (!raw) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

function parseMealSelection(value: string) {
  const [type, id] = value.split(":");
  if ((type !== "recipe" && type !== "freezer") || !id) return null;
  return { type, id };
}

async function releaseFreezerItemsForDay(planningPeriodId: string, dateKey: string) {
  const plannedMeals = await prisma.plannedMeal.findMany({
    where: {
      planningPeriodId,
      date: fromDateKey(dateKey),
      freezerItemId: { not: null },
    },
    select: { freezerItemId: true },
  });

  const freezerItemIds = plannedMeals
    .map((plannedMeal) => plannedMeal.freezerItemId)
    .filter((id): id is string => typeof id === "string");

  if (freezerItemIds.length > 0) {
    await prisma.freezerItem.updateMany({
      where: { id: { in: freezerItemIds } },
      data: { usedAt: null },
    });
  }
}

async function replaceDayPlanning(planningPeriodId: string, dateKey: string) {
  await releaseFreezerItemsForDay(planningPeriodId, dateKey);
  await prisma.plannedMeal.deleteMany({
    where: {
      planningPeriodId,
      date: fromDateKey(dateKey),
    },
  });
}

async function createPlannedMeal({
  planningPeriodId,
  dateKey,
  selection,
  eater,
  robinPortions,
  amberPortions,
}: {
  planningPeriodId: string;
  dateKey: string;
  selection: string;
  eater: "BOTH" | "ROBIN" | "AMBER";
  robinPortions: number;
  amberPortions: number;
}) {
  const parsed = parseMealSelection(selection);
  if (!parsed) return;

  await prisma.plannedMeal.create({
    data: {
      planningPeriodId,
      date: fromDateKey(dateKey),
      eater,
      assignmentType: parsed.type === "recipe" ? "RECIPE" : "FREEZER",
      recipeId: parsed.type === "recipe" ? parsed.id : null,
      freezerItemId: parsed.type === "freezer" ? parsed.id : null,
      robinPortions,
      amberPortions,
    },
  });

  if (parsed.type === "freezer") {
    await prisma.freezerItem.update({
      where: { id: parsed.id },
      data: { usedAt: new Date() },
    });
  }
}

export async function updatePlanningPeriodSettings(formData: FormData) {
  const { household } = await requireHousehold();
  const id = stringValue(formData, "planningPeriodId");
  const pickupDate = optionalStringValue(formData, "collectAndGoPickupDate");

  await prisma.planningPeriod.update({
    where: { id, householdId: household.id },
    data: {
      collectAndGoPickupDate: pickupDate ? fromDateKey(pickupDate) : null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/planningen/${id}`);
}

export async function deletePlanningPeriod(formData: FormData) {
  const { household } = await requireHousehold();
  const id = stringValue(formData, "planningPeriodId");
  const plannedMeals = await prisma.plannedMeal.findMany({
    where: { planningPeriodId: id, planningPeriod: { householdId: household.id } },
    select: { freezerItemId: true },
  });
  const freezerItemIds = plannedMeals
    .map((plannedMeal) => plannedMeal.freezerItemId)
    .filter((freezerItemId): freezerItemId is string => Boolean(freezerItemId));

  if (freezerItemIds.length > 0) {
    await prisma.freezerItem.updateMany({
      where: { householdId: household.id, id: { in: freezerItemIds } },
      data: { usedAt: null },
    });
  }

  await prisma.planningPeriod.delete({
    where: { id, householdId: household.id },
  });

  revalidatePath("/");
  redirect("/");
}

export async function planSameMeal(formData: FormData) {
  const { household } = await requireHousehold();
  const planningPeriodId = stringValue(formData, "planningPeriodId");
  const dateKey = stringValue(formData, "date");
  const selection = stringValue(formData, "mealSelection");

  await prisma.planningPeriod.findFirstOrThrow({
    where: { id: planningPeriodId, householdId: household.id },
    select: { id: true },
  });

  await replaceDayPlanning(planningPeriodId, dateKey);
  await createPlannedMeal({
    planningPeriodId,
    dateKey,
    selection,
    eater: "BOTH",
    robinPortions: intValue(formData, "robinPortions"),
    amberPortions: intValue(formData, "amberPortions"),
  });

  revalidatePath("/");
  revalidatePath(`/planningen/${planningPeriodId}`);
}

export async function planSplitMeal(formData: FormData) {
  const { household } = await requireHousehold();
  const planningPeriodId = stringValue(formData, "planningPeriodId");
  const dateKey = stringValue(formData, "date");

  await prisma.planningPeriod.findFirstOrThrow({
    where: { id: planningPeriodId, householdId: household.id },
    select: { id: true },
  });

  await replaceDayPlanning(planningPeriodId, dateKey);
  await createPlannedMeal({
    planningPeriodId,
    dateKey,
    selection: stringValue(formData, "robinMealSelection"),
    eater: "ROBIN",
    robinPortions: intValue(formData, "robinPortions") || 1,
    amberPortions: 0,
  });
  await createPlannedMeal({
    planningPeriodId,
    dateKey,
    selection: stringValue(formData, "amberMealSelection"),
    eater: "AMBER",
    robinPortions: 0,
    amberPortions: intValue(formData, "amberPortions") || 1,
  });

  revalidatePath("/");
  revalidatePath(`/planningen/${planningPeriodId}`);
}

export async function clearDayPlanning(formData: FormData) {
  const { household } = await requireHousehold();
  const planningPeriodId = stringValue(formData, "planningPeriodId");
  const dateKey = stringValue(formData, "date");

  await prisma.planningPeriod.findFirstOrThrow({
    where: { id: planningPeriodId, householdId: household.id },
    select: { id: true },
  });
  await replaceDayPlanning(planningPeriodId, dateKey);

  revalidatePath("/");
  revalidatePath(`/planningen/${planningPeriodId}`);
}

export async function createRecipe(formData: FormData) {
  const { household, user } = await requireHousehold();
  const recipe = await prisma.recipe.create({
    data: {
      householdId: household.id,
      createdByUserId: user.id,
      name: stringValue(formData, "name"),
      description: optionalStringValue(formData, "description"),
    },
  });

  revalidatePath("/maaltijden");
  redirect(`/maaltijden/${recipe.id}`);
}

export async function updateRecipe(formData: FormData) {
  const { household } = await requireHousehold();
  const id = stringValue(formData, "recipeId");

  await prisma.recipe.update({
    where: { id, householdId: household.id },
    data: {
      name: stringValue(formData, "name"),
      description: optionalStringValue(formData, "description"),
      prepMinutes: intValue(formData, "prepMinutes") || null,
      cookMinutes: intValue(formData, "cookMinutes") || null,
      sourceUrl: optionalStringValue(formData, "sourceUrl"),
      tags: optionalStringValue(formData, "tags"),
      instructions: optionalStringValue(formData, "instructions"),
    },
  });

  revalidatePath("/maaltijden");
  revalidatePath(`/maaltijden/${id}`);
}

export async function deleteRecipe(formData: FormData) {
  const { household } = await requireHousehold();
  const id = stringValue(formData, "recipeId");
  await prisma.recipe.delete({
    where: { id, householdId: household.id },
  });

  revalidatePath("/maaltijden");
  redirect("/maaltijden");
}

export async function addRecipeIngredient(formData: FormData) {
  const { household } = await requireHousehold();
  const recipeId = stringValue(formData, "recipeId");
  const recipe = await prisma.recipe.findFirstOrThrow({
    where: { id: recipeId, householdId: household.id },
    select: { id: true },
  });
  const count = await prisma.recipeIngredient.count({
    where: { recipeId: recipe.id },
  });

  await prisma.recipeIngredient.create({
    data: {
      recipeId,
      scope: stringValue(formData, "scope") as "ROBIN" | "AMBER" | "PREPARATION",
      name: stringValue(formData, "name"),
      quantity: floatValue(formData, "quantity"),
      unit: optionalStringValue(formData, "unit"),
      notes: optionalStringValue(formData, "notes"),
      sortOrder: count + 1,
    },
  });

  revalidatePath(`/maaltijden/${recipeId}`);
}

export async function deleteRecipeIngredient(formData: FormData) {
  const { household } = await requireHousehold();
  const recipeId = stringValue(formData, "recipeId");
  const ingredientId = stringValue(formData, "ingredientId");

  await prisma.recipeIngredient.delete({
    where: {
      id: ingredientId,
      recipe: { householdId: household.id },
    },
  });

  revalidatePath(`/maaltijden/${recipeId}`);
}

export async function createFreezerItem(formData: FormData) {
  const { household } = await requireHousehold();
  const recipeId = optionalStringValue(formData, "recipeId");
  const recipe = recipeId
    ? await prisma.recipe.findFirst({
        where: { id: recipeId, householdId: household.id },
        select: { id: true, name: true },
      })
    : null;

  await prisma.freezerItem.create({
    data: {
      householdId: household.id,
      recipeId: recipe?.id,
      name: stringValue(formData, "name") || recipe?.name || "Diepvriesmaaltijd",
      category: optionalStringValue(formData, "category"),
      robinPortions: intValue(formData, "robinPortions"),
      amberPortions: intValue(formData, "amberPortions"),
      notes: optionalStringValue(formData, "notes"),
      frozenAt: optionalStringValue(formData, "frozenAt")
        ? fromDateKey(stringValue(formData, "frozenAt"))
        : new Date(),
    },
  });

  revalidatePath("/diepvries");
  revalidatePath("/");
}

export async function deleteFreezerItem(formData: FormData) {
  const { household } = await requireHousehold();
  const id = stringValue(formData, "freezerItemId");
  await prisma.freezerItem.delete({
    where: { id, householdId: household.id },
  });

  revalidatePath("/diepvries");
  revalidatePath("/");
}

export async function addManualShoppingItem(formData: FormData) {
  const { household } = await requireHousehold();
  const planningPeriodId = stringValue(formData, "planningPeriodId");
  await prisma.planningPeriod.findFirstOrThrow({
    where: { id: planningPeriodId, householdId: household.id },
    select: { id: true },
  });

  const count = await prisma.shoppingListItem.count({
    where: { planningPeriodId },
  });
  await prisma.shoppingListItem.create({
    data: {
      planningPeriodId,
      name: stringValue(formData, "name"),
      quantity: floatValue(formData, "quantity"),
      unit: optionalStringValue(formData, "unit"),
      notes: optionalStringValue(formData, "notes"),
      sortOrder: count + 1,
      manual: true,
    },
  });

  revalidatePath(`/planningen/${planningPeriodId}`);
  revalidatePath("/boodschappen");
}

export async function toggleManualShoppingItem(formData: FormData) {
  const { household } = await requireHousehold();
  const planningPeriodId = stringValue(formData, "planningPeriodId");
  const itemId = stringValue(formData, "shoppingItemId");
  const item = await prisma.shoppingListItem.findFirstOrThrow({
    where: {
      id: itemId,
      planningPeriod: { householdId: household.id },
    },
    select: { checked: true },
  });

  await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { checked: !item.checked },
  });

  revalidatePath(`/planningen/${planningPeriodId}`);
  revalidatePath("/boodschappen");
}

export async function deleteManualShoppingItem(formData: FormData) {
  const { household } = await requireHousehold();
  const planningPeriodId = stringValue(formData, "planningPeriodId");
  const itemId = stringValue(formData, "shoppingItemId");

  await prisma.shoppingListItem.delete({
    where: {
      id: itemId,
      planningPeriod: { householdId: household.id },
    },
  });

  revalidatePath(`/planningen/${planningPeriodId}`);
  revalidatePath("/boodschappen");
}

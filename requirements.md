# Meal Planner Requirements

## Goal
Build a private Dutch-language web app for planning meals over flexible periods, managing meals/recipes with ingredients per person, tracking freezer meals, and calculating the ingredient list needed for a Collect & Go order. The app is protected by Google and Microsoft sign-in and is deployed at `https://meal-planner.usemillie.com`.

This is the agreed MVP direction for the first autonomous implementation pass.

## Current Workflow Observations
Based on the shared screenshots, the current meal planning workflow is closer to a fast household planning page than a recipe database.

- Planning happens during the weekend for the following days.
- The current page is in Dutch and uses a simple "Weekmenu" structure.
- Each day is a section with a large heading such as `Maandag 04/05`.
- Day entries mix different types of information:
  - Logistics, for example where people are or who is home.
  - Headcount shorthand, for example `(4A +3R -2)`.
  - Planned meal text, for example `Amber potje`.
  - Batch cooking tasks, for example `+ 2 potjes (A +R) maken`.
- Meals are mostly lightweight text entries, not necessarily formal saved recipes.
- Freezer inventory is part of the planning workflow.
- The freezer list has categories such as `Potjes`, `Groenten`, and `Vlees`.
- The shopping list exists near the top of the week menu and can be collapsed or expanded.

These observations suggest the MVP should prioritize speed, week visibility, freezer inventory, and grocery planning before a heavy recipe-management system.

## Users And Access
- The app is private.
- Authentication uses Auth.js with Google and Microsoft providers.
- Initial allowed accounts are:
  - `robin.baeteman@outlook.com`
  - `robin.baeteman@gmail.com`
- Any authenticated user outside the allowlist is denied.
- The app should show the current signed-in user and provide a sign-out action.

## MVP Product Scope

### App Shell
- The entire app should be in Dutch.
- Authenticated planning should be the default workflow.
- Candidate main navigation:
  - Planningen
  - Diepvries
  - Boodschappen
  - Maaltijden
  - Instellingen
- The app is desktop-first, with full mobile support.
- The app must still be comfortable to use on an iPhone, because meal plans are sometimes created on mobile.
- No public landing page is needed.

### Planning Calendar
- The start screen should be a light-mode planning calendar inspired by the concept of Google Calendar, without copying Google Calendar's exact UI.
- The calendar should show days in a grid with weekday and date visible in each cell.
- The calendar should support scrolling through days/weeks so users can position arbitrary ranges on screen.
- Users should be able to view periods that cross month boundaries, for example the last week of May and first week of June, without switching context awkwardly.
- Planning periods should be visually shown as colored horizontal bars spanning the days in the period.
- Each planning period has its own color.
- Calendar day cells should also show a short summary of what is planned for that day.
- Collect & Go pickup days should be visibly marked in the calendar.
- Other important planning markers can also be shown on the calendar later.
- Clicking a planning period opens its full detail page for viewing/editing/deleting.
- The full detail page must have a back button that returns to the calendar overview.
- Users should be able to create a new planning period by selecting a day and dragging over following days.
- Dragging over days should immediately create the planning period and navigate to the detail page.
- A planning period does not need a name.
- A `Nieuwe planning` button should also exist for accessibility and mobile support.
- On desktop, the calendar is the primary overview.
- On mobile, the calendar can become a compact agenda/list view if a full month grid becomes too dense, but the same period creation and editing workflow must remain available.

### Maaltijden/Recepten
- Users can create meals/recipes.
- Each meal has ingredients defined per person or portion profile.
- Ingredients per person are the basis for calculating the planning-period ingredient list.
- A meal can be planned as a new meal from the meal database.
- A meal can also be prepared in batches and placed in the freezer.
- Recipe management should support fast creation and editing, not a heavy recipe-publishing workflow.

### Planning Periods
- Users create a planning period with an arbitrary start date and end date.
- Planning periods are flexible:
  - Sometimes only the coming three days.
  - Sometimes a full week.
  - The creation day can differ; it is not always the same weekday.
- Each planning period has a Collect & Go pickup day connected to it.
- The app is only for evening meals.
- Each day has one dinner planning block.
- Inside that dinner planning block, Robin and Amber can either eat the same meal or different meals.
- When Robin and Amber eat the same meal, the user chooses one meal and enters both portion counts, for example `2x Robin` and `2x Amber`.
- When Robin and Amber eat different meals, the user can assign separate dinner choices for Robin and Amber.
- Each dinner choice can be:
  - A meal from the freezer.
  - A meal from the meals/recipes database.
- Portion counts should support Robin and Amber separately, for example `3x Robin` and `2x Amber`.
- Robin and Amber have different serving sizes, so calculations cannot assume all persons eat the same amount.
- Day sections should support both meals and day notes.
- Day notes should be able to capture logistics, headcounts, and batch cooking reminders.
- Meal entries should support quick free-text entry from the start.
- Formal recipe linking can be added without making recipe selection mandatory.
- Candidate page structure:
  - Planning title, date range, and Collect & Go pickup date.
  - Calculated `Boodschappenlijstje` for the selected planning period.
  - Relevant `In diepvries` inventory.
  - Day-by-day list for the planning period.
- Period detail should open from the calendar as a full page and use a list view of all days inside the selected period.
- Each day in the period detail is a list item, for example `Maandag 4 mei 2026`.
- Each day list item lets the user define which meal(s) Robin and Amber eat on that date.
- Period detail should support view, edit, and delete operations.

### Freezer Inventory
- Keep a list of meals and ingredients currently in the freezer.
- Inventory should support categories, initially:
  - Potjes
  - Groenten
  - Vlees
- Freezer items should be easy to reference from a planning period.
- Planned freezer items add zero ingredients to the shopping list because they are already prepared.
- When a freezer item is used in a plan, it should automatically be removed from freezer inventory.
- Batch cooking should be able to add freezer inventory items.
- Freezer meals should carry enough portion information to know whether they can satisfy a planned meal for Robin, Amber, or both.
- In the MVP, freezer items are individual consumable entries. If there are three identical potjes, they can be represented as three freezer items.

### Meal Details
- A meal should support:
  - Name
  - Description or notes
  - Ingredients per Robin portion
  - Ingredients per Amber portion
  - Optional global ingredient amounts for ingredients that are not naturally person-specific
  - Optional prep time
  - Optional cook time
  - Tags
  - Optional source URL
  - Instructions
- A meal is always a full recipe with ingredients. Quick non-recipe meal names are not part of the MVP.
- Global ingredient amounts use the `per bereiding` model: they are added once when the meal is planned, regardless of Robin/Amber portion counts.

### Boodschappenlijst
- Each planning period has a calculated ingredient list.
- The list is calculated from:
  - Planned meals during the period.
  - The number of Robin portions and Amber portions per planned meal.
  - The ingredient amounts stored per person/portion on the meal.
- Freezer meals do not contribute ingredients to the calculated list.
- The list exists to enter all needed ingredients into Collect & Go.
- The planning period stores the Collect & Go pickup day.
- Include custom manually added shopping list items.
- Items can be checked off.
- Items can be edited or removed.
- Ingredient merging can start conservative:
  - Merge only exact same item name and unit.
  - Keep ambiguous items separate.

### Settings
- Show allowed signed-in user information.
- Configure household defaults:
  - Default servings
  - Week start day
- Future settings can include dietary preferences, stores, and notification preferences.

## Non-MVP
- AI meal generation.
- Automatic recipe import from arbitrary websites.
- Nutrition calculations.
- Multiple households with invitations.
- Native mobile apps.
- Real-time collaboration.
- Payment, subscriptions, or billing.

## Data Model
Use a relational schema from the start so the app can grow without a data migration rewrite.

Initial entities:
- `AppUser`
  - id
  - email
  - name
  - image
  - createdAt
  - updatedAt
- `Household`
  - id
  - name
  - createdAt
  - updatedAt
- `HouseholdMember`
  - householdId
  - userId
  - role
- `Recipe`
  - id
  - householdId
  - name
  - description
  - servings
  - prepMinutes
  - cookMinutes
  - sourceUrl
  - tags
  - instructions
  - createdByUserId
  - createdAt
  - updatedAt
- `RecipeIngredient`
  - id
  - recipeId
  - portionProfile
  - name
  - quantity
  - unit
  - notes
  - sortOrder
- `PlanningPeriod`
  - id
  - householdId
  - name
  - startDate
  - endDate
  - collectAndGoPickupDate
  - createdAt
  - updatedAt
- `PlannedMeal`
  - id
  - planningPeriodId
  - date
  - eater
  - assignmentMode
  - recipeId
  - freezerItemId
  - robinPortions
  - amberPortions
  - notes
  - createdAt
  - updatedAt
- `FreezerItem`
  - id
  - householdId
  - recipeId
  - name
  - category
  - robinPortions
  - amberPortions
  - notes
  - frozenAt
  - createdAt
  - updatedAt
- `ShoppingList`
  - id
  - householdId
  - planningPeriodId
  - name
  - startDate
  - endDate
  - collectAndGoPickupDate
  - createdAt
  - updatedAt
- `ShoppingListItem`
  - id
  - shoppingListId
  - name
  - quantity
  - unit
  - notes
  - checked
  - sourceRecipeId
  - sourcePlannedMealId
  - sortOrder

## Persistence Decision
Use PostgreSQL with Prisma.

Rationale:
- The app is already deployed into Kubernetes on the Hetzner VPS.
- PostgreSQL avoids container-local data loss and avoids SQLite concurrency and volume constraints.
- Prisma gives a typed schema, migrations, and straightforward Next.js integration.
- The database can initially run inside the single-node k3s cluster with a persistent volume, then move to managed PostgreSQL later if needed.

## Deployment Requirements
- Runtime target is the existing k3s cluster on `bloom`.
- Public ingress remains `meal-planner.usemillie.com`.
- Cloudflare DNS points to the Hetzner VPS and remains proxied.
- TLS is handled by ingress-nginx and cert-manager in the cluster.
- App secrets live in Kubernetes secrets, local `.env`, and later GitHub Actions secrets.
- No secrets should be committed.

## Deployment Pipeline Target
The intended automated pipeline is:
- Push to GitHub.
- GitHub Actions runs typecheck, lint, and build.
- GitHub Actions builds a Docker image.
- Image is published to GitHub Container Registry or loaded onto the k3s node.
- GitHub Actions connects to `bloom` over SSH.
- Kubernetes manifests are applied.
- Deployment rollout is monitored.
- Agent Browser validates unauthenticated and authenticated production behavior.

The current manual deployment through Kubernetes is acceptable for the auth checkpoint, but the product build should move to this automated pipeline.

## Validation Requirements
Every meaningful change should be validated with:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Database migration validation when schema changes
- Local unauthenticated browser check
- Local authenticated browser check when the local Agent Browser profile is logged in
- Production unauthenticated browser check after deploy
- Production authenticated browser check when the production Agent Browser profile is logged in
- `kubectl rollout status` and pod log checks after production deploy

## Open Product Questions
These decisions can be made later, but they affect prioritization:
- Should the app group shopping ingredients by Collect & Go category, custom category, or no category after the MVP?

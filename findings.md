# Findings & Decisions

## Requirements
- Build the Meal Planner as a Next.js application.
- Use Auth.js for Google and Microsoft authentication.
- Avoid Cloudflare Zero Trust as the primary app-protection mechanism.
- Host the app at `meal-planner.usemillie.com`.
- Codex should be able to develop, deploy, run GitHub Actions, modify Cloudflare DNS, use the Hetzner VPS, and validate with Agent Browser autonomously.
- GitHub `main` is the source of truth. Production deploys must happen by pushing code to `main` and letting GitHub Actions deploy to the Hetzner VPS.
- Use persistent file-based planning with `task_plan.md`, `findings.md`, and `progress.md`.
- Allow initial sign-in only for `robin.baeteman@outlook.com` and `robin.baeteman@gmail.com`.
- Product requirements are finalized for the first autonomous MVP implementation pass in `requirements.md`.
- MVP scope is being discussed with the user; current direction is Weekmenu first, with freezer inventory and shopping list close to the planning workflow.
- Non-MVP scope includes AI meal generation, arbitrary recipe import, nutrition calculations, invitations, native mobile apps, and real-time collaboration.
- The whole app should be in Dutch.
- The app must work well on mobile phones, especially iPhone.
- The app is desktop-first, with mobile support.
- The desired start screen is a light-mode planning calendar inspired by Google Calendar's concept, not a copy of its exact UI.
- Users want to scroll through the calendar so periods across month boundaries can be positioned on screen together.
- Planning periods should appear as spanning bars on the calendar.
- Each planning period should have its own color.
- Calendar day cells should show a short summary of the planned meals for that day.
- Users should be able to click a period to view/edit/delete it.
- Users should be able to create a period by dragging across days.
- Dragging across days should immediately create the planning period and navigate to the period detail page.
- Planning periods do not need names.
- Period detail should open as a full page with a back button to the calendar overview.
- Collect & Go pickup days should be marked in the calendar.
- Users need to create meals/recipes and define ingredients per person for each meal.
- Planning periods are arbitrary date ranges, not fixed weeks.
- A planning period has a Collect & Go pickup day.
- A planned meal can come from the freezer or from the meals/recipes database.
- Ingredient lists are calculated from the planned meals, Robin/Amber portion counts, and ingredient amounts per person.
- Robin and Amber should be counted separately because serving size differs.
- Planning is only for evening meals.
- Each day has one dinner planning block, but Robin and Amber can eat the same meal or different meals within that block.
- Freezer meals add zero ingredients to the shopping list and should be removed from freezer inventory when planned.
- Meals are always full recipes with ingredients.
- Global recipe ingredient amounts use `per bereiding`: they are added once when a recipe is planned, regardless of Robin/Amber portion counts.
- Freezer inventory items are individual consumable entries in the MVP; repeated potjes can be represented as repeated freezer items.

## Current Workflow From Screenshots
- The existing process is a Notion-like dark page named `Weekmenu`.
- The workflow is in Dutch.
- The household plans during the weekend for the following days.
- The current page combines planning, freezer inventory, and shopping list context in one place.
- Day sections use large headings such as `Zondag 03/05`, `Maandag 04/05`, and `Dinsdag 05/05`.
- Day entries include meal text, logistics, headcount shorthand, and cooking reminders.
- Freezer inventory is a first-class part of planning, with visible categories such as `Potjes`, `Groenten`, and `Vlees`.
- `Boodschappenlijstje` exists near the top and appears collapsible.
- The product should preserve the speed and flexibility of text-based planning before adding heavy recipe structure.

## Requirements From User Discussion
- App language: Dutch.
- Core entities:
  - Meals/recipes with ingredients per person.
  - Planning periods with flexible start and end dates.
  - Planned meals tied to dates inside a planning period.
  - Freezer meals/items.
  - Calculated ingredient list for the planning period.
- Portion model:
  - Users commonly plan using separate Robin and Amber portions, such as `3x Robin` and `2x Amber`.
  - The serving size differs between Robin and Amber, so the model needs separate ingredient amounts per profile.
  - Some ingredients may be global weights rather than Robin/Amber-specific amounts.
  - Global weights use `per bereiding`, so they are added once per planned recipe.
- Planning model:
  - A plan can cover three days, a week, or another arbitrary range.
  - The day on which the plan is created can differ.
  - Each plan is connected to a Collect & Go pickup day.
  - Planning is dinner-only: one dinner planning block per day.
  - Robin and Amber can share a meal with separate portion counts, or each can have a different meal.
- Shopping model:
  - The grocery output is used to enter ingredients into Collect & Go before pickup.
  - The calculated list must be based on recipe ingredients and portion counts, while still allowing manual edits/additions.
  - Freezer meals contribute no grocery ingredients because they are already prepared.
  - The MVP shopping list can be flat, with no category grouping.
  - Using a freezer item in a plan should automatically remove it from freezer inventory.
  - Freezer items are individual consumable entries in the MVP.
- UI model:
  - Desktop-first.
  - Light-mode calendar overview inspired by Google Calendar's day-grid concept is the start screen.
  - Calendar should be scrollable through days/weeks rather than locked to one month only.
  - Periods should be visible as spans over their date range.
  - Each period should use a distinct color.
  - Calendar day cells should show short planned-meal summaries.
  - Period detail opens as a full page, with a back button to the calendar, and shows a list of days with planned dishes.
  - Drag selection should immediately create a period and route to the period detail page.
  - Collect & Go pickup day and similar markers should be visible on the calendar.

## Research Findings
- Cloudflare Zero Trust/Access can protect routes externally, but the user decided not to use it for this app.
- App-level Auth.js authentication is a suitable free/open-source path for Google and Microsoft OAuth.
- Google/Microsoft OAuth apps are still required; Auth.js will use their client IDs/secrets.
- Auth.js Google provider for Next.js uses callback URL `https://<host>/api/auth/callback/google` and env vars `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
- Auth.js Microsoft Entra ID provider for Next.js uses callback URL `https://<host>/api/auth/callback/microsoft-entra-id` and env vars `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_ISSUER`.
- Auth.js requires `AUTH_SECRET`; behind a reverse proxy, `AUTH_TRUST_HOST=true` may be needed.
- For personal Microsoft accounts, the Microsoft discovery document reports issuer `https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`; using the `consumers` alias caused Auth.js to reject the issuer.
- Auth.js official installation for Next.js currently uses `npm install next-auth@beta`, a root `auth.ts`, route handler at `app/api/auth/[...nextauth]/route.ts`, and `proxy.ts` on Next.js 16.
- Auth.js resource protection can be implemented server-side by calling `auth()` in the page and redirecting or rendering a sign-in view when no active session exists.
- `ssh bloom` is verified and lands as `root` on VPS `ubuntu-16gb-nbg1-1`; available tooling includes Node 20.20.2, npm 10.8.2, nginx, and Docker.
- DNS access is available through the project `.env`, and DNS read/write has been verified for `usemillie.com`.
- GitHub CLI is authenticated locally as `robaetem` and can push code and manage workflows.
- `agent-browser` is installed globally and can open pages, inspect snapshots, and take screenshots for validation.
- Hetzner VPS access is expected via `ssh bloom`; still needs verification before deployment automation.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Use app-level authentication instead of Cloudflare Access | Avoids Cloudflare Zero Trust setup and keeps auth in the open-source app stack. |
| Use Auth.js | User explicitly selected it; it has first-class support across modern JavaScript frameworks and OAuth providers. |
| Use Next.js | User requested it and it fits Auth.js, route protection, server rendering, and deployment needs. |
| Store Cloudflare credentials only in `.env` | Keeps secrets out of git and planning docs while still enabling autonomous local API use. |
| Validate with `agent-browser` | Provides browser-level validation of local and production implementations. |
| Deploy first auth checkpoint with Kubernetes on `bloom` | External ports are owned by k3s ingress-nginx; cert-manager already issues TLS for existing `usemillie.com` apps. |
| Treat `Weekmenu` as the candidate home screen | The screenshots show the current workflow centered on a weekly menu page, not a dashboard or recipe library. |
| Prioritize freezer inventory in MVP discussion | The user explicitly said freezer meals are tracked alongside meal planning. |
| Use quick text entries from the start | Current planning includes shorthand, logistics, and flexible meal notes that would not fit a recipe-only UI. |
| Use Dutch labels and content throughout the app | User explicitly wants the whole app in Dutch. |
| Use flexible planning periods instead of fixed weeks | User sometimes plans three days, sometimes a week, and the planning day differs. |
| Model Robin and Amber portions separately | Serving sizes differ, so one generic person count would calculate ingredients incorrectly. |
| Attach Collect & Go pickup date to each planning period | The plan is created to place a Collect & Go order and pickup on a specific day. |
| Use dinner-only planning | User explicitly said only evening meals are planned. |
| Allow same-meal and split-meal dinner days | Sometimes Robin and Amber eat the same meal; often with freezer meals they eat different meals. |
| Remove freezer items automatically when planned | User wants freezer inventory to update when a freezer meal is used. |
| Keep the MVP shopping list flat | User said a flat `Boodschappenlijst` is enough for now. |
| Require meals to be full recipes with ingredients | User said a meal is always a full recipe with ingredients. |
| Make the calendar overview the start screen | User wants a Google Calendar-like overview that shows planning periods and date context. |
| Use calendar drag selection for period creation | User wants to create a period by selecting a day and dragging over following days. |
| Open period detail as a full page day list | User wants a clicked period to show a full page with back button and list view of days and planned dishes. |
| Mark Collect & Go days on the calendar | User wants pickup days and similar information visible in the overview. |
| Use a light calendar UI | User wants light mode like the Google Calendar screenshot concept, without copying Google Calendar exactly. |
| Color-code planning periods | User wants different colors for different periods. |
| Show planned meal summaries in calendar day cells | User wants to see what is planned directly from the calendar view. |
| Create periods without names | User said a period does not need a name. |
| Global ingredient amounts are per bereiding | Accepted proposal: global ingredients are added once when a recipe is planned. |
| Use individual consumable freezer items in the MVP | Matches automatic removal when a freezer item is planned and avoids early batch-count complexity. |

## Open Credential/Setup Needs
- Google OAuth client ID and secret are present in `.env`.
- Microsoft OAuth client ID, client secret, and issuer are present in `.env`.
- `AUTH_SECRET` for Auth.js is present in `.env`.
- Production `AUTH_URL`/base URL value, expected to be `https://meal-planner.usemillie.com`.
- Allowed-user policy: exact emails, domains, and whether Microsoft personal accounts are allowed.
- GitHub Actions secrets mirroring production runtime secrets.
- Auth validation accounts or saved browser state for at least one allowed Google login and one allowed Microsoft login.
- Local autonomous authenticated browser validation can use `E2E_AUTH_EMAIL` plus `/api/e2e-login`; this path is disabled when `NODE_ENV=production`.

## Product Build Requirements
- App shell should expose Kalender/Planningen, Maaltijden, Diepvries, Boodschappen, and Instellingen to authenticated users.
- Calendar overview should show planning periods as spanning bars and support creating periods by drag selection.
- Calendar overview should show planned meal summaries inside day cells.
- Drag selection should create a period and navigate to the full period detail page.
- Meal library should support CRUD and ingredients per person/profile.
- Planning periods should support arbitrary start/end dates and a Collect & Go pickup date.
- Planned meals should reference either a meal/recipe or a freezer item.
- Planned meals should capture Robin and Amber portion counts separately.
- Planning is dinner-only, with support for Robin and Amber eating the same recipe or different recipes/freezer meals on the same day.
- Freezer assignments should add no ingredients and should remove the freezer item from inventory.
- Shopping lists should calculate ingredient totals from planned meals and remain manually editable.
- Settings should include signed-in user context and household defaults such as default portion profiles.

## Persistence Requirements
- Use PostgreSQL for durable app data.
- Use Prisma for schema, migrations, and typed database access.
- Keep Auth.js sessions cookie/JWT based initially; app data should key users by allowlisted email and an internal `AppUser`.
- Initial schema should include `AppUser`, `Household`, `HouseholdMember`, `Recipe`, `RecipeIngredient`, `PlanningPeriod`, `PlannedMeal`, `FreezerItem`, `ShoppingList`, and `ShoppingListItem`.
- Production database credentials should live in Kubernetes secrets and GitHub Actions secrets, not in git.

## Deployment Pipeline Requirements
- GitHub Actions should run typecheck, lint, and build before deployment.
- The production target remains the k3s cluster on `bloom`.
- Deployment should apply Kubernetes manifests, monitor rollout status, and check pod logs on failure.
- The workflow should SSH into `bloom`, pull the pushed commit from `main`, run Prisma migrations, build the Docker image on the VPS, import it into k3s, and roll out the deployment.
- Production validation should use curl/kubectl for health and Agent Browser for user-facing behavior.

## OAuth App Creation Notes
- Google app should be a Web application OAuth client in Google Cloud / Google Auth Platform.
- Google production redirect URI: `https://meal-planner.usemillie.com/api/auth/callback/google`.
- Google local redirect URI: `http://localhost:3000/api/auth/callback/google`.
- Google testing mode should include `robin.baeteman@gmail.com` as a test user if the OAuth consent screen is not published.
- Microsoft app should be an Entra App Registration with Web platform redirect URI.
- Microsoft production redirect URI: `https://meal-planner.usemillie.com/api/auth/callback/microsoft-entra-id`.
- Microsoft local redirect URI: `http://localhost:3000/api/auth/callback/microsoft-entra-id`.
- To allow `robin.baeteman@outlook.com`, Microsoft account type should include personal Microsoft accounts. Current issuer is `https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`.

## Expected OAuth Redirects
- Google: `https://meal-planner.usemillie.com/api/auth/callback/google`
- Microsoft Entra ID: `https://meal-planner.usemillie.com/api/auth/callback/microsoft-entra-id`

## Authentication Validation Strategy
- Unauthenticated-state validation can be fully automated with `agent-browser`: open protected routes, assert redirect/sign-in page, ensure protected content is absent.
- Authenticated-state validation requires either dedicated test account credentials usable by the agent, or one-time user-assisted logins in persistent Agent Browser profiles.
- Saved Agent Browser auth profiles should be stored under `.auth-states/`, which is gitignored.
- Production authenticated validation should use `.auth-states/meal-planner-prod-profile`.
- Local authenticated validation should use `.auth-states/meal-planner-local-profile`.
- Production and local need separate login state because Auth.js cookies are host-specific.
- For local OAuth testing on port 3100, Google and Microsoft OAuth apps must also allow local redirect URIs for `http://localhost:3100/api/auth/callback/google` and `http://localhost:3100/api/auth/callback/microsoft-entra-id`.
- OAuth providers may trigger MFA, CAPTCHA, device approval, or risk checks. If they do, the user must complete that step once or provide test accounts configured to avoid interactive challenges.
- Do not place user passwords in git or planning files. Use local secret storage, environment variables, or `agent-browser` auth/session state.

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Cloudflare Access APIs were not usable because Access was not enabled | User chose not to use Zero Trust; proceed with Auth.js. |
| Cloudflare API token was pasted in chat | Token is stored in `.env`; user should rotate if production-sensitive. |

## Resources
- Auth.js: https://authjs.dev/
- Auth.js installation: https://authjs.dev/getting-started/installation
- Auth.js protecting resources: https://authjs.dev/getting-started/session-management/protecting
- Auth.js Google provider: https://authjs.dev/getting-started/providers/google
- Auth.js Microsoft Entra ID provider: https://authjs.dev/getting-started/providers/microsoft-entra-id
- Auth.js deployment env vars: https://authjs.dev/getting-started/deployment
- Cloudflare DNS API: https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/list/
- Agent Browser CLI skill: `.agents/skills/agent-browser/SKILL.md`
- Cloudflare skill: `.agents/skills/cloudflare/SKILL.md`
- Planning skill: `.agents/skills/planning-with-files/SKILL.md`

## Visual/Browser Findings
- Cloudflare token screenshot showed the permissions UI now uses categories such as `DNS & Zones` and `Cloudflare One / Zero Trust`; account-level permissions differ from zone-scoped permissions.
- 2026-05-03 simplification pass: the app should stay visually close to default shadcn neutral styling. The custom colored/panel-heavy surface was replaced by shadcn Button, Card, Badge, Field, Input, Textarea, Separator, and Empty primitives with only layout classes and a minimal period color accent.
- Agent Browser desktop screenshots after the pass:
  - `/tmp/meal-planner-shadcn-calendar-2.png`
  - `/tmp/meal-planner-shadcn-period.png`
  - `/tmp/meal-planner-shadcn-meals.png`
  - `/tmp/meal-planner-shadcn-freezer.png`
  - `/tmp/meal-planner-shadcn-recipe.png`
- Agent Browser mobile screenshots after the pass:
  - `/tmp/meal-planner-shadcn-mobile-calendar.png`
  - `/tmp/meal-planner-shadcn-mobile-period.png`
- Browser validation confirmed:
  - unauthenticated local requests still redirect to `/signin`;
  - authenticated E2E local session opens the calendar;
  - calendar day click creates a planning period and routes to the detail page;
  - temporary planning period deletion routes back to the calendar;
  - existing planned meals and freezer assignment render in calendar/detail;
  - manual shopping item add, check, and delete work with normal Agent Browser clicks;
  - freezer inventory no longer shows the freezer item that was planned;
  - no page errors were reported by `agent-browser errors`.

---
*Update this file after every 2 view/browser/search operations.*

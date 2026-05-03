# Task Plan: Meal Planner Autonomous Buildout

## Goal
Build and operate the Meal Planner as a Next.js application with Auth.js-based Google and Microsoft authentication, deployed at `meal-planner.usemillie.com`, with Codex able to develop, deploy, monitor, and validate changes autonomously.

## Current Phase
Phase 8

## Phases

### Phase 1: Autonomy & Access Bootstrap
- [x] Link local repo to `https://github.com/robaetem/Meal-Planner.git`
- [x] Install Cloudflare skill and add local `.env` fallback instructions
- [x] Verify Cloudflare DNS read/write access for `usemillie.com`
- [x] Verify GitHub CLI auth and workflow scope
- [x] Install and verify global `agent-browser`
- [x] Validate Hetzner VPS access with `ssh bloom`
- [x] Capture remaining required OAuth credentials
  - [x] Google OAuth client ID/secret
  - [x] Microsoft OAuth client ID/secret/issuer
  - [x] Auth.js `AUTH_SECRET`
- [x] Capture initial allowed-user policy
- **Status:** complete

### Phase 2: Product & Technical Requirements
- [x] Define first auth checkpoint scope: protected page showing current user
- [x] Create product requirements document
- [x] Decide final data model, persistence, and hosting topology
- [x] Decide allowed-user rules for Google/Microsoft sign-in
- [x] Confirm production hostname and redirect URLs
- [x] Define calendar-first planning overview with the user
- [x] Define final product workflows and screen behavior with the user
- [x] Define final visual direction and UI structure with the user
- [x] Capture open product questions for follow-up
- **Status:** complete

### Phase 3: Next.js Foundation
- [x] Scaffold Next.js application in this repo
- [x] Add TypeScript, linting, formatting, and baseline scripts
- [x] Establish app layout, routing, and protected-shell structure
- [x] Add minimal protected auth-check UI
- **Status:** complete

### Phase 4: Auth.js Integration
- [x] Install and configure Auth.js
- [x] Add Google provider
- [x] Add Microsoft Entra provider
- [x] Add session handling and protected route middleware
- [x] Enforce allowed emails/domains
- [x] Document required `.env` variables without committing secrets
- [ ] Save authenticated Agent Browser state after user completes one manual login
- **Status:** in_progress

### Phase 5: Deployment Pipeline
- [x] Decide deployment target on Hetzner VPS
- [x] Decide production container/runtime model
- [x] Configure production database and app runtime secrets
- [x] Create GitHub Actions workflow
- [x] Add GitHub Actions secrets
- [x] Push workflow, run it, monitor results, and iterate
- **Status:** complete

### Phase 6: DNS & Edge Routing
- [x] Create or update `meal-planner.usemillie.com` DNS record
- [x] Confirm SSL/proxy behavior through Cloudflare
- [x] Confirm app is reachable at the intended production URL
- **Status:** complete

### Phase 7: Validation & Handoff
- [x] Validate local app with `agent-browser`
- [x] Validate production app with `agent-browser`
- [x] Validate Google login flow
- [x] Validate Microsoft login flow
- [x] Validate provider redirects for Google and Microsoft
- [x] Validate unauthenticated users are blocked
- [ ] Save authenticated browser state for future logged-in validation
- [x] Record test results and final operational notes
- **Status:** in_progress

### Phase 8: Core Product Buildout
- [x] Add local PostgreSQL and Prisma data layer
- [x] Add initial database migrations and seed path for the first household
- [x] Build authenticated Dutch app shell and navigation
- [x] Build light calendar overview with colored planning periods, daily meal summaries, and drag creation
- [x] Build full-page planning period detail with day list, same/apart meal assignment, Collect & Go date, and delete/back actions
- [x] Build meal library CRUD with Robin/Amber/per-bereiding ingredient amounts
- [x] Build freezer inventory with consumable freezer items and automatic removal when planned
- [x] Build generated and editable flat shopping list
- [x] Build settings screen for user and household defaults
- [x] Simplify UI around default shadcn neutral black/white components
- [ ] Add focused tests for data and route behavior
- [x] Deploy and validate product build on `bloom`
- **Status:** in_progress

## Key Questions
1. Should additional users be allowed beyond `robin.baeteman@outlook.com` and `robin.baeteman@gmail.com`?
2. Should shopping ingredients be grouped by Collect & Go category after the MVP?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use Next.js | User requested the app become a Next.js application; it fits Auth.js and full-stack app needs. |
| Use Auth.js for authentication | User selected Auth.js; it avoids Cloudflare Zero Trust dependency and keeps auth in the app. |
| Use Google and Microsoft OAuth apps | Required for Google/Microsoft sign-in through Auth.js. |
| Use `agent-browser` for validation | User requested autonomous validation and the CLI is globally installed and verified. |
| Keep secrets out of planning files | Planning files are intended to be committed or shared; secrets stay in `.env` and GitHub secrets. |
| Initial allowed users are exact email addresses | User requested `robin.baeteman@outlook.com` and `robin.baeteman@gmail.com`; exact allowlist is safer than domain-wide access. |
| Deploy first checkpoint through Kubernetes ingress on `bloom` | The VPS already routes external 80/443 through ingress-nginx and cert-manager; Kubernetes matches the existing public routing model. |
| Use PostgreSQL with Prisma for app data | Relational data fits recipes, plans, and shopping lists; PostgreSQL is safer than container-local SQLite for Kubernetes deployment. |
| Keep a household model internally | It supports shared recipes and future multi-user use without forcing invitations into the MVP. |
| Build MVP around app shell, recipes, planner, shopping list, and settings | These are the core workflows needed before adding AI, recipe import, nutrition, or collaboration features. |
| Treat `Weekmenu` as the candidate primary screen | User screenshots show weekly planning is the center of the current workflow. |
| Include freezer inventory in the requirements discussion | User explicitly tracks freezer meals as part of planning. |
| Make the app Dutch-first | User explicitly wants the whole app in Dutch. |
| Use flexible planning periods instead of fixed weeks | User plans for arbitrary ranges such as three days or a full week. |
| Track Robin and Amber portions separately | Serving sizes differ and ingredient calculations need accurate portion counts. |
| Attach a Collect & Go pickup day to each planning period | The ingredient list is used to place a Collect & Go order for pickup. |
| Use dinner-only planning | User explicitly said only evening meals are planned. |
| Allow same-meal and split-meal days | Robin and Amber sometimes eat the same meal with different portions, and sometimes eat different freezer meals. |
| Freezer meals add no shopping ingredients | Freezer meals are already prepared. |
| Remove freezer items when planned | User wants freezer inventory to update automatically when a freezer meal is used. |
| Keep the MVP shopping list flat | User said flat is enough for now. |
| Meals are always full recipes | User said a meal always has ingredients. |
| Make the start screen calendar-first | User wants a Google Calendar-like overview that shows periods and date context. |
| Desktop-first with mobile support | User clarified desktop is primary, while mobile must still work. |
| Create planning periods by dragging across days | User wants to select a day and drag across following days to create a period. |
| Show period detail as a day list | User wants to click a period and then see a list view of days and planned meals. |
| Mark Collect & Go pickup days on the calendar | User wants pickup days and other markers visible in the overview. |
| Use light calendar UI inspired by Google Calendar's concept | User wants light mode and the day-grid/period-bar concept without copying Google Calendar exactly. |
| Open period detail as a full page | User wants a full page with back button to the calendar overview. |
| Show short daily meal summaries in the calendar | User wants to understand what is planned per day directly from the calendar view. |
| Periods do not need names | User said drag creation should create a period and navigate to detail where pickup day and meals are set. |
| Global ingredient amounts are per bereiding | Accepted proposal: global ingredients are added once when a recipe is planned. |
| Freezer items are individual consumable entries in the MVP | Simpler and matches automatic removal when a freezer item is planned. |
| GitHub main is the production source of truth | User explicitly requested deployments to happen by pushing to `main` and deploying via GitHub Actions. |
| Use default shadcn neutral UI primitives for the app surface | User reviewed first results and asked to simplify heavily, use default shadcn as much as possible, and keep the black/white shadcn theme. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Initial Wrangler OAuth lacked DNS record API permission | 1 | Added Cloudflare API token in `.env`; verified DNS read/write. |
| Cloudflare Access API returned `access.api.error.not_enabled` | 1 | Pivoted away from Cloudflare Zero Trust after user chose app-level Auth.js auth. |

## Notes
- Root `.env` exists and is gitignored; do not print or commit its contents.
- Cloudflare DNS read/write for `usemillie.com` has been verified with a temporary TXT record and cleanup.
- GitHub CLI is authenticated as `robaetem` with `repo` and `workflow` scopes.
- `agent-browser` is globally installed and verified.
- `ssh bloom` access has been verified with a non-destructive inventory command.
- Google OAuth credentials are present in `.env`.
- Microsoft OAuth credentials are present in `.env`.
- Auth.js `AUTH_SECRET` is present in `.env`.
- Initial allowed accounts: `robin.baeteman@outlook.com`, `robin.baeteman@gmail.com`.
- Expected production hostname: `meal-planner.usemillie.com`.
- User confirmed on 2026-05-03 that both Google and Microsoft production login flows work.

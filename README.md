# Canada Business Launchpad | Ontario Pilot

The primary product is `/en/start` or `/zh/start` (also `/`, `/en` and `/zh`):
a three-tab startup checklist with Home, Process and Services. It has 8 stages,
24 steps and 26 official/independent resources. Progress is stored in D1 using a
separate anonymous access cookie. A reference route is explicitly illustrative
and cannot change personal records.

The earlier detailed workspace remains at `/en/launch?tab=plan` or
`/zh/launch?tab=plan`; its data is unchanged. The earlier landing page is retained
at `/en/overview`. Those pages are not the primary three-tab experience.

## Simple startup checklist

- Step -> relevant services -> external website -> return to the same step ->
  manually update progress -> continue. No external application or payment APIs.
- Four reversible statuses. Skipped steps do not count as completed.
- Optional nickname, Ontario city and team size with a storage-consent checkbox.
- English/Chinese navigation retains route context and the same saved records.
- `lib/launchpad-catalog.ts` owns step/service associations and checked URLs.
- `lib/launchpad-progress.ts` validates progress commands and computes next steps.
- `app/api/journey/route.ts` owns anonymous session isolation and revision checks.
- `components/LaunchpadSimple.tsx` and `app/launchpad.css` own the three-tab UI.
- A fresh public site was authorized on 2026-09-10 after the previous site could
  not be found. Local D1 records are not copied into the public deployment.

See `docs/SIMPLE_LAUNCHPAD.md` for the walkthrough and content boundaries.

## Working loop

Business details -> action plan -> preparation -> official external service ->
record outcome -> next task / follow-up -> update business facts and keep going.

- Stable business ID, preserved history and rule-based reassessment.
- Explicit waiting, issues, completion, reopening and conditional non-applicability.
- Source-backed tasks, materials and dependency checks before completion.
- Independent periods with editable dates: finishing one does not close the next.
- Server-side persistence, visible save failures, export and permanent deletion.
- Revision and business-ID checks prevent stale tabs overwriting newer data.

## Run locally

Node.js 22.13+ is required.

```sh
npm install
npm run db:local
npm run dev
```

Open `http://localhost:3000/zh/start` or `/en/start`.
The migration command uses local D1 only, persisted in `.wrangler/state`.
Do not clear that directory if local records must be retained.
The placeholder ID in `wrangler.local.json` matches the local Vite binding;
it is not a real production database ID.

## Architecture and access

- vinext / Next.js App Router, React, TypeScript, Tailwind and Lucide.
- `lib/content.ts`: existing tasks and authoritative sources.
- `lib/assessment.ts`, `lib/rules.ts`: shared questions and deterministic rules.
- `lib/business.ts`: validated commands, reassessment and workflow calculation.
- `app/api/business/route.ts`, `db/business.ts`: D1 access boundary.
- `db/schema.ts`, `drizzle/`: schema and generated, append-only migrations.
- `components/BusinessWorkspace.tsx`: retained detailed workspace.

One workspace is associated with an anonymous browser access cookie.
The random token is HttpOnly, SameSite=Strict and Secure on HTTPS; only its hash
is stored in D1. Mutations require same origin, valid commands and matching
business ID plus revision; writes use prepared SQL and atomic conditions.
The cookie is an access key, not a verified identity.

Account recovery, cross-device sign-in, multiple businesses, import/restore,
real file uploads, live LLMs, emails and partner APIs are not implemented.
Losing the cookie loses access. JSON export is a record copy, not a recovery
mechanism. The pilot retains up to 100 dated records and the latest 200 actions.
Completion dates use America/Toronto. Dates are entered by users, not statutory
deadlines calculated by the product. All outcomes remain user-reported.

## Separate sample routes

`/demo`, `/sample-assessment`, `/workspace/:scenarioId`, `/tasks/:taskId` and
`/calendar` retain isolated sample state in `localStorage["cbl-demo:v1"]`.
`/present` uses independent tab session state. Neither can overwrite the
personal workspace. Providers, assistant, support and admin views retain their
clearly labelled preview or simulated capabilities.

The legacy `/assessment` URL redirects to `/launch?tab=profile`.
Home-page start buttons and feature actions enter the personal workspace.
Internal workspace transitions stay in the same tab, preserve business identity,
support browser Back/Forward and scroll to the target section; only external
official services open a separate tab.

## Validate

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

Apply local migrations before testing. Set `PLAYWRIGHT_BASE_URL` to reuse a
running server, or let the existing Playwright configuration start one.
System Chrome is used unless `PLAYWRIGHT_CHROME_PATH` overrides it.
Tests cover rule paths, transitions, identity, reassessment, periods, failures,
session isolation, stale/replacement writes and bilingual responsive layouts.

## Scope and deployment

Ontario pilot; Toronto is the municipal example. Residency is a rule variable,
not the target market. Complex cases remain in professional review.
Existing sources were checked on 2026-09-04; this workflow update is not a new
professional review. Company annual return, T2, tax balance, GST/HST, payroll
and ISC remain distinct. No SINs, passwords, bank details, tax forms or identity
documents should be entered. No government submissions or partner transfers occur.

`.openai/hosting.json` declares the logical D1 binding `DB`. Sites supplies the
hosted database and applies generated migrations. Keep applied migrations
immutable. Public deployment requires approval; local validation does not
publish this version. Account/recovery, privacy, security and professional
review remain prerequisites for wider release.

Product guide: `docs/PRODUCT_WORKFLOW.md`.
Supplementary presentation guide: `docs/PRESENTATION_GUIDE.md`.

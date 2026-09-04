# Canada Business Launchpad — External Demo MVP v0.1

A bilingual, responsive demonstration of an Ontario small-business planning and progress workspace.

The prototype turns business context into a source-backed task plan, helps users prepare before leaving for an official or third-party service, and keeps user-marked progress and illustrative reminders together.

## Run locally

Prerequisite: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000/en` or `http://localhost:3000/zh`.

Quality commands:

```bash
npm run lint
npm run build
npm test
npm run test:e2e
```

`npm test` builds the app, runs 13 deterministic rule/source-governance unit
tests and checks five server-rendered English/Chinese views. `npm run test:e2e`
starts an isolated local server and runs 12 Playwright checks with the installed
system Chrome. Set
`PLAYWRIGHT_CHROME_PATH` to override the browser executable, or
`PLAYWRIGHT_BASE_URL` to test an already-running preview.

The browser suite covers the golden journey, static and dynamic assessment
persistence, stage-aware routing, task-status reload, material handoff gating,
provider search and consent, expert-handoff consent, browser-only admin editing,
SSR locale metadata, unknown-route handling, baseline WCAG AA text-contrast checks and horizontal-
overflow checks at 1440 px, 768 px and 390 px across the core pages.

## Eight-minute demo

1. Open `/en` and explain the independent Ontario-pilot positioning.
2. Open `/en/demo` and choose one of the four benchmark journeys.
3. Show the next-best action, task applicability and source count.
4. Open a full task card; review why it applies, materials, timing and official source.
5. Enter a fictional reference such as `DEMO-2026-001` and mark it complete.
6. Open the calendar to show registry, T2, GST/HST and payroll obligations as distinct items.
7. Open Providers and submit a simulated, explicitly disclosed handoff.
8. Open the Assistant and show a preset answer with authoritative sources.
9. Optional: open `/en/admin/sources` to show the rules/source governance preview.

## Demo journeys

- Toronto digital consultant, sole proprietor, no employees, under CAD 30k.
- Two-founder Ontario service corporation.
- Ontario e-commerce corporation near the GST/HST threshold and importing goods.
- Existing Ontario business preparing to hire its first employee.
- Complex residency/control boundary case.
- Regulated or complex extra-provincial boundary case.

The assessment preserves the user's selected stage, structure, revenue band,
city, employee state and activities. It recalculates task applicability rather
than copying a static persona profile. A confirmed registration produces a
verification task; an operating business with unknown or missing registration
keeps the applicable Ontario registration step visible.

## Routes

- `/:locale` — external landing page
- `/:locale/product` — capabilities and MVP boundary
- `/:locale/partners` — partnership model
- `/:locale/demo` — six demo journeys
- `/:locale/assessment` — guided assessment
- `/:locale/workspace/:scenarioId` — personalized workspace
- `/:locale/tasks/:taskId` — task detail and local evidence record
- `/:locale/calendar` — scenario-filtered compliance preview
- `/:locale/providers` — labelled provider directory and simulated referral
- `/:locale/assistant` — preset, source-backed explainer
- `/:locale/support` — scope, privacy, FAQ and expert handoff
- `/:locale/admin/{rules|sources|tasks|providers|referrals}` — light operations views

Supported locales are `en` and `zh`; English is the default at `/`.

## Architecture

- vinext / Next.js App Router, React, TypeScript and Tailwind CSS
- Lucide React icons
- Typed fixtures in `lib/content.ts`
- Deterministic route matching in `lib/demo-repository.ts`
- Versioned browser state at `localStorage["cbl-demo:v1"]`
- No backend, customer database, authentication, live LLM or government API

Use **Reset local demo data** on the Support page to remove stored assessment, progress, evidence and referral records.

## MVP boundary

Working in the demo:

- Assessment, task graph, next-best action and progress
- Materials checklists, authoritative links and verification dates
- Text-only demo evidence and browser-local status
- Scenario-filtered compliance reminders
- Provider labelling, commercial disclosure, consent and simulated referral
- Preset AI-style explanations with cited sources
- Rules, sources, tasks, providers and referrals admin previews

Simulated or excluded:

- Government submissions and live status synchronization
- Real file upload, authentication, email reminders and customer database
- Payments, KYC/KYB, government credentials or sensitive identifiers
- Live partner quotes, branding, commission attribution or SLA
- Personalized legal, tax, insurance, licensing or immigration conclusions

The product is an independent prototype, not a government service, law firm, CPA firm, insurance broker or immigration adviser. Official and third-party websites retain their own terms, privacy practices, eligibility decisions and fees.

## Data and content notes

- Do not enter a SIN, passport, CRA account, BN, Ontario Company Key, bank information, tax form or real government receipt.
- Task completion means **user marked complete (unverified)**.
- Ontario BIN and CRA BN are modelled as different identifiers.
- Ontario Annual Return, T2 filing, corporation tax balance, ISC review, GST/HST and payroll are separate tasks.
- The general GST/HST small-supplier test is not represented as a universal annual-revenue rule.
- Sources in the demo were last reviewed on 2026-09-04 and must be rechecked before any public launch.
- The interface currently exposes 32 task titles, 14 full task cards and 27 maintained source records; every detailed-task CTA must match one of the task's cited source URLs.

## Deployment

Build with `npm run build`, then deploy the repository through the configured vinext/Cloudflare Sites pipeline. Keep the preview unindexed; metadata already sets `noindex, nofollow`. No environment secrets are required for this prototype.

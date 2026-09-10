# Three-tab startup checklist

## Scope

Ontario service-business reference route for teams of 1-5. Home shows personal
progress and the next step. Process contains 8 stages and 24 steps. Services
contains 26 official resources and independent providers, filterable by stage or
by the selected step. No signed partnership, paid placement or commission is
claimed. No external SOP, application submission, payment, file upload or AI
decision is implemented in this surface.

The user-supplied workbook informed the categories and candidate tools. No company
name, personal email, domain ownership or tool adoption was assumed. The built-in
two-person reference route has illustrative progress, not an actual company's
records. It is read only and uses no persistence.

## Five-minute walkthrough

1. Open `/zh/start` or `/en/start`. No registration is required to browse.
2. Optionally use the pencil beside My business to save a nickname, city and team
   size after consenting to storage. Use no sensitive information.
3. Open Process, stage 4, Business email. Read its purpose and service options.
4. Compare options to see only the three relevant services. Open a provider in a
   new tab. This records the visit, not a purchase, submission or completion.
5. Return to the step, set the user-reported status and continue to the next step.
6. Open Home, refresh, and switch language: progress stays the same.
7. Browse the reference route and return: the personal checklist is unchanged.

## Persistence

`launch_journeys` is separate from `business_workspaces`. The new surface never
updates legacy records. `cbl_journey` is a random 256-bit HttpOnly, SameSite=Strict
cookie (Secure on HTTPS); only its SHA-256 hash is stored. No username or password
is required. Clearing the cookie loses access; there is no account recovery or
cross-device access. Payloads are bounded, provider associations validated, and
updates compare both the journey ID and revision. Writes are same-origin only.
Migrations are append only. Local `.wrangler/state` must not be deleted.

## Source verification

Catalog URLs were checked against official publisher/vendor pages on 2026-09-10.
Ontario's start-business, registry, SBEC and employment pages were confirmed via
official indexed content; direct extraction was blocked (403). CRTC's CASL page
was confirmed via its official indexed content. This is source verification, not
a promise of uptime or a professional review of every customer's requirements.
All remaining catalog targets returned page content through research tools.
The CRA registration entry links to the resident/non-resident choice rather than
assuming either market. No prices, registration thresholds or filing dates are
calculated. Company annual returns, income tax and GST/HST remain distinct.

## Tests

`npm run test:unit` includes catalog mapping, status/skip calculation, external
visit semantics, profile consent, revision conflicts and reference isolation.
`tests/e2e/simple-launchpad.spec.ts` covers real D1 persistence, external-link
handoff (external response stubbed), profile/case isolation, browser history,
locale continuity, failed-save retry, session isolation, full checklist closure,
and 1440/768/390px layouts. Legacy tests remain, with their landing route changed
to `/en/overview`. The public build must pass before sharing.

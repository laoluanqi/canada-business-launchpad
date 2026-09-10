import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import test, { before, after } from "node:test";
import { Miniflare } from "miniflare";

let runtime;
before(async () => {
  const root = fileURLToPath(new URL("../dist/server/", import.meta.url));
  const files = (await readdir(root, { recursive: true })).filter((file) => file.endsWith(".js"));
  runtime = new Miniflare({
    modulesRoot: root,
    modules: await Promise.all(files.map(async (file) => ({
      type: "ESModule", path: resolve(root, file), contents: await readFile(resolve(root, file), "utf8"),
    }))).then((modules) => modules.sort((a, b) => Number(b.path.endsWith("/index.js") || b.path.endsWith("\\index.js")) - Number(a.path.endsWith("/index.js") || a.path.endsWith("\\index.js")))),
    compatibilityDate: "2026-05-15",
    compatibilityFlags: ["nodejs_compat"],
    serviceBindings: { ASSETS: async () => new Response("Not found", { status: 404 }) },
    d1Databases: ["DB"],
  });
  await runtime.ready;
  const database = await runtime.getD1Database("DB");
  const journal = JSON.parse(await readFile(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"));
  for (const migration of journal.entries) {
    const sql = await readFile(new URL(`../drizzle/${migration.tag}.sql`, import.meta.url), "utf8");
    for (const statement of sql.split("--> statement-breakpoint").filter((item) => item.trim())) await database.prepare(statement.trim()).run();
  }
});
after(async () => { await runtime?.dispose(); });

async function render(path = "/") {
  return runtime.dispatchFetch(`http://localhost${path}`, { headers: { accept: "text/html" } });
}

test("built Worker saves and reads a private business with real D1 storage", async () => {
  const bootstrap = await runtime.dispatchFetch("http://localhost/api/business");
  assert.equal(bootstrap.status, 200);
  const cookie = bootstrap.headers.get("set-cookie").split(";")[0];
  const headers = { Cookie: cookie, Origin: "http://localhost", "Content-Type": "application/json" };
  const answers = { stage: "planning", registrationStatus: "unsure", city: "Toronto", industry: "services", structure: "sole_prop", businessNameUse: "unsure", revenue: "under_30k", gstRegistered: "unsure", employees: "none", hasOntarioFacilityOffice: "no", imports: false, crossProvince: false, complexResidency: false };
  const created = await runtime.dispatchFetch("http://localhost/api/business", { method: "POST", headers, body: JSON.stringify({ name: "Built-worker check", consent: true, answers }) });
  assert.equal(created.status, 201);
  const business = (await created.json()).business;
  const checked = await runtime.dispatchFetch("http://localhost/api/business", { method: "PATCH", headers, body: JSON.stringify({ businessId: business.id, revision: business.revision, type: "check", taskId: "choose-structure", index: 0, checked: true }) });
  assert.equal(checked.status, 200);
  const response = await runtime.dispatchFetch("http://localhost/api/business", { headers: { Cookie: cookie } });
  const restored = (await response.json()).business;
  assert.equal(restored.id, business.id);
  assert.equal(restored.records["choose-structure"].checks[0], true);
  const stranger = await runtime.dispatchFetch("http://localhost/api/business");
  assert.equal((await stranger.json()).business, null);
});

test("built Worker persists an isolated checklist without treating a visit as completion", async () => {
  const bootstrap = await runtime.dispatchFetch("http://localhost/api/journey");
  assert.equal(bootstrap.status, 200);
  assert.equal((await bootstrap.json()).journey, null);
  const cookie = bootstrap.headers.get("set-cookie").split(";")[0];
  const headers = { Cookie: cookie, Origin: "http://localhost", "Content-Type": "application/json" };
  const command = { type: "status", stepId: "business-email", status: "in_progress", journeyId: "", revision: 0 };
  const created = await runtime.dispatchFetch("http://localhost/api/journey", { method: "PATCH", headers, body: JSON.stringify(command) });
  assert.equal(created.status, 200);
  const journey = (await created.json()).journey;
  assert.equal(journey.records["business-email"].status, "in_progress");
  const stale = await runtime.dispatchFetch("http://localhost/api/journey", { method: "PATCH", headers, body: JSON.stringify(command) });
  assert.equal(stale.status, 409);
  const restored = await runtime.dispatchFetch("http://localhost/api/journey", { headers: { Cookie: cookie } });
  assert.deepEqual((await restored.json()).journey, journey);
  const stranger = await runtime.dispatchFetch("http://localhost/api/journey");
  assert.equal((await stranger.json()).journey, null);
  const crossSite = await runtime.dispatchFetch("http://localhost/api/journey", { method: "PATCH", headers: { ...headers, Origin: "https://other.example" }, body: JSON.stringify(command) });
  assert.equal(crossSite.status, 403);
});

test("renders the external English landing page", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Canada Business Launchpad \| Ontario Pilot<\/title>/i);
  assert.match(html, /A clear next step/);
  assert.match(html, /My Ontario business/);
  assert.match(html, /Ontario Pilot/);
  assert.match(html, /General information only/);
  assert.match(html, /Continue my process/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("server-renders Chinese locale and preserves the locale route", async () => {
  const response = await render("/zh");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /下一步，清清楚楚/);
  assert.match(html, /我的安省企业/);
  assert.match(html, /Ontario Pilot/);
  assert.match(html, /继续我的流程/);
  assert.match(html, /href="\/en\/start/);
});

test("renders six preview journeys and the product boundary", async () => {
  const [demo, product] = await Promise.all([
    render("/en/demo").then((response) => response.text()),
    render("/en/product").then((response) => response.text()),
  ]);
  assert.match(demo, /Toronto digital consultant/);
  assert.match(demo, /Two-founder service corporation/);
  assert.match(demo, /E-commerce growth company/);
  assert.match(demo, /First employee readiness/);
  assert.match(demo, /Complex residency or control/);
  assert.match(demo, /Regulated or multi-province business/);
  assert.match(product, /Clickable now/);
  assert.match(product, /Simulated in the preview/);
  assert.match(product, /Not in this MVP/);
});

test("renders a source-backed workspace and distinct compliance language", async () => {
  const response = await render("/en/workspace/service-corporation");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /NEXT BEST ACTION/);
  assert.match(html, /Ontario corporate annual return/);
  assert.match(html, /T2 corporation tax return/);
  assert.match(html, /Review individuals with significant control/);
  assert.match(html, /Authoritative sources|Sources checked/);
});

test("keeps the prototype implementation and dependency portable", async () => {
  const [content, packageJson] = await Promise.all([
    readFile(new URL("../lib/content.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const taskDefinitions = content.match(/compactTask\(/g) ?? [];
  assert.ok(taskDefinitions.length >= 30, "expected at least 30 mapped tasks");
  assert.match(content, /verified: "2026-09-04"/);
  assert.match(content, /Ontario BIN/);
  assert.match(content, /CRA BN/);
  assert.match(content, /t2-balance/);
  assert.match(packageJson, /"lucide-react": "0\.577\.0"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|file:\.wrangler/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});

test("presentation entry renders in both languages with six real navigation controls", async () => {
  for (const locale of ["en", "zh"]) {
    const response = await render(`/${locale}/present`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /present-chapters/);
    assert.match(html, /present-print-handout/);
    assert.match(html, /chapter=1/);
    assert.match(html, locale === "en" ? /Many services. One connected plan/ : /入口可以分散，创业进度不必/);
    assert.match(html, locale === "en" ? /Your workspace is unchanged/ : /不修改原工作台数据/);
  }
});

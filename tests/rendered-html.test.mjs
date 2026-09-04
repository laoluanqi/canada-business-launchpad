import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the external English landing page", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Canada Business Launchpad \| Ontario Pilot<\/title>/i);
  assert.match(html, /Know what applies/);
  assert.match(html, /Finish what/);
  assert.match(html, /Ontario Pilot/);
  assert.match(html, /General information only/);
  assert.match(html, /Build my launch plan/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("server-renders Chinese locale and preserves the locale route", async () => {
  const response = await render("/zh");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /知道什么适用/);
  assert.match(html, /完成关键下一步/);
  assert.match(html, /安省试点/);
  assert.match(html, /生成我的创业计划/);
  assert.match(html, /href="\/en"/);
});

test("renders six demo journeys and the product boundary", async () => {
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
  assert.match(product, /Simulated in the demo/);
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

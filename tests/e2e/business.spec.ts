import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { assessmentDefaults } from "../../lib/assessment";
import type { BusinessWorkspaceData } from "../../lib/business";

async function createInBrowser(page: Page) {
  await page.goto("/en/launch");
  await expect(page.locator("[data-business-ready=true]")).toBeVisible();
  await page.getByLabel("Project nickname", { exact: true }).fill("My Ontario studio");
  await page.getByRole("checkbox", { name: /I reviewed these selections/ }).check();
  await page.getByRole("button", { name: "Create my workspace", exact: true }).click();
  await expect(page.getByRole("heading", { name: "What needs to happen next?" })).toBeVisible();
}
async function saved(page: Page): Promise<BusinessWorkspaceData> { return (await (await page.request.get("/api/business")).json()).business; }
async function settle(page: Page) { await expect(page.locator(".business-save-status")).toContainText("Saved"); }

test("entry points and browser navigation stay in the personal business loop", async ({ page, context }) => {
  await page.goto("/en/overview");
  await page.locator(".hero-actions").getByRole("link", { name: "Build my launch plan" }).click();
  await expect(page).toHaveURL(/\/en\/launch$/);
  await expect(page.locator("[data-business-ready=true]")).toBeVisible();
  await createInBrowser(page);
  const original = await saved(page);
  await page.getByRole("button", { name: "Work on this task", exact: true }).click();
  await expect(page).toHaveURL(/task=choose-structure/);
  await page.getByRole("button", { name: /Follow-ups & periods/ }).click();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Choose a business structure", exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Nothing ends at the handoff." })).toBeVisible();
  await page.goto("/en/assessment");
  await expect(page).toHaveURL(/\/en\/launch\?tab=profile$/);
  await expect(page.getByLabel("Project nickname", { exact: true })).toHaveValue(original.name);
  await page.goto("/en/present");
  const tabCount = context.pages().length;
  await page.getByRole("link", { name: "My workspace", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/launch$/);
  await expect(page.locator("[data-business-ready=true]")).toBeVisible();
  expect(context.pages().length).toBe(tabCount);
  expect((await saved(page)).id).toBe(original.id);
});

test("home-page starting points create a personal plan rather than opening a sample workspace", async ({ page }) => {
  await page.goto("/en/overview");
  await page.locator(".home-scenario-card").filter({ hasText: "First employee readiness" }).getByRole("link").click();
  await expect(page).toHaveURL(/\/en\/launch\?template=first-hire$/);
  await expect(page.locator("[data-business-ready=true]")).toBeVisible();
  await expect(page.getByLabel("What is the hiring situation?", { exact: false })).toHaveValue("hiring");
  await expect(page.getByLabel("Project nickname", { exact: true })).toHaveValue("");
});

test("business closed loop: own profile, official handoff, issue, completion, next step and preserved reassessment", async ({ page }) => {
  await createInBrowser(page);
  const original = await saved(page);
  await page.getByRole("button", { name: "Work on this task", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Choose a business structure", exact: true })).toBeVisible();
  const checks = page.locator(".business-task-layout > div > .business-card").first().getByRole("checkbox");
  for (let index = 0; index < await checks.count(); index++) { await checks.nth(index).check(); await settle(page); }
  const official = page.getByRole("link", { name: "Open official service / source" });
  await expect(official).toHaveAttribute("href", /^https:\/\//);
  const href = await official.getAttribute("href");
  await page.context().route(`${href}*`, (route) => route.fulfill({ status: 200, body: "Official page placeholder for offline UI test only" }));
  const popupPromise = page.waitForEvent("popup");
  await official.click(); const popup = await popupPromise; await popup.close(); await settle(page);
  expect((await saved(page)).records["choose-structure"].status).toBe("not_started");
  await page.getByLabel("Next follow-up date", { exact: true }).fill("2026-10-01");
  await page.getByRole("button", { name: "Submitted externally; awaiting result", exact: true }).click(); await settle(page);
  await page.getByRole("button", { name: /Follow-ups & periods/ }).click();
  await expect(page.locator(".business-followup-row")).toContainText("2026-10-01");
  await page.getByRole("button", { name: "Record latest outcome", exact: true }).click();
  await page.getByLabel("Next follow-up date", { exact: true }).fill("2026-10-02");
  await page.getByRole("button", { name: "Record issue / more materials", exact: true }).click(); await settle(page);
  expect((await saved(page)).records["choose-structure"].status).toBe("blocked");
  await page.getByRole("checkbox", { name: /I checked the applicable requirements/ }).check();
  await page.getByRole("button", { name: "Save completion & show next step", exact: true }).click();
  await expect(page.getByRole("heading", { name: "This outcome is recorded." })).toBeVisible();
  const completed = await saved(page);
  expect(completed.records["choose-structure"].status).toBe("done");
  expect(completed.records["choose-structure"].followUp).toBe("");
  await page.getByRole("button", { name: "Continue to next task", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Choose a business structure");
  await page.getByRole("button", { name: "Business details", exact: true }).click();
  await page.getByLabel("What is the hiring situation?", { exact: false }).selectOption("hiring");
  await page.getByRole("checkbox", { name: /I reviewed these selections/ }).check();
  await page.getByRole("button", { name: "Update my plan", exact: true }).click();
  await expect(page.locator(".business-change")).toContainText("Previous records remain");
  const updated = await saved(page);
  expect(updated.id).toBe(original.id);
  expect(updated.records["choose-structure"].completedAt).toBe(completed.records["choose-structure"].completedAt);
  expect(updated.records["choose-structure"].needsRecheck).toBe(true);
  expect(updated.planChanges.added).toContain("hiring-readiness");
  await page.reload(); await expect(page.locator("[data-business-ready=true]")).toBeVisible();
  await page.getByRole("link", { name: "中文", exact: true }).click();
  await expect(page.getByRole("heading", { name: "My Ontario studio", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("\u6f14\u793a");
  await page.goto("/zh/demo");
  expect((await saved(page)).id).toBe(original.id);
});

test("separate periods can be corrected and completed without closing the next one", async ({ page }) => {
  await createInBrowser(page);
  await page.getByRole("button", { name: /Follow-ups & periods/ }).click();
  for (const period of ["2026 Q4", "2027 Q1"]) {
    await page.getByLabel("Period or purpose", { exact: true }).fill(period);
    await page.getByLabel("Date confirmed by you", { exact: true }).fill(period === "2026 Q4" ? "2026-12-01" : "2027-03-01");
    await page.getByRole("checkbox", { name: /I have checked this date/ }).check();
    await page.getByRole("button", { name: "Save dated record", exact: true }).click(); await settle(page);
  }
  const row = page.locator(".business-followup-row").filter({ hasText: "2026 Q4" });
  await row.getByRole("button", { name: "Edit date / period", exact: true }).click();
  await page.getByLabel("Date confirmed by you", { exact: true }).fill("2026-12-05");
  await page.getByRole("checkbox", { name: /I have checked this date/ }).check();
  await page.getByRole("button", { name: "Save dated record", exact: true }).click();
  await expect(row).toContainText("2026-12-05");
  await row.getByRole("button", { name: "Complete this period only", exact: true }).click();
  await expect(row).toContainText("This period completed");
  await expect(page.locator(".business-followup-row").filter({ hasText: "2027 Q1" })).toContainText("Open");
  const business = await saved(page);
  expect(business.followUps).toHaveLength(2);
  expect(business.records).toEqual({});
});

test("failed saves show an error, retain the saved state and allow a retry", async ({ page }) => {
  await createInBrowser(page);
  const before = await saved(page);
  await page.getByRole("button", { name: "Business details", exact: true }).click();
  await page.getByLabel("Project nickname", { exact: true }).fill("Unsaved change");
  await page.getByRole("checkbox", { name: /I reviewed these selections/ }).check();
  await page.route("**/api/business", (route) => route.request().method() === "PATCH" ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "storage_unavailable" }) }) : route.continue());
  await page.getByRole("button", { name: "Update my plan", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("have not been saved");
  await expect(page.locator(".business-save-status")).toContainText("Not saved");
  expect((await saved(page)).name).toBe(before.name);
  await page.unroute("**/api/business");
  await page.getByRole("button", { name: "Update my plan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Unsaved change", exact: true })).toBeVisible();
});

test("server sessions isolate workspaces, reject stale writes and prevent replacement-workspace overwrites", async ({ page, browser, baseURL }) => {
  await createInBrowser(page);
  const original = await saved(page);
  const origin = new URL(baseURL!).origin;
  const headers = { Origin: origin };
  const other = await browser.newContext({ baseURL });
  expect((await (await other.request.get("/api/business")).json()).business).toBeNull();
  const denied = await other.request.patch("/api/business", { headers, data: { businessId: original.id, revision: original.revision, type: "profile", name: "Other visitor", answers: assessmentDefaults } });
  expect(denied.status()).toBe(404);
  const changed = await page.request.patch("/api/business", { headers, data: { businessId: original.id, revision: original.revision, type: "profile", name: "New name", answers: assessmentDefaults } });
  expect(changed.ok()).toBeTruthy();
  const stale = await page.request.patch("/api/business", { headers, data: { businessId: original.id, revision: original.revision, type: "profile", name: "Old name", answers: assessmentDefaults } });
  expect(stale.status()).toBe(409);
  const latest = await saved(page);
  expect((await page.request.delete("/api/business", { headers, data: { businessId: latest.id, revision: latest.revision, confirmed: true } })).ok()).toBeTruthy();
  const replacementResponse = await page.request.post("/api/business", { headers, data: { name: "Replacement", answers: assessmentDefaults, consent: true } });
  const replacement = (await replacementResponse.json()).business;
  expect(replacement.revision).toBe(original.revision);
  const staleDelete = await page.request.delete("/api/business", { headers, data: { businessId: original.id, revision: original.revision, confirmed: true } });
  expect(staleDelete.status()).toBe(409);
  expect((await saved(page)).id).toBe(replacement.id);
  const crossOrigin = await page.request.patch("/api/business", { headers: { Origin: "https://unrelated.example" }, data: { businessId: replacement.id, revision: replacement.revision, type: "profile", name: "Cross origin", answers: assessmentDefaults } });
  expect(crossOrigin.status()).toBe(403);
  await other.close();
});

test("new working surface has responsive layouts in both languages", async ({ page }) => {
  await createInBrowser(page);
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const locale of ["en", "zh"]) {
      for (const tab of ["plan", "profile", "followups", "history"]) {
        await page.goto(`/${locale}/launch?tab=${tab}`);
        await expect(page.locator("[data-business-ready=true]")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
      }
    }
  }
  await page.goto("/zh/launch"); await expect(page.locator("[data-business-ready=true]")).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("workspace-zh-mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: test.info().outputPath("workspace-zh-desktop.png"), fullPage: true });
});

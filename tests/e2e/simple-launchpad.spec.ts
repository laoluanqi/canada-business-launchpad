import { expect, test, type Page } from "@playwright/test";
import type { LaunchJourney } from "../../lib/launchpad-progress";

async function ready(page: Page) { await expect(page.locator('[data-journey-ready="true"]')).toBeVisible(); }
async function saved(page: Page) { return page.evaluate(async () => ((await (await fetch("/api/journey")).json()) as { journey: LaunchJourney }).journey); }
const email = "/en/start?tab=process&stage=digital&step=business-email";

test("step to filtered services to external site to completion is a persistent loop", async ({ page, context }) => {
  await page.goto(email); await ready(page);
  await expect(page.getByRole("button", { name: "Not started", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Compare options", exact: true }).click();
  await expect(page.locator(".lp-service")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Zoho Mail", exact: true })).toBeVisible();
  const link = page.locator(".lp-service").filter({ has: page.getByRole("heading", { name: "Zoho Mail", exact: true }) }).getByRole("link", { name: "Visit service website" });
  await expect(link).toHaveAttribute("href", "https://www.zoho.com/mail/");
  await expect(link).toHaveAttribute("target", "_blank");
  await context.route("https://www.zoho.com/mail/**", route => route.fulfill({ body: "External service fixture for navigation testing", contentType: "text/plain" }));
  const opened = page.waitForEvent("popup"); await link.click(); const popup = await opened; await popup.close(); await ready(page);
  expect((await saved(page)).records["business-email"].status).toBe("not_started");
  await page.getByRole("button", { name: "Back to this step", exact: true }).click();
  await expect(page.locator(".lp-return-note")).toContainText("Zoho Mail");
  await page.getByRole("button", { name: "Completed by me", exact: true }).click(); await ready(page);
  expect((await saved(page)).records["business-email"].status).toBe("done");
  await page.getByRole("button", { name: "Continue to the next step", exact: true }).click();
  await expect(page).toHaveURL(/step=website/);
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await expect(page.getByTestId("lp-progress")).toHaveText("1 / 24");
  await page.reload(); await ready(page); await expect(page.getByTestId("lp-progress")).toHaveText("1 / 24");
  await page.getByRole("link", { name: "Switch to Chinese" }).click(); await ready(page);
  await expect(page.getByTestId("lp-progress")).toHaveText("1 / 24");
  await expect(page.locator("body")).not.toContainText("\u6f14\u793a");
});

test("profile editing and reference route never overwrite personal progress", async ({ page }) => {
  await page.goto("/en/start"); await ready(page);
  await expect(page.getByRole("navigation").getByRole("button")).toHaveCount(3);
  await page.getByRole("button", { name: "Edit business details" }).click();
  await page.getByLabel("Business nickname (optional)", { exact: true }).fill("My independent studio");
  await page.getByLabel("Team size", { exact: true }).selectOption("2");
  await expect(page.getByRole("button", { name: "Save details", exact: true })).toBeDisabled();
  await page.getByRole("checkbox").check(); await page.getByRole("button", { name: "Save details", exact: true }).click(); await ready(page);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "My independent studio", exact: true })).toBeVisible();
  const before = await saved(page);
  await page.getByRole("button", { name: "Explore reference route" }).click();
  await expect(page.getByTestId("lp-progress")).toHaveText("6 / 24");
  await page.getByRole("button", { name: "Continue my process" }).click();
  await expect(page.getByRole("button", { name: "Completed by me", exact: true })).toBeDisabled();
  await page.reload(); await ready(page);
  expect(await saved(page)).toEqual(before);
  await page.getByRole("button", { name: "Back to my checklist" }).click();
  await expect(page.getByTestId("lp-progress")).toHaveText("0 / 24");
  await expect(page.getByRole("heading", { name: "My independent studio", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit business details" }).click(); await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("deep links, history and locale retain the selected step", async ({ page }) => {
  await page.goto(email + "&category=growth"); await ready(page);
  await page.getByRole("button", { name: "Compare options", exact: true }).click();
  await page.goBack(); await expect(page.locator("#lp-detail-business-email")).toBeVisible();
  await page.goForward(); await expect(page.locator(".lp-service")).toHaveCount(3);
  await page.getByRole("link", { name: "Switch to Chinese" }).click(); await ready(page);
  await expect(page).toHaveURL(/zh\/start\?tab=services&step=business-email/);
  await page.getByRole("button", { name: "返回这一步", exact: true }).click();
  await expect(page.locator("#lp-detail-business-email")).toBeVisible();
  await page.goto("/zh/start?tab=process&step=missing&stage=missing"); await ready(page);
  await expect(page.locator(".lp-stage-card")).toHaveCount(8);
});

test("failed saves remain unsaved and can be retried", async ({ page }) => {
  await page.goto(email); await ready(page);
  await page.route("**/api/journey", async route => {
    if (route.request().method() === "PATCH") await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "storage_unavailable" }) });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Completed by me", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("has not been saved");
  await expect(page.getByRole("button", { name: "Not started", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.unroute("**/api/journey");
  await page.getByRole("button", { name: "Reload", exact: true }).click(); await ready(page);
  await page.getByRole("button", { name: "Completed by me", exact: true }).click(); await ready(page);
  expect((await saved(page)).records["business-email"].status).toBe("done");
});

test("server rejects cross-site and stale updates and keeps legacy state separate", async ({ page, browser, baseURL }) => {
  await page.goto(email); await ready(page);
  await page.getByRole("button", { name: "In progress", exact: true }).click(); await ready(page);
  const current = await saved(page);
  const endpoint = `${baseURL}/api/journey`;
  const input = { type: "status", stepId: "business-email", status: "done", journeyId: current.id, revision: current.revision - 1 };
  const stale = await page.request.patch(endpoint, { headers: { Origin: baseURL! }, data: input }); expect(stale.status()).toBe(409);
  const cross = await page.request.patch(endpoint, { headers: { Origin: "https://unrelated.invalid" }, data: input }); expect(cross.status()).toBe(403);
  const alien = await browser.newContext(); const anon = await alien.request.get(endpoint); expect((await anon.json()).journey).toBeNull(); await alien.close();
  const legacy = await page.request.get(`${baseURL}/api/business`); expect((await legacy.json()).business).toBeNull();
  expect((await saved(page)).records["business-email"].status).toBe("in_progress");
});

test("all steps can be resolved and reopened without resetting the checklist", async ({ page }) => {
  await page.goto("/en/start"); await ready(page);
  await page.evaluate(async () => {
    const ids = ["business-idea", "market-research", "business-plan", "business-name", "domain", "visual-brand", "legal-structure", "registration", "permits-insurance", "business-email", "website", "collaboration", "banking", "bookkeeping", "tax-accounts", "agreements", "client-intake", "invoicing", "marketing", "crm", "booking", "filings", "hiring", "renewals"];
    let journey = ((await (await fetch("/api/journey")).json()) as { journey: Pick<LaunchJourney, "id" | "revision"> | null }).journey ?? { id: "", revision: 0 };
    for (const stepId of ids) {
      const response = await fetch("/api/journey", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ journeyId: journey.id, revision: journey.revision, type: "status", stepId, status: "done" }) });
      if (!response.ok) throw new Error("failed to complete " + stepId);
      journey = ((await response.json()) as { journey: LaunchJourney }).journey;
    }
  });
  await page.reload(); await ready(page);
  await expect(page.getByTestId("lp-progress")).toHaveText("24 / 24");
  await expect(page.getByRole("heading", { name: "Your startup checklist is up to date." })).toBeVisible();
  await page.goto(email); await ready(page);
  await page.getByRole("button", { name: "Not started", exact: true }).click(); await ready(page);
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await expect(page.getByTestId("lp-progress")).toHaveText("23 / 24");
});

test("three working tabs fit desktop tablet and mobile in both languages", async ({ page }, info) => {
  for (const locale of ["en", "zh"]) for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 950 });
    for (const query of ["tab=home", "tab=process&stage=digital&step=business-email", "tab=services&step=business-email"]) {
      await page.goto(`/${locale}/start?${query}`); await ready(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (locale === "zh" && width !== 768) await page.screenshot({ path: info.outputPath(`launchpad-${width}-${query.split("&")[0].split("=")[1]}.png`), fullPage: true });
    }
  }
});

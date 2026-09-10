import { test, expect } from "@playwright/test";

const WORKSPACE_KEY = "cbl-demo:v1";
const PRESENTATION_KEY = "cbl-presentation:v1";

test("public-facing Chinese copy uses product and sample language while retaining simulation boundaries", async ({ page }) => {
  for (const path of ["", "/present", "/product", "/demo", "/assessment", "/workspace/toronto-consultant", "/tasks/choose-structure", "/providers", "/calendar", "/assistant", "/support", "/partners", "/admin/rules"]) {
    await page.goto(`/zh${path}`);
    await expect(page.locator(path === "" ? '[data-journey-ready="true"]' : "html[data-launchpad-ready='true']")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("\u6f14\u793a");
  }
  await page.goto("/zh/present?chapter=6");
  await expect(page.locator("[data-presentation-ready=true]")).toBeVisible();
  await expect(page.locator(".present-consent")).toContainText("无真实接收方");
  await expect(page.locator(".present-consent-check")).toContainText("本地模拟");
});

test("six-chapter presentation keeps audience, notes and language but never writes workspace data", async ({ page }) => {
  await page.goto("/en/present");
  await expect(page.locator("[data-presentation-ready=true]")).toBeVisible();
  const original = JSON.stringify({ version: 1, activeScenarioId: "first-hire", assessmentAnswers: { stage: "operating", structure: "corporation", employees: "hiring" }, taskStatus: {}, materialChecks: {}, evidence: {}, referrals: [], consents: [] });
  await page.evaluate(({ key, original }) => localStorage.setItem(key, original), { key: WORKSPACE_KEY, original });
  await page.getByRole("button", { name: "For partners", exact: true }).click();
  await page.getByRole("button", { name: "Notes", exact: true }).click();
  await expect(page.locator(".present-notes")).toContainText("visible to your audience");
  await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await page.getByRole("button", { name: /First employee readiness/ }).click();
  await page.getByRole("link", { name: "中文", exact: true }).click();
  await expect(page.locator(".present-chapter-heading h1")).toContainText("不同企业");
  await expect(page.getByRole("button", { name: "合作方视角" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".present-profile-result")).toContainText("首位员工准备");
  await expect(page.locator(".present-notes")).toBeVisible();
  await page.locator(".present-chapter-heading h1").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".present-chapter-heading h1")).toContainText("下一步清楚");
  await page.getByRole("link", { name: "进入我的企业工作台" }).click();
  await expect(page).toHaveURL(/\/zh\/launch$/);
  await expect(page.locator("[data-business-ready=true]")).toBeVisible();
  await page.goBack();
  await expect(page.locator("[data-presentation-ready=true]")).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), WORKSPACE_KEY)).toBe(original);
  await page.getByRole("button", { name: "重新演练", exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), WORKSPACE_KEY)).toBe(original);
  await expect(page.locator(".present-chapter-heading h1")).toContainText("入口可以分散");
});

for (const profile of ["Toronto digital consultant", "Two-founder service corporation", "E-commerce growth company", "First employee readiness"]) {
  test(`${profile} completes the isolated rehearsal and advances the next task`, async ({ page }) => {
    await page.goto("/en/present?chapter=2");
    await expect(page.locator("[data-presentation-ready=true]")).toBeVisible();
    await page.getByRole("button", { name: new RegExp(profile) }).click();
    await page.getByRole("button", { name: "See this plan" }).click();
    const before = await page.locator(".present-action h2").textContent();
    await page.getByRole("button", { name: "Next chapter", exact: true }).click();
    const submit = page.getByRole("button", { name: "Record simulated external waiting" });
    await expect(submit).toBeDisabled();
    for (const check of await page.locator(".present-checklist input").all()) await check.check();
    await submit.click();
    await page.getByRole("button", { name: "Continue with a sample record" }).click();
    await page.getByRole("button", { name: "Record sample completion" }).click();
    await expect(page.locator(".present-rehearsal-grid aside")).toContainText("1 user-recorded milestone");
    const after = await page.locator(".present-rehearsal-grid aside h3 + p").textContent();
    expect(after).not.toBe(before);
    await page.reload();
    await expect(page.getByRole("button", { name: "Sample completion recorded" })).toBeDisabled();
    await page.getByRole("button", { name: "Next chapter", exact: true }).click();
    const receipt = page.getByRole("button", { name: "Simulate partner receipt" });
    await expect(receipt).toBeDisabled();
    await page.locator(".present-consent-check input").check();
    await receipt.click();
    await expect(page.locator(".present-consent [role='status']")).toContainText("Nothing was sent to a partner");
    expect(await page.evaluate((key) => localStorage.getItem(key), WORKSPACE_KEY)).toBeNull();
  });
}

test("boundary presentation never offers sample completion", async ({ page }) => {
  await page.goto("/en/present?chapter=2");
  await expect(page.locator("[data-presentation-ready=true]")).toBeVisible();
  await page.getByRole("button", { name: /Regulated or multi-province business/ }).click();
  await page.getByRole("button", { name: "See this plan" }).click();
  await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await expect(page.locator(".present-boundary")).toBeVisible();
  await expect(page.locator(".present-checklist")).toHaveCount(0);
  await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await expect(page.getByRole("button", { name: "Record sample completion" })).toHaveCount(0);
  const stored = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)!), PRESENTATION_KEY);
  expect(stored.rehearsal).toBe("preparing");
});

test("workspace handoff, milestone record and phase filter are connected", async ({ page }) => {
  await page.goto("/en/tasks/choose-structure");
  await expect(page.locator("html[data-launchpad-ready='true']")).toBeVisible();
  await expect(page.locator(".material-list input")).toHaveCount(3);
  for (const check of await page.locator(".material-list input").all()) await check.check();
  await page.getByRole("button", { name: "Record external waiting", exact: true }).click();
  await page.goto("/en/workspace/toronto-consultant");
  await expect(page.locator(".workflow-waiting")).toContainText("Choose a business structure");
  await expect(page.locator(".next-action-card h2")).not.toContainText("Choose a business structure");
  await page.locator(".workflow-waiting a").click();
  await page.getByRole("button", { name: "Use safe sample data" }).click();
  await page.getByRole("button", { name: "Mark complete", exact: true }).click();
  await expect(page.locator(".workflow-outcome")).toContainText("Your plan can keep moving");
  await expect(page.locator(".task-handoff-strip > div").nth(2)).not.toHaveClass(/reached/);
  await page.getByRole("link", { name: "See milestone in workspace" }).click();
  await expect(page.locator("#evidence")).toContainText("SAMPLE-2026-001");
  await page.locator(".milestone-map button").first().click();
  await expect(page.locator(".phase-filter-note")).toContainText("Plan");
  await expect(page.locator(".task-row")).toHaveCount(2);
  await page.getByRole("button", { name: "Show all stages" }).click();
  await expect(page.locator(".task-row")).toHaveCount(21);
});

test("presentation offers a printable six-chapter handout", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const locale of ["en", "zh"]) {
    await page.emulateMedia({ media: "screen" });
    for (let chapter = 1; chapter <= 6; chapter++) {
      await page.goto(`/${locale}/present?chapter=${chapter}`);
      await expect(page.locator("[data-presentation-ready=true]")).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`presentation-${locale}-${chapter}.png`), fullPage: true });
    }
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".present-print-handout")).toBeVisible();
    await expect(page.locator(".present-body")).toBeHidden();
    await expect(page.locator(".present-print-handout section")).toHaveCount(6);
    await page.pdf({ path: testInfo.outputPath(`presentation-handout-${locale}.pdf`), format: "A4", printBackground: true, preferCSSPageSize: true });
  }
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zh/present?chapter=4");
  await expect(page.locator("[data-presentation-ready=true]")).toBeVisible();
  await expect(page.getByRole("button", { name: "重新演练" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("presentation-zh-mobile.png"), fullPage: true });
});

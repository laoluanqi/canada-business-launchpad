import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "cbl-demo:v1";

async function waitForApp(page: Page) {
  await page.locator("html[data-launchpad-ready='true']").waitFor();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/en/overview");
  await page.evaluate((key) => window.localStorage.removeItem(key), STORAGE_KEY);
});

test("homepage to preview to workspace to task is a complete golden path", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Examples", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/demo$/);

  const scenario = page
    .locator("article.scenario-card")
    .filter({ has: page.getByRole("heading", { name: "Toronto digital consultant" }) });
  await scenario.getByRole("link", { name: "Launch this journey" }).click();

  await expect(page).toHaveURL(/\/en\/workspace\/toronto-consultant$/);
  await expect(page.getByRole("heading", { name: "Your next milestone." })).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByRole("radio", { name: "Sole proprietorship" })).toHaveClass(
    /selected/,
  );
  await expect(page.getByRole("radio", { name: "Under CAD 30,000" })).toHaveClass(
    /selected/,
  );
  await page.goBack();
  await page.getByRole("link", { name: "Open task" }).click();
  await expect(page).toHaveURL(/\/en\/tasks\/choose-structure$/);
  await expect(
    page.getByRole("heading", { name: "Choose a business structure" }),
  ).toBeVisible();
});

test("assessment preserves dynamic answers, recalculates tasks and persists progress", async ({
  page,
}) => {
  await page.goto("/en/sample-assessment");
  await waitForApp(page);
  await page.getByRole("radio", { name: "Ontario corporation" }).click();
  await page.getByRole("radio", { name: "Near CAD 30,000" }).click();
  await page.getByRole("radio", { name: "Preparing the first hire" }).click();
  await page.getByRole("button", { name: "Create matched plan" }).click();

  await expect(page).toHaveURL(/\/en\/workspace\/first-hire$/);
  const stored = await page.evaluate((key) => {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }, STORAGE_KEY);
  expect(stored?.assessmentAnswers).toMatchObject({
    structure: "corporation",
    revenue: "near_30k",
    employees: "hiring",
  });

  const assumptions = page.locator("article.assumption-card");
  await expect(assumptions).toContainText("corporation");
  await expect(assumptions).toContainText("near 30k");
  await expect(assumptions).toContainText("hiring");
  await expect(page.getByText("Open a payroll account", { exact: true })).toBeVisible();
  await expect(page.getByText("File the Ontario corporate annual return", { exact: true })).toBeVisible();

  const structureRow = page
    .locator(".task-row")
    .filter({ hasText: "Choose a business structure" });
  await structureRow.getByLabel("Task status").selectOption("done");
  await expect(structureRow.getByLabel("Task status")).toHaveValue("done");
  await page.reload();
  await expect(
    page
      .locator(".task-row")
      .filter({ hasText: "Choose a business structure" })
      .getByLabel("Task status"),
  ).toHaveValue("done");

  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/en\/sample-assessment$/);
  await expect(page.getByRole("radio", { name: "Ontario corporation" })).toHaveClass(
    /selected/,
  );
  await expect(page.getByRole("radio", { name: "Near CAD 30,000" })).toHaveClass(
    /selected/,
  );
  await expect(page.getByRole("radio", { name: "Preparing the first hire" })).toHaveClass(
    /selected/,
  );
});

test("language switch preserves the current route", async ({ page }) => {
  await page.goto("/en/demo");
  await page.locator("a.language-link.desktop-only").click();
  await expect(page).toHaveURL(/\/zh\/demo$/);
  await expect(page.getByRole("heading", { name: "选择一条创业旅程" })).toBeVisible();

  await page.locator("a.language-link.desktop-only").click();
  await expect(page).toHaveURL(/\/en\/demo$/);
});

test("SSR declares the page language and unknown routes return 404", async ({
  request,
}) => {
  const chinese = await request.get("/zh");
  expect(chinese.status()).toBe(200);
  expect(await chinese.text()).toContain('<html lang="zh-Hans"');

  expect((await request.get("/fr")).status()).toBe(404);
  expect((await request.get("/en/not-a-page")).status()).toBe(404);
});

test("provider handoff requires explicit consent and records only a local simulation", async ({
  page,
}) => {
  await page.goto("/en/providers");
  await waitForApp(page);
  await page.getByRole("textbox", { name: "Search service category" }).fill("official");
  await expect(page.locator("article.provider-card")).toHaveCount(2);
  await page.getByRole("textbox", { name: "Search service category" }).fill("");
  await page.getByRole("button", { name: "Review simulated handoff" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Review before sharing" })).toBeVisible();
  const submit = dialog.getByRole("button", { name: "Submit simulated handoff" });
  await expect(submit).toBeDisabled();
  await dialog.getByRole("checkbox").check();
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(dialog.getByRole("heading", { name: "Simulated handoff received" })).toBeVisible();
  const referralCount = await page.evaluate((key) => {
    const state = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    return state.referrals?.length ?? 0;
  }, STORAGE_KEY);
  expect(referralCount).toBe(1);
});

test("materials persist and gate the official handoff", async ({ page }) => {
  await page.goto("/en/tasks/choose-structure");
  await expect(
    page.getByRole("button", { name: "Complete the checklist to continue" }),
  ).toBeDisabled();
  const checks = page.locator(".material-list input[type='checkbox']");
  await expect(checks).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) await checks.nth(index).check();
  await expect(
    page.getByRole("link", { name: /Continue to the official website/ }),
  ).toBeVisible();
  await page.reload();
  for (let index = 0; index < 3; index += 1) {
    await expect(checks.nth(index)).toBeChecked();
  }
});

test("support handoff cannot be prepared without consent", async ({ page }) => {
  await page.goto("/en/support#expert");
  const submit = page.getByRole("button", { name: "Prepare sample request" });
  await expect(submit).toBeDisabled();
  await page.getByRole("checkbox").check();
  await expect(submit).toBeEnabled();
});

test("admin draft editing and publish review remain browser-only simulations", async ({
  page,
}) => {
  await page.goto("/en/admin/sources");
  await waitForApp(page);
  await page.getByRole("button", { name: "Simulate publish" }).click();
  await expect(page.getByText(/Preview publish blocked/)).toBeVisible();

  await page.getByRole("button", { name: "Edit preview draft" }).click();
  const editor = page.getByRole("dialog", { name: "Edit a browser-only preview draft" });
  const background = page.locator(".admin-page > div[inert]");
  await expect(background).toHaveAttribute("aria-hidden", "true");
  await editor.getByRole("checkbox", { name: "English and Chinese reviewed" }).check();
  await editor.getByRole("button", { name: "Close editor" }).click();

  await page.getByRole("button", { name: "Edit preview draft" }).click();
  await expect(
    editor.getByRole("checkbox", { name: "English and Chinese reviewed" }),
  ).not.toBeChecked();
  await editor.getByRole("checkbox", { name: "English and Chinese reviewed" }).check();
  await editor
    .getByRole("checkbox", { name: "Source and professional boundary reviewed" })
    .check();
  await editor.getByRole("button", { name: "Save preview draft" }).click();
  await page.getByRole("button", { name: "Simulate publish" }).click();
  await expect(page.getByText(/Reviewed preview draft published/)).toBeVisible();
});

async function getContrastViolations(page: Page, path: string) {
  await page.goto(path);
  return page.evaluate(() => {
    type Rgba = { r: number; g: number; b: number; a: number };
    const parse = (value: string): Rgba | null => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const parts = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return {
        r: parts[0],
        g: parts[1],
        b: parts[2],
        a: parts.length > 3 ? parts[3] : 1,
      };
    };
    const composite = (front: Rgba, back: Rgba): Rgba => {
      const a = front.a + back.a * (1 - front.a);
      if (a === 0) return { r: 255, g: 255, b: 255, a: 1 };
      return {
        r: (front.r * front.a + back.r * back.a * (1 - front.a)) / a,
        g: (front.g * front.a + back.g * back.a * (1 - front.a)) / a,
        b: (front.b * front.a + back.b * back.a * (1 - front.a)) / a,
        a,
      };
    };
    const luminance = ({ r, g, b }: Rgba) => {
      const linear = [r, g, b].map((channel) => {
        const value = channel / 255;
        return value <= 0.04045
          ? value / 12.92
          : Math.pow((value + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const backgroundFor = (element: Element): Rgba | null => {
      let background: Rgba = { r: 255, g: 255, b: 255, a: 0 };
      let current: Element | null = element;
      while (current) {
        const style = getComputedStyle(current);
        if (style.backgroundImage !== "none" && background.a < 1) return null;
        const layer = parse(style.backgroundColor);
        if (layer && layer.a > 0) background = composite(background, layer);
        if (background.a >= 0.999) return background;
        current = current.parentElement;
      }
      return composite(background, { r: 255, g: 255, b: 255, a: 1 });
    };

    return Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        if (!(element instanceof HTMLElement)) return false;
        if (element.matches(":disabled") || element.closest('[aria-hidden="true"]')) return false;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const hasDirectText = Array.from(element.childNodes).some(
          (node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
        );
        return (
          hasDirectText &&
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none"
        );
      })
      .flatMap((element) => {
        const style = getComputedStyle(element);
        const foreground = parse(style.color);
        const background = backgroundFor(element);
        if (!foreground || !background) return [];
        const renderedForeground = composite(foreground, background);
        const values = [luminance(renderedForeground), luminance(background)].sort(
          (a, b) => b - a,
        );
        const ratio = (values[0] + 0.05) / (values[1] + 0.05);
        const size = Number.parseFloat(style.fontSize);
        const weight = Number.parseInt(style.fontWeight, 10) || 400;
        const large = size >= 24 || (size >= 18.66 && weight >= 700);
        if (ratio + 0.01 >= (large ? 3 : 4.5)) return [];
        return [
          {
            selector: `${element.tagName.toLowerCase()}.${element.className}`,
            text: element.textContent?.trim().slice(0, 70),
            ratio: Number(ratio.toFixed(2)),
            color: style.color,
            background: `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})`,
          },
        ];
      });
  });
}

test("core content text meets WCAG AA contrast thresholds", async ({ page }) => {
  const violations = [];
  for (const path of [
    "/en",
    "/en/workspace/service-corporation",
    "/en/tasks/choose-structure",
    "/en/calendar",
    "/en/providers",
    "/en/assistant",
    "/en/admin/sources",
    "/zh/workspace/service-corporation",
    "/en/present?chapter=1",
    "/en/present?chapter=4",
    "/zh/present?chapter=6",
  ]) {
    violations.push(...(await getContrastViolations(page, path)).map((item) => ({ path, ...item })));
  }
  const unique = Array.from(
    new Map(
      violations.map((item) => [
        `${item.path}|${item.color}|${item.background}|${item.selector}`,
        item,
      ]),
    ).values(),
  );
  expect(unique, JSON.stringify(unique, null, 2)).toEqual([]);
});

async function expectNoHorizontalOverflow(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("body")).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    dimensions.scrollWidth,
    `${path} overflows: ${dimensions.scrollWidth}px > ${dimensions.clientWidth}px`,
  ).toBeLessThanOrEqual(dimensions.clientWidth);
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name} core pages have no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const path of [
      "/en",
      "/en/workspace/service-corporation",
      "/en/tasks/choose-structure",
      "/en/providers",
      "/en/calendar",
      "/en/present?chapter=1",
      "/en/present?chapter=2",
      "/en/present?chapter=3",
      "/en/present?chapter=4",
      "/en/present?chapter=5",
      "/en/present?chapter=6",
      "/zh/present?chapter=1",
      "/zh/present?chapter=6",
    ]) {
      await expectNoHorizontalOverflow(page, path);
    }
  });
}

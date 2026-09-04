"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  assistantPrompts,
  bi,
  calendarEvents,
  getScenario,
  getSource,
  getTask,
  providers,
  scenarios,
  sources,
  tasks,
} from "@/lib/content";
import {
  createInitialState,
  demoRepository,
  matchScenario,
  synthesizeAssessmentScenario,
} from "@/lib/demo-repository";
import type {
  DemoScenario,
  DemoState,
  Locale,
  LocalizedText,
  Provider,
  TaskDefinition,
  TaskKind,
  TaskStatus,
} from "@/lib/types";
import { Icon } from "./Icon";

type PageProps = {
  locale: Locale;
  path?: string[];
};

const copy = {
  demoStrip: {
    en: "External Demo MVP v0.1 · Ontario Pilot · General information only",
    zh: "对外演示MVP v0.1 · 安省试点 · 仅提供一般信息",
  },
  nav: {
    product: { en: "Product", zh: "产品" },
    demo: { en: "Demo", zh: "体验" },
    partners: { en: "Partners", zh: "合作" },
    resources: { en: "Resources", zh: "资源" },
  },
  cta: { en: "Build my launch plan", zh: "生成我的创业计划" },
};

const l = (value: LocalizedText, locale: Locale) => value[locale];
const route = (locale: Locale, path = "") => `/${locale}${path}`;

function AppLink({
  locale,
  href,
  className = "",
  children,
  onClick,
  ariaLabel,
}: {
  locale: Locale;
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <a
      aria-label={ariaLabel}
      className={className}
      href={route(locale, href)}
      onClick={onClick}
    >
      {children}
    </a>
  );
}

function DemoBadge({
  locale,
  compact = false,
}: {
  locale: Locale;
  compact?: boolean;
}) {
  return (
    <span className={`demo-badge ${compact ? "compact" : ""}`}>
      <span className="pulse-dot" />
      {compact
        ? locale === "en"
          ? "DEMO · ONTARIO PILOT · GENERAL INFORMATION ONLY"
          : "演示 · 安省试点 · 仅提供一般信息"
        : copy.demoStrip[locale]}
    </span>
  );
}

function Header({
  locale,
  active,
  currentPath,
}: {
  locale: Locale;
  active: string;
  currentPath: string[];
}) {
  const [open, setOpen] = useState(false);
  const languagePath = route(
    locale === "en" ? "zh" : "en",
    currentPath.length ? `/${currentPath.join("/")}` : "",
  );
  const nav = [
    ["product", copy.nav.product[locale], "/product"],
    ["demo", copy.nav.demo[locale], "/demo"],
    ["partners", copy.nav.partners[locale], "/partners"],
    ["support", copy.nav.resources[locale], "/support"],
  ];
  return (
    <>
      <div className="top-strip">{copy.demoStrip[locale]}</div>
      <header className="site-header">
        <div className="shell header-inner">
          <AppLink
            locale={locale}
            href=""
            className="brand"
            ariaLabel="Canada Business Launchpad home"
          >
            <span className="brand-mark">
              <span>CB</span>
            </span>
            <span className="brand-name">
              <strong>Canada Business</strong>
              <span>Launchpad</span>
            </span>
          </AppLink>
          <nav
            className={`main-nav ${open ? "open" : ""}`}
            aria-label="Primary navigation"
          >
            {nav.map(([key, label, href]) => (
              <AppLink
                key={key}
                locale={locale}
                href={href}
                className={active === key ? "active" : ""}
              >
                {label}
              </AppLink>
            ))}
            <a className="language-link mobile-only" href={languagePath}>
              <Icon name="globe" size={17} />{" "}
              {locale === "en" ? "中文" : "English"}
            </a>
          </nav>
          <div className="header-actions">
            <a className="language-link desktop-only" href={languagePath}>
              <Icon name="globe" size={17} /> {locale === "en" ? "中文" : "EN"}
            </a>
            <AppLink
              locale={locale}
              href="/assessment"
              className="btn btn-primary btn-sm"
            >
              {copy.cta[locale]} <Icon name="arrow" size={16} />
            </AppLink>
            <button
              className="menu-button"
              aria-label="Toggle menu"
              onClick={() => setOpen(!open)}
            >
              <Icon name={open ? "x" : "menu"} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <div className="brand footer-brand">
            <span className="brand-mark">
              <span>CB</span>
            </span>
            <span className="brand-name">
              <strong>Canada Business</strong>
              <span>Launchpad</span>
            </span>
          </div>
          <p className="footer-copy">
            {locale === "en"
              ? "Independent planning and progress management for Ontario small businesses."
              : "面向安省小企业的独立规划与进度管理平台。"}
          </p>
          <DemoBadge locale={locale} compact />
        </div>
        <div>
          <h4>{locale === "en" ? "Explore" : "产品"}</h4>
          <AppLink locale={locale} href="/product">
            {locale === "en" ? "How it works" : "工作方式"}
          </AppLink>
          <AppLink locale={locale} href="/demo">
            {locale === "en" ? "Demo journeys" : "演示旅程"}
          </AppLink>
          <AppLink locale={locale} href="/providers">
            {locale === "en" ? "Service directory" : "服务商目录"}
          </AppLink>
        </div>
        <div>
          <h4>{locale === "en" ? "Trust" : "信任"}</h4>
          <AppLink locale={locale} href="/support">
            {locale === "en" ? "Scope & disclaimers" : "范围与声明"}
          </AppLink>
          <AppLink locale={locale} href="/support#privacy">
            {locale === "en" ? "Privacy approach" : "隐私原则"}
          </AppLink>
          <AppLink locale={locale} href="/admin/sources">
            {locale === "en" ? "Source ledger" : "来源台账"}
          </AppLink>
        </div>
        <div className="footer-disclaimer">
          <Icon name="shield" size={22} />
          <p>
            {locale === "en"
              ? "Canada Business Launchpad is an independent prototype. It is not a government service, law firm, CPA firm, insurance broker or immigration adviser. Third-party terms apply. Information can change."
              : "Canada Business Launchpad为独立原型，并非政府服务、律师事务所、会计师事务所、保险经纪或移民顾问。第三方条款适用，信息可能变化。"}
          </p>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 Canada Business Launchpad</span>
        <span>
          {locale === "en"
            ? "Demo data only · No real submissions"
            : "仅使用演示数据 · 不进行真实提交"}
        </span>
      </div>
    </footer>
  );
}

function useDemoState() {
  const [state, setState] = useState<DemoState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setState(demoRepository.read());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const commit = useCallback((next: DemoState) => setState(next), []);
  return { state, commit, hydrated };
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function HeroDashboard({ locale }: { locale: Locale }) {
  return (
    <div
      className="hero-dashboard"
      aria-label={locale === "en" ? "Workspace preview" : "工作台预览"}
    >
      <div className="preview-window-bar">
        <div className="preview-dots">
          <span />
          <span />
          <span />
        </div>
        <span className="preview-address">launchpad.demo / workspace</span>
        <span className="verified-pill">
          <Icon name="shield" size={12} />{" "}
          {locale === "en" ? "Source verified" : "来源已核验"}
        </span>
      </div>
      <div className="preview-body">
        <aside className="preview-sidebar">
          <div className="preview-logo">CB</div>
          {["chart", "route", "file", "calendar", "users"].map(
            (name, index) => (
              <span className={index === 0 ? "selected" : ""} key={name}>
                <Icon name={name as "chart"} size={17} />
              </span>
            ),
          )}
        </aside>
        <div className="preview-main">
          <div className="preview-greeting">
            <div>
              <small>
                {locale === "en" ? "GOOD MORNING, ALEX" : "早上好，ALEX"}
              </small>
              <h3>{locale === "en" ? "Your launch plan" : "您的创业计划"}</h3>
            </div>
            <div className="progress-ring">
              <b>42%</b>
            </div>
          </div>
          <div className="preview-next">
            <span className="step-kicker">
              {locale === "en" ? "NEXT BEST ACTION" : "下一最佳行动"}
            </span>
            <div className="preview-next-row">
              <span className="task-icon">
                <Icon name="building" />
              </span>
              <div>
                <b>
                  {locale === "en"
                    ? "Register your Ontario business"
                    : "注册您的安省企业"}
                </b>
                <small>
                  {locale === "en"
                    ? "Materials: 4 of 5 ready"
                    : "材料：已准备4/5"}
                </small>
              </div>
              <span className="round-arrow">
                <Icon name="arrow" size={16} />
              </span>
            </div>
            <div className="mini-progress">
              <span style={{ width: "80%" }} />
            </div>
          </div>
          <div className="preview-cards">
            <div>
              <span>
                <Icon name="check" size={14} />
              </span>
              <b>3</b>
              <small>{locale === "en" ? "User-marked" : "用户自报"}</small>
            </div>
            <div>
              <span>
                <Icon name="clock" size={14} />
              </span>
              <b>5</b>
              <small>{locale === "en" ? "In progress" : "进行中"}</small>
            </div>
            <div>
              <span>
                <Icon name="calendar" size={14} />
              </span>
              <b>2</b>
              <small>{locale === "en" ? "Upcoming" : "即将到期"}</small>
            </div>
          </div>
          <div className="preview-list">
            <div>
              <span className="list-dot done" />
              <span>
                {locale === "en" ? "Choose business structure" : "选择企业结构"}
              </span>
              <em>{locale === "en" ? "Done" : "完成"}</em>
            </div>
            <div>
              <span className="list-dot active" />
              <span>
                {locale === "en" ? "Ontario registration" : "安省企业注册"}
              </span>
              <em>{locale === "en" ? "Next" : "下一步"}</em>
            </div>
            <div>
              <span className="list-dot" />
              <span>
                {locale === "en" ? "CRA program accounts" : "CRA项目账户"}
              </span>
              <em>{locale === "en" ? "Locked" : "待解锁"}</em>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage({ locale }: { locale: Locale }) {
  const features = [
    [
      "route",
      bi("A plan that adapts", "动态适配的计划"),
      bi(
        "Answer a few practical questions. See only the Ontario tasks that match your stage, structure and activities.",
        "回答少量实际问题，仅查看与您的阶段、结构和经营活动相符的安省任务。",
      ),
    ],
    [
      "file",
      bi("Ready before you leave", "跳转前准备就绪"),
      bi(
        "Check materials, costs, timing and prerequisites before opening an official or third-party service.",
        "进入官方或第三方网站前，先核对材料、费用、时间和前置条件。",
      ),
    ],
    [
      "shield",
      bi("Evidence you can trust", "可核验的依据"),
      bi(
        "Every rule-led task links to an authoritative source and shows when it was last verified.",
        "每项规则任务均关联权威来源，并显示最近核验日期。",
      ),
    ],
    [
      "calendar",
      bi("Stay ready after launch", "启动后持续跟进"),
      bi(
        "Keep corporate, tax, payroll and renewal reminders distinct in one practical view.",
        "在统一视图中分别跟踪公司、税务、Payroll及续期提醒。",
      ),
    ],
  ] as const;
  return (
    <main>
      <section className="hero">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="shell hero-grid">
          <div className="hero-copy">
            <DemoBadge locale={locale} compact />
            <h1>
              {locale === "en" ? (
                <>
                  Know what applies.
                  <br />
                  <span>Finish what’s next.</span>
                </>
              ) : (
                <>
                  知道什么适用。
                  <br />
                  <span>完成关键下一步。</span>
                </>
              )}
            </h1>
            <p>
              {locale === "en"
                ? "A guided workspace that turns Ontario business requirements into a clear, source-backed plan—from first decision to ongoing compliance."
                : "将安省创业要求转化为清晰、可核验的行动计划——从首次决策到持续合规，都在一个引导式工作台中管理。"}
            </p>
            <div className="hero-actions">
              <AppLink
                locale={locale}
                href="/assessment"
                className="btn btn-primary btn-lg"
              >
                {copy.cta[locale]} <Icon name="arrow" />
              </AppLink>
              <AppLink
                locale={locale}
                href="/demo"
                className="btn btn-ghost btn-lg"
              >
                <span className="play">▶</span>
                {locale === "en" ? "Explore demo journeys" : "查看演示旅程"}
              </AppLink>
            </div>
            <div className="trust-row">
              <span>
                <Icon name="check" size={16} />
                {locale === "en" ? "No account needed" : "无需注册账户"}
              </span>
              <span>
                <Icon name="check" size={16} />
                {locale === "en" ? "No sensitive data" : "不收集敏感数据"}
              </span>
              <span>
                <Icon name="check" size={16} />
                {locale === "en" ? "Official links first" : "官方入口优先"}
              </span>
            </div>
          </div>
          <HeroDashboard locale={locale} />
        </div>
        <div className="shell hero-stats">
          <Stat
            value="30+"
            label={locale === "en" ? "Mapped launch tasks" : "已梳理创业任务"}
          />
          <Stat
            value={String(sources.length)}
            label={locale === "en" ? "Authoritative sources" : "权威信息来源"}
          />
          <Stat
            value="6"
            label={locale === "en" ? "Demo journeys" : "演示用户旅程"}
          />
          <Stat value="2" label={locale === "en" ? "Languages" : "支持语言"} />
        </div>
      </section>

      <section className="section light-section">
        <div className="shell">
          <div className="section-heading centered">
            <span className="eyebrow">
              {locale === "en"
                ? "FROM UNCERTAINTY TO ACTION"
                : "从不确定到行动"}
            </span>
            <h2>
              {locale === "en"
                ? "One clear path across a fragmented journey"
                : "在分散流程中建立一条清晰路径"}
            </h2>
            <p>
              {locale === "en"
                ? "Launchpad does not replace government services. It prepares you, sends you to the right place, and keeps the journey moving."
                : "Launchpad不会取代政府服务。它帮助您准备、前往正确入口，并持续推动流程。"}
            </p>
          </div>
          <div className="process-row">
            {[
              [
                "01",
                locale === "en" ? "Tell us about the business" : "说明企业情况",
                "users",
              ],
              [
                "02",
                locale === "en" ? "See what applies" : "判断适用事项",
                "route",
              ],
              [
                "03",
                locale === "en" ? "Prepare materials" : "准备所需材料",
                "file",
              ],
              [
                "04",
                locale === "en" ? "Continue externally" : "前往外部办理",
                "external",
              ],
              [
                "05",
                locale === "en" ? "Track proof & deadlines" : "跟踪凭证与期限",
                "calendar",
              ],
            ].map(([number, label, icon], index) => (
              <div className="process-step" key={number}>
                <span className="process-number">{number}</span>
                <span className="process-icon">
                  <Icon name={icon as "route"} />
                </span>
                <b>{label}</b>
                {index < 4 && (
                  <i>
                    <Icon name="chevron" />
                  </i>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">
                {locale === "en" ? "BUILT FOR COMPLETION" : "为完成而设计"}
              </span>
              <h2>
                {locale === "en"
                  ? "More than a directory of links"
                  : "不只是链接目录"}
              </h2>
            </div>
            <p>
              {locale === "en"
                ? "Every feature helps remove a real blocker between deciding to start and completing the next verifiable milestone."
                : "每项功能都用于消除从决定创业到完成下一个可验证里程碑之间的实际障碍。"}
            </p>
          </div>
          <div className="feature-grid">
            {features.map(([icon, title, description], index) => (
              <article
                className={`feature-card feature-${index + 1}`}
                key={title.en}
              >
                <span className="feature-icon">
                  <Icon name={icon} />
                </span>
                <h3>{l(title, locale)}</h3>
                <p>{l(description, locale)}</p>
                <span className="feature-link">
                  {locale === "en" ? "See it in the demo" : "在演示中查看"}
                  <Icon name="arrow" size={16} />
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section scenario-preview-section">
        <div className="shell">
          <div className="section-heading centered inverse">
            <span className="eyebrow">
              {locale === "en" ? "MADE FOR REAL MILESTONES" : "聚焦真实里程碑"}
            </span>
            <h2>
              {locale === "en" ? "Start where you are" : "从您当前的阶段开始"}
            </h2>
            <p>
              {locale === "en"
                ? "Explore four common Ontario journeys—or see how the workspace safely handles an edge case."
                : "体验四类常见安省创业旅程，或查看工作台如何安全处理边界案例。"}
            </p>
          </div>
          <div className="home-scenario-grid">
            {scenarios.slice(0, 4).map((scenario) => (
              <article key={scenario.id} className="home-scenario-card">
                <span className={`scenario-accent ${scenario.accent}`}>
                  {scenario.number}
                </span>
                <small>{l(scenario.badge, locale)}</small>
                <h3>{l(scenario.title, locale)}</h3>
                <p>{l(scenario.descriptor, locale)}</p>
                <AppLink
                  locale={locale}
                  href={`/workspace/${scenario.id}`}
                  className="card-arrow"
                >
                  {locale === "en" ? "Open journey" : "打开旅程"}
                  <Icon name="arrow" size={16} />
                </AppLink>
              </article>
            ))}
          </div>
          <div className="scenario-section-action">
            <AppLink locale={locale} href="/demo" className="btn btn-light">
              {locale === "en" ? "View all six journeys" : "查看全部六条旅程"}
              <Icon name="arrow" size={17} />
            </AppLink>
          </div>
        </div>
      </section>

      <section className="section trust-section">
        <div className="shell trust-grid">
          <div className="trust-copy">
            <span className="eyebrow">
              {locale === "en" ? "TRUST BY DESIGN" : "以可信为设计原则"}
            </span>
            <h2>
              {locale === "en"
                ? "Guidance with its evidence attached"
                : "每项指引都附有依据"}
            </h2>
            <p>
              {locale === "en"
                ? "Rules change. Marketing claims get noisy. Launchpad shows who published the information, the jurisdiction it covers, and when we last checked it."
                : "规则会变化，营销信息也可能混杂。Launchpad明确显示发布机构、适用地区和最近核验时间。"}
            </p>
            <ul className="check-list">
              <li>
                <Icon name="check" />
                {locale === "en"
                  ? "Authoritative source on every rule-led task"
                  : "每项规则任务均附权威来源"}
              </li>
              <li>
                <Icon name="check" />
                {locale === "en"
                  ? "Official do-it-yourself route always visible"
                  : "官方自助入口始终可见"}
              </li>
              <li>
                <Icon name="check" />
                {locale === "en"
                  ? "Commercial relationships disclosed beside the action"
                  : "商业关系在操作入口旁披露"}
              </li>
              <li>
                <Icon name="check" />
                {locale === "en"
                  ? "Expert handoff when the facts exceed the rule set"
                  : "超出规则范围时转交专家"}
              </li>
            </ul>
            <AppLink
              locale={locale}
              href="/admin/sources"
              className="text-link"
            >
              {locale === "en" ? "Inspect the source ledger" : "查看来源台账"}
              <Icon name="arrow" size={16} />
            </AppLink>
          </div>
          <div className="source-card-stack">
            {sources.slice(2, 6).map((source, index) => (
              <div
                className="source-proof-card"
                key={source.id}
                style={{ transform: `translateY(${index * 2}px)` }}
              >
                <span className="source-logo">
                  <Icon name={index % 2 ? "building" : "shield"} />
                </span>
                <div>
                  <small>{source.authority}</small>
                  <b>{l(source.title, locale)}</b>
                  <span>
                    <span className="verified-dot" />
                    {locale === "en"
                      ? `Verified ${source.verified}`
                      : `核验于 ${source.verified}`}
                  </span>
                </div>
                <Icon name="external" size={17} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section final-cta-section">
        <div className="shell final-cta">
          <div>
            <DemoBadge locale={locale} compact />
            <h2>
              {locale === "en"
                ? "Your next step should be obvious."
                : "让下一步清晰可见。"}
            </h2>
            <p>
              {locale === "en"
                ? "Build an Ontario launch plan in under five minutes. No account. No sensitive information."
                : "不到五分钟生成安省创业计划。无需账户，不提供敏感信息。"}
            </p>
          </div>
          <AppLink
            locale={locale}
            href="/assessment"
            className="btn btn-gold btn-lg"
          >
            {copy.cta[locale]}
            <Icon name="arrow" />
          </AppLink>
        </div>
      </section>
    </main>
  );
}

function AppShell({
  locale,
  active,
  currentPath,
  children,
}: {
  locale: Locale;
  active: string;
  currentPath: string[];
  children: React.ReactNode;
}) {
  return (
    <>
      <Header locale={locale} active={active} currentPath={currentPath} />
      {children}
      <Footer locale={locale} />
    </>
  );
}

function ProductPage({ locale }: { locale: Locale }) {
  const modules = [
    [
      "01",
      "route",
      bi("Guided assessment", "引导式问诊"),
      bi(
        "Practical questions produce a deterministic Ontario route—not an AI guess.",
        "通过实际问题生成确定性的安省路线，而非由AI猜测。",
      ),
    ],
    [
      "02",
      "chart",
      bi("Personal task graph", "个性化任务图"),
      bi(
        "See dependencies, applicability, progress, risk and the next best action.",
        "查看依赖、适用性、进度、风险及下一最佳行动。",
      ),
    ],
    [
      "03",
      "file",
      bi("Readiness & evidence", "就绪与凭证"),
      bi(
        "Prepare first, then record a safe reference after completing the external step.",
        "先做好准备，再在外部完成后记录安全的参考信息。",
      ),
    ],
    [
      "04",
      "calendar",
      bi("Compliance calendar", "合规日历"),
      bi(
        "Keep registry, tax, payroll and renewals distinct, visible and sourced.",
        "清晰区分并显示注册处、税务、Payroll及续期事项。",
      ),
    ],
    [
      "05",
      "users",
      bi("Transparent handoff", "透明转介"),
      bi(
        "Compare official and commercial routes with labels, consent and disclosures.",
        "通过明确标签、同意和披露比较官方及商业路径。",
      ),
    ],
    [
      "06",
      "spark",
      bi("Source-backed explanation", "基于来源的解释"),
      bi(
        "AI-style assistance explains approved content and stops when expert review is needed.",
        "AI式助手解释已审核内容，并在需要专家审查时停止。",
      ),
    ],
  ] as const;
  const boundaries = [
    [
      bi("Clickable now", "当前可点击"),
      bi(
        "Assessment, task graph, readiness lists, sources, progress, calendar and provider comparison.",
        "问诊、任务图、就绪清单、来源、进度、日历及服务商比较。",
      ),
      "now",
    ],
    [
      bi("Simulated in the demo", "在演示中模拟"),
      bi(
        "Authentication, uploads, external status, email reminders, AI replies and referral receipt.",
        "登录、上传、外部状态、邮件提醒、AI回答及转介接收。",
      ),
      "sim",
    ],
    [
      bi("Requires an agreement", "需要合作协议"),
      bi(
        "Tracking, compensation, provider logos, live quotes, customer-data sharing and SLAs.",
        "归因追踪、佣金、服务商Logo、实时报价、客户数据共享及SLA。",
      ),
      "agree",
    ],
    [
      bi("Not in this MVP", "不在本MVP范围"),
      bi(
        "Government submissions, live status sync, payments, KYC/KYB or personalized professional advice.",
        "政府提交、实时状态同步、支付、KYC/KYB及个性化专业意见。",
      ),
      "out",
    ],
  ] as const;
  return (
    <main>
      <section className="page-hero navy">
        <div className="shell narrow">
          <DemoBadge locale={locale} compact />
          <span className="eyebrow">
            {locale === "en" ? "PRODUCT OVERVIEW" : "产品概览"}
          </span>
          <h1>
            {locale === "en"
              ? "A practical operating layer above fragmented services"
              : "连接分散服务的实用运营层"}
          </h1>
          <p>
            {locale === "en"
              ? "Launchpad decides what to show, prepares the user for action, and keeps evidence and deadlines together. Official services still complete official work."
              : "Launchpad负责判断、准备、跟踪凭证和期限；正式办理仍由官方服务完成。"}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <div className="section-heading centered">
            <span className="eyebrow">
              {locale === "en" ? "THE OPERATING MODEL" : "运营模型"}
            </span>
            <h2>
              {locale === "en"
                ? "Designed around completion, not clicks"
                : "围绕完成，而非点击设计"}
            </h2>
          </div>
          <div className="module-grid">
            {modules.map(([n, icon, title, text]) => (
              <article key={n} className="module-card">
                <span className="module-num">{n}</span>
                <span className="feature-icon">
                  <Icon name={icon} />
                </span>
                <h3>{l(title, locale)}</h3>
                <p>{l(text, locale)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section muted">
        <div className="shell">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">
                {locale === "en" ? "MVP BOUNDARY" : "MVP边界"}
              </span>
              <h2>
                {locale === "en"
                  ? "Clear about what is real"
                  : "清晰说明实现状态"}
              </h2>
            </div>
            <p>
              {locale === "en"
                ? "Every capability is labelled so an external audience can distinguish working demo behaviour from future integrations."
                : "所有能力均明确标注，帮助外部受众区分可用演示和未来集成。"}
            </p>
          </div>
          <div className="boundary-grid">
            {boundaries.map(([title, text, type]) => (
              <article key={type} className={`boundary-card ${type}`}>
                <span className="boundary-state">
                  <Icon
                    name={
                      type === "now" ? "check" : type === "out" ? "x" : "clock"
                    }
                  />
                  {l(title, locale)}
                </span>
                <p>{l(text, locale)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell compare-grid">
          <div>
            <span className="eyebrow">
              {locale === "en" ? "OUR ROLE" : "我们的角色"}
            </span>
            <h2>
              {locale === "en"
                ? "Orchestration—not another government portal"
                : "流程编排，而非另一个政府门户"}
            </h2>
            <p>
              {locale === "en"
                ? "Ontario Business Account and other official services own government transactions. Launchpad makes the cross-system journey understandable and trackable."
                : "Ontario Business Account及其他官方服务负责政府交易；Launchpad让跨系统流程易于理解和跟踪。"}
            </p>
          </div>
          <div className="compare-panel">
            <div className="compare-head">
              <span>{locale === "en" ? "Official services" : "官方服务"}</span>
              <span>Launchpad</span>
            </div>
            {[
              ["Submit official transactions", "Prepare & sequence"],
              ["Manage government accounts", "Track cross-system progress"],
              ["Provide authoritative rules", "Explain rules with sources"],
              [
                "Issue receipts and decisions",
                "Record safe completion evidence",
              ],
            ].map((row) => (
              <div className="compare-row" key={row[0]}>
                <span>
                  {locale === "en"
                    ? row[0]
                    : (
                        {
                          "Submit official transactions": "提交官方交易",
                          "Manage government accounts": "管理政府账户",
                          "Provide authoritative rules": "发布权威规则",
                          "Issue receipts and decisions": "签发回执和决定",
                        } as Record<string, string>
                      )[row[0]]}
                </span>
                <Icon name="arrow" />
                <strong>
                  {locale === "en"
                    ? row[1]
                    : (
                        {
                          "Prepare & sequence": "准备与排序",
                          "Track cross-system progress": "跟踪跨系统进度",
                          "Explain rules with sources": "附来源解释规则",
                          "Record safe completion evidence":
                            "记录安全的完成凭证",
                        } as Record<string, string>
                      )[row[1]]}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section final-cta-section">
        <div className="shell final-cta">
          <div>
            <h2>
              {locale === "en"
                ? "See the product through a real journey."
                : "通过真实旅程体验产品。"}
            </h2>
            <p>
              {locale === "en"
                ? "Choose a benchmark scenario or build a plan from your own answers."
                : "选择基准画像，或根据您的回答生成计划。"}
            </p>
          </div>
          <AppLink locale={locale} href="/demo" className="btn btn-gold btn-lg">
            {locale === "en" ? "Open the guided demo" : "打开引导演示"}
            <Icon name="arrow" />
          </AppLink>
        </div>
      </section>
    </main>
  );
}

function ScenarioCard({
  scenario,
  locale,
  onChoose,
}: {
  scenario: DemoScenario;
  locale: Locale;
  onChoose: (id: string) => void;
}) {
  return (
    <article className={`scenario-card ${scenario.boundary ? "boundary" : ""}`}>
      <div className="scenario-card-top">
        <span className={`scenario-accent ${scenario.accent}`}>
          {scenario.number}
        </span>
        <span
          className={`kind-pill ${scenario.boundary ? "needs_expert" : "mandatory"}`}
        >
          {l(scenario.badge, locale)}
        </span>
      </div>
      <h3>{l(scenario.title, locale)}</h3>
      <p className="scenario-descriptor">{l(scenario.descriptor, locale)}</p>
      <p>{l(scenario.outcome, locale)}</p>
      <div className="scenario-meta">
        <span>
          <Icon name="route" size={15} />
          {scenario.tasks.length}{" "}
          {locale === "en" ? "mapped tasks" : "项已梳理任务"}
        </span>
        <span>
          <Icon name="clock" size={15} />
          {scenario.boundary
            ? locale === "en"
              ? "Expert stop"
              : "专家节点"
            : locale === "en"
              ? "6–8 min demo"
              : "6–8分钟演示"}
        </span>
      </div>
      <AppLink
        locale={locale}
        href={`/workspace/${scenario.id}`}
        className="btn btn-outline full"
        onClick={() => onChoose(scenario.id)}
      >
        {locale === "en" ? "Launch this journey" : "启动此旅程"}
        <Icon name="arrow" size={17} />
      </AppLink>
    </article>
  );
}

function DemoPage({
  locale,
  state,
  commit,
}: {
  locale: Locale;
  state: DemoState;
  commit: (state: DemoState) => void;
}) {
  const choose = (id: string) =>
    commit(demoRepository.chooseScenario(state, id));
  return (
    <main>
      <section className="page-hero compact">
        <div className="shell">
          <DemoBadge locale={locale} compact />
          <span className="eyebrow">
            {locale === "en" ? "GUIDED PRODUCT DEMO" : "产品引导演示"}
          </span>
          <h1>
            {locale === "en" ? "Choose a business journey" : "选择一条创业旅程"}
          </h1>
          <p>
            {locale === "en"
              ? "Each journey uses demo data to show how the same workspace adapts to a different milestone. No account or sensitive information is required."
              : "每条旅程均使用演示数据，展示同一工作台如何适应不同里程碑。无需账户或敏感信息。"}
          </p>
        </div>
      </section>
      <section className="section demo-list-section">
        <div className="shell">
          <div className="demo-section-label">
            <span>
              {locale === "en" ? "Four benchmark journeys" : "四条基准旅程"}
            </span>
            <i>{locale === "en" ? "Fully mapped" : "完整梳理"}</i>
          </div>
          <div className="scenario-grid">
            {scenarios.slice(0, 4).map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                locale={locale}
                onChoose={choose}
              />
            ))}
          </div>
          <div className="demo-section-label boundary-label">
            <span>
              {locale === "en" ? "Two boundary journeys" : "两条边界旅程"}
            </span>
            <i>{locale === "en" ? "Safe expert handoff" : "安全专家接力"}</i>
          </div>
          <div className="scenario-grid two">
            {scenarios.slice(4).map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                locale={locale}
                onChoose={choose}
              />
            ))}
          </div>
          <div className="custom-plan-banner">
            <div>
              <span className="feature-icon">
                <Icon name="spark" />
              </span>
              <div>
                <h3>
                  {locale === "en"
                    ? "Prefer your own answers?"
                    : "希望使用自己的情况？"}
                </h3>
                <p>
                  {locale === "en"
                    ? "Complete the short assessment to create a matched demo plan."
                    : "完成简短问诊，生成匹配的演示计划。"}
                </p>
              </div>
            </div>
            <AppLink
              locale={locale}
              href="/assessment"
              className="btn btn-primary"
            >
              {locale === "en" ? "Start assessment" : "开始问诊"}
              <Icon name="arrow" size={17} />
            </AppLink>
          </div>
        </div>
      </section>
    </main>
  );
}

type AssessmentQuestion = {
  id: string;
  label: LocalizedText;
  hint: LocalizedText;
  options: Array<{ value: string | boolean; label: LocalizedText }>;
  show?: (answers: Record<string, string | boolean>) => boolean;
};

const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: "stage",
    label: { en: "Where are you today?", zh: "您目前处于哪个阶段？" },
    hint: {
      en: "This sets the starting point for your plan.",
      zh: "这将决定计划的起点。",
    },
    options: [
      { value: "planning", label: { en: "Planning", zh: "筹备中" } },
      {
        value: "registered",
        label: { en: "Registered, not operating", zh: "已注册，尚未经营" },
      },
      {
        value: "operating",
        label: { en: "Already operating", zh: "已开始经营" },
      },
    ],
  },
  {
    id: "registrationStatus",
    label: {
      en: "Has the operating business been registered in Ontario?",
      zh: "正在经营的企业是否已在安省完成注册？",
    },
    hint: {
      en: "Operating activity does not prove registration. Choose not sure if no Ontario BIN or registry record is available.",
      zh: "已经经营并不等于已经注册。如无法确认Ontario BIN或注册记录，请选择不确定。",
    },
    options: [
      {
        value: "registered",
        label: { en: "Registered and recorded", zh: "已注册并有记录" },
      },
      {
        value: "not_registered",
        label: { en: "Not registered", zh: "尚未注册" },
      },
      { value: "unsure", label: { en: "Not sure", zh: "不确定" } },
    ],
    show: (a) => a.stage === "operating",
  },
  {
    id: "city",
    label: { en: "Where will the business operate?", zh: "企业将在哪里经营？" },
    hint: {
      en: "The pilot provides a deeper municipal example for Toronto.",
      zh: "本试点为多伦多提供更深入的市级示例。",
    },
    options: [
      { value: "Toronto", label: { en: "Toronto", zh: "多伦多" } },
      {
        value: "Ontario",
        label: { en: "Elsewhere in Ontario", zh: "安省其他地区" },
      },
    ],
  },
  {
    id: "industry",
    label: {
      en: "What best describes the activity?",
      zh: "哪一项最能描述经营活动？",
    },
    hint: {
      en: "Regulated sectors stop at an expert-review boundary.",
      zh: "受监管行业将在专家审查边界停止。",
    },
    options: [
      {
        value: "services",
        label: { en: "Professional or digital services", zh: "专业或数字服务" },
      },
      {
        value: "ecommerce",
        label: { en: "E-commerce or product sales", zh: "电商或产品销售" },
      },
      {
        value: "regulated",
        label: {
          en: "Regulated or premises-heavy activity",
          zh: "受监管或重场所行业",
        },
      },
    ],
  },
  {
    id: "structure",
    label: {
      en: "Which structure are you considering?",
      zh: "您考虑哪种企业结构？",
    },
    hint: {
      en: "This is planning guidance, not a legal recommendation.",
      zh: "这属于规划指引，并非法律建议。",
    },
    options: [
      {
        value: "sole_prop",
        label: { en: "Sole proprietorship", zh: "个体经营" },
      },
      {
        value: "corporation",
        label: { en: "Ontario corporation", zh: "安省公司" },
      },
      { value: "undecided", label: { en: "Not decided", zh: "尚未决定" } },
    ],
  },
  {
    id: "businessNameUse",
    label: {
      en: "How will the sole proprietorship present its name?",
      zh: "个体经营将使用什么名称对外经营？",
    },
    hint: {
      en: "Using only your own legal name can change whether Ontario business-name registration is required.",
      zh: "仅使用本人法定姓名时，安省商业名称注册要求可能不同。",
    },
    options: [
      {
        value: "legal_name",
        label: { en: "Only my legal name", zh: "仅使用本人法定姓名" },
      },
      {
        value: "trade_name",
        label: { en: "A different business name", zh: "使用其他商业名称" },
      },
      { value: "unsure", label: { en: "Not sure", zh: "不确定" } },
    ],
    show: (a) => a.structure === "sole_prop",
  },
  {
    id: "revenue",
    label: {
      en: "Approximate GST/HST-relevant taxable worldwide supplies?",
      zh: "与GST/HST相关的全球应税供应额大致处于哪个区间？",
    },
    hint: {
      en: "Planning signal only. CRA tests can use one quarter or four consecutive calendar quarters; this band never decides registration by itself.",
      zh: "仅用于规划。CRA测试可能按单一季度或连续四个日历季度判断；该区间本身不会直接决定注册义务。",
    },
    options: [
      {
        value: "under_30k",
        label: { en: "Under CAD 30,000", zh: "低于CAD 30,000" },
      },
      {
        value: "near_30k",
        label: { en: "Near CAD 30,000", zh: "接近CAD 30,000" },
      },
      {
        value: "over_30k",
        label: { en: "Over CAD 30,000", zh: "高于CAD 30,000" },
      },
    ],
  },
  {
    id: "gstRegistered",
    label: {
      en: "Is the business already registered for GST/HST?",
      zh: "企业是否已经注册GST/HST？",
    },
    hint: {
      en: "Only a confirmed registration makes the return task required in this demo; otherwise the workspace keeps it conditional.",
      zh: "本演示仅在确认已注册时将申报任务列为必需；其他情况均保留为条件任务。",
    },
    options: [
      { value: "yes", label: { en: "Yes", zh: "是" } },
      { value: "no", label: { en: "No", zh: "否" } },
      { value: "unsure", label: { en: "Not sure", zh: "不确定" } },
    ],
    show: (a) =>
      a.stage !== "planning" ||
      a.revenue === "near_30k" ||
      a.revenue === "over_30k",
  },
  {
    id: "employees",
    label: { en: "What is the hiring situation?", zh: "目前的招聘情况？" },
    hint: {
      en: "Hiring can trigger payroll, WSIB and workplace tasks.",
      zh: "招聘可能触发Payroll、WSIB及工作场所任务。",
    },
    options: [
      {
        value: "none",
        label: { en: "No employees planned", zh: "暂无员工计划" },
      },
      {
        value: "hiring",
        label: { en: "Preparing the first hire", zh: "准备招聘首位员工" },
      },
      {
        value: "existing",
        label: { en: "Already have employees", zh: "已有员工" },
      },
    ],
  },
  {
    id: "hasOntarioFacilityOffice",
    label: {
      en: "Will the sole proprietorship have an Ontario office or facility?",
      zh: "该个体经营是否会在安省设有办公室或经营设施？",
    },
    hint: {
      en: "Employees, facilities or offices in Ontario can make Ontario registration required even when a legal name is used.",
      zh: "即使仅使用法定姓名，在安省有员工、设施或办公室也可能必须注册。",
    },
    options: [
      { value: "yes", label: { en: "Yes", zh: "是" } },
      { value: "no", label: { en: "No", zh: "否" } },
      { value: "unsure", label: { en: "Not sure", zh: "不确定" } },
    ],
    show: (a) => a.structure === "sole_prop" && a.employees === "none",
  },
  {
    id: "imports",
    label: {
      en: "Will you import commercial goods?",
      zh: "是否进口商业货物？",
    },
    hint: {
      en: "Commercial importing can require CARM and an import-export account.",
      zh: "商业进口可能需要CARM及进出口账户。",
    },
    options: [
      { value: true, label: { en: "Yes or likely", zh: "是或可能" } },
      { value: false, label: { en: "No", zh: "否" } },
    ],
  },
  {
    id: "crossProvince",
    label: {
      en: "Is there complex extra-provincial activity?",
      zh: "是否存在复杂跨省经营？",
    },
    hint: {
      en: "The Ontario pilot routes complex cases to review.",
      zh: "安省试点会将复杂案例转交审查。",
    },
    options: [
      { value: true, label: { en: "Yes or unsure", zh: "是或不确定" } },
      { value: false, label: { en: "No", zh: "否" } },
    ],
  },
  {
    id: "complexResidency",
    label: {
      en: "Do all directors or controlling owners appear to be outside Canada?",
      zh: "全部董事或控制人是否可能位于加拿大境外？",
    },
    hint: {
      en: "Residency is a rule variable—not the target market. Do not enter names or ID details.",
      zh: "居住地是规则变量，而非目标市场。请勿输入姓名或证件信息。",
    },
    options: [
      { value: true, label: { en: "Yes or unsure", zh: "是或不确定" } },
      { value: false, label: { en: "No", zh: "否" } },
    ],
    show: (a) => a.structure === "corporation" || a.structure === "undecided",
  },
];

const assessmentDefaults: Record<string, string | boolean> = {
  stage: "planning",
  registrationStatus: "unsure",
  city: "Toronto",
  industry: "services",
  structure: "sole_prop",
  businessNameUse: "unsure",
  revenue: "under_30k",
  gstRegistered: "unsure",
  employees: "none",
  hasOntarioFacilityOffice: "no",
  imports: false,
  crossProvince: false,
  complexResidency: false,
};

function assessmentAnswersForState(
  state: DemoState,
): Record<string, string | boolean> {
  if (Object.keys(state.assessmentAnswers).length > 0) {
    return { ...assessmentDefaults, ...state.assessmentAnswers };
  }
  const profile = (getScenario(state.activeScenarioId) ?? scenarios[0]).profile;
  return {
    ...assessmentDefaults,
    stage: profile.stage,
    registrationStatus:
      profile.stage === "planning" ? "unsure" : "registered",
    city: profile.city,
    industry: profile.industry,
    structure: profile.structure,
    revenue: profile.revenue,
    employees: profile.employees,
    hasOntarioFacilityOffice: "no",
    imports: profile.imports,
    crossProvince: profile.crossProvince,
    complexResidency: profile.complexResidency,
  };
}

function AssessmentPage({
  locale,
  state,
  hydrated,
  commit,
}: {
  locale: Locale;
  state: DemoState;
  hydrated: boolean;
  commit: (state: DemoState) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string | boolean>>(() =>
    assessmentAnswersForState(state),
  );
  const [restored, setRestored] = useState(false);
  const [interacted, setInteracted] = useState(false);
  useEffect(() => {
    if (!hydrated || restored) return;
    const frame = window.requestAnimationFrame(() => {
      if (!interacted) setAnswers(assessmentAnswersForState(state));
      setRestored(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hydrated, interacted, restored, state]);
  const visible = assessmentQuestions.filter((q) => !q.show || q.show(answers));
  const resultId = matchScenario(answers);
  const result = getScenario(resultId)!;
  const submit = () => {
    const next = demoRepository.saveAssessment(state, answers, resultId);
    commit(next);
    window.location.assign(route(locale, `/workspace/${resultId}`));
  };
  return (
    <main className="assessment-page">
      <section className="assessment-head">
        <div className="shell assessment-head-inner">
          <div>
            <DemoBadge locale={locale} compact />
            <h1>
              {locale === "en"
                ? "Build your Ontario launch plan"
                : "生成您的安省创业计划"}
            </h1>
            <p>
              {locale === "en"
                ? "Eight to twelve practical questions. No names, government IDs, account numbers or exact financial data."
                : "八至十二个实际问题。无需填写姓名、政府证件号、账户号或准确财务数据。"}
            </p>
          </div>
          <div className="assessment-progress">
            <span>{locale === "en" ? "Plan readiness" : "计划完成度"}</span>
            <b>100%</b>
            <div>
              <i style={{ width: "100%" }} />
            </div>
          </div>
        </div>
      </section>
      <section className="section assessment-body">
        <div className="shell assessment-layout">
          <div className="question-list">
            {visible.map((q, index) => (
              <fieldset className="question-card" key={q.id}>
                <legend>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <b>{l(q.label, locale)}</b>
                    <small>{l(q.hint, locale)}</small>
                  </div>
                </legend>
                <div
                  className="option-grid"
                  role="radiogroup"
                  aria-label={l(q.label, locale)}
                >
                  {q.options.map((opt) => {
                    const checked = answers[q.id] === opt.value;
                    return (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        className={`option-button ${checked ? "selected" : ""}`}
                        key={String(opt.value)}
                        onClick={() => {
                          setInteracted(true);
                          setAnswers((current) => ({
                            ...current,
                            [q.id]: opt.value,
                          }));
                        }}
                      >
                        <span>
                          {checked && <Icon name="check" size={15} />}
                        </span>
                        {l(opt.label, locale)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <aside className="assessment-summary">
            <span className="eyebrow">
              {locale === "en" ? "LIVE MATCH" : "实时匹配"}
            </span>
            <span className={`scenario-accent ${result.accent}`}>
              {result.number}
            </span>
            <h3>{l(result.title, locale)}</h3>
            <p>{l(result.descriptor, locale)}</p>
            <div className="summary-line">
              <span>{locale === "en" ? "Mapped tasks" : "已梳理任务"}</span>
              <b>{result.tasks.length}</b>
            </div>
            <div className="summary-line">
              <span>{locale === "en" ? "Expert review" : "专家审查"}</span>
              <b>
                {result.boundary
                  ? locale === "en"
                    ? "Required"
                    : "需要"
                  : locale === "en"
                    ? "Not flagged"
                    : "未触发"}
              </b>
            </div>
            <div className="privacy-note">
              <Icon name="lock" />
              <p>
                {locale === "en"
                  ? "Answers stay in this browser as demo data. Nothing is submitted to government or partners."
                  : "回答仅作为演示数据保存在此浏览器中，不会提交给政府或合作方。"}
              </p>
            </div>
            <button className="btn btn-primary full" onClick={submit}>
              {locale === "en" ? "Create matched plan" : "生成匹配计划"}
              <Icon name="arrow" />
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}

const statusLabels: Record<TaskStatus, LocalizedText> = {
  not_started: { en: "Not started", zh: "未开始" },
  in_progress: { en: "In progress", zh: "进行中" },
  external_pending: { en: "External pending", zh: "外部处理中" },
  done: {
    en: "User marked complete (unverified)",
    zh: "用户自报完成（未核验）",
  },
  not_applicable: { en: "Not applicable", zh: "不适用" },
  needs_expert: { en: "Expert review", zh: "专家审查" },
};
const kindLabels: Record<TaskKind, LocalizedText> = {
  mandatory: { en: "Required", zh: "必需" },
  conditional: { en: "Conditional", zh: "条件适用" },
  optional: { en: "Optional", zh: "可选" },
  not_applicable: { en: "Not applicable", zh: "不适用" },
  needs_expert: { en: "Expert review", zh: "专家审查" },
};

function WorkspaceNav({
  locale,
  scenarioId,
  active,
}: {
  locale: Locale;
  scenarioId: string;
  active: string;
}) {
  const items = [
    [
      "workspace",
      "chart",
      locale === "en" ? "Overview" : "总览",
      `/workspace/${scenarioId}`,
    ],
    [
      "plan",
      "route",
      locale === "en" ? "Launch plan" : "创业计划",
      `/workspace/${scenarioId}#plan`,
    ],
    [
      "evidence",
      "file",
      locale === "en" ? "Evidence" : "完成凭证",
      `/workspace/${scenarioId}#evidence`,
    ],
    [
      "calendar",
      "calendar",
      locale === "en" ? "Calendar" : "合规日历",
      "/calendar",
    ],
    [
      "providers",
      "users",
      locale === "en" ? "Providers" : "服务商",
      "/providers",
    ],
    [
      "assistant",
      "spark",
      locale === "en" ? "Ask Launchpad" : "询问助手",
      "/assistant",
    ],
  ];
  return (
    <aside className="workspace-nav">
      <div className="workspace-brand">
        <span className="brand-mark">
          <span>CB</span>
        </span>
        <div>
          <b>Launchpad</b>
          <small>{locale === "en" ? "Demo workspace" : "演示工作台"}</small>
        </div>
      </div>
      <nav>
        {items.map(([key, icon, label, href]) => (
          <AppLink
            locale={locale}
            href={href}
            className={active === key ? "active" : ""}
            key={key}
          >
            <Icon name={icon as "chart"} />
            <span>{label}</span>
          </AppLink>
        ))}
      </nav>
      <div className="workspace-demo-note">
        <Icon name="lock" />
        <b>{locale === "en" ? "Demo data only" : "仅演示数据"}</b>
        <span>
          {locale === "en" ? "Stored in this browser" : "保存在此浏览器"}
        </span>
      </div>
    </aside>
  );
}

function WorkspaceTopbar({
  locale,
  scenario,
  currentPath,
  onReset,
}: {
  locale: Locale;
  scenario: DemoScenario;
  currentPath: string[];
  onReset: () => void;
}) {
  return (
    <div className="workspace-topbar">
      <div>
        <small>{locale === "en" ? "ACTIVE JOURNEY" : "当前旅程"}</small>
        <b>{l(scenario.title, locale)}</b>
      </div>
      <div>
        <AppLink locale={locale} href="/demo" className="switch-link">
          {locale === "en" ? "Switch journey" : "切换旅程"}
        </AppLink>
        <button
          aria-label={locale === "en" ? "Reset demo data" : "重置演示数据"}
          className="icon-button"
          title={locale === "en" ? "Reset demo" : "重置演示"}
          onClick={onReset}
        >
          <Icon name="reset" size={18} />
        </button>
        <a
          className="language-link"
          href={route(
            locale === "en" ? "zh" : "en",
            `/${currentPath.join("/")}`,
          )}
        >
          <Icon name="globe" size={17} />
          {locale === "en" ? "中文" : "EN"}
        </a>
        <span className="avatar">AL</span>
      </div>
    </div>
  );
}

function statusFor(
  state: DemoState,
  scenario: DemoScenario,
  taskId: string,
  kind: TaskKind,
): TaskStatus {
  if (kind === "needs_expert") return "needs_expert";
  if (kind === "not_applicable") return "not_applicable";
  return state.taskStatus[`${scenario.id}:${taskId}`] ?? "not_started";
}

const workflowRiskLabels: Record<
  NonNullable<TaskDefinition["workflowRisk"]>,
  LocalizedText
> = {
  low: bi("Low workflow risk", "低流程风险"),
  medium: bi("Medium workflow risk", "中等流程风险"),
  high: bi("High if delayed", "延误风险较高"),
  expert: bi("Expert review", "专家审查"),
};

function dependenciesForScenario(
  task: TaskDefinition,
  scenario: DemoScenario,
) {
  return (task.dependsOn ?? [])
    .map((id) => ({ definition: getTask(id), instance: scenario.tasks.find((x) => x.id === id) }))
    .filter(
      (
        value,
      ): value is {
        definition: TaskDefinition;
        instance: { id: string; kind: TaskKind };
      } => Boolean(value.definition && value.instance),
    );
}

function taskIsBlocked(
  state: DemoState,
  scenario: DemoScenario,
  task: TaskDefinition,
) {
  return dependenciesForScenario(task, scenario).some(
    ({ instance }) =>
      instance.kind !== "not_applicable" &&
      statusFor(state, scenario, instance.id, instance.kind) !== "done",
  );
}

function resolveScenario(state: DemoState, requestedId?: string): DemoScenario {
  const id = requestedId ?? state.activeScenarioId;
  if (
    id === state.activeScenarioId &&
    Object.keys(state.assessmentAnswers).length > 0 &&
    matchScenario(state.assessmentAnswers) === id
  ) {
    return synthesizeAssessmentScenario(state.assessmentAnswers);
  }
  return getScenario(id) ?? scenarios[0];
}

const calendarTaskByEvent: Record<string, string> = {
  "cal-annual": "annual-return",
  "cal-isc": "isc-review",
  "cal-gst": "gst-return",
  "cal-payroll": "payroll-remittance",
  "cal-t2": "t2-return",
  "cal-t2-balance": "t2-balance",
  "cal-renew": "permit-scan",
};

function calendarForScenario(scenario: DemoScenario) {
  return calendarEvents.filter((event) =>
    scenario.tasks.some(
      (task) =>
        task.id === calendarTaskByEvent[event.id] &&
        task.kind !== "not_applicable",
    ),
  );
}

function WorkspacePage({
  locale,
  scenarioId,
  state,
  hydrated,
  commit,
}: {
  locale: Locale;
  scenarioId: string;
  state: DemoState;
  hydrated: boolean;
  commit: (state: DemoState) => void;
}) {
  const scenario = resolveScenario(state, scenarioId);
  useEffect(() => {
    if (!hydrated || state.activeScenarioId === scenario.id) return;
    const frame = window.requestAnimationFrame(() =>
      commit(demoRepository.chooseScenario(state, scenario.id)),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [commit, hydrated, scenario.id, state]);
  const entries = scenario.tasks
    .map((item) => ({ ...item, task: getTask(item.id)! }))
    .filter((x) => x.task);
  const scenarioEvents = calendarForScenario(scenario);
  const active = entries.filter(
    (x) => x.kind !== "optional" && x.kind !== "not_applicable",
  );
  const done = active.filter(
    (x) => statusFor(state, scenario, x.id, x.kind) === "done",
  ).length;
  const progress = Math.round((done / Math.max(active.length, 1)) * 100);
  const next =
    entries.find(
      (x) =>
        x.kind !== "not_applicable" &&
        !["done", "not_applicable"].includes(
          statusFor(state, scenario, x.id, x.kind),
        ) &&
        !taskIsBlocked(state, scenario, x.task),
    ) ??
    entries.find(
      (x) =>
        x.kind !== "not_applicable" &&
        !["done", "not_applicable"].includes(
          statusFor(state, scenario, x.id, x.kind),
        ),
    ) ??
    entries[0];
  const [filter, setFilter] = useState<"all" | TaskKind>("all");
  const visible =
    filter === "all" ? entries : entries.filter((x) => x.kind === filter);
  const reset = () => {
    if (
      window.confirm(
        locale === "en"
          ? "Reset all local demo progress?"
          : "重置全部本地演示进度？",
      )
    ) {
      commit(demoRepository.reset());
      window.location.href = route(locale, "/demo");
    }
  };
  return (
    <div className="workspace-layout">
      <WorkspaceNav
        locale={locale}
        scenarioId={scenario.id}
        active="workspace"
      />
      <div className="workspace-content">
        <WorkspaceTopbar locale={locale} scenario={scenario} currentPath={["workspace", scenario.id]} onReset={reset} />
        <main className="workspace-main">
          <div className="workspace-welcome">
            <div>
              <span className="eyebrow">
                {locale === "en"
                  ? "YOUR ONTARIO LAUNCH WORKSPACE"
                  : "您的安省创业工作台"}
              </span>
              <h1>
                {locale === "en" ? "Good morning, Alex." : "早上好，Alex。"}
              </h1>
              <p>{l(scenario.outcome, locale)}</p>
            </div>
            <DemoBadge locale={locale} compact />
          </div>
          {scenario.boundary && (
            <div className="expert-banner">
              <Icon name="alert" />
              <div>
                <b>
                  {locale === "en"
                    ? "This journey includes an expert-review boundary"
                    : "此旅程包含专家审查边界"}
                </b>
                <p>
                  {locale === "en"
                    ? "The demo intentionally stops before giving a definitive legal, tax, licensing or residency conclusion."
                    : "演示会在给出确定性法律、税务、许可或居住地结论前停止。"}
                </p>
              </div>
              <AppLink
                locale={locale}
                href="/support#expert"
                className="btn btn-outline btn-sm"
              >
                {locale === "en" ? "Prepare handoff" : "准备转交"}
              </AppLink>
            </div>
          )}
          <section className="workspace-summary-grid">
            <article className="progress-card">
              <div className="card-title">
                <span>
                  <Icon name="chart" />{" "}
                  {locale === "en" ? "Overall progress" : "整体进度"}
                </span>
                <b>{progress}%</b>
              </div>
              <div className="large-progress">
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-meta">
                <span>
                  <i className="dot done" />
                  {done} {locale === "en" ? "user-marked" : "用户自报完成"}
                </span>
                <span>
                  <i className="dot active" />
                  {active.length - done}{" "}
                  {locale === "en" ? "remaining" : "待处理"}
                </span>
              </div>
            </article>
            <article className="metric-card">
              <span className="metric-icon blue">
                <Icon name="route" />
              </span>
              <div>
                <small>{locale === "en" ? "Mapped tasks" : "已梳理任务"}</small>
                <b>{entries.length}</b>
                <span>
                  {active.length}{" "}
                  {locale === "en"
                    ? "active obligations or reviews"
                    : "项当前义务或复核"}
                </span>
              </div>
            </article>
            <article className="metric-card">
              <span className="metric-icon gold">
                <Icon name="calendar" />
              </span>
              <div>
                <small>{locale === "en" ? "Upcoming dates" : "即将到期"}</small>
                <b>{scenarioEvents.length}</b>
                <span>
                  {locale === "en" ? "Illustrative reminders" : "示例提醒"}
                </span>
              </div>
            </article>
            <article className="metric-card">
              <span className="metric-icon teal">
                <Icon name="shield" />
              </span>
              <div>
                <small>
                  {locale === "en" ? "Sources checked" : "来源已核验"}
                </small>
                <b>{new Set(entries.flatMap((x) => x.task.sourceIds)).size}</b>
                <span>
                  {locale === "en" ? "Last review 04 Sep" : "最近复核 9月4日"}
                </span>
              </div>
            </article>
          </section>
          {next && (
            <section className="next-action-card">
              <div className="next-action-top">
                <span className="step-kicker">
                  {locale === "en" ? "NEXT BEST ACTION" : "下一最佳行动"}
                </span>
                <span className={`kind-pill ${next.kind}`}>
                  {l(kindLabels[next.kind], locale)}
                </span>
              </div>
              <div className="next-action-body">
                <span className="next-task-icon">
                  <Icon
                    name={next.kind === "needs_expert" ? "alert" : "building"}
                  />
                </span>
                <div>
                  <small>
                    {locale === "en"
                      ? `STEP ${next.task.number} OF YOUR PLAN`
                      : `计划第 ${next.task.number} 步`}
                  </small>
                  <h2>{l(next.task.title, locale)}</h2>
                  <p>{l(next.task.summary, locale)}</p>
                  <div className="next-detail-row">
                    <span>
                      <Icon name="file" size={16} />
                      {next.task.materials?.length ?? 3}{" "}
                      {locale === "en" ? "materials to review" : "项材料需核对"}
                    </span>
                    <span>
                      <Icon name="clock" size={16} />
                      {next.task.timing
                        ? l(next.task.timing, locale)
                        : locale === "en"
                          ? "Review when ready"
                          : "准备后查看"}
                    </span>
                  </div>
                </div>
                <AppLink
                  locale={locale}
                  href={`/tasks/${next.id}`}
                  className="btn btn-primary"
                >
                  {next.kind === "needs_expert"
                    ? locale === "en"
                      ? "Review boundary"
                      : "查看边界"
                    : locale === "en"
                      ? "Open task"
                      : "打开任务"}
                  <Icon name="arrow" size={17} />
                </AppLink>
              </div>
            </section>
          )}
          <section className="task-section" id="plan">
            <div className="task-section-head">
              <div>
                <h2>{locale === "en" ? "Your launch plan" : "您的创业计划"}</h2>
                <p>
                  {locale === "en"
                    ? "Ordered by dependency and current milestone"
                    : "按依赖关系和当前里程碑排序"}
                </p>
              </div>
              <div className="filter-tabs">
                {(
                  [
                    "all",
                    "mandatory",
                    "conditional",
                    "optional",
                    "not_applicable",
                    "needs_expert",
                  ] as const
                ).map((key) => (
                  <button
                    className={filter === key ? "active" : ""}
                    key={key}
                    onClick={() => setFilter(key)}
                  >
                    {key === "all"
                      ? locale === "en"
                        ? "All"
                        : "全部"
                      : l(kindLabels[key], locale)}
                  </button>
                ))}
              </div>
            </div>
            <div className="task-table">
              <div className="task-table-head">
                <span>{locale === "en" ? "Task" : "任务"}</span>
                <span>{locale === "en" ? "Applicability" : "适用性"}</span>
                <span>{locale === "en" ? "Status" : "状态"}</span>
                <span />
              </div>
              {visible.map(({ task, kind }) => {
                const status = statusFor(state, scenario, task.id, kind);
                const dependencies = dependenciesForScenario(task, scenario);
                const blocked = taskIsBlocked(state, scenario, task);
                const workflowMetaId = `workflow-${task.id}`;
                const workflowRisk =
                  kind === "needs_expert"
                    ? "expert"
                    : (task.workflowRisk ?? "medium");
                return (
                  <div className="task-row" key={task.id}>
                    <span className="task-index">{task.number}</span>
                    <span
                      className={`task-check ${status === "done" ? "checked" : ""}`}
                    >
                      <Icon name="check" size={14} />
                    </span>
                    <div className="task-row-main">
                      <b>{l(task.title, locale)}</b>
                      <small>{l(task.summary, locale)}</small>
                      <span className="task-workflow-meta" id={workflowMetaId}>
                        <span className={`risk-level ${workflowRisk}`}>
                          {l(workflowRiskLabels[workflowRisk], locale)}
                        </span>
                        <span>
                          <Icon name={blocked ? "lock" : "route"} size={12} />
                          {dependencies.length === 0
                            ? locale === "en"
                              ? "No prerequisite"
                              : "无前置任务"
                            : blocked
                              ? locale === "en"
                                ? `${dependencies.length} prerequisite(s) pending`
                                : `${dependencies.length}项前置任务待完成`
                              : locale === "en"
                                ? "Prerequisites complete"
                                : "前置任务已完成"}
                        </span>
                        <span>
                          <Icon name="calendar" size={12} />
                          {task.due ? l(task.due, locale) : "—"}
                        </span>
                      </span>
                    </div>
                    <span className={`kind-pill ${kind}`}>
                      {l(kindLabels[kind], locale)}
                    </span>
                    <select
                      aria-label={locale === "en" ? "Task status" : "任务状态"}
                      aria-describedby={workflowMetaId}
                      value={status}
                      disabled={
                        kind === "not_applicable" || kind === "needs_expert"
                      }
                      onChange={(e) =>
                        commit(
                          demoRepository.updateTask(
                            state,
                            scenario.id,
                            task.id,
                            e.target.value as TaskStatus,
                          ),
                        )
                      }
                    >
                      {Object.entries(statusLabels)
                        .filter(([key]) =>
                          kind === "not_applicable"
                            ? key === "not_applicable"
                            : kind === "needs_expert"
                              ? key === "needs_expert"
                              : key !== "not_applicable" && key !== "needs_expert",
                        )
                        .map(([key, label]) => (
                          <option
                            value={key}
                            key={key}
                            disabled={key === "done" && blocked}
                          >
                            {l(label, locale)}
                          </option>
                        ))}
                    </select>
                    <AppLink
                      locale={locale}
                      href={`/tasks/${task.id}`}
                      className="row-action"
                      ariaLabel={
                        locale === "en"
                          ? `Open ${l(task.title, locale)}`
                          : `打开${l(task.title, locale)}`
                      }
                    >
                      <Icon name="chevron" />
                    </AppLink>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="workspace-bottom-grid">
            <article className="upcoming-card">
              <div className="widget-head">
                <div>
                  <Icon name="calendar" />
                  <span>
                    <b>
                      {locale === "en"
                        ? "Upcoming obligations"
                        : "即将到期事项"}
                    </b>
                    <small>
                      {locale === "en"
                        ? "Illustrative dates only"
                        : "仅为示例日期"}
                    </small>
                  </span>
                </div>
                <AppLink locale={locale} href="/calendar">
                  {locale === "en" ? "View calendar" : "查看日历"}
                  <Icon name="arrow" size={14} />
                </AppLink>
              </div>
              {scenarioEvents.slice(0, 3).map((event) => (
                <div className="mini-event" key={event.id}>
                  <span>
                    <b>{event.day}</b>
                    <small>{event.month}</small>
                  </span>
                  <div>
                    <b>{l(event.title, locale)}</b>
                    <small>{l(event.note, locale)}</small>
                  </div>
                  <i className={`event-type ${event.type}`} />
                </div>
              ))}
            </article>
            <article className="assumption-card">
              <div className="widget-head">
                <div>
                  <Icon name="settings" />
                  <span>
                    <b>{locale === "en" ? "Plan assumptions" : "计划假设"}</b>
                    <small>
                      {locale === "en"
                        ? "Change answers to recalculate"
                        : "修改回答以重新计算"}
                    </small>
                  </span>
                </div>
                <AppLink locale={locale} href="/assessment">
                  {locale === "en" ? "Edit" : "修改"}
                  <Icon name="arrow" size={14} />
                </AppLink>
              </div>
              <dl>
                <div>
                  <dt>{locale === "en" ? "Location" : "地点"}</dt>
                  <dd>{scenario.profile.city}</dd>
                </div>
                <div>
                  <dt>{locale === "en" ? "Structure" : "结构"}</dt>
                  <dd>{scenario.profile.structure.replace("_", " ")}</dd>
                </div>
                <div>
                  <dt>{locale === "en" ? "Revenue" : "收入"}</dt>
                  <dd>{scenario.profile.revenue.replaceAll("_", " ")}</dd>
                </div>
                <div>
                  <dt>{locale === "en" ? "Employees" : "员工"}</dt>
                  <dd>{scenario.profile.employees}</dd>
                </div>
              </dl>
              <div className="privacy-note small">
                <Icon name="lock" />
                <p>
                  {locale === "en"
                    ? "No SIN, passport, bank, tax-form or government-login data is collected."
                    : "不收集SIN、护照、银行、税表或政府登录信息。"}
                </p>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

function TaskPage({
  locale,
  taskId,
  state,
  commit,
}: {
  locale: Locale;
  taskId: string;
  state: DemoState;
  commit: (state: DemoState) => void;
}) {
  const task = getTask(taskId) ?? tasks[0];
  const scenario = resolveScenario(state);
  const scenarioTask = scenario.tasks.find((x) => x.id === task.id);
  const kind = scenarioTask?.kind ?? "optional";
  const status = statusFor(state, scenario, task.id, kind);
  const [reference, setReference] = useState("");
  const [fileName, setFileName] = useState("");
  const [saved, setSaved] = useState(false);
  const materials =
    task.materials ??
    [
      {
        en: "Business profile and activity description",
        zh: "企业概况和经营活动说明",
      },
      {
        en: "Relevant registration details",
        zh: "相关注册信息",
      },
      {
        en: "Questions for the official service or expert",
        zh: "向官方服务或专家咨询的问题",
      },
    ];
  const materialKey = `${scenario.id}:${task.id}`;
  const materialChecks =
    state.materialChecks[materialKey] ?? Array(materials.length).fill(false);
  const preparedCount = materialChecks.filter(Boolean).length;
  const materialsReady = preparedCount === materials.length;
  const prerequisites = dependenciesForScenario(task, scenario);
  const blocked = taskIsBlocked(state, scenario, task);
  const workflowRisk =
    kind === "needs_expert" ? "expert" : (task.workflowRisk ?? "medium");
  const actionLocked =
    kind === "not_applicable" || kind === "needs_expert" || blocked;
  const save = () => {
    if (actionLocked || (!reference && !fileName)) return;
    commit(
      demoRepository.saveEvidence(state, scenario.id, {
        taskId: task.id,
        reference: reference || "DEMO-REFERENCE",
        fileName: fileName || "No file recorded",
        completedAt: new Date().toISOString(),
      }),
    );
    setSaved(true);
  };
  return (
    <div className="workspace-layout">
      <WorkspaceNav locale={locale} scenarioId={scenario.id} active="plan" />
      <div className="workspace-content">
        <WorkspaceTopbar
          locale={locale}
          scenario={scenario}
          currentPath={["tasks", task.id]}
          onReset={() => commit(demoRepository.reset())}
        />
        <main className="workspace-main task-detail-page">
          <div className="breadcrumb">
            <AppLink locale={locale} href={`/workspace/${scenario.id}`}>
              {locale === "en" ? "Launch plan" : "创业计划"}
            </AppLink>
            <Icon name="chevron" size={13} />
            <span>{task.number}</span>
          </div>
          <div className="task-detail-heading">
            <div>
              <div className="task-heading-meta">
                <span className={`kind-pill ${kind}`}>
                  {l(kindLabels[kind], locale)}
                </span>
                <span className={`status-pill ${status}`}>
                  {l(statusLabels[status], locale)}
                </span>
              </div>
              <h1>{l(task.title, locale)}</h1>
              <p>{l(task.summary, locale)}</p>
            </div>
            <span className="task-large-number">{task.number}</span>
          </div>
          {kind === "needs_expert" && (
            <div className="expert-banner">
              <Icon name="alert" />
              <div>
                <b>
                  {locale === "en"
                    ? "A definitive answer needs qualified review"
                    : "确定性答案需要合格专业人士审查"}
                </b>
                <p>
                  {locale === "en"
                    ? "Launchpad can help organize the facts, but it will not make a legal, tax, licensing, insurance or immigration determination."
                    : "Launchpad可以帮助整理事实，但不会作出法律、税务、许可、保险或移民判断。"}
                </p>
              </div>
            </div>
          )}
          {kind === "not_applicable" && (
            <div className="not-applicable-banner">
              <Icon name="check" />
              <div>
                <b>
                  {locale === "en"
                    ? "No action is required for the current demo facts"
                    : "根据当前演示事实，无需执行此任务"}
                </b>
                <p>
                  {locale === "en"
                    ? "Keep it visible as an explicit Not Applicable decision. Change the assessment if the business facts change."
                    : "该任务保留为明确的“不适用”结论。若企业事实变化，请修改问诊答案。"}
                </p>
              </div>
            </div>
          )}
          {blocked && (
            <div className="dependency-banner">
              <Icon name="lock" />
              <div>
                <b>
                  {locale === "en"
                    ? "Complete the prerequisite before marking this task done"
                    : "将此任务标记为完成前，请先完成前置任务"}
                </b>
                <p>
                  {prerequisites
                    .map(({ definition }) => l(definition.title, locale))
                    .join(" · ")}
                </p>
              </div>
            </div>
          )}
          <div className="task-detail-grid">
            <div className="task-detail-main">
              <section className="detail-card">
                <span className="detail-card-label">
                  <Icon name="spark" />
                  {locale === "en" ? "WHY THIS APPLIES" : "为什么适用"}
                </span>
                <p className="lead-text">
                  {task.why ? l(task.why, locale) : l(task.summary, locale)}
                </p>
              </section>
              <section className="detail-card">
                <span className="detail-card-label">
                  <Icon name="file" />
                  {locale === "en" ? "GET READY" : "准备材料"}
                </span>
                <h2>
                  {locale === "en" ? "Materials to review" : "需要核对的材料"}
                </h2>
                <div className="material-readiness" aria-live="polite">
                  <b>
                    {preparedCount}/{materials.length}
                  </b>
                  <span>
                    {materialsReady
                      ? locale === "en"
                        ? "Ready to open the official route"
                        : "已可前往官方入口"
                      : locale === "en"
                        ? "Check every item before continuing"
                        : "继续前请核对全部项目"}
                  </span>
                </div>
                <div className="material-list">
                  {materials.map((material, index) => (
                    <label key={material.en}>
                      <input
                        type="checkbox"
                        disabled={kind === "not_applicable"}
                        checked={Boolean(materialChecks[index])}
                        onChange={(event) =>
                          commit(
                            demoRepository.updateMaterialCheck(
                              state,
                              scenario.id,
                              task.id,
                              index,
                              event.target.checked,
                              materials.length,
                            ),
                          )
                        }
                      />
                      <span>
                        <i>{String(index + 1).padStart(2, "0")}</i>
                        <b>{l(material, locale)}</b>
                        <small>
                          {locale === "en"
                            ? "Review before continuing"
                            : "继续前请核对"}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
              <section className="detail-card">
                <span className="detail-card-label">
                  <Icon name="external" />
                  {locale === "en" ? "COMPLETE EXTERNALLY" : "前往外部办理"}
                </span>
                <h2>
                  {locale === "en"
                    ? "Use the official route first"
                    : "优先使用官方入口"}
                </h2>
                <p>
                  {locale === "en"
                    ? "Launchpad does not submit this transaction, store government credentials or receive the official result."
                    : "Launchpad不会提交此交易、保存政府登录凭据或接收官方结果。"}
                </p>
                {kind === "needs_expert" ? (
                  <AppLink
                    locale={locale}
                    href="/support#expert"
                    className="official-link-card"
                  >
                    <span className="source-logo">
                      <Icon name="users" />
                    </span>
                    <div>
                      <small>
                        {locale === "en" ? "EXPERT HANDOFF" : "专家接力"}
                      </small>
                      <b>
                        {locale === "en"
                          ? "Prepare a focused review request"
                          : "准备聚焦的审查请求"}
                      </b>
                      <span>
                        {locale === "en"
                          ? "No definitive conclusion is generated"
                          : "不会生成确定性结论"}
                      </span>
                    </div>
                    <Icon name="arrow" />
                  </AppLink>
                ) : kind === "not_applicable" ? (
                  <div className="official-link-card disabled" aria-disabled="true">
                    <span className="source-logo">
                      <Icon name="check" />
                    </span>
                    <div>
                      <small>{locale === "en" ? "NO ACTION" : "无需操作"}</small>
                      <b>
                        {locale === "en"
                          ? "Official handoff is not needed"
                          : "无需前往官方入口"}
                      </b>
                    </div>
                  </div>
                ) : task.officialUrl &&
                  (materialsReady ? (
                    <a
                      className="official-link-card"
                      target="_blank"
                      rel="noreferrer"
                      href={task.officialUrl}
                    >
                      <span className="source-logo">
                        <Icon name="building" />
                      </span>
                      <div>
                        <small>
                          {locale === "en"
                            ? "AUTHORITATIVE EXTERNAL SERVICE"
                            : "权威外部服务"}
                        </small>
                        <b>
                          {locale === "en"
                            ? "Continue to the official website"
                            : "前往官方网站"}
                        </b>
                        <span>{new URL(task.officialUrl).hostname}</span>
                      </div>
                      <Icon name="external" />
                    </a>
                  ) : (
                    <button
                      className="official-link-card disabled"
                      type="button"
                      disabled
                    >
                      <span className="source-logo">
                        <Icon name="lock" />
                      </span>
                      <div>
                        <small>
                          {locale === "en"
                            ? "MATERIAL CHECK REQUIRED"
                            : "需要完成材料核对"}
                        </small>
                        <b>
                          {locale === "en"
                            ? "Complete the checklist to continue"
                            : "完成清单后继续"}
                        </b>
                        <span>{new URL(task.officialUrl).hostname}</span>
                      </div>
                      <Icon name="lock" />
                    </button>
                  ))}
                <div className="external-warning">
                  <Icon name="alert" />
                  <span>
                    {locale === "en"
                      ? "You are leaving this demo. Review the third party’s current terms, privacy notice and fees."
                      : "您即将离开本演示。请查看第三方最新条款、隐私声明及费用。"}
                  </span>
                </div>
              </section>
              <section className="detail-card" id="evidence">
                <span className="detail-card-label">
                  <Icon name="check" />
                  {locale === "en" ? "RECORD COMPLETION" : "记录完成情况"}
                </span>
                <h2>
                  {locale === "en"
                    ? "Save a safe demo reference"
                    : "保存安全的演示参考信息"}
                </h2>
                <p>
                  {locale === "en"
                    ? "Do not enter a SIN, BN, tax account, Company Key, government password, bank information or real receipt."
                    : "请勿输入SIN、BN、税务账户、Company Key、政府密码、银行信息或真实回执。"}
                </p>
                <div className="evidence-form">
                  <label>
                    <span>
                      {locale === "en" ? "Demo reference" : "演示参考号"}
                    </span>
                    <input
                      value={reference}
                      disabled={actionLocked}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="DEMO-2026-001"
                    />
                  </label>
                  <label>
                    <span>
                      {locale === "en"
                        ? "Demo filename (text only)"
                        : "演示文件名（仅文本）"}
                    </span>
                    <input
                      value={fileName}
                      disabled={actionLocked}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="sample-confirmation.pdf"
                    />
                  </label>
                  <button
                    className="btn btn-primary"
                    onClick={save}
                    disabled={actionLocked || (!reference && !fileName)}
                  >
                    <Icon name="check" />
                    {locale === "en" ? "Mark complete" : "标记为完成"}
                  </button>
                  {saved && (
                    <span className="saved-message">
                      <Icon name="check" />
                      {locale === "en"
                        ? "Saved locally. No file was uploaded."
                        : "已保存在本地，未上传任何文件。"}
                    </span>
                  )}
                </div>
              </section>
            </div>
            <aside className="task-detail-aside">
              <section className="aside-card">
                <h3>{locale === "en" ? "At a glance" : "任务概览"}</h3>
                <dl>
                  <div>
                    <dt>
                      <Icon name="clock" />
                      {locale === "en" ? "Timing" : "时间"}
                    </dt>
                    <dd>
                      {task.timing
                        ? l(task.timing, locale)
                        : locale === "en"
                          ? "Review when ready"
                          : "准备后查看"}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="briefcase" />
                      {locale === "en" ? "Cost" : "费用"}
                    </dt>
                    <dd>
                      {task.cost
                        ? l(task.cost, locale)
                        : locale === "en"
                          ? "Varies by route"
                          : "因路径而异"}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="calendar" />
                      {locale === "en" ? "Target deadline" : "目标截止时间"}
                    </dt>
                    <dd>{task.due ? l(task.due, locale) : "—"}</dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="route" />
                      {locale === "en" ? "Prerequisites" : "前置任务"}
                    </dt>
                    <dd>
                      {prerequisites.length
                        ? prerequisites
                            .map(({ definition }) => l(definition.shortTitle, locale))
                            .join(" · ")
                        : locale === "en"
                          ? "None in this journey"
                          : "此旅程中无前置任务"}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="alert" />
                      {locale === "en" ? "Workflow risk" : "流程风险"}
                    </dt>
                    <dd>
                      {l(workflowRiskLabels[workflowRisk], locale)}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="route" />
                      {locale === "en" ? "Plan position" : "计划位置"}
                    </dt>
                    <dd>
                      {locale === "en"
                        ? `Task ${task.number} · ${task.phase.replace("_", " ")}`
                        : `任务 ${task.number} · ${task.phase}`}
                    </dd>
                  </div>
                </dl>
              </section>
              <section className="aside-card source-aside">
                <h3>
                  <Icon name="shield" />
                  {locale === "en" ? "Authoritative sources" : "权威来源"}
                </h3>
                {task.sourceIds.map((id) => {
                  const source = getSource(id);
                  return source ? (
                    <a
                      key={id}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <b>{source.authority}</b>
                      <span>{l(source.title, locale)}</span>
                      <small>
                        <i className="verified-dot" />
                        {locale === "en"
                          ? `Verified ${source.verified}`
                          : `核验于 ${source.verified}`}
                      </small>
                    </a>
                  ) : null;
                })}
                <p>
                  {locale === "en"
                    ? "Source links can change. Always confirm current requirements on the official page."
                    : "来源链接可能变化，请始终在官方页面确认最新要求。"}
                </p>
              </section>
              <section className="aside-card">
                <h3>{locale === "en" ? "Need help?" : "需要帮助？"}</h3>
                <p>
                  {locale === "en"
                    ? "Prepare a focused expert handoff without sharing sensitive information in this demo."
                    : "在本演示中准备聚焦的专家转交，无需分享敏感信息。"}
                </p>
                <AppLink
                  locale={locale}
                  href="/support#expert"
                  className="btn btn-outline full"
                >
                  {locale === "en" ? "Open support" : "打开支持"}
                </AppLink>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function CalendarPage({ locale, state, commit }: { locale: Locale; state: DemoState; commit: (state: DemoState) => void }) {
  const scenario = resolveScenario(state);
  const visibleEvents = calendarForScenario(scenario);
  const exportPreview = () => {
    const heading =
      locale === "en"
        ? "Canada Business Launchpad — illustrative reminder preview"
        : "Canada Business Launchpad——示例提醒预览";
    const disclaimer =
      locale === "en"
        ? "Confirm every date against your own fiscal year, CRA frequency and official notices."
        : "请根据自身财年、CRA分配频率及官方通知确认每个日期。";
    const lines = visibleEvents.map((event) => {
      const source = getSource(event.sourceId);
      const taskId = calendarTaskByEvent[event.id];
      const instance = scenario.tasks.find((item) => item.id === taskId);
      const eventStatus = instance
        ? statusFor(state, scenario, taskId, instance.kind)
        : "not_started";
      return `${event.month} ${event.day} | ${l(event.title, locale)} | ${l(statusLabels[eventStatus], locale)} | ${l(event.note, locale)} | ${source?.url ?? ""}`;
    });
    const blob = new Blob([[heading, disclaimer, "", ...lines].join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `launchpad-reminder-preview-${locale}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="workspace-layout">
      <WorkspaceNav
        locale={locale}
        scenarioId={scenario.id}
        active="calendar"
      />
      <div className="workspace-content">
        <WorkspaceTopbar
          locale={locale}
          scenario={scenario}
          currentPath={["calendar"]}
          onReset={() => commit(demoRepository.reset())}
        />
        <main className="workspace-main">
          <div className="workspace-welcome">
            <div>
              <span className="eyebrow">
                {locale === "en" ? "COMPLIANCE PREVIEW" : "合规预览"}
              </span>
              <h1>
                {locale === "en"
                  ? "Keep distinct obligations distinct"
                  : "清晰区分不同义务"}
              </h1>
              <p>
                {locale === "en"
                  ? "Illustrative reminders based on a demo fiscal year. Launchpad does not file or calculate final due dates."
                  : "基于演示财年的示例提醒。Launchpad不负责提交，也不计算最终截止日期。"}
              </p>
            </div>
            <DemoBadge locale={locale} compact />
          </div>
          <div className="calendar-notice">
            <Icon name="alert" />
            <span>
              {locale === "en"
                ? "Reminder preview only. Confirm dates against your own fiscal year, reporting frequency and official notices."
                : "仅为提醒预览。请根据自己的财年、申报频率及官方通知确认日期。"}
            </span>
          </div>
          <div className="calendar-layout">
            <section className="calendar-list-card">
              <div className="task-section-head">
                <div>
                  <h2>
                    {locale === "en" ? "Upcoming timeline" : "即将到期时间线"}
                  </h2>
                  <p>
                    {locale === "en"
                      ? "Registry, tax, payroll and renewal items are never merged"
                      : "注册处、税务、Payroll及续期事项不会混为一谈"}
                  </p>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={exportPreview}
                >
                  {locale === "en" ? "Download preview" : "下载预览"}
                </button>
              </div>
              <div className="timeline">
                {visibleEvents.map((event) => {
                  const source = getSource(event.sourceId);
                  const taskId = calendarTaskByEvent[event.id];
                  const instance = scenario.tasks.find((item) => item.id === taskId);
                  const eventStatus = instance
                    ? statusFor(state, scenario, taskId, instance.kind)
                    : "not_started";
                  const evidence = state.evidence[`${scenario.id}:${taskId}`];
                  return (
                    <article
                      key={event.id}
                      className={`timeline-event ${eventStatus === "done" ? "completed" : ""}`}
                    >
                      <div className="event-date">
                        <b>{event.day}</b>
                        <span>{event.month}</span>
                      </div>
                      <div className={`event-line ${event.type}`}>
                        <i />
                      </div>
                      <div className="event-body">
                        <div>
                          <span className={`event-chip ${event.type}`}>
                            {event.type}
                          </span>
                          {instance && (
                            <span className={`kind-pill ${instance.kind}`}>
                              {l(kindLabels[instance.kind], locale)}
                            </span>
                          )}
                          <span className={`status-pill ${eventStatus}`}>
                            {l(statusLabels[eventStatus], locale)}
                          </span>
                        </div>
                        <h3>{l(event.title, locale)}</h3>
                        <p>{l(event.note, locale)}</p>
                        {evidence && eventStatus === "done" && (
                          <small className="calendar-completion">
                            <Icon name="check" size={13} />
                            {locale === "en" ? "Recorded locally" : "已在本地记录"} ·{" "}
                            {new Date(evidence.completedAt).toLocaleDateString(
                              locale === "en" ? "en-CA" : "zh-CN",
                            )}
                          </small>
                        )}
                        {source && (
                          <a href={source.url} target="_blank" rel="noreferrer">
                            <Icon name="shield" size={15} />
                            {source.authority} ·{" "}
                            {locale === "en" ? "verified" : "核验于"}{" "}
                            {source.verified}
                            <Icon name="external" size={13} />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
            <aside className="calendar-aside">
              <section className="aside-card legend-card">
                <h3>{locale === "en" ? "Calendar legend" : "日历图例"}</h3>
                {[
                  ["corporate", "Corporate registry", "公司注册处"],
                  ["tax", "Tax filing", "税务申报"],
                  ["payroll", "Payroll", "Payroll"],
                  ["permit", "Renewal", "续期"],
                  ["privacy", "Privacy review", "隐私复核"],
                ].map(([type, en, zh]) => (
                  <span key={type}>
                    <i className={`event-type ${type}`} />
                    {locale === "en" ? en : zh}
                  </span>
                ))}
              </section>
              <section className="aside-card">
                <h3>
                  {locale === "en"
                    ? "Why separation matters"
                    : "为什么必须区分"}
                </h3>
                <p>
                  {locale === "en"
                    ? "An annual return maintains registry information. A T2 reports corporate income tax. GST/HST and payroll each follow their own assigned cycles."
                    : "年度申报维护注册处信息；T2申报公司所得税；GST/HST与Payroll各有独立周期。"}
                </p>
                <AppLink
                  locale={locale}
                  href="/assistant"
                  className="text-link"
                >
                  {locale === "en" ? "Ask the explainer" : "询问解释助手"}
                  <Icon name="arrow" size={14} />
                </AppLink>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function ProviderType({
  type,
  locale,
}: {
  type: Provider["type"];
  locale: Locale;
}) {
  const labels = {
    official: { en: "Official", zh: "官方" },
    independent: { en: "Independent", zh: "独立" },
    demo_partner: { en: "Demo partner", zh: "演示伙伴" },
    sponsored: { en: "Sponsored demo", zh: "赞助位演示" },
  };
  return (
    <span className={`provider-type ${type}`}>{l(labels[type], locale)}</span>
  );
}

function ProvidersPage({
  locale,
  state,
  commit,
}: {
  locale: Locale;
  state: DemoState;
  commit: (state: DemoState) => void;
}) {
  const scenario = resolveScenario(state);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [query, setQuery] = useState("");
  const visibleProviders = providers.filter((provider) =>
    [
      provider.name,
      provider.type,
      l(provider.category, locale),
      l(provider.description, locale),
      l(provider.region, locale),
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selected) return;
    const previous = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => {
      modalRef.current
        ?.querySelector<HTMLElement>("button, input, [href], [tabindex]:not([tabindex='-1'])")
        ?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        return;
      }
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex='-1'])",
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      previous?.focus();
    };
  }, [selected]);
  const submit = () => {
    if (!selected || !consent) return;
    commit(
      demoRepository.createReferral(
        state,
        selected.id,
        selected.sharedFields.map((x) => x.en),
      ),
    );
    setSent(true);
  };
  return (
    <div className="workspace-layout">
      <WorkspaceNav
        locale={locale}
        scenarioId={scenario.id}
        active="providers"
      />
      <div className="workspace-content">
        <WorkspaceTopbar
          locale={locale}
          scenario={scenario}
          currentPath={["providers"]}
          onReset={() => commit(demoRepository.reset())}
        />
        <main className="workspace-main">
          <div className="workspace-welcome">
            <div>
              <span className="eyebrow">
                {locale === "en"
                  ? "TRANSPARENT SERVICE DIRECTORY"
                  : "透明服务商目录"}
              </span>
              <h1>
                {locale === "en"
                  ? "Official routes first. Commercial routes clearly labelled."
                  : "官方入口优先，商业路径明确标注。"}
              </h1>
              <p>
                {locale === "en"
                  ? "Compare route type, region, pricing source, data sharing and commercial disclosure before taking action."
                  : "操作前比较路径类型、服务地区、价格来源、数据共享及商业披露。"}
              </p>
            </div>
            <DemoBadge locale={locale} compact />
          </div>
          <div className="commercial-notice">
            <Icon name="shield" />
            <div>
              <b>
                {locale === "en"
                  ? "No real commercial relationships in this prototype"
                  : "本原型不存在真实商业合作关系"}
              </b>
              <p>
                {locale === "en"
                  ? "Names marked as demo or sponsored are fictional. Any future compensation would be disclosed beside the action."
                  : "标注为演示或赞助的名称均为虚构。未来任何报酬都会在操作入口旁披露。"}
              </p>
            </div>
          </div>
          <div className="provider-toolbar">
            <div className="search-box">
              <Icon name="search" />
              <input
                aria-label={
                  locale === "en" ? "Search service category" : "搜索服务类别"
                }
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  locale === "en" ? "Search service category" : "搜索服务类别"
                }
              />
            </div>
            <span>
              {visibleProviders.length} {locale === "en" ? "routes shown" : "条路径"}
            </span>
          </div>
          <div className="provider-list">
            {visibleProviders.map((provider) => (
              <article className="provider-card" key={provider.id}>
                <div className="provider-main">
                  <div className={`provider-logo ${provider.type}`}>
                    <Icon
                      name={
                        provider.type === "official"
                          ? "building"
                          : provider.type === "sponsored"
                            ? "spark"
                            : "briefcase"
                      }
                    />
                  </div>
                  <div>
                    <div className="provider-title-row">
                      <h3>{provider.name}</h3>
                      <ProviderType type={provider.type} locale={locale} />
                    </div>
                    <span className="provider-category">
                      {l(provider.category, locale)}
                    </span>
                    <p>{l(provider.description, locale)}</p>
                    <div className="provider-tags">
                      <span>
                        <Icon name="globe" size={14} />
                        {l(provider.region, locale)}
                      </span>
                      <span>
                        <Icon name="clock" size={14} />
                        {locale === "en"
                          ? `Checked ${provider.verified}`
                          : `核验于 ${provider.verified}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="provider-price">
                  <small>
                    {locale === "en" ? "PRICE / FEE" : "价格 / 费用"}
                  </small>
                  <b>{l(provider.price, locale)}</b>
                  <span>{l(provider.priceSource, locale)}</span>
                </div>
                <div className="provider-action">
                  {provider.commercialDisclosure && (
                    <p className="disclosure">
                      <Icon name="alert" size={14} />
                      {l(provider.commercialDisclosure, locale)}
                    </p>
                  )}
                  {provider.type === "official" ? (
                    <a
                      className="btn btn-outline"
                      target="_blank"
                      rel="noreferrer"
                      href={provider.website}
                    >
                      {locale === "en"
                        ? "Go to official website"
                        : "前往官方网站"}
                      <Icon name="external" size={16} />
                    </a>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelected(provider);
                        setSent(false);
                        setConsent(false);
                      }}
                    >
                      {locale === "en" ? "Review demo handoff" : "查看演示转介"}
                      <Icon name="arrow" size={16} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
      {selected && (
        <div className="modal-backdrop">
          <div
            className="referral-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="referral-modal-title"
            ref={modalRef}
          >
            <button
              aria-label={locale === "en" ? "Close dialog" : "关闭对话框"}
              className="modal-close"
              onClick={() => setSelected(null)}
            >
              <Icon name="x" />
            </button>
            {sent ? (
              <div className="success-state">
                <span>
                  <Icon name="check" size={30} />
                </span>
                <small>
                  {locale === "en" ? "SIMULATED RECEIPT" : "模拟接收"}
                </small>
                <h2 id="referral-modal-title">
                  {locale === "en" ? "Demo handoff received" : "演示转介已接收"}
                </h2>
                <p>
                  {locale === "en"
                    ? "A local referral record was created. Nothing was sent to a real provider."
                    : "已创建本地转介记录，未向真实服务商发送任何内容。"}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setSelected(null)}
                >
                  {locale === "en" ? "Return to directory" : "返回目录"}
                </button>
              </div>
            ) : (
              <>
                <DemoBadge locale={locale} compact />
                <h2 id="referral-modal-title">
                  {locale === "en" ? "Review before sharing" : "共享前请确认"}
                </h2>
                <p>
                  {selected.name} · {l(selected.category, locale)}
                </p>
                <div className="share-box">
                  <small>
                    {locale === "en"
                      ? "DEMO FIELDS THAT WOULD BE SHARED"
                      : "将共享的演示字段"}
                  </small>
                  {selected.sharedFields.map((field) => (
                    <span key={field.en}>
                      <Icon name="check" size={14} />
                      {l(field, locale)}
                    </span>
                  ))}
                  <p>
                    {locale === "en"
                      ? "Use a fictional contact email in this demonstration. Do not enter client data."
                      : "演示中请使用虚构联系邮箱，不要输入客户数据。"}
                  </p>
                </div>
                {selected.commercialDisclosure && (
                  <div className="commercial-modal-note">
                    <Icon name="alert" />
                    <p>{l(selected.commercialDisclosure, locale)}</p>
                  </div>
                )}
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    {locale === "en"
                      ? "I understand this is a simulation and consent to creating a local demo record."
                      : "我理解这是模拟操作，并同意创建本地演示记录。"}
                  </span>
                </label>
                <button
                  disabled={!consent}
                  className="btn btn-primary full"
                  onClick={submit}
                >
                  {locale === "en"
                    ? "Submit simulated handoff"
                    : "提交模拟转介"}
                  <Icon name="arrow" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AssistantPage({
  locale,
  state,
  commit,
}: {
  locale: Locale;
  state: DemoState;
  commit: (state: DemoState) => void;
}) {
  const scenario = resolveScenario(state);
  const [active, setActive] = useState(assistantPrompts[0]);
  return (
    <div className="workspace-layout">
      <WorkspaceNav
        locale={locale}
        scenarioId={scenario.id}
        active="assistant"
      />
      <div className="workspace-content">
        <WorkspaceTopbar
          locale={locale}
          scenario={scenario}
          currentPath={["assistant"]}
          onReset={() => commit(demoRepository.reset())}
        />
        <main className="workspace-main">
          <div className="workspace-welcome">
            <div>
              <span className="eyebrow">
                {locale === "en"
                  ? "CURATED AI EXPLAINER"
                  : "经审核的AI解释预览"}
              </span>
              <h1>
                {locale === "en"
                  ? "Explain the approved content—not invent the rule"
                  : "解释已审核内容，而非创造规则"}
              </h1>
              <p>
                {locale === "en"
                  ? "Select a common question to see a deterministic, source-backed response. No live model is used in this demo."
                  : "选择常见问题，查看确定且附来源的回答。本演示不调用实时模型。"}
              </p>
            </div>
            <DemoBadge locale={locale} compact />
          </div>
          <div className="assistant-boundary">
            <Icon name="spark" />
            <span>
              {locale === "en"
                ? "AI preview · Preset answers · Sources attached · Expert fallback"
                : "AI预览 · 预置回答 · 附带来源 · 专家兜底"}
            </span>
          </div>
          <div className="assistant-layout">
            <aside className="prompt-list">
              <small>
                {locale === "en" ? "SUGGESTED QUESTIONS" : "建议问题"}
              </small>
              {assistantPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  className={active.id === prompt.id ? "active" : ""}
                  onClick={() => setActive(prompt)}
                >
                  <span>
                    <Icon name="spark" size={15} />
                  </span>
                  {l(prompt.question, locale)}
                  <Icon name="chevron" size={14} />
                </button>
              ))}
            </aside>
            <section className="chat-panel">
              <div className="chat-head">
                <div className="assistant-avatar">
                  <Icon name="spark" />
                </div>
                <div>
                  <b>Launchpad Guide</b>
                  <span>
                    <i />
                    {locale === "en"
                      ? "Approved-content mode"
                      : "已审核内容模式"}
                  </span>
                </div>
              </div>
              <div className="chat-body">
                <div className="chat-user">{l(active.question, locale)}</div>
                <div className="chat-assistant">
                  <div className="assistant-avatar small">
                    <Icon name="spark" size={16} />
                  </div>
                  <div>
                    <p>{l(active.answer, locale)}</p>
                    <div className="chat-sources">
                      <small>
                        {locale === "en" ? "SOURCES USED" : "引用来源"}
                      </small>
                      {active.sourceIds.map((id) => {
                        const source = getSource(id)!;
                        return (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            key={id}
                          >
                            <Icon name="shield" size={15} />
                            <span>
                              <b>{source.authority}</b>
                              <small>
                                {l(source.title, locale)} · {source.verified}
                              </small>
                            </span>
                            <Icon name="external" size={13} />
                          </a>
                        );
                      })}
                    </div>
                    <div className="answer-boundary">
                      <Icon name="alert" size={16} />
                      {locale === "en"
                        ? "General information only. Your facts may change the result; use the official source or a qualified professional for a final determination."
                        : "仅提供一般信息。具体事实可能改变结果；最终判断请使用官方来源或咨询合格专业人士。"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="chat-input">
                <input
                  readOnly
                  aria-label={
                    locale === "en"
                      ? "Free-form assistant input disabled in demo"
                      : "演示中已禁用自由提问输入"
                  }
                  placeholder={
                    locale === "en"
                      ? "Live free-form questions are disabled in this demo"
                      : "本演示未启用实时自由提问"
                  }
                />
                <button
                  disabled
                  aria-label={locale === "en" ? "Send disabled" : "发送已禁用"}
                >
                  <Icon name="arrow" />
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function PartnersPage({ locale }: { locale: Locale }) {
  return (
    <main>
      <section className="page-hero navy partner-hero">
        <div className="shell two-col">
          <div>
            <DemoBadge locale={locale} compact />
            <span className="eyebrow">
              {locale === "en"
                ? "FOR ADVISORS & SERVICE PROVIDERS"
                : "面向顾问与服务商"}
            </span>
            <h1>
              {locale === "en"
                ? "Meet founders when the next step is clear"
                : "在下一步清晰时连接创业者"}
            </h1>
            <p>
              {locale === "en"
                ? "A transparent handoff model that prepares the user, captures explicit consent and keeps responsibility visible."
                : "通过透明转介模式，帮助用户准备、取得明确同意，并清晰界定责任。"}
            </p>
            <AppLink
              locale={locale}
              href="/providers"
              className="btn btn-gold btn-lg"
            >
              {locale === "en" ? "See the handoff demo" : "查看转介演示"}
              <Icon name="arrow" />
            </AppLink>
          </div>
          <div className="partner-flow-card">
            <small>{locale === "en" ? "THE HANDOFF MODEL" : "转介模型"}</small>
            {[
              ["01", "Context", "情境"],
              ["02", "Readiness", "就绪"],
              ["03", "Consent", "同意"],
              ["04", "Handoff", "转介"],
            ].map(([n, en, zh], i) => (
              <div key={n}>
                <span>{n}</span>
                <b>{locale === "en" ? en : zh}</b>
                {i < 3 && <Icon name="arrow" />}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <div className="section-heading centered">
            <span className="eyebrow">
              {locale === "en"
                ? "DESIGNED FOR RESPONSIBLE GROWTH"
                : "为负责任的增长而设计"}
            </span>
            <h2>
              {locale === "en"
                ? "A better introduction for every side"
                : "为各方提供更高质量的转介"}
            </h2>
          </div>
          <div className="partner-benefits">
            {[
              [
                "users",
                "Prepared context",
                "已准备的情境",
                "The user understands the task, materials and route before asking for help.",
                "用户在寻求帮助前已了解任务、材料和路径。",
              ],
              [
                "shield",
                "Explicit consent",
                "明确同意",
                "Only disclosed fields are included in a simulated handoff.",
                "模拟转介仅包含已披露并获同意的字段。",
              ],
              [
                "chart",
                "Trackable milestones",
                "可跟踪里程碑",
                "Success is a completed user milestone—not a hidden click.",
                "成功标准是用户完成里程碑，而不是隐蔽点击。",
              ],
              [
                "briefcase",
                "Clear responsibility",
                "责任清晰",
                "The provider contracts, advises and charges the customer directly.",
                "由服务商直接与客户签约、提供建议并收费。",
              ],
            ].map(([icon, en, zh, descEn, descZh]) => (
              <article key={en}>
                <span className="feature-icon">
                  <Icon name={icon as "users"} />
                </span>
                <h3>{locale === "en" ? en : zh}</h3>
                <p>{locale === "en" ? descEn : descZh}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section muted">
        <div className="shell partner-requirements">
          <div>
            <span className="eyebrow">
              {locale === "en"
                ? "BEFORE ANY LIVE INTEGRATION"
                : "启用真实集成前"}
            </span>
            <h2>
              {locale === "en"
                ? "Evidence before logos or claims"
                : "先有证据，再使用Logo或合作宣称"}
            </h2>
            <p>
              {locale === "en"
                ? "The demo assumes no partner relationships. A live listing needs documented authority, data handling and commercial terms."
                : "本演示不假设任何合作关系。真实展示需要书面授权、数据处理及商业条款。"}
            </p>
          </div>
          <ul className="check-list numbered">
            <li>
              <span>01</span>
              {locale === "en"
                ? "Signed commercial agreement and brand permission"
                : "已签署商业协议及品牌授权"}
            </li>
            <li>
              <span>02</span>
              {locale === "en"
                ? "Defined shared fields, consent language and deletion path"
                : "明确共享字段、同意文本及删除路径"}
            </li>
            <li>
              <span>03</span>
              {locale === "en"
                ? "Service scope, qualification, SLA and complaint ownership"
                : "明确服务范围、资质、SLA及投诉责任"}
            </li>
            <li>
              <span>04</span>
              {locale === "en"
                ? "Commission or sponsorship disclosure beside the action"
                : "在操作入口旁披露佣金或赞助关系"}
            </li>
          </ul>
        </div>
      </section>
      <section className="section final-cta-section">
        <div className="shell final-cta">
          <div>
            <h2>
              {locale === "en"
                ? "Review the external demo together."
                : "共同评审对外演示。"}
            </h2>
            <p>
              {locale === "en"
                ? "The partnership flow is intentionally simulated until the required agreements exist."
                : "在必要协议签署前，合作流程仅作模拟展示。"}
            </p>
          </div>
          <AppLink
            locale={locale}
            href="/providers"
            className="btn btn-gold btn-lg"
          >
            {locale === "en" ? "Open provider directory" : "打开服务商目录"}
            <Icon name="arrow" />
          </AppLink>
        </div>
      </section>
    </main>
  );
}

function SupportPage({
  locale,
  commit,
}: {
  locale: Locale;
  commit: (state: DemoState) => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);
  return (
    <main>
      <section className="page-hero compact">
        <div className="shell">
          <DemoBadge locale={locale} compact />
          <span className="eyebrow">
            {locale === "en" ? "SUPPORT, SCOPE & TRUST" : "支持、范围与信任"}
          </span>
          <h1>
            {locale === "en"
              ? "Know where the workspace stops"
              : "了解工作台的边界"}
          </h1>
          <p>
            {locale === "en"
              ? "Get a focused next step without turning a planning prototype into legal, tax, insurance or immigration advice."
              : "在不将规划原型变成法律、税务、保险或移民建议的前提下，获得聚焦的下一步。"}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell support-grid">
          <div>
            <div className="support-section">
              <span className="eyebrow">
                {locale === "en" ? "COMMON QUESTIONS" : "常见问题"}
              </span>
              <h2>
                {locale === "en"
                  ? "What this demo does—and does not do"
                  : "本演示能做什么、不能做什么"}
              </h2>
              <div className="faq-list">
                {[
                  [
                    "Does Launchpad submit registrations or tax returns?",
                    "Launchpad prepares and tracks the journey. Official or qualified third-party services complete submissions; the demo does not transmit data.",
                    "Launchpad会提交注册或税务申报吗？",
                    "Launchpad帮助准备和跟踪流程。提交由官方或合格第三方服务完成；本演示不传输数据。",
                  ],
                  [
                    "Is this only for non-residents?",
                    "No. The target is Ontario small-business founders generally. Residency is asked only where it can change a route or trigger expert review.",
                    "该产品是否只面向非居民？",
                    "不是。目标用户是广泛的安省小企业创业者；仅在居住地可能改变路径或触发专家审查时询问。",
                  ],
                  [
                    "Where is my demo data stored?",
                    "Assessment answers, task statuses and simulated records stay in this browser's local storage until you reset them.",
                    "演示数据保存在哪里？",
                    "问诊回答、任务状态及模拟记录保存在此浏览器的本地存储中，直至您重置。",
                  ],
                  [
                    "Are prices and deadlines guaranteed?",
                    "No. Each item shows its source and verification date. Confirm current requirements on the official or provider website.",
                    "价格和截止日期是否有保证？",
                    "没有。每项信息都显示来源和核验日期，请在官方或服务商网站确认最新要求。",
                  ],
                ].map(([enQ, enA, zhQ, zhA]) => (
                  <details key={enQ}>
                    <summary>
                      {locale === "en" ? enQ : zhQ}
                      <Icon name="chevron" />
                    </summary>
                    <p>{locale === "en" ? enA : zhA}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="support-section" id="privacy">
              <span className="eyebrow">
                {locale === "en" ? "PRIVACY APPROACH" : "隐私原则"}
              </span>
              <h2>
                {locale === "en"
                  ? "Minimize before you secure"
                  : "先最小化，再谈保护"}
              </h2>
              <div className="privacy-principles">
                {[
                  [
                    "lock",
                    "No sensitive demo fields",
                    "不设置敏感演示字段",
                    "No SIN, passport, bank, tax-form, government-password or Company Key fields.",
                    "不设置SIN、护照、银行、税表、政府密码或Company Key字段。",
                  ],
                  [
                    "database",
                    "Browser-local state",
                    "浏览器本地状态",
                    "The prototype has no customer database, live file vault or production authentication.",
                    "原型没有客户数据库、真实文件库或生产级身份系统。",
                  ],
                  [
                    "users",
                    "Consent before sharing",
                    "共享前取得同意",
                    "The provider demo shows every shared field before creating a local referral record.",
                    "服务商演示会在创建本地转介记录前显示所有共享字段。",
                  ],
                ].map(([icon, en, zh, descEn, descZh]) => (
                  <div key={en}>
                    <Icon name={icon as "lock"} />
                    <span>
                      <b>{locale === "en" ? en : zh}</b>
                      <p>{locale === "en" ? descEn : descZh}</p>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="expert-form" id="expert">
            <DemoBadge locale={locale} compact />
            <span className="feature-icon">
              <Icon name="users" />
            </span>
            <h2>
              {locale === "en" ? "Prepare an expert handoff" : "准备专家转交"}
            </h2>
            <p>
              {locale === "en"
                ? "Create a demo support request using categories only. Do not enter names, identifiers or case details."
                : "仅使用问题类别创建演示支持请求。请勿输入姓名、标识符或个案详情。"}
            </p>
            {submitted ? (
              <div className="support-success">
                <Icon name="check" size={28} />
                <b>
                  {locale === "en" ? "Demo request prepared" : "演示请求已准备"}
                </b>
                <span>
                  {locale === "en"
                    ? "Nothing was transmitted. This status exists only in the current screen."
                    : "未传输任何信息，此状态仅存在于当前页面。"}
                </span>
              </div>
            ) : (
              <>
                <label>
                  <span>
                    {locale === "en" ? "Review category" : "审查类别"}
                  </span>
                  <select>
                    <option>
                      {locale === "en" ? "Business structure" : "企业结构"}
                    </option>
                    <option>
                      {locale === "en" ? "Tax registration" : "税务注册"}
                    </option>
                    <option>
                      {locale === "en"
                        ? "Permit or regulated activity"
                        : "许可或受监管活动"}
                    </option>
                    <option>{locale === "en" ? "Insurance" : "保险"}</option>
                  </select>
                </label>
                <label>
                  <span>{locale === "en" ? "Business stage" : "企业阶段"}</span>
                  <select>
                    <option>{locale === "en" ? "Planning" : "筹备中"}</option>
                    <option>{locale === "en" ? "Registered" : "已注册"}</option>
                    <option>{locale === "en" ? "Operating" : "经营中"}</option>
                  </select>
                </label>
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  <span>
                    {locale === "en"
                      ? "I understand this is a non-transmitting demo."
                      : "我理解这是不会发送数据的演示。"}
                  </span>
                </label>
                <button
                  className="btn btn-primary full"
                  disabled={!consent}
                  onClick={() => setSubmitted(true)}
                >
                  {locale === "en" ? "Prepare demo request" : "准备演示请求"}
                  <Icon name="arrow" />
                </button>
              </>
            )}
          </aside>
        </div>
      </section>
      <section className="section muted">
        <div className="shell disclaimer-panel">
          <div>
            <Icon name="shield" />
            <div>
              <h2>
                {locale === "en"
                  ? "Independent-platform disclosure"
                  : "独立平台声明"}
              </h2>
              <p>
                {locale === "en"
                  ? "Canada Business Launchpad is not a government service, law firm, CPA firm, insurance broker or immigration adviser. It provides general planning information from cited sources. Third-party services have their own eligibility, terms, privacy practices and fees."
                  : "Canada Business Launchpad并非政府服务、律师事务所、会计师事务所、保险经纪或移民顾问。平台依据引用来源提供一般规划信息。第三方服务有各自的资格、条款、隐私政策及费用。"}
              </p>
            </div>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => commit(demoRepository.reset())}
          >
            <Icon name="reset" />
            {locale === "en" ? "Reset local demo data" : "重置本地演示数据"}
          </button>
        </div>
      </section>
    </main>
  );
}

function AdminPage({
  locale,
  view,
  state,
}: {
  locale: Locale;
  view: string;
  state: DemoState;
}) {
  const [notice, setNotice] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [draftText, setDraftText] = useState(
    locale === "en" ? "Review source before next release" : "下次发布前复核来源",
  );
  const [bilingualReviewed, setBilingualReviewed] = useState(false);
  const [contentReviewed, setContentReviewed] = useState(false);
  const editorRef = useRef<HTMLElement>(null);
  const editorSnapshot = useRef({
    draftText,
    bilingualReviewed,
    contentReviewed,
  });
  const openEditor = () => {
    editorSnapshot.current = {
      draftText,
      bilingualReviewed,
      contentReviewed,
    };
    setEditorOpen(true);
  };
  const cancelEditor = () => {
    setDraftText(editorSnapshot.current.draftText);
    setBilingualReviewed(editorSnapshot.current.bilingualReviewed);
    setContentReviewed(editorSnapshot.current.contentReviewed);
    setEditorOpen(false);
  };
  useEffect(() => {
    if (!editorOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDraftText(editorSnapshot.current.draftText);
        setBilingualReviewed(editorSnapshot.current.bilingualReviewed);
        setContentReviewed(editorSnapshot.current.contentReviewed);
        setEditorOpen(false);
        return;
      }
      if (event.key !== "Tab" || !editorRef.current) return;
      const focusable = Array.from(
        editorRef.current.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex='-1'])",
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previous?.focus();
    };
  }, [editorOpen]);
  const tabs = [
    ["rules", "Rules", "规则"],
    ["sources", "Sources", "来源"],
    ["tasks", "Tasks", "任务"],
    ["providers", "Providers", "服务商"],
    ["referrals", "Referrals", "转介"],
  ];
  const title = tabs.find((x) => x[0] === view) ?? tabs[0];
  return (
    <main className="admin-page">
      <div inert={editorOpen} aria-hidden={editorOpen || undefined}>
      <div className="admin-bar">
        <div className="shell">
          <div>
            <span className="brand-mark">
              <span>CB</span>
            </span>
            <b>Launchpad Ops</b>
            <DemoBadge locale={locale} compact />
          </div>
          <div>
            <AppLink locale={locale} href="/demo">
              {locale === "en" ? "Exit admin" : "退出后台"}
            </AppLink>
            <a
              className="language-link"
              href={route(locale === "en" ? "zh" : "en", `/admin/${view}`)}
            >
              <Icon name="globe" size={16} />
              {locale === "en" ? "中文" : "EN"}
            </a>
            <span className="avatar">OP</span>
          </div>
        </div>
      </div>
      <div className="shell admin-shell">
        <aside className="admin-nav">
          <small>{locale === "en" ? "CONTENT OPERATIONS" : "内容运营"}</small>
          {tabs.map(([key, en, zh]) => (
            <AppLink
              key={key}
              locale={locale}
              href={`/admin/${key}`}
              className={view === key ? "active" : ""}
            >
              <Icon
                name={
                  key === "sources"
                    ? "shield"
                    : key === "tasks"
                      ? "file"
                      : key === "providers"
                        ? "briefcase"
                        : key === "referrals"
                          ? "users"
                          : "settings"
                }
              />
              {locale === "en" ? en : zh}
              <span>
                {key === "sources"
                  ? sources.length
                  : key === "tasks"
                    ? tasks.length
                    : key === "providers"
                      ? providers.length
                      : key === "referrals"
                        ? state.referrals.length
                        : "8"}
              </span>
            </AppLink>
          ))}
          <div className="workspace-demo-note">
            <Icon name="database" />
            <b>{locale === "en" ? "Browser-only demo" : "仅浏览器演示"}</b>
            <span>
              {locale === "en" ? "No publishing backend" : "无发布后台"}
            </span>
          </div>
        </aside>
        <section className="admin-content">
          <div className="admin-head">
            <div>
              <span className="eyebrow">
                {locale === "en" ? "LIGHT OPERATIONS CONSOLE" : "轻量运营后台"}
              </span>
              <h1>{locale === "en" ? title[1] : title[2]}</h1>
              <p>
                {locale === "en"
                  ? "Preview content governance and operational states without a production backend."
                  : "在没有生产后台的情况下预览内容治理和运营状态。"}
              </p>
            </div>
            <div className="admin-head-actions">
              <button
                className="btn btn-outline"
                onClick={openEditor}
              >
                <Icon name="file" />
                {locale === "en" ? "Edit demo draft" : "编辑演示草稿"}
              </button>
              <button
                className="btn btn-primary"
                onClick={() =>
                  setNotice(
                    bilingualReviewed && contentReviewed
                      ? locale === "en"
                        ? "Reviewed demo draft published in this screen only. No production content changed."
                        : "已在当前页面模拟发布经审核草稿，未修改任何生产内容。"
                      : locale === "en"
                        ? "Demo publish blocked: complete bilingual and content review first."
                        : "模拟发布已阻止：请先完成双语与内容审核。",
                  )
                }
              >
                <Icon name="check" />
                {locale === "en" ? "Simulate publish" : "模拟发布"}
              </button>
            </div>
          </div>
          {notice && (
            <div className="admin-notice">
              <Icon name="check" />
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label={locale === "en" ? "Dismiss notice" : "关闭通知"}
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          )}
          <div className="admin-governance" aria-label={locale === "en" ? "Governance status" : "治理状态"}>
            <span>
              <b>EN / 中文</b>
              {bilingualReviewed
                ? locale === "en"
                  ? "Reviewed"
                  : "已审核"
                : locale === "en"
                  ? "Review pending"
                  : "待审核"}
            </span>
            <span>
              <b>{locale === "en" ? "Content review" : "内容审核"}</b>
              {contentReviewed
                ? locale === "en"
                  ? "Approved in demo"
                  : "演示中已批准"
                : locale === "en"
                  ? "Draft"
                  : "草稿"}
            </span>
            <span>
              <b>{locale === "en" ? "Exception routes" : "异常路径"}</b>
              {scenarios.filter((scenario) => scenario.boundary).length}{" "}
              {locale === "en" ? "need expert review" : "条需专家审查"}
            </span>
          </div>
          {view === "rules" && <RulesView locale={locale} />}{" "}
          {view === "sources" && <SourcesView locale={locale} />}{" "}
          {view === "tasks" && <TasksView locale={locale} />}{" "}
          {view === "providers" && <ProvidersView locale={locale} />}{" "}
          {view === "referrals" && (
            <ReferralsView locale={locale} state={state} />
          )}
        </section>
      </div>
      </div>
      {editorOpen && (
        <div className="modal-backdrop">
          <section
            ref={editorRef}
            className="admin-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-editor-title"
          >
            <button
              className="modal-close"
              onClick={cancelEditor}
              aria-label={locale === "en" ? "Close editor" : "关闭编辑器"}
            >
              <Icon name="x" />
            </button>
            <DemoBadge locale={locale} compact />
            <h2 id="admin-editor-title">
              {locale === "en" ? "Edit a browser-only demo draft" : "编辑仅浏览器演示草稿"}
            </h2>
            <p>
              {locale === "en"
                ? "This illustrates the review workflow. Changes are not persisted or sent to a production system."
                : "此处仅展示审核流程，修改不会持久化或发送至生产系统。"}
            </p>
            <label>
              <span>{locale === "en" ? "Internal draft note" : "内部草稿备注"}</span>
              <input
                autoFocus
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
              />
            </label>
            <label className="consent-check">
              <input
                type="checkbox"
                checked={bilingualReviewed}
                onChange={(event) => setBilingualReviewed(event.target.checked)}
              />
              <span>{locale === "en" ? "English and Chinese reviewed" : "英文与中文均已审核"}</span>
            </label>
            <label className="consent-check">
              <input
                type="checkbox"
                checked={contentReviewed}
                onChange={(event) => setContentReviewed(event.target.checked)}
              />
              <span>{locale === "en" ? "Source and professional boundary reviewed" : "来源与专业边界已审核"}</span>
            </label>
            <button
              className="btn btn-primary full"
              disabled={!draftText.trim()}
              onClick={() => {
                setEditorOpen(false);
                setNotice(
                  locale === "en"
                    ? "Demo draft saved in the current screen."
                    : "演示草稿已保存在当前页面。",
                );
              }}
            >
              {locale === "en" ? "Save demo draft" : "保存演示草稿"}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function AdminStats({ items }: { items: Array<[string, string, string]> }) {
  return (
    <div className="admin-stats">
      {items.map(([value, label, tone]) => (
        <article key={label} className={tone}>
          <span>{value}</span>
          <b>{label}</b>
        </article>
      ))}
    </div>
  );
}
function RulesView({ locale }: { locale: Locale }) {
  const rules = [
    {
      id: "R-001",
      trigger: "structure = corporation",
      result: "Add incorporation, records, annual return, T2 and ISC tasks",
      source: "Ontario / CRA",
      status: "Reviewed",
    },
    {
      id: "R-002",
      trigger: "revenue = near / over 30k",
      result:
        "Prioritize the GST/HST decision; require returns only after confirmed registration",
      source: "CRA",
      status: "Reviewed",
    },
    {
      id: "R-003",
      trigger: "employees = hiring / existing",
      result: "Add payroll, WSIB, posters and employment baseline",
      source: "CRA / Ontario / WSIB",
      status: "Reviewed",
    },
    {
      id: "R-004",
      trigger: "imports = true",
      result: "Add CARM and import-export readiness",
      source: "CBSA / CRA",
      status: "Reviewed",
    },
    {
      id: "R-005",
      trigger: "city = Toronto",
      result: "Add municipal and location check",
      source: "Toronto / BizPaL",
      status: "Reviewed",
    },
    {
      id: "R-006",
      trigger: "regulated or complex cross-province",
      result: "Stop definitive rules at expert review",
      source: "Policy boundary",
      status: "Reviewed",
    },
    {
      id: "R-007",
      trigger: "complex residency = true",
      result: "Route structure and CRA access to expert review",
      source: "Policy boundary",
      status: "Reviewed",
    },
    {
      id: "R-008",
      trigger: "every scenario",
      result: "Add permit scan, records and change review",
      source: "Ontario / CRA",
      status: "Reviewed",
    },
  ];
  return (
    <>
      <AdminStats
        items={[
          [
            "8",
            locale === "en" ? "Active demo rules" : "启用的演示规则",
            "blue",
          ],
          ["8/8", locale === "en" ? "Reviewed" : "已审核", "teal"],
          ["0", locale === "en" ? "P0 errors" : "P0错误", "gold"],
        ]}
      />
      <div className="admin-table">
        <div className="admin-table-row head">
          <span>ID</span>
          <span>{locale === "en" ? "Trigger" : "触发条件"}</span>
          <span>{locale === "en" ? "Result" : "结果"}</span>
          <span>{locale === "en" ? "Authority" : "依据"}</span>
          <span>{locale === "en" ? "Status" : "状态"}</span>
        </div>
        {rules.map((rule) => (
          <div className="admin-table-row" key={rule.id}>
            <span>
              <code>{rule.id}</code>
            </span>
            <span>{rule.trigger}</span>
            <span>{rule.result}</span>
            <span>{rule.source}</span>
            <span>
              <i className="verified-dot" />
              {rule.status}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
function SourcesView({ locale }: { locale: Locale }) {
  return (
    <>
      <AdminStats
        items={[
          [
            String(sources.length),
            locale === "en" ? "Authoritative sources" : "权威来源",
            "blue",
          ],
          [
            String(sources.filter((s) => s.status === "verified").length),
            locale === "en" ? "Current" : "当前有效",
            "teal",
          ],
          ["3", locale === "en" ? "Jurisdictions" : "适用辖区", "gold"],
        ]}
      />
      <div className="admin-table sources-table">
        <div className="admin-table-row head">
          <span>{locale === "en" ? "Authority" : "发布机构"}</span>
          <span>{locale === "en" ? "Source" : "来源"}</span>
          <span>{locale === "en" ? "Jurisdiction" : "辖区"}</span>
          <span>{locale === "en" ? "Last verified" : "最近核验"}</span>
          <span>{locale === "en" ? "Cadence" : "频率"}</span>
        </div>
        {sources.map((source) => (
          <div className="admin-table-row" key={source.id}>
            <span>
              <b>{source.authority}</b>
            </span>
            <span>
              <a href={source.url} target="_blank" rel="noreferrer">
                {l(source.title, locale)}
                <Icon name="external" size={12} />
              </a>
            </span>
            <span>{source.jurisdiction}</span>
            <span>
              <i className="verified-dot" />
              {source.verified}
            </span>
            <span>{l(source.cadence, locale)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
function TasksView({ locale }: { locale: Locale }) {
  return (
    <>
      <AdminStats
        items={[
          [
            String(tasks.length),
            locale === "en" ? "Task titles" : "任务标题",
            "blue",
          ],
          [
            String(tasks.filter((t) => t.full).length),
            locale === "en" ? "Full task cards" : "完整任务卡",
            "teal",
          ],
          ["5", locale === "en" ? "Lifecycle phases" : "生命周期阶段", "gold"],
        ]}
      />
      <div className="admin-table tasks-table">
        <div className="admin-table-row head">
          <span>#</span>
          <span>{locale === "en" ? "Task" : "任务"}</span>
          <span>{locale === "en" ? "Phase" : "阶段"}</span>
          <span>{locale === "en" ? "Content" : "内容"}</span>
          <span>{locale === "en" ? "Sources" : "来源"}</span>
        </div>
        {tasks.map((task) => (
          <div className="admin-table-row" key={task.id}>
            <span>{task.number}</span>
            <span>
              <b>{l(task.title, locale)}</b>
              <small>{task.id}</small>
            </span>
            <span>{task.phase.replace("_", " ")}</span>
            <span>
              <span className={`content-state ${task.full ? "full" : "title"}`}>
                {task.full
                  ? locale === "en"
                    ? "Full card"
                    : "完整卡片"
                  : locale === "en"
                    ? "Title mapped"
                    : "已梳理标题"}
              </span>
            </span>
            <span>{task.sourceIds.length}</span>
          </div>
        ))}
      </div>
    </>
  );
}
function ProvidersView({ locale }: { locale: Locale }) {
  return (
    <>
      <AdminStats
        items={[
          [
            String(providers.length),
            locale === "en" ? "Listed routes" : "已列路径",
            "blue",
          ],
          ["2", locale === "en" ? "Official routes" : "官方路径", "teal"],
          ["0", locale === "en" ? "Live agreements" : "真实协议", "gold"],
        ]}
      />
      <div className="admin-table providers-table">
        <div className="admin-table-row head">
          <span>{locale === "en" ? "Provider" : "服务商"}</span>
          <span>{locale === "en" ? "Type" : "类型"}</span>
          <span>{locale === "en" ? "Category" : "类别"}</span>
          <span>{locale === "en" ? "Price source" : "价格来源"}</span>
          <span>{locale === "en" ? "Disclosure" : "披露"}</span>
        </div>
        {providers.map((p) => (
          <div className="admin-table-row" key={p.id}>
            <span>
              <b>{p.name}</b>
            </span>
            <span>
              <ProviderType type={p.type} locale={locale} />
            </span>
            <span>{l(p.category, locale)}</span>
            <span>{l(p.priceSource, locale)}</span>
            <span>
              {p.commercialDisclosure
                ? locale === "en"
                  ? "Attached"
                  : "已附"
                : locale === "en"
                  ? "Not commercial"
                  : "非商业"}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
function ReferralsView({
  locale,
  state,
}: {
  locale: Locale;
  state: DemoState;
}) {
  return (
    <>
      <AdminStats
        items={[
          [
            String(state.referrals.length),
            locale === "en" ? "Local demo referrals" : "本地演示转介",
            "blue",
          ],
          [
            String(state.consents.length),
            locale === "en" ? "Consent records" : "同意记录",
            "teal",
          ],
          [
            "0",
            locale === "en" ? "Externally transmitted" : "外部发送",
            "gold",
          ],
        ]}
      />
      {state.referrals.length === 0 ? (
        <div className="empty-state">
          <Icon name="users" size={34} />
          <h3>
            {locale === "en" ? "No simulated referrals yet" : "尚无模拟转介"}
          </h3>
          <p>
            {locale === "en"
              ? "Create one from the provider directory to see it here."
              : "从服务商目录创建转介后，将在此显示。"}
          </p>
          <AppLink
            locale={locale}
            href="/providers"
            className="btn btn-outline"
          >
            {locale === "en" ? "Open directory" : "打开目录"}
          </AppLink>
        </div>
      ) : (
        <div className="admin-table referral-table">
          <div className="admin-table-row head">
            <span>ID</span>
            <span>{locale === "en" ? "Provider" : "服务商"}</span>
            <span>{locale === "en" ? "Journey" : "旅程"}</span>
            <span>{locale === "en" ? "Created" : "创建时间"}</span>
            <span>{locale === "en" ? "Status" : "状态"}</span>
          </div>
          {state.referrals.map((r) => (
            <div className="admin-table-row" key={r.id}>
              <span>
                <code>{r.id}</code>
              </span>
              <span>{providers.find((p) => p.id === r.providerId)?.name}</span>
              <span>{r.scenarioId}</span>
              <span>
                {new Date(r.createdAt).toLocaleString(
                  locale === "en" ? "en-CA" : "zh-CN",
                )}
              </span>
              <span>
                <i className="verified-dot" />
                {locale === "en" ? "Demo received" : "演示已接收"}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function LaunchpadApp({ locale, path = [] }: PageProps) {
  const { state, commit, hydrated } = useDemoState();
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-Hans" : "en-CA";
    document.documentElement.dataset.launchpadReady = "true";
    return () => {
      delete document.documentElement.dataset.launchpadReady;
    };
  }, [locale]);
  const page = path[0] ?? "home";
  let content: React.ReactNode;
  if (page === "home") content = <HomePage locale={locale} />;
  else if (page === "product") content = <ProductPage locale={locale} />;
  else if (page === "partners") content = <PartnersPage locale={locale} />;
  else if (page === "demo")
    content = <DemoPage locale={locale} state={state} commit={commit} />;
  else if (page === "assessment")
    content = (
      <AssessmentPage
        locale={locale}
        state={state}
        hydrated={hydrated}
        commit={commit}
      />
    );
  else if (page === "workspace")
    return (
      <WorkspacePage
        locale={locale}
        scenarioId={path[1] ?? state.activeScenarioId}
        state={state}
        hydrated={hydrated}
        commit={commit}
      />
    );
  else if (page === "tasks")
    return (
      <TaskPage
        locale={locale}
        taskId={path[1] ?? "choose-structure"}
        state={state}
        commit={commit}
      />
    );
  else if (page === "calendar")
    return <CalendarPage locale={locale} state={state} commit={commit} />;
  else if (page === "providers")
    return <ProvidersPage locale={locale} state={state} commit={commit} />;
  else if (page === "assistant")
    return <AssistantPage locale={locale} state={state} commit={commit} />;
  else if (page === "support")
    content = <SupportPage locale={locale} commit={commit} />;
  else if (page === "admin")
    return (
      <AdminPage locale={locale} view={path[1] ?? "rules"} state={state} />
    );
  else content = <HomePage locale={locale} />;
  return (
    <AppShell locale={locale} active={page} currentPath={path}>
      {content}
    </AppShell>
  );
}

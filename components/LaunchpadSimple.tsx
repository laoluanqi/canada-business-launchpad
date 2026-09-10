"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Building2, CalendarCheck, Check, CheckCircle2, ChevronDown, ChevronRight, Circle, ExternalLink, Home, Info, Lightbulb, ListChecks, Loader2, MapPin, Monitor, Pencil, RefreshCw, Rocket, Shapes, ShieldCheck, Sparkles, Users, Wallet, X, BriefcaseBusiness, Megaphone } from "lucide-react";
import type { Locale } from "@/lib/types";
import { getLaunchStep, launchServices, launchStages, launchSteps } from "@/lib/launchpad-catalog";
import type { LaunchService, LaunchStep } from "@/lib/launchpad-catalog";
import { emptyLaunchJourney, exampleLaunchJourney, launchCities, launchStatuses, launchSummary } from "@/lib/launchpad-progress";
import type { LaunchJourney, LaunchStatus } from "@/lib/launchpad-progress";

type Tab = "home" | "process" | "services";
type Location = { tab: Tab; step: string; stage: string; category: string; example: boolean };
const defaultLocation: Location = { tab: "home", step: "", stage: "", category: "all", example: false };
const stageIcons = [Lightbulb, Sparkles, Building2, Monitor, Wallet, BriefcaseBusiness, Megaphone, CalendarCheck];
const statusLabels: Record<LaunchStatus, { en: string; zh: string }> = {
  not_started: { en: "Not started", zh: "未开始" }, in_progress: { en: "In progress", zh: "进行中" }, done: { en: "Completed by me", zh: "我已完成" }, not_needed: { en: "Not needed now", zh: "暂不需要" },
};
function readLocation(): Location {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  const step = getLaunchStep(params.get("step") ?? "");
  const stage = step?.stage ?? launchStages.find(item => item.id === params.get("stage"))?.id ?? "";
  return { tab: tab === "process" || tab === "services" ? tab : "home", step: step?.id ?? "", stage, category: launchStages.some(item => item.id === params.get("category")) ? params.get("category")! : "all", example: params.get("case") === "service-business" };
}
function queryFor(location: Location) {
  const params = new URLSearchParams({ tab: location.tab });
  if (location.step) params.set("step", location.step);
  if (location.stage) params.set("stage", location.stage);
  if (location.category !== "all") params.set("category", location.category);
  if (location.example) params.set("case", "service-business");
  return `?${params}`;
}

export function LaunchpadSimple({ locale }: { locale: Locale }) {
  const t = (en: string, zh: string) => locale === "en" ? en : zh;
  const [location, setLocation] = useState<Location>(defaultLocation);
  const [journey, setJourney] = useState<LaunchJourney>(emptyLaunchJourney);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const inFlight = useRef(false);
  async function reload() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/journey", { cache: "no-store" });
      const data = await response.json() as { journey: LaunchJourney | null; error?: string };
      if (!response.ok) throw new Error(data.error);
      setJourney(data.journey ?? emptyLaunchJourney()); setLoaded(true);
    } catch (e) { setError(e instanceof Error ? e.message : "storage_unavailable"); }
    finally { inFlight.current = false; setBusy(false); }
  }
  useEffect(() => {
    const restore = () => { setLocation(readLocation()); setNotice(""); };
    const frame = requestAnimationFrame(() => { restore(); void reload(); });
    window.addEventListener("popstate", restore);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("popstate", restore); };
  }, []);
  function navigate(tab: Tab, options: Partial<Omit<Location, "tab">> = {}) {
    const next: Location = { ...defaultLocation, tab, example: location.example, ...options };
    const href = `/${locale}/start${queryFor(next)}`;
    if (`${window.location.pathname}${window.location.search}` !== href) window.history.pushState(null, "", href);
    setLocation(next); setNotice("");
    requestAnimationFrame(() => {
      const target = next.tab === "process" ? document.getElementById(next.step ? `lp-step-${next.step}` : `lp-stage-${next.stage}`) : null;
      if (target) target.scrollIntoView({ block: "start", behavior: "instant" });
      else window.scrollTo({ top: 0, behavior: "instant" });
    });
  }
  async function save(command: Record<string, unknown>): Promise<boolean> {
    if (location.example || !loaded || error || inFlight.current) return false;
    inFlight.current = true; setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/journey", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...command, journeyId: journey.id, revision: journey.revision }) });
      const data = await response.json() as { journey: LaunchJourney; error?: string };
      if (!response.ok) throw new Error(data.error);
      setJourney(data.journey);
      if (command.type !== "visit") setNotice(t("Saved to your checklist.", "已保存到你的清单。"));
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "storage_unavailable"); return false; }
    finally { inFlight.current = false; setBusy(false); }
  }
  const view = location.example ? exampleLaunchJourney() : journey;
  const summary = launchSummary(view);
  const selected = getLaunchStep(location.step);
  const canSave = loaded && !busy && !error && !location.example;
  const name = location.example ? t("Small service business", "小型服务企业参考路线") : view.profile.name || t("My Ontario business", "我的安省企业");
  const servicesFor = (step: LaunchStep) => launchServices.filter(service => step.services.includes(service.id)).sort((a, b) => Number(b.official) - Number(a.official));
  const filteredServices = launchServices.filter(service => selected ? selected.services.includes(service.id) : location.category === "all" || service.category === location.category).sort((a, b) => Number(b.official) - Number(a.official));
  const goStep = (step: LaunchStep) => navigate("process", { step: step.id, stage: step.stage });
  const visit = (service: LaunchService, step = selected) => { if (step && canSave) void save({ type: "visit", stepId: step.id, serviceId: service.id }); };

  return <div className="lp-app" data-journey-ready={loaded && !busy}>
    <a className="lp-skip" href="#lp-content">{t("Skip to content", "跳至内容")}</a>
    <header className="lp-header">
      <a className="lp-brand" href={`/${locale}/start`} aria-label="Canada Business Launchpad"><span className="lp-brand-icon"><Rocket size={23}/></span><span>Launchpad<small>CANADA BUSINESS</small></span></a>
      <nav aria-label={t("Main navigation", "主导航")}>{([{ id: "home", en: "Home", zh: "首页", icon: Home }, { id: "process", en: "Process", zh: "创业流程", icon: ListChecks }, { id: "services", en: "Services", zh: "服务目录", icon: Shapes }] as const).map(item => <button key={item.id} className={location.tab === item.id ? "active" : ""} aria-current={location.tab === item.id ? "page" : undefined} onClick={() => navigate(item.id)}><item.icon size={18}/><span>{item.en}{locale === "zh" && <small>{item.zh}</small>}</span></button>)}</nav>
      <a className="lp-language" aria-label={t("Switch to Chinese", "切换为英文")} href={`/${locale === "en" ? "zh" : "en"}/start${queryFor(location)}`}>{locale === "en" ? "中文" : "EN"}</a>
    </header>
    <main className="lp-main" id="lp-content">
      <div className="lp-topline"><span className="lp-pilot"><span/> Ontario Pilot</span><span className="lp-save-indicator" role="status">{location.example ? t("Reference route · read only", "参考路线 · 只读") : busy ? <><Loader2 size={14} className="spin"/>{t("Saving / loading", "正在保存或读取")}</> : error ? t("Not saved", "尚未保存") : loaded ? <><CheckCircle2 size={14}/>{journey.id ? t("Progress saved", "进度已保存") : t("Your own checklist", "你的专属清单")}</> : t("Loading", "正在读取")}</span></div>
      {error && <div className="lp-error" role="alert"><div><b>{error === "conflict" ? t("This checklist changed in another tab.", "其他页面已更新这份清单。") : t("Your latest change has not been saved.", "本次修改尚未保存。")}</b><p>{t("Reload the saved version, then try again. Your previous records have not been replaced.", "请重新读取已保存版本后再试，原有记录未被覆盖。")}</p></div><button className="lp-secondary" onClick={() => void reload()} disabled={busy}><RefreshCw size={16}/>{t("Reload", "重新读取")}</button></div>}
      {location.example && <div className="lp-case-banner"><Info size={20}/><div><b>{t("A reference route for a two-person service business", "两人服务企业的参考路线")}</b><p>{t("Illustrative progress, not a real company's records. Your own checklist stays separate.", "示例进度，不代表某家公司的真实记录；不会改变你自己的清单。")}</p></div><button className="lp-secondary" onClick={() => navigate("home", { example: false })}>{t("Back to my checklist", "回到我的清单")}<ArrowRight size={16}/></button></div>}
      {notice && <div className="lp-notice" role="status"><CheckCircle2 size={17}/>{notice}</div>}

      {location.tab === "home" && <>
        <div className="lp-heading"><p className="lp-eyebrow">{t("YOUR BUSINESS STARTS HERE", "从这里开始你的创业之旅")}</p><h1>{t("A clear next step.", "下一步，清清楚楚。")}</h1><p>{t("Your startup steps and the services to help you move forward.", "把创业步骤和相关服务放在一起，按自己的节奏推进。")}</p></div>
        <div className="lp-home-grid">
<section className="lp-next"><span className="lp-small-label">{summary.next ? t("UP NEXT", "下一步") : t("YOUR CHECKLIST", "你的清单")}</span><div className="lp-next-number" aria-hidden="true">{summary.next ? String(launchStages.findIndex(s => s.id === summary.next?.stage) + 1).padStart(2, "0") : <Check size={78}/>}</div><h2>{summary.next?.title[locale] ?? (summary.done ? t("Your startup checklist is up to date.", "这份创业清单已处理完成。") : t("All steps set aside for now.", "所有步骤已标记暂不需要。"))}</h2><p>{summary.next?.purpose[locale] ?? t("Review your records whenever your business changes. This is not confirmation of legal or tax compliance.", "业务情况变化后可随时回来复核。这不代表企业已满足法律或税务要求。")}</p><button className="lp-primary" onClick={() => summary.next ? goStep(summary.next) : navigate("process")}>{summary.next ? t("Continue my process", "继续我的流程") : t("Review my checklist", "复核我的清单")}<ArrowRight size={18}/></button></section>
<section className="lp-card lp-overview"><div className="lp-card-top"><span className="lp-kicker"><Building2 size={18}/>{location.example ? t("REFERENCE BUSINESS", "参考企业") : t("MY BUSINESS", "我的企业")}</span>{!location.example && <button className="lp-icon-button" aria-label={t("Edit business details", "编辑企业资料")} disabled={!loaded || busy || !!error} onClick={() => setProfileOpen(true)}><Pencil size={16}/></button>}</div><h2>{name}</h2><p className="lp-business-facts"><span><MapPin size={14}/>{view.profile.city}</span><span><Users size={14}/>{view.profile.team} {t(view.profile.team === 1 ? "person" : "people", "人团队")}</span><span>{t("Service business", "服务型企业")}</span></p><div className="lp-progress-label"><b>{t("Your progress", "我的进度")}</b><span data-testid="lp-progress">{summary.done} / {summary.total}</span></div><div className="lp-progress-track" role="progressbar" aria-label={t("Checklist completion", "清单完成进度")} aria-valuenow={summary.percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${summary.percent}%` }}/></div><p className="lp-meta">{summary.remaining} {t("steps to go", "项待处理")}{summary.skipped > 0 && ` · ${summary.skipped} ${t("not needed now", "项暂不需要")}`}</p><div className="lp-mini-flow"><span><Check size={16}/>{t("Find a step", "找到步骤")}</span><ChevronRight size={14}/><span>{t("Choose a service", "选择服务")}</span><ChevronRight size={14}/><span>{t("Keep going", "继续推进")}</span></div></section>
        </div>
        <section className="lp-section"><div className="lp-section-heading"><h2>{t("Your road to opening", "从想法到开始经营")}</h2><button className="lp-text-button" onClick={() => navigate("process")}>{t("View all steps", "查看所有步骤")}<ArrowRight size={16}/></button></div><div className="lp-stage-grid">{launchStages.map((stage, index) => { const Icon = stageIcons[index]; const completed = launchSteps.filter(s => s.stage === stage.id && view.records[s.id]?.status === "done").length; return <button className="lp-stage-tile" key={stage.id} onClick={() => navigate("process", { stage: stage.id })}><span>{String(index + 1).padStart(2, "0")}</span><Icon className="lp-tile-icon" size={19}/><h3>{stage.title[locale]}</h3><p>{stage.description[locale]}</p><small>{completed}/3 {t("completed", "已完成")}</small></button>; })}</div></section>
        {!location.example && <section className="lp-reference"><div><b>{t("See how a small business can get started", "看看一家小企业可以怎样开始")}</b><p>{t("Explore an example route. It will not change your progress.", "浏览一条参考路线，不会改变你的进度。")}</p></div><button className="lp-text-button" onClick={() => navigate("home", { example: true })}>{t("Explore reference route", "查看参考路线")}<ArrowRight size={16}/></button></section>}
      </>}

      {location.tab === "process" && <>
        <div className="lp-heading"><p className="lp-eyebrow">PROCESS</p><h1>{t("One step at a time.", "一步一步，开始经营。")}</h1><p>{t("24 steps across 8 stages. Start anywhere and skip what you do not need.", "8 个阶段，24 个步骤。可从任意一步开始，跳过暂不需要的事项。")}</p></div>
        <div className="lp-process-summary"><span><CheckCircle2 size={18}/>{summary.done} {t("completed", "已完成")}</span><span>{summary.remaining} {t("remaining", "待处理")}</span><span>{summary.skipped} {t("not needed now", "暂不需要")}</span><small>{t("Your records, not an approval status", "个人记录，不是审批状态")}</small></div>
        <div className="lp-process-list">{launchStages.map((stage, index) => {
          const open = location.stage === stage.id;
          const steps = launchSteps.filter(s => s.stage === stage.id);
          const Icon = stageIcons[index];
          const count = steps.filter(s => view.records[s.id]?.status === "done").length;
          return <section className={`lp-stage-card ${open ? "is-open" : ""}`} key={stage.id} id={`lp-stage-${stage.id}`}>
            <button className="lp-stage-toggle" aria-expanded={open} aria-controls={`lp-group-${stage.id}`} onClick={() => navigate("process", { stage: open ? "" : stage.id })}><span className="lp-stage-number">{index + 1}</span><Icon className="lp-stage-symbol" size={26}/><span className="lp-stage-title"><h2>{stage.title[locale]}</h2><p>{stage.description[locale]}</p></span><span className="lp-stage-count">{count}/3</span><ChevronDown className={open ? "lp-rotated" : ""} size={20}/></button>
            {open && <div className="lp-stage-body" id={`lp-group-${stage.id}`}>{steps.map(step => {
              const record = view.records[step.id]; const status = record?.status ?? "not_started"; const active = selected?.id === step.id;
              return <div className={`lp-step ${active ? "is-selected" : ""}`} key={step.id} id={`lp-step-${step.id}`}>
                <button className="lp-step-row" aria-expanded={active} aria-controls={`lp-detail-${step.id}`} onClick={() => navigate("process", { stage: stage.id, step: active ? "" : step.id })}><span className={`lp-step-check ${status}`}>{status === "done" ? <Check size={16}/> : status === "in_progress" ? <Circle size={12}/> : status === "not_needed" ? "–" : null}</span><span className="lp-step-name">{step.title[locale]}</span><span className={`lp-status ${status}`}>{statusLabels[status][locale]}</span><ChevronRight className={active ? "lp-rotated-right" : ""} size={16}/></button>
                {active && <div className="lp-step-detail" id={`lp-detail-${step.id}`}>
                  <p className="lp-step-purpose">{step.purpose[locale]}</p><p className="lp-step-hint"><Info size={15}/>{step.applicability[locale]}</p>
                  <div className="lp-section-heading"><h3>{t("Services for this step", "这一步可以找谁")}</h3><button className="lp-text-button" onClick={() => navigate("services", { step: step.id, stage: stage.id })}>{t("Compare options", "查看相关服务")}<ArrowRight size={15}/></button></div>
                  <div className="lp-related-services">{servicesFor(step).map(service => <a className="lp-related-service" key={service.id} href={service.url} target="_blank" rel="noopener noreferrer" onClick={() => visit(service, step)}><span className="lp-service-monogram">{service.initials}</span><span><b>{service.name}</b><small>{service.official ? t("Official resource", "官方资源") : t("Independent service", "第三方服务")}</small></span><ArrowUpRight size={18}/></a>)}</div>
                  <p className="lp-external-hint"><ExternalLink size={14}/>{t("Opens a new tab. Setup and applications stay on the provider's website.", "在新标签页打开，具体设置与办理在对方网站完成。")}</p>
                  {record?.serviceId && <div className="lp-return-note"><CheckCircle2 size={17}/><span>{t("Last service visited: ", "上次访问的服务：")}{launchServices.find(s => s.id === record.serviceId)?.name}{t(". Back from their website? Update your progress below.", "。从对方网站回来后，可以在下方更新进度。")}</span></div>}
                  <div className="lp-status-editor"><div><b>{t("Where are you with this step?", "这一步进行到哪里了？")}</b><p>{t("Update this yourself. No external results are synced.", "由你自行记录，不自动同步外部办理结果。")}</p></div><div className="lp-status-actions">{launchStatuses.map(value => <button type="button" key={value} disabled={!canSave} aria-pressed={status === value} className={`lp-state-button ${status === value ? "active" : ""}`} onClick={() => void save({ type: "status", stepId: step.id, status: value })}>{value === "done" && <Check size={15}/>} {statusLabels[value][locale]}</button>)}</div></div>
                  {location.example && <p className="lp-meta">{t("This reference is read only. Return to your own checklist to record progress.", "参考路线只供浏览；回到自己的清单后即可记录进度。")}</p>}
                  {(status === "done" || status === "not_needed") && <div className="lp-step-continue"><span>{statusLabels[status][locale]}</span><button className="lp-secondary" onClick={() => summary.next ? goStep(summary.next) : navigate("home")}>{summary.next ? t("Continue to the next step", "继续下一步") : t("Back to my overview", "返回首页")}<ArrowRight size={16}/></button></div>}
                </div>}
              </div>;
            })}</div>}
          </section>;
        })}</div>
      </>}

      {location.tab === "services" && <>
        <div className="lp-heading"><p className="lp-eyebrow">SERVICES</p><h1>{selected ? selected.title[locale] : t("The right help for your next step.", "找到下一步需要的服务。")}</h1><p>{selected ? t("Choose a service, then return to your step to record progress.", "选择相关服务，完成外部操作后返回原步骤记录进度。") : t("Official resources and independent tools, organized around your business.", "围绕创业步骤整理的官方资源与第三方工具。")}</p></div>
        {selected ? <div className="lp-service-context"><button className="lp-text-button" onClick={() => goStep(selected)}><ArrowLeft size={16}/>{t("Back to this step", "返回这一步")}</button><span>{filteredServices.length} {t("related services", "项相关服务")}</span><button className="lp-text-button" onClick={() => navigate("services")}>{t("See all services", "查看全部服务")}</button></div> : <div className="lp-category-tabs" aria-label={t("Service categories", "服务分类")}><button className={location.category === "all" ? "active" : ""} aria-pressed={location.category === "all"} onClick={() => navigate("services")}>{t("All services", "全部服务")}</button>{launchStages.map(stage => <button key={stage.id} className={location.category === stage.id ? "active" : ""} aria-pressed={location.category === stage.id} onClick={() => navigate("services", { category: stage.id })}>{stage.title[locale]}</button>)}</div>}
        <div className="lp-disclosure"><ShieldCheck size={18}/><p>{t("Directory listings, not endorsements or signed partnerships. No paid placements or referral commissions are enabled. Check current terms and pricing on each provider's website.", "目录收录不代表背书或已签约合作。当前未启用付费排名或转介佣金；价格和服务条款以对方网站为准。")}</p></div>
        <div className="lp-service-grid">{filteredServices.map(service => { const related = launchSteps.filter(step => step.services.includes(service.id)); return <article className="lp-card lp-service" key={service.id}><div className="lp-service-card-top"><span className="lp-service-monogram">{service.initials}</span><ArrowUpRight size={18}/></div><span className={`lp-service-type ${service.official ? "official" : ""}`}>{service.official ? t("Official resource", "官方资源") : t("Independent service", "第三方服务")}</span><h2>{service.name}</h2><p>{service.description[locale]}</p><div className="lp-service-steps"><small>{t("USEFUL FOR", "适用步骤")}</small>{(selected ? [selected] : related.slice(0, 2)).map(step => <button key={step.id} className="lp-text-button" onClick={() => goStep(step)}>{step.title[locale]}<ChevronRight size={13}/></button>)}</div><div className="lp-service-bottom"><a className="lp-service-link" href={service.url} target="_blank" rel="noopener noreferrer" onClick={() => visit(service)}>{service.official ? t("Open official website", "前往官方入口") : t("Visit service website", "前往服务网站")}<ArrowUpRight size={16}/></a><small>{t("Source checked", "来源核对")} {service.checked}</small></div></article>; })}</div>
      </>}
      <footer className="lp-footer"><p>{t("Independent platform · Ontario pilot · General information only. Applications and purchases happen on external websites. Your checklist does not confirm legal or tax compliance.", "独立平台 · Ontario 试点 · 一般信息。申请与购买在外部网站完成；清单进度不代表法律或税务合规结论。")}</p><p>{t("Progress is saved on this service using a browser access cookie. No account or cross-device recovery. Clearing cookies loses access. Do not enter passwords, SINs, banking details or identity documents.", "进度保存在本服务，通过浏览器 Cookie 访问。暂不支持账号或跨设备恢复；清除 Cookie 会失去访问权限。请勿填写密码、SIN、银行资料或身份证件。")}</p><div className="lp-footer-bottom"><span>Canada Business Launchpad</span><a href={`/${locale}/launch?tab=plan`}>{t("Previous workspace & records", "原工作台与历史记录")}<ArrowUpRight size={13}/></a></div></footer>
    </main>
    {profileOpen && <ProfileDialog locale={locale} profile={journey.profile} busy={busy || !loaded || !!error} close={() => setProfileOpen(false)} save={save} error={error} reload={reload}/>}
  </div>;
}

function ProfileDialog({ locale, profile, busy, close, save, error, reload }: { locale: Locale; profile: LaunchJourney["profile"]; busy: boolean; close: () => void; save: (value: Record<string, unknown>) => Promise<boolean>; error: string; reload: () => Promise<void> }) {
  const t = (en: string, zh: string) => locale === "en" ? en : zh;
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(profile);
  const [consent, setConsent] = useState(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="lp-dialog" aria-labelledby="lp-profile-title" onCancel={event => { event.preventDefault(); close(); }}><div className="lp-dialog-heading"><h2 id="lp-profile-title">{t("Make this checklist yours", "让清单属于你的企业")}</h2><button className="lp-icon-button" onClick={close} aria-label={t("Close", "关闭")}><X size={20}/></button></div><p>{t("A nickname is enough. No registered name or identity details are needed.", "使用项目昵称即可，无需法定名称或身份资料。")}</p><form onSubmit={async event => { event.preventDefault(); if (await save({ type: "profile", ...draft, consent })) close(); }}><label>{t("Business nickname (optional)", "企业昵称（选填）")}<input autoFocus maxLength={60} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder={t("My Ontario studio", "我的安省工作室")}/></label><div className="lp-form-row"><label>{t("Location", "所在地")}<select aria-label={t("Location", "所在地")} value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })}>{launchCities.map(city => <option key={city} value={city}>{city === "Other Ontario city" ? t(city, "安省其他城市") : city}</option>)}</select></label><label>{t("Team size", "团队人数")}<select aria-label={t("Team size", "团队人数")} value={draft.team} onChange={event => setDraft({ ...draft, team: Number(event.target.value) })}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {t(n === 1 ? "person" : "people", "人")}</option>)}</select></label></div><p className="lp-meta">{t("This is a general service-business checklist, not an automatically assessed legal plan. Your existing progress stays unchanged.", "这是服务型企业通用清单，不是自动评估的法律方案。修改资料不改变已有进度。")}</p><label className="lp-consent"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)}/><span>{t("Save this nickname, location, team size and checklist progress on this service. Nothing is sent to external providers.", "同意在本服务保存昵称、地区、团队人数与清单进度，不向外部服务商发送。")}</span></label>{error && <div className="lp-inline-error" role="alert"><span>{t("Not saved. Reload and try again; your draft stays here.", "尚未保存。请重新读取后再试，当前填写内容会保留。")}</span><button type="button" className="lp-text-button" onClick={() => void reload()}>{t("Reload", "重新读取")}</button></div>}<div className="lp-dialog-actions"><button type="button" className="lp-secondary" onClick={close}>{t("Cancel", "取消")}</button><button className="lp-primary lp-green-button" disabled={busy || !consent}>{busy && <Loader2 size={16} className="spin"/>}{t("Save details", "保存资料")}</button></div></form></dialog>;
}

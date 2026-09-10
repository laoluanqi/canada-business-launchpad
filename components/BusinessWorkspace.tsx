"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, CalendarDays, Check, CheckCircle2, ClipboardList, Download, ExternalLink, History, Loader2, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { assessmentDefaults, assessmentQuestions } from "@/lib/assessment";
import { businessFlow, businessPlan, issueReasons, ontarioDate, skipReasons } from "@/lib/business";
import type { BusinessWorkspaceData, WorkAction, WorkStatus } from "@/lib/business";
import { getScenario, getSource, getTask } from "@/lib/content";
import { synthesizeAssessmentScenario } from "@/lib/rules";
import { phaseLabels } from "@/lib/workflow";
import type { Locale, TaskKind } from "@/lib/types";

type Tab = "plan" | "profile" | "followups" | "history";
type Command = Record<string, unknown>;
const text = (locale: Locale, en: string, zh: string) => locale === "en" ? en : zh;
const statusCopy: Record<WorkStatus, [string, string]> = { not_started: ["Not started", "未开始"], in_progress: ["Preparing", "准备中"], waiting: ["Waiting externally", "外部处理中"], blocked: ["Needs attention", "有问题待处理"], done: ["Recorded complete", "已记录完成"], not_applicable: ["Not applicable", "不适用"] };
const kindCopy: Record<TaskKind, [string, string]> = { mandatory: ["Required", "必需"], conditional: ["Conditional", "条件适用"], optional: ["Optional", "可选"], not_applicable: ["Outside this plan", "本计划不适用"], needs_expert: ["Professional review", "专业审核"] };
const reasonCopy: Record<string, [string, string]> = { missing_materials: ["More materials needed", "需要补充材料"], provider_delay: ["Waiting for an external response", "等待外部回复"], unclear_requirement: ["A requirement needs clarification", "办理要求待确认"], professional_review: ["Professional advice needed", "需要专业意见"], activity_not_started: ["Activity has not started", "尚未开展该活动"], not_applicable_after_review: ["Reviewed the official conditions", "已核对官方适用条件"], professional_confirmation: ["Reviewed with a professional", "已与专业人士核对"] };
const eventCopy: Record<string, [string, string]> = { created: ["Workspace created", "已建立企业工作台"], profile: ["Business details updated; plan recalculated", "已更新企业情况并重算计划"], start: ["Preparation started", "开始准备"], visit: ["Opened an official source; not a submission", "访问官方入口，不代表已提交"], waiting: ["External waiting recorded", "已记录外部等待"], blocked: ["Issue recorded", "已记录待处理问题"], complete: ["Completion recorded by you", "用户记录完成"], reopen: ["Task reopened", "重新打开任务"], not_applicable: ["Marked not applicable after review", "核对后标记不适用"], confirm_review: ["Rechecked after profile change", "企业情况变化后已重新核对"], followup_created: ["Dated follow-up created", "已创建具体日期的跟进事项"], followup_updated: ["Dated record corrected", "已更正日期事项"], followup_done: ["This occurrence completed", "已完成本期事项"], followup_reopen: ["This occurrence reopened", "已重新打开本期事项"] };
const errorCopy: Record<string, [string, string]> = {
  confirmation_required: ["Confirm the outcome before saving.", "请先确认结果再保存。"], consent_required: ["Please review and confirm the storage notice.", "请先阅读并确认保存说明。"],
  incomplete_profile: ["Review the business questions before creating the plan.", "请核对企业问题后再生成计划。"], reason_required: ["Choose a reason for this outcome.", "请为该结果选择原因。"],
  invalid_task: ["This task is no longer in the current plan. Reload the latest version.", "该任务不在当前适用计划内，请读取最新版本。"], cannot_skip: ["Required tasks cannot be marked not applicable here.", "必需任务不能在这里标记为不适用。"],
  reopen_required: ["Reopen the recorded task before changing its outcome.", "请先重新打开任务，再修改结果。"], not_found: ["This workspace is no longer available. Reload to start again.", "该工作台已不存在，请重新读取。"],
  storage_unavailable: ["Saving is unavailable. Your changes have not been saved. Retry when the service is available.", "暂时无法保存，本次修改尚未保存。请稍后重试。"],
  conflict: ["Another tab updated this workspace. Reload the saved version before continuing; your draft has not overwritten it.", "其他页面已更新工作台。请重新读取已保存版本后继续，本次草稿没有覆盖原记录。"],
  dependencies_required: ["Resolve the prerequisite tasks first.", "请先处理前置任务。"], materials_required: ["Check all materials before recording completion.", "请先核对全部材料再记录完成。"],
  expert_required: ["This item requires professional review; progress tracking cannot confirm a professional conclusion.", "此事项需要专业审核，进度记录不能代替专业结论。"],
  completion_date_required: ["Use a valid completion date no later than today.", "请填写有效的完成日期，不得晚于今天。"], date_required: ["Choose a valid follow-up date.", "请选择有效的跟进日期。"],
  duplicate_period: ["This task already has that period. Use its existing record or a different period.", "该任务已有相同周期，请使用已有记录或填写其他周期。"],
  session_required: ["Reload to restore the browser access session. Cookies must be enabled.", "请重新加载以恢复浏览器访问会话，并确保已启用 Cookie。"],
  invalid_input: ["Check the entered values.", "请检查填写内容。"], record_limit: ["This pilot supports up to 100 dated records per workspace.", "试点版每个工作台最多保存100条日期事项。"],
};

function downloadJson(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BusinessWorkspace({ locale }: { locale: Locale }) {
  const t = (en: string, zh: string) => text(locale, en, zh);
  const label = (pair: [string, string]) => pair[locale === "en" ? 0 : 1];
  const [business, setBusiness] = useState<BusinessWorkspaceData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("plan");
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState("all");
  const [templateId, setTemplateId] = useState("");
  async function load() {
    setError(""); setBusy(true);
    try {
      const response = await fetch("/api/business", { cache: "no-store" });
      const data = await response.json() as { business: BusinessWorkspaceData | null; error?: string };
      if (!response.ok) throw new Error(data.error);
      setBusiness(data.business); setLoaded(true);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "storage_unavailable"); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    const restoreLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const requestedTab = params.get("tab");
      setTab(["plan", "profile", "followups", "history"].includes(requestedTab ?? "") ? requestedTab as Tab : "plan");
      setSelected(params.get("task") ?? "");
      setQuery(window.location.search);
      setTemplateId(params.get("template") ?? "");
      setNotice("");
    };
    const frame = requestAnimationFrame(() => {
      restoreLocation();
      void load();
    });
    window.addEventListener("popstate", restoreLocation);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("popstate", restoreLocation); };
  }, []);
  function navigate(nextTab: Tab, taskId = "") {
    setTab(nextTab); setSelected(taskId); setNotice("");
    const params = new URLSearchParams({ tab: nextTab });
    if (taskId) params.set("task", taskId);
    const nextQuery = `?${params}`; setQuery(nextQuery);
    const href = `/${locale}/launch${nextQuery}`;
    if (`${window.location.pathname}${window.location.search}` !== href) window.history.pushState(null, "", href);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
      const heading = document.querySelector<HTMLElement>(".business-main h1");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    });
  }
  async function save(command: Command, method = "PATCH"): Promise<boolean> {
    if (busy) return false;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/business", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...command, businessId: business?.id, revision: business?.revision }) });
      const data = await response.json() as { business: BusinessWorkspaceData | null; error?: string };
      if (!response.ok) throw new Error(data.error);
      setBusiness(data.business); setNotice(t("Saved to your workspace.", "已保存至您的企业工作台。"));
      return true;
    } catch (failure) { setError(failure instanceof Error ? failure.message : "storage_unavailable"); return false; }
    finally { setBusy(false); }
  }
  const flow = business ? businessFlow(business) : null;
  const template = getScenario(templateId);
  const initialAnswers = template ? { ...assessmentDefaults, ...template.profile } : assessmentDefaults;
  const task = flow?.items.find((item) => item.id === selected);
  const today = ontarioDate();
  const followups = business?.followUps.filter((item) => item.status === "open") ?? [];
  const due = (flow?.items.filter((item) => item.record.followUp && item.record.followUp <= today && ["waiting", "blocked"].includes(item.status)).length ?? 0) + followups.filter((item) => item.dueDate <= today).length;

  return <div className="business-app" data-business-ready={loaded}>
    <header className="business-header"><a href={`/${locale}`} className="brand"><span className="brand-mark">CB</span><span className="brand-name"><strong>Canada Business</strong><span>Launchpad</span></span></a><span className="business-scope">{t("Ontario Pilot · General information", "安省试点 · 一般信息指引")}</span><div><a href={`/${locale}/present`}>{t("Product overview", "产品介绍")}</a><a href={`/${locale === "en" ? "zh" : "en"}/launch${query}`}>{locale === "en" ? "中文" : "English"}</a></div></header>
    <div className="business-layout">
      <aside className="business-sidebar"><span className="eyebrow">{t("MY BUSINESS", "我的企业")}</span><h2>{business?.name ?? t("Your Ontario business", "您的安省企业")}</h2><p>{t("One plan. A record of every next step.", "一份计划，持续推进每一步。")}</p><nav aria-label={t("Workspace sections", "工作台栏目")}>{([
        ["plan", ClipboardList, t("Action plan", "行动计划")], ["profile", Building2, t("Business details", "企业情况")], ["followups", CalendarDays, t("Follow-ups & periods", "跟进与持续事项")], ["history", History, t("Activity & records", "历史与记录")],
      ] as const).map(([id, Icon, title]) => <button key={id} disabled={!business} className={tab === id ? "active" : ""} onClick={() => navigate(id)}><Icon size={18} />{title}{id === "followups" && due > 0 && <b>{due}</b>}</button>)}</nav><div className="business-sidebar-note"><ShieldCheck size={21} /><p>{t("Your plan is saved by the service. This browser's private cookie is the access key. No government submission or partner data sharing.", "计划由服务端保存，当前浏览器的专用 Cookie 是访问凭据。不向政府提交申请，不向合作方共享资料。")}</p></div></aside>
      <main className="business-main">
        <div className="business-save-status" aria-live="polite">{busy ? <><Loader2 size={15} className="spin" />{t("Saving / loading…", "正在保存或读取…")}</> : error ? <span>{t("Not saved / reload required", "未保存／需要重新读取")}</span> : business ? <><CheckCircle2 size={15} />{t("Saved", "已保存")} · {new Date(business.updatedAt).toLocaleString(locale === "en" ? "en-CA" : "zh-CN")}</> : t("Start with your business, not a preset profile.", "从您的企业情况开始，不必选择固定画像。")}</div>
        {error && <div className="business-error" role="alert"><p>{label(errorCopy[error] ?? errorCopy.storage_unavailable)}</p><button className="btn btn-outline btn-sm" disabled={busy} onClick={() => void load()}><RefreshCw size={15} />{t("Reload saved version", "重新读取已保存版本")}</button></div>}
        {notice && <div className="business-notice" role="status">{notice}</div>}
        {!loaded && !error && <p role="status">{t("Loading your workspace…", "正在读取您的工作台…")}</p>}
        {loaded && (!business || tab === "profile") && <BusinessProfileForm key={business ? `${business.id}-${business.revision}` : `new-${templateId}`} locale={locale} business={business} initialAnswers={initialAnswers} busy={busy} onSave={async (input) => { const okay = await save(input, business ? "PATCH" : "POST"); if (okay) navigate("plan"); return okay; }} />}
        {business && flow && tab === "plan" && <>
          <div className="business-page-heading"><div><span className="eyebrow">{t("YOUR CONNECTED WORKFLOW", "持续推进的创业工作台")}</span><h1>{task ? task.task.title[locale] : t("What needs to happen next?", "接下来，推进哪一步？")}</h1><p>{t("Prepare here. Complete external transactions with the right service. Return to record the outcome.", "在这里准备，到对应平台办理，回来记录结果并继续下一步。")}</p></div><button className="btn btn-outline btn-sm" onClick={() => navigate("profile")}>{t("Update business details", "更新企业情况")}</button></div>
          <div className="business-loop" aria-label={t("Workflow", "产品流程")}>{[t("Business details", "企业情况"), t("Action plan", "行动计划"), t("Preparation", "准备材料"), t("External service", "外部办理"), t("Record & continue", "回填与跟进")].map((item, i) => <span key={item}><b>{i + 1}</b>{item}{i < 4 && <ArrowRight size={14} />}</span>)}</div>
          {task ? <BusinessTaskPanel key={`${business.id}:${task.id}`} locale={locale} business={business} taskId={task.id} busy={busy} save={save} navigate={navigate} /> : <>
            <div className="business-metrics"><div><strong>{flow.progress}%</strong><span>{t("Plan resolved · not a compliance score", "计划处理进度 · 非合规评分")}</span></div><button onClick={() => navigate("followups")}><strong>{flow.waiting.length}</strong><span>{t("Waiting externally", "外部等待")}</span></button><button onClick={() => navigate("followups")}><strong>{flow.issues.length}</strong><span>{t("Issues to resolve", "问题待处理")}</span></button><button onClick={() => navigate("followups")}><strong>{due}</strong><span>{t("Follow up today / overdue", "今日或已到期待跟进")}</span></button></div>
            {(business.planChanges.added.length > 0 || business.planChanges.removed.length > 0 || business.planChanges.review.length > 0) && <div className="business-change"><b>{t("Your plan has changed. Previous records remain available.", "计划已更新，原有记录仍保留。")}</b><p>{t("Added", "新增")} {business.planChanges.added.length} · {t("No longer applicable", "不再适用")} {business.planChanges.removed.length} · {t("Previous completions to recheck", "原完成事项需复核")} {flow.items.filter((item) => item.record.needsRecheck).length}</p></div>}
            <section className="business-next"><div><span className="eyebrow">{t("NEXT ACTION", "下一步行动")}</span><h2>{flow.next?.task.title[locale] ?? t("Check your follow-ups", "查看待跟进事项")}</h2><p>{flow.next ? flow.next.task.summary[locale] : t("Ready tasks are resolved or waiting. This does not mean the business is legally compliant; review continuing obligations separately.", "可推进任务已处理或正在等待。这不代表企业已满足全部合规要求，请继续检查持续事项。")}</p></div><button className="btn btn-primary" onClick={() => flow.next ? navigate("plan", flow.next.id) : navigate("followups")}>{flow.next ? t("Work on this task", "处理这个任务") : t("Review follow-ups", "查看后续事项")}<ArrowRight size={17} /></button></section>
            <div className="business-phase-tabs"><button className={phase === "all" ? "active" : ""} onClick={() => setPhase("all")}>{t("All stages", "全部阶段")}</button>{Object.entries(phaseLabels).map(([id, value]) => <button className={phase === id ? "active" : ""} key={id} onClick={() => setPhase(id)}>{value[locale]}</button>)}</div>
            <section className="business-task-list" aria-label={t("Your tasks", "您的任务")}>{flow.items.filter((item) => (phase === "all" || item.task.phase === phase) && item.kind !== "not_applicable").map((item) => <button key={item.id} className="business-task-row" onClick={() => navigate("plan", item.id)}><span className={`business-state-dot state-${item.status}`}><Check size={14} /></span><span><b>{item.task.title[locale]}</b><small>{label(kindCopy[item.kind])} · {phaseLabels[item.task.phase][locale]}{item.blockedBy.length > 0 ? ` · ${t("Prerequisites pending", "前置事项待处理")}` : ""}</small></span><span className={`business-status state-${item.status}`}>{item.record.needsRecheck ? t("Recheck needed", "需重新核对") : label(statusCopy[item.status])}</span><ArrowRight size={16} /></button>)}</section>
            <p className="business-caption">{t("Completed and not-applicable items count as resolved. Optional tasks are excluded from the percentage. All outcomes are user-reported.", "已完成及经核对不适用的事项计入处理进度；可选事项不计入百分比。所有结果均由用户自行记录。")}</p>
          </>}
        </>}
        {business && flow && tab === "followups" && <BusinessFollowUps locale={locale} business={business} initialTaskId={selected} busy={busy} save={save} navigate={navigate} />}
        {business && tab === "history" && <><div className="business-page-heading"><div><span className="eyebrow">{t("YOUR RECORD", "企业记录")}</span><h1>{t("Keep the thread of your work.", "每次推进，都有记录。")}</h1><p>{t("The latest 200 actions. Profile changes do not delete earlier task or period records.", "最近200次操作。修改企业情况不会删除原有任务与周期记录。")}</p></div><button className="btn btn-outline" onClick={() => downloadJson(business, `launchpad-${business.id}.json`)}><Download size={17} />{t("Export records", "导出记录")}</button></div><ol className="business-history">{[...business.history].reverse().map((event) => <li key={event.id}><History size={17} /><div><b>{label(eventCopy[event.type] ?? [event.type, event.type])}</b>{event.taskId && <p>{getTask(event.taskId)?.title[locale]}</p>}{event.detail && <small>{reasonCopy[event.detail] ? label(reasonCopy[event.detail]) : event.detail}</small>}<time>{new Date(event.at).toLocaleString(locale === "en" ? "en-CA" : "zh-CN")}</time></div></li>)}</ol><section className="business-card"><h2>{t("Previous completion records", "历史完成记录")}</h2>{Object.entries(business.records).filter(([, record]) => record.completedAt).map(([id, record]) => <p key={id}>{getTask(id)?.title[locale]} · {record.completedAt} · {record.needsRecheck ? t("Recheck pending", "待重新核对") : t("User-reported record", "用户自报记录")}</p>)}</section><section className="business-card business-danger"><h2>{t("Remove this workspace", "删除此工作台")}</h2><p>{t("Deletes this browser's workspace from the service. Export your records first. This does not cancel any external application.", "从服务端删除当前浏览器关联的工作台。请先导出需要保留的记录。这不会撤销任何外部申请。")}</p><button className="btn btn-outline" disabled={busy} onClick={async () => { if (window.confirm(t("Permanently delete this workspace and its records?", "确定永久删除此工作台和全部记录？"))) { if (await save({ confirmed: true }, "DELETE")) navigate("plan"); } }}><Trash2 size={17} />{t("Delete workspace", "删除工作台")}</button></section></>}
        <footer className="business-footer">{t("Independent planning and progress management. No application submissions, real-time government status or professional conclusions. Do not enter SINs, passwords, bank details or identity documents. No files are uploaded. Clearing the access cookie loses access; account recovery and cross-device sign-in are not available in this pilot.", "独立规划与进度管理平台，不提交申请、不实时同步政府状态、不出具专业结论。请勿填写 SIN、密码、银行资料或身份证件；不上传文件。清除访问 Cookie 将失去工作台访问权限；试点版暂不支持账户恢复或跨设备登录。")}</footer>
      </main>
    </div>
  </div>;
}

function BusinessProfileForm({ locale, business, busy, onSave, initialAnswers = assessmentDefaults }: { locale: Locale; business: BusinessWorkspaceData | null; busy: boolean; initialAnswers?: Record<string, string | boolean>; onSave: (input: Command) => Promise<boolean> }) {
  const t = (en: string, zh: string) => text(locale, en, zh);
  const [name, setName] = useState(business?.name ?? "");
  const [answers, setAnswers] = useState(business?.answers ?? { ...initialAnswers });
  const [consent, setConsent] = useState(false);
  const plan = synthesizeAssessmentScenario(answers);
  return <form className="business-profile" onSubmit={(event) => { event.preventDefault(); void onSave({ type: "profile", name, answers, consent }); }}><div className="business-page-heading"><div><span className="eyebrow">{t("01 / BUSINESS DETAILS", "01 / 企业情况")}</span><h1>{business ? t("Update the same business plan.", "更新情况，延续同一份计划。") : t("Create your own business workspace.", "建立属于您的企业工作台。")}</h1><p>{t("Use a project nickname, review the selections and create a plan you can return to. No legal name or identity information is required.", "使用项目昵称、核对选项，建立一份可以持续使用的计划。无需法定名称或身份资料。")}</p></div></div><div className="business-profile-grid"><div className="business-card"><fieldset disabled={busy}><label className="business-field">{t("Project nickname", "项目昵称")}<input required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("e.g. My Ontario studio", "例如：我的安省工作室")} autoComplete="off" /></label>{assessmentQuestions.filter((question) => !question.show || question.show(answers)).map((question) => <label className="business-field" key={question.id}>{question.label[locale]}<select value={String(answers[question.id])} onChange={(event) => { const option = question.options.find((item) => String(item.value) === event.target.value); if (option) setAnswers({ ...answers, [question.id]: option.value }); }}>{question.options.map((option) => <option value={String(option.value)} key={String(option.value)}>{option.label[locale]}</option>)}</select><small>{question.hint[locale].replace("本预览", "当前规则").replace("this preview", "the current rules")}</small></label>)}</fieldset></div><aside className="business-profile-summary business-card"><span className="eyebrow">{t("PLAN PREVIEW", "计划概览")}</span><h2>{name || t("Your business", "您的企业")}</h2><strong className="business-big-number">{plan.tasks.filter((item) => item.kind !== "not_applicable").length}</strong><p>{t("applicable planning tasks", "项适用的规划任务")}</p><p>{plan.boundary ? t("This situation requires professional review. The platform records preparation and follow-ups, not a final conclusion.", "该情况需要专业审核。平台记录准备及跟进，不输出最终结论。") : t("Official sources stay beside your tasks. Applicability is based on your answers, not an approval decision.", "任务旁保留官方依据。适用性取决于您的回答，不代表审批决定。")}</p>{business && <p>{t("Changing answers preserves the business ID and history. Earlier completions may need rechecking.", "修改答案会保留企业ID和历史记录，原完成事项可能需要重新核对。")}</p>}<label className="business-checkbox"><input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{t("I reviewed these selections and agree to save the nickname, business answers and activity records on this service. Nothing is sent to government or partners.", "我已核对选项，同意将昵称、企业情况和操作记录保存在本服务端；不向政府或合作方发送。")}</span></label><button className="btn btn-primary full" disabled={busy || !consent || !name.trim()}>{business ? t("Update my plan", "更新我的计划") : t("Create my workspace", "创建我的工作台")}<ArrowRight size={17} /></button><small>{t("One private workspace per browser. No account or recovery service yet.", "每个浏览器一个独立工作台，暂不提供账户或恢复服务。")}</small></aside></div></form>;
}

function BusinessTaskPanel({ locale, business, taskId, busy, save, navigate }: { locale: Locale; business: BusinessWorkspaceData; taskId: string; busy: boolean; save: (command: Command) => Promise<boolean>; navigate: (tab: Tab, id?: string) => void }) {
  const t = (en: string, zh: string) => text(locale, en, zh);
  const label = (pair: [string, string]) => pair[locale === "en" ? 0 : 1];
  const flow = businessFlow(business);
  const entry = flow.items.find((item) => item.id === taskId)!;
  const { task, record } = entry;
  const [followUp, setFollowUp] = useState(record.followUp);
  const [reason, setReason] = useState<string>(issueReasons[0]);
  const [skipReason, setSkipReason] = useState<string>(skipReasons[0]);
  const [pendingChecks, setPendingChecks] = useState<Record<number, boolean>>({});
  async function toggleMaterial(index: number, checked: boolean) {
    if (busy) return;
    setPendingChecks({ [index]: checked });
    await save({ type: "check", taskId, index, checked });
    setPendingChecks({});
  }
  const [confirmed, setConfirmed] = useState(false);
  const [completedAt, setCompletedAt] = useState(ontarioDate());
  const finished = ["done", "not_applicable"].includes(entry.status);
  const expert = entry.kind === "needs_expert";
  const materialsReady = (task.materials ?? []).every((_, index) => record.checks[index]);
  const source = task.sourceIds.map(getSource).filter((item) => Boolean(item));
  const official = task.officialUrl ?? source[0]?.url;
  const action = (value: WorkAction) => save({ type: "task", taskId, action: value, followUp, reason: value === "not_applicable" ? skipReason : reason, completedAt, confirmed });
  return <><button className="text-link business-back" onClick={() => navigate("plan")}><ArrowLeft size={16} />{t("Back to my plan", "返回我的计划")}</button><div className="business-task-layout"><div>
    <section className="business-card"><div className="business-task-badges"><span>{label(kindCopy[entry.kind])}</span><span className={`business-status state-${entry.status}`}>{record.needsRecheck ? t("Recheck needed", "需重新核对") : label(statusCopy[entry.status])}</span></div><h2>{t("Why this is in your plan", "为什么要处理这项任务")}</h2><p>{(task.why ?? task.summary)[locale]}</p>{record.needsRecheck && <p className="business-change">{t("Your business details changed. Earlier records are retained, but this task needs a fresh check.", "企业情况已变化，原记录保留，此任务需要重新核对。")}</p>}{entry.blockedBy.length > 0 && <div className="business-prerequisites"><b>{t("First resolve", "请先处理")}</b>{entry.blockedBy.map((id) => <button className="text-link" key={id} onClick={() => navigate("plan", id)}>{getTask(id)?.title[locale]}<ArrowRight size={14} /></button>)}</div>}<h3>{t("Prepare before you leave", "离开平台前，先准备")}</h3>{task.materials?.length ? <fieldset disabled={busy || finished}>{task.materials.map((item, index) => <label className="business-checkbox" key={index}><input type="checkbox" checked={pendingChecks[index] ?? Boolean(record.checks[index])} onChange={(event) => void toggleMaterial(index, event.target.checked)} /><span>{item[locale]}</span></label>)}</fieldset> : <p className="business-caption">{t("This is an entry-level planning task, not a complete materials list. Read the official requirements before acting.", "此项为入口级规划任务，并非完整材料清单。办理前请阅读官方要求。")}
    </p>}<div className="business-task-facts">{task.cost && <p><b>{t("Cost guidance", "费用指引")}</b>{task.cost[locale]}</p>}{task.timing && <p><b>{t("Time guidance", "时间指引")}</b>{task.timing[locale]}</p>}</div>{official && <a className="btn btn-primary" href={official} target="_blank" rel="noreferrer noopener" onClick={() => { if (!busy) void action("visit"); }}>{t("Open official service / source", "前往官方办理或查询")}<ExternalLink size={17} /></a>}<p className="business-caption">{t("A link visit is not a submission. Return below to record what actually happened.", "打开链接不代表提交申请。返回后，请在下方记录实际结果。")}</p></section>
    <section className="business-card business-return"><span className="eyebrow">{t("RETURN & CONTINUE", "返回平台，记录并继续")}</span><h2>{finished ? t("This outcome is recorded.", "本次结果已记录。") : t("What happened with this task?", "这项任务现在进展如何？")}</h2>{finished ? <><p>{t("User-reported, not verified with the government. This does not close future reporting periods.", "用户自行记录，未经政府核验；不会关闭未来申报周期。")}{record.completedAt && ` · ${record.completedAt}`}</p><div className="business-actions"><button className="btn btn-primary" onClick={() => flow.next ? navigate("plan", flow.next.id) : navigate("followups")}>{flow.next ? t("Continue to next task", "继续下一任务") : t("Manage continuing items", "管理持续事项")}<ArrowRight size={16} /></button><button className="btn btn-outline" onClick={() => navigate("followups", taskId)}>{t("Add a dated follow-up", "添加日期跟进")}</button><button className="text-link" disabled={busy} onClick={() => void action("reopen")}>{t("Reopen this task", "重新打开任务")}</button></div></> : <fieldset disabled={busy}><button type="button" className="btn btn-outline btn-sm" onClick={() => void action("start")}>{t("Still preparing / not submitted", "仍在准备／尚未提交")}</button><div className="business-return-grid"><label className="business-field">{t("Next follow-up date", "下次跟进日期")}<input type="date" min="2000-01-01" max="2200-12-31" value={followUp} onChange={(event) => setFollowUp(event.target.value)} /></label><label className="business-field">{t("If there is an issue", "如遇到问题，请选择")}<select value={reason} onChange={(event) => setReason(event.target.value)}>{issueReasons.map((id) => <option key={id} value={id}>{label(reasonCopy[id])}</option>)}</select></label></div><div className="business-actions"><button className="btn btn-outline" disabled={!followUp} onClick={() => void action("waiting")}>{expert ? t("Contacted expert; awaiting reply", "已联系专家，等待回复") : t("Submitted externally; awaiting result", "已在外部提交，等待结果")}</button><button className="btn btn-outline" disabled={!followUp} onClick={() => void action("blocked")}>{t("Record issue / more materials", "记录问题／补充材料")}</button></div><small>{t("Follow-up dates are your own planning dates, not automatically calculated legal deadlines.", "跟进日期由您设定，并非自动计算的法定期限。")}</small>{expert ? <div className="business-change"><h3>{t("Professional review is needed", "需要专业审核")}</h3><p>{t("You can track contact and preparation. A platform task cannot approve a legal or tax position. Contact the professional yourself; no request is sent from this page.", "可以记录联系与准备进度，但平台任务不能批准法律或税务判断。请自行联系专业人士，此页面不会发送请求。")}</p><button className="btn btn-outline" type="button" onClick={() => downloadJson({ business: business.name, profile: business.answers, task: task.title[locale], materialsReady: record.checks, sources: source.map((item) => item!.url), note: "Prepared by user. No professional or government verification." }, "launchpad-review-brief.json")}><Download size={16} />{t("Download review brief", "下载专业沟通清单")}</button></div> : <div className="business-complete-box"><h3>{t("Record a completed outcome", "记录已经完成的结果")}</h3><label className="business-field">{t("Completion date", "完成日期")}<input type="date" value={completedAt} max={ontarioDate()} onChange={(event) => setCompletedAt(event.target.value)} /></label><label className="business-checkbox"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>{t("I checked the applicable requirements and confirm this result. This is my own record, not a government or professional verification.", "我已核对适用要求并确认此结果。这是我的自主记录，不代表政府或专业核验。")}</span></label><button className="btn btn-primary" disabled={!confirmed || !materialsReady || entry.blockedBy.length > 0} onClick={() => void action(record.needsRecheck ? "confirm_review" : "complete")}>{record.needsRecheck ? t("Confirm recheck & complete", "重新核对并确认完成") : t("Save completion & show next step", "保存完成结果，查看下一步")}<CheckCircle2 size={17} /></button>{(!materialsReady || entry.blockedBy.length > 0) && <p className="business-caption">{t("Complete materials and prerequisites first.", "请先核对材料并处理前置任务。")}</p>}{["conditional", "optional"].includes(entry.kind) && <div className="business-skip"><label className="business-field">{t("Not applicable after checking?", "核对后确认暂不适用？")}<select value={skipReason} onChange={(event) => setSkipReason(event.target.value)}>{skipReasons.map((id) => <option key={id} value={id}>{label(reasonCopy[id])}</option>)}</select></label><button className="text-link" disabled={!confirmed} onClick={() => void action("not_applicable")}>{t("Record as not applicable", "记录为不适用")}</button></div>}</div>}</fieldset>}</section>
  </div><aside><section className="business-card"><ShieldCheck size={25} /><h2>{t("Sources beside your action", "行动旁边，就是依据")}</h2>{source.map((item) => <a key={item!.id} className="business-source" href={item!.url} target="_blank" rel="noreferrer noopener"><b>{item!.title[locale]}<ExternalLink size={14} /></b><small>{item!.authority} · {item!.jurisdiction}</small><small>{t("Checked", "核验日期")} {item!.verified}</small></a>)}<p className="business-caption">{t("Check the current source before acting. Existing source dates have not been refreshed by this workflow update.", "办理前请再次核对官方页面。此次流程升级不代表已重新核验所有来源。")}</p></section><section className="business-card"><h3>{t("Task activity", "本任务动态")}</h3>{business.history.filter((event) => event.taskId === taskId).slice(-6).reverse().map((event) => <p className="business-mini-event" key={event.id}><b>{label(eventCopy[event.type] ?? [event.type, event.type])}</b><small>{new Date(event.at).toLocaleString(locale === "en" ? "en-CA" : "zh-CN")}</small></p>)}</section></aside></div></>;
}

function BusinessFollowUps({ locale, business, busy, save, navigate, initialTaskId }: { locale: Locale; business: BusinessWorkspaceData; busy: boolean; initialTaskId: string; save: (command: Command) => Promise<boolean>; navigate: (tab: Tab, id?: string) => void }) {
  const t = (en: string, zh: string) => text(locale, en, zh);
  const flow = businessFlow(business);
  const available = businessPlan(business).tasks.filter((item) => item.kind !== "not_applicable");
  const [taskId, setTaskId] = useState(available.find((item) => item.id === initialTaskId)?.id ?? available.find((item) => getTask(item.id)?.phase === "comply")?.id ?? available[0]?.id ?? "");
  const [period, setPeriod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const outstanding = flow.items.filter((item) => ["waiting", "blocked"].includes(item.status));
  return <><div className="business-page-heading"><div><span className="eyebrow">{t("KEEP MOVING", "持续推进")}</span><h1>{t("Nothing ends at the handoff.", "办理之后，仍有下一步。")}</h1><p>{t("External waiting, unresolved issues and dated obligations stay connected to the business. Each period is a separate record.", "外部等待、待处理问题与日期事项都关联当前企业，每个周期独立记录。")}</p></div></div><section className="business-card"><h2>{t("External waiting & issues", "外部等待与待处理问题")}</h2>{!outstanding.length && <p>{t("No external waiting or unresolved issues recorded.", "目前没有记录外部等待或待处理问题。")}</p>}{outstanding.sort((a, b) => a.record.followUp.localeCompare(b.record.followUp)).map((item) => <div className="business-followup-row" key={item.id}><div><b>{item.task.title[locale]}</b><p>{statusCopy[item.status][locale === "en" ? 0 : 1]}{item.record.reason && ` · ${reasonCopy[item.record.reason]?.[locale === "en" ? 0 : 1] ?? ""}`}</p><small>{t("Follow up", "跟进日期")} {item.record.followUp}</small></div><button className="btn btn-outline btn-sm" onClick={() => navigate("plan", item.id)}>{t("Record latest outcome", "记录最新结果")}<ArrowRight size={14} /></button></div>)}</section><div className="business-task-layout"><section className="business-card"><h2>{t("Periods & dated records", "周期与日期事项")}</h2><p>{t("Annual returns, corporate income tax, GST/HST and payroll are different obligations. Add dates only after confirming your own period and official requirements.", "公司年报、公司所得税、GST/HST 和 Payroll 属于不同义务。确认自身周期及官方要求后，再录入日期。")}</p>{business.followUps.length === 0 && <div className="business-empty"><CalendarDays size={28} /><b>{t("Set the next check-in", "设定下一次跟进")}</b><p>{t("No invented tax deadlines or sample dates are added to your business.", "不会自动为企业填入虚构税务期限或样例日期。")}</p></div>}{[...business.followUps].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((item) => <div className="business-followup-row" key={item.id}><div><b>{getTask(item.taskId)?.title[locale]}</b><p>{item.period} · <time>{item.dueDate}</time></p><small>{item.status === "done" ? `${t("This period completed", "本期已完成")} · ${item.completedAt}` : t("Open · date entered by you", "待处理 · 用户设定日期")}</small></div><div className="business-actions"><button className="text-link" onClick={() => available.some((task) => task.id === item.taskId) ? navigate("plan", item.taskId) : navigate("history")}>{t("Related task / record", "关联任务／记录")}</button><button className="text-link" disabled={busy} onClick={() => { setEditingId(item.id); setTaskId(item.taskId); setPeriod(item.period); setDueDate(item.dueDate); setConfirmed(false); }}>{t("Edit date / period", "更正日期／周期")}</button><button disabled={busy} className="btn btn-outline btn-sm" onClick={() => void save({ type: "followup_status", id: item.id, status: item.status === "done" ? "open" : "done" })}>{item.status === "done" ? t("Reopen this period", "重新打开本期") : t("Complete this period only", "仅完成本期")}</button></div></div>)}</section><form className="business-card" onSubmit={async (event) => { event.preventDefault(); if (await save({ type: editingId ? "followup_update" : "followup", id: editingId, taskId, period, dueDate, confirmed })) { setPeriod(""); setDueDate(""); setConfirmed(false); setEditingId(""); } }}><h2>{editingId ? t("Correct this dated record", "更正这条日期记录") : t("Add a follow-up / period", "添加跟进／周期")}</h2>{editingId && <button type="button" className="text-link" onClick={() => { setEditingId(""); setPeriod(""); setDueDate(""); setConfirmed(false); }}>{t("Cancel editing", "取消更正")}</button>}<fieldset disabled={busy}><label className="business-field">{t("Related task", "关联任务")}<select disabled={Boolean(editingId)} value={taskId} onChange={(event) => setTaskId(event.target.value)}>{available.map((item) => <option key={item.id} value={item.id}>{getTask(item.id)?.title[locale]}</option>)}</select></label><label className="business-field">{t("Period or purpose", "周期或用途")}<input required maxLength={40} value={period} onChange={(event) => setPeriod(event.target.value)} placeholder={t("e.g. 2026 Q4 / first review", "如：2026年第4季度／首次复核")} /></label><label className="business-field">{t("Date confirmed by you", "您确认的日期")}<input required type="date" min="2000-01-01" max="2200-12-31" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><label className="business-checkbox"><input type="checkbox" required checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>{t("I have checked this date. It is my planning record, not a deadline calculated by Launchpad.", "我已核对该日期。这是我的计划记录，并非平台计算的法定期限。")}</span></label><button className="btn btn-primary full" disabled={!confirmed || !period.trim() || !dueDate}>{t("Save dated record", "保存日期事项")}<Check size={17} /></button><p className="business-caption">{t("Shown in your workspace. No email or push notification is sent. Add the next period separately; completing this one never closes the next.", "在工作台内显示，不发送邮件或推送。下一期需独立添加，完成本期不会关闭下一期。")}</p></fieldset></form></div></>;
}

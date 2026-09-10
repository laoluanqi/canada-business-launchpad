"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Maximize, Minimize, Pause, Play, Printer, RotateCcw, StickyNote, X } from "lucide-react";
import { bi, getScenario, getSource, scenarios, sources, tasks } from "@/lib/content";
import { createInitialState, synthesizeAssessmentScenario } from "@/lib/demo-repository";
import { initialPresentation, presentationChapters, PRESENTATION_STORAGE_KEY, restorePresentation } from "@/lib/presentation";
import { summarizeWorkflow, taskIsBlocked } from "@/lib/workflow";
import type { Locale, LocalizedText, TaskKind } from "@/lib/types";

const kindLabels: Record<TaskKind, LocalizedText> = {
  mandatory: bi("Required", "必需"), conditional: bi("Conditional", "有条件适用"),
  optional: bi("Optional", "可选"), not_applicable: bi("Not applicable", "不适用"), needs_expert: bi("Expert Review", "专家审核"),
};

export function PresentationPage({ locale }: { locale: Locale }) {
  const [view, setView] = useState(initialPresentation);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const t = (en: string, zh: string) => locale === "en" ? en : zh;
  const chapter = presentationChapters[view.chapter];
  const selected = getScenario(view.scenarioId) ?? scenarios[0];
  const calculated = synthesizeAssessmentScenario({
    ...selected.profile,
    registrationStatus: selected.profile.stage === "planning" ? "unsure" : "registered",
    businessNameUse: "unsure", hasOntarioFacilityOffice: "no", gstRegistered: "unsure",
  });
  const scenario = { ...calculated, title: selected.title, descriptor: selected.descriptor };
  const baseline = { ...createInitialState(), activeScenarioId: scenario.id };
  const baselineFlow = summarizeWorkflow(baseline, scenario);
  const rehearsalTask = baselineFlow.next?.task;
  const rehearsalKey = `${scenario.id}:${rehearsalTask?.id}`;
  const rehearsalState = {
    ...baseline,
    taskStatus: scenario.boundary ? {} : {
      [rehearsalKey]: view.rehearsal === "done" ? "done" as const : view.rehearsal === "waiting" ? "external_pending" as const : "not_started" as const,
    },
  };
  const flow = summarizeWorkflow(rehearsalState, scenario);
  const materials = rehearsalTask?.materials ?? [
    bi("Confirm the sample business situation", "确认样例企业情况"),
    bi("Read the linked official guidance", "查看所附官方指引"),
    bi("List questions to verify with the service", "列出需向服务方核验的问题"),
  ];
  const allChecked = materials.length > 0 && materials.every((_, index) => view.checks[index]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let stored: unknown;
      try { stored = JSON.parse(sessionStorage.getItem(PRESENTATION_STORAGE_KEY) ?? "null"); } catch { /* In-memory rehearsal remains available. */ }
      const restored = restorePresentation(stored, scenarios.map((item) => item.id));
      const params = new URLSearchParams(window.location.search);
      const index = Number(params.get("chapter"));
      if (params.has("chapter") && Number.isInteger(index) && index >= 1 && index <= 6) restored.chapter = index - 1;
      setView(restored);
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(PRESENTATION_STORAGE_KEY, JSON.stringify(view)); } catch { /* No server fallback: presentation data stays on this device. */ }
    const url = new URL(window.location.href);
    url.searchParams.set("chapter", String(view.chapter + 1));
    window.history.replaceState(null, "", url);
  }, [view, ready]);

  const go = useCallback((chapterIndex: number) => {
    setView((current) => ({ ...current, chapter: Math.max(0, Math.min(5, chapterIndex)) }));
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if ((event.target as HTMLElement).closest("input, textarea, select, a, button, [contenteditable]")) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        go(view.chapter + (event.key === "ArrowRight" ? 1 : -1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, view.chapter]);

  useEffect(() => {
    if (!running) return;
    const start = Date.now() - seconds * 1000;
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => window.clearInterval(timer);
    // Anchor once per play/pause transition to avoid timer drift.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setNotice(t("Full screen is unavailable here. The presentation is still usable.", "当前环境不支持全屏，仍可正常展示。"));
    } catch { setNotice(t("Full screen was unavailable. Continue in this window.", "未能进入全屏，可在当前窗口继续展示。")); }
  };
  const chooseScenario = (scenarioId: string) => setView((current) => ({ ...current, scenarioId, checks: [], rehearsal: "preparing", consent: false, received: false }));
  // Leaving the isolated rehearsal opens the chooser, never silently resets an existing assessment.
  const openWorkspace = `/${locale}/launch`;
  const currentStep = view.rehearsal === "done" ? 3 : view.rehearsal === "waiting" ? 2 : allChecked ? 1 : 0;

  return (
    <div className="presentation-root" data-presentation-ready={ready ? "true" : "false"}>
      <header className="present-header">
        <a href={`/${locale}`} className="present-brand"><span className="brand-mark">CB</span><span>Canada Business<br /><b>Launchpad</b></span></a>
        <span className="present-disclaimer">{t("PREVIEW · ONTARIO PILOT · GENERAL INFORMATION ONLY", "产品预览 · 安省试点 · 仅提供一般信息")}</span>
        <div className="present-tools">
          <button className="present-tool" aria-pressed={view.notes} onClick={() => setView({ ...view, notes: !view.notes })}><StickyNote size={18} />{t("Notes", "讲解备注")}</button>
          <button className="present-tool icon-only" aria-label={t("Print presentation handout", "打印产品讲义")} onClick={() => window.print()}><Printer size={18} /></button>
          <button className="present-tool icon-only" aria-label={fullscreen ? t("Exit full screen", "退出全屏") : t("Full screen", "全屏展示")} onClick={toggleFullscreen}>{fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</button>
          <a className="present-tool" href={`/${locale === "en" ? "zh" : "en"}/present?chapter=${view.chapter + 1}`}>{t("中文", "English")}</a>
          <a className="present-tool" href={openWorkspace}>{t("My workspace", "我的工作台")}<ArrowRight size={16} /></a>
          <a className="present-tool icon-only" aria-label={t("Exit presentation", "退出介绍")} href={openWorkspace}><X size={18} /></a>
        </div>
      </header>
      <div className="present-body">
        <aside className="present-sidebar">
          <div className="present-sidebar-intro"><span className="present-eyebrow">{t("THE PRODUCT STORY", "产品讲解")}</span><h2>{t("A clearer way to start.", "把创业这件事，讲清楚。")}</h2><p>{t("6 chapters · suggested 8 minutes", "6个章节 · 建议8分钟")}</p></div>
          <div className="present-audience" aria-label={t("Audience", "讲解对象")}>
            {(["founder", "partner"] as const).map((audience) => <button key={audience} aria-pressed={view.audience === audience} onClick={() => setView({ ...view, audience })}>{audience === "founder" ? t("For founders", "客户视角") : t("For partners", "合作方视角")}</button>)}
          </div>
          <nav className="present-chapters" aria-label={t("Presentation chapters", "产品章节")}>
            {presentationChapters.map((item, index) => <button key={item.label.en} onClick={() => go(index)} aria-current={index === view.chapter ? "step" : undefined}><span>{String(index + 1).padStart(2, "0")}</span>{item.label[locale]}{index === view.chapter && <ArrowRight size={16} />}</button>)}
          </nav>
          <div className="present-session">
            <span>{t("REHEARSAL TIMER", "讲解计时")}</span>
            <div><output aria-label={t("Elapsed time", "已用时间")}>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</output><button className="present-tool" aria-label={running ? t("Pause timer", "暂停计时") : t("Start timer", "开始计时")} onClick={() => setRunning(!running)}>{running ? <Pause size={18} /> : <Play size={18} />}</button></div>
            <button className="present-reset" onClick={() => { setView(initialPresentation()); setRunning(false); setSeconds(0); setNotice(""); }}><RotateCcw size={15} />{t("Restart rehearsal", "重新演练")}</button>
            <p>{t("Tab-local sample data. Your workspace is unchanged.", "样例仅保留在当前标签页，不修改原工作台数据。")}</p>
          </div>
        </aside>
        <main className="present-main" id="presentation-content">
          <div className="present-chapter-heading"><span className="present-eyebrow">{String(view.chapter + 1).padStart(2, "0")} / 06 · {chapter.label[locale]}</span><h1 ref={heading} tabIndex={-1}>{chapter.title[locale]}</h1><p>{chapter.summary[locale]}</p></div>
          {notice && <p role="status" className="present-notice">{notice}</p>}
          <div className="present-scene" key={view.chapter}>
            {view.chapter === 0 && <div className="present-concept">
              <div className="present-before"><span className="present-eyebrow">{t("WITHOUT A CONNECTED PLAN", "流程分散时")}</span><h2>{t("Every site is a new starting point.", "每换一个网站，又从头理解。")}</h2><div className="present-fragments">{[bi("Ontario registry", "安省注册处"), bi("CRA accounts", "CRA账户"), bi("Permits & licences", "许可与牌照"), bi("Professional services", "专业服务")].map((item) => <span key={item.en}>{item[locale]}<ExternalLink size={16} /></span>)}</div><p>{t("You assemble the order, remember missing materials and track the follow-up yourself.", "顺序自己拼，材料自己记，后续事项自己追。")}</p></div>
              <div className="present-after"><span className="present-eyebrow">CANADA BUSINESS LAUNCHPAD</span><h2>{t("One plan connects the journey.", "用一份计划，把过程接起来。")}</h2><ol>{[bi("Understand your situation", "了解您的经营情况"), bi("Build the relevant plan", "整理适用行动计划"), bi("Prepare before leaving", "办理前准备材料"), bi("Record and keep moving", "回来记录，继续下一步")].map((item, index) => <li key={item.en}><span>{index + 1}</span>{item[locale]}</li>)}</ol><p>{t("Official services handle applications. Launchpad connects preparation and progress.", "申请仍在官方服务完成，平台连接准备与进度。")}</p></div>
            </div>}

            {view.chapter === 1 && <div className="present-profile-layout">
              <div className="present-profile-options">{scenarios.map((item) => <button key={item.id} className={`present-profile ${item.id === view.scenarioId ? "selected" : ""}`} aria-pressed={item.id === view.scenarioId} onClick={() => chooseScenario(item.id)}><span>{item.number}</span><div><b>{item.title[locale]}</b><small>{item.descriptor[locale]}</small></div>{item.id === view.scenarioId && <Check size={20} />}</button>)}</div>
              <section className="present-profile-result" aria-live="polite"><span className="present-eyebrow">{t("MATCHED PLAN", "匹配计划")}</span><h2>{scenario.title[locale]}</h2><p>{selected.outcome[locale]}</p><div className="present-counts">{(["mandatory", "conditional", "needs_expert", "not_applicable"] as const).map((kind) => <div key={kind}><b>{flow.entries.filter((item) => item.kind === kind).length}</b><span>{kindLabels[kind][locale]}</span></div>)}</div><p className="present-footnote">{t("The plan uses sample business details and predefined rules. No identity data is requested.", "计划依据样例企业情况和预设规则生成，无需提供身份资料。")}</p><button className="btn btn-primary" onClick={() => go(2)}>{t("See this plan", "查看这份计划")}<ArrowRight size={17} /></button></section>
            </div>}

            {view.chapter === 2 && <div className="present-plan-layout">
              <section className="present-action"><span className="present-eyebrow">{scenario.boundary ? t("EXPERT REVIEW", "专家审核") : t("NEXT BEST ACTION", "下一最佳行动")}</span><h2>{flow.next?.task.title[locale] ?? t("Review your progress", "复核当前进度")}</h2><p>{flow.next?.task.summary[locale]}</p><div className="present-progress-number">{flow.progress}<span>%</span></div><p className="present-footnote">{t("User-marked progress, not a compliance score or approval status.", "用户自报任务进度，不是合规评分或审批状态。")}</p><a href={openWorkspace} className="btn btn-primary">{t("Open my business workspace", "进入我的企业工作台")}<ExternalLink size={16} /></a></section>
              <section className="present-plan-list"><h3>{scenario.title[locale]}</h3><div className="present-phase-strip">{flow.phases.map((phase) => <div key={phase.id}><b>{phase.label[locale]}</b><span>{phase.done}/{phase.total}</span></div>)}</div>{flow.entries.slice(0, 5).map((item) => <div className="present-task-row" key={item.id}><span>{item.task.number}</span><div><b>{item.task.title[locale]}</b><small>{taskIsBlocked(rehearsalState, scenario, item.task) ? t("Prerequisite review needed", "需先处理前置任务") : t("No unfinished prerequisite", "无未完成前置任务")}</small></div><span className={`kind-pill ${item.kind}`}>{kindLabels[item.kind][locale]}</span></div>)}<p className="present-footnote">{t(`${flow.entries.length} mapped tasks · ${flow.waiting.length} waiting externally`, `${flow.entries.length}项任务 · ${flow.waiting.length}项外部等待`)}</p></section>
            </div>}

            {(view.chapter === 3 || view.chapter === 4) && <div className="present-rehearsal">
              <div className="present-rehearsal-top"><span className="present-eyebrow">{t("ISOLATED WORKFLOW REHEARSAL", "独立流程演练")}</span><span>{scenario.title[locale]}</span></div>
              {scenario.boundary ? <div className="present-boundary"><h2>{t("Prepare questions, not a final determination.", "整理问题，不给最终判断。")}</h2><p>{selected.outcome[locale]}</p><div className="present-source-list">{rehearsalTask?.sourceIds.map((id) => { const source = getSource(id); return source && <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.title[locale]} · {source.verified}<ExternalLink size={15} /></a>; })}</div><button className="btn btn-primary" onClick={() => go(5)}>{t("Show expert handoff", "展示专家接力")}<ArrowRight size={17} /></button></div> : rehearsalTask && <>
                <h2>{rehearsalTask.title[locale]}</h2>
                {!rehearsalTask.full && <p className="present-footnote">{t("This is a summary task. The checklist below rehearses preparation questions; it is not an official material requirement.", "此项为概览任务，下方清单仅演练准备问题，不是官方材料要求。")}</p>}
                <ol className="present-handoff-steps">{[bi("Prepare", "准备材料"), bi("Ready", "准备就绪"), bi("Waiting externally", "外部等待"), bi("User-recorded", "用户回填")].map((item, index) => <li key={item.en} className={currentStep >= index ? "reached" : ""}><span>{index + 1}</span>{item[locale]}</li>)}</ol>
                <div className="present-rehearsal-grid"><section>
                  {view.chapter === 3 ? <><h3>{t("Check before continuing", "继续前核对")}</h3><div className="present-checklist">{materials.map((item, index) => <label key={item.en}><input type="checkbox" checked={Boolean(view.checks[index])} disabled={view.rehearsal !== "preparing"} onChange={(event) => { const checks = [...view.checks]; checks[index] = event.target.checked; setView({ ...view, checks }); }} /><span>{item[locale]}</span></label>)}</div><button className="btn btn-primary" disabled={!allChecked || view.rehearsal !== "preparing"} onClick={() => setView({ ...view, rehearsal: "waiting" })}>{view.rehearsal === "preparing" ? t("Record simulated external waiting", "记录模拟外部等待") : t("External waiting recorded", "已记录外部等待")}</button><p className="present-footnote">{t("This button only changes the rehearsal. No application or request is sent.", "按钮只改变演练状态，不提交申请或发出请求。")}</p>{view.rehearsal !== "preparing" && <button className="text-link" onClick={() => go(4)}>{t("Continue with a sample record", "继续体验回填")}<ArrowRight size={16} /></button>}</> : <><h3>{t("A safe sample, not a real receipt", "安全样例，不是真实回执")}</h3><div className="present-receipt"><span>{t("Sample reference", "样例参考号")}</span><strong>SAMPLE-2026-001</strong><span>sample-confirmation.pdf</span><small>{t("Text only · no file upload", "仅文本 · 无文件上传")}</small></div><button className="btn btn-primary" disabled={view.rehearsal !== "waiting"} onClick={() => setView({ ...view, rehearsal: "done" })}><Check size={18} />{view.rehearsal === "done" ? t("Sample completion recorded", "样例完成已记录") : t("Record sample completion", "记录样例完成")}</button>{view.rehearsal === "preparing" && <button className="text-link" onClick={() => go(3)}>{t("Prepare the checklist first", "先完成材料准备")}<ArrowLeft size={16} /></button>}</>}
                </section><aside>
                  {view.chapter === 3 ? <><h3>{t("Evidence beside the action", "操作旁边，就是依据")}</h3><p>{rehearsalTask.why?.[locale] ?? rehearsalTask.summary[locale]}</p><dl className="present-task-facts"><div><dt>{t("Cost", "费用")}</dt><dd>{rehearsalTask.cost?.[locale] ?? t("Confirm on the official service", "请在官方服务确认")}</dd></div><div><dt>{t("Timing", "时间")}</dt><dd>{rehearsalTask.timing?.[locale] ?? t("No estimate in this summary", "本概览不提供预估")}</dd></div></dl><div className="present-source-list">{rehearsalTask.sourceIds.map((id) => { const source = getSource(id); return source && <a href={source.url} target="_blank" rel="noreferrer" key={id}><span>{source.title[locale]}<small>{source.jurisdiction} · {t("Reviewed", "核验于")} {source.verified}</small></span><ExternalLink size={17} /></a>; })}</div><p className="present-footnote">{t("Official reference links; current requirements must be confirmed on the source page.", "官方参考入口；最新要求须在来源页再次确认。")}</p></> : <div aria-live="polite"><span className="present-eyebrow">{t("WHAT CHANGED", "刚刚发生了什么")}</span><div className="present-progress-number">{flow.progress}<span>%</span></div><p>{t(`${flow.done} user-recorded milestone(s) · unverified`, `${flow.done}项用户自报完成 · 未经核验`)}</p><h3>{t("Next action", "下一步")}</h3><p>{flow.next?.task.title[locale] ?? t("Review ongoing obligations", "复核持续义务")}</p><div className="present-obligations">{[bi("Corporate annual return", "公司年报"), bi("T2 income-tax return", "T2所得税申报"), bi("GST/HST and payroll", "GST/HST与Payroll")].map((item) => <span key={item.en}>{item[locale]}</span>)}</div><p className="present-footnote">{t("Different obligations; applicability depends on the business. Dates in the calendar remain illustrative.", "以上为不同义务，须按企业情况判断适用性；日历日期仍为示例。")}</p></div>}
                </aside></div>
              </>}
            </div>}

            {view.chapter === 5 && <div className="present-trust-layout"><section className="present-consent"><span className="present-eyebrow">{t("SIMULATED PARTNER · NO REAL RECIPIENT", "模拟合作方 · 无真实接收方")}</span><h2>{t("A transparent handoff", "透明的服务接力")}</h2><p>{t("Sample fields that would be shared", "拟共享的样例字段")}</p><ul><li>{t("Scenario and Ontario location", "画像与安省地区")}</li><li>{t("Selected task and preparation status", "所选任务与材料准备状态")}</li><li>{t("Questions needing professional review", "需要专业复核的问题")}</li></ul><p className="present-footnote">{t("No contact details, identity documents or real files. Future referral commissions require separate agreements and disclosure; none is earned here.", "不含联系方式、身份资料或真实文件。未来佣金须另行签约并披露，本预览不产生佣金。")}</p><label className="present-consent-check"><input type="checkbox" checked={view.consent} disabled={view.received} onChange={(event) => setView({ ...view, consent: event.target.checked })} /><span>{t("I understand this is a local simulation and have reviewed the sample fields and disclosure.", "我理解这仅为本地模拟，并已查看样例字段及披露。")}</span></label><button className="btn btn-primary" disabled={!view.consent || view.received} onClick={() => setView({ ...view, received: true })}>{view.received ? t("Simulated receipt created", "已生成模拟接收记录") : t("Simulate partner receipt", "模拟合作方接收")}</button>{view.received && <p role="status" className="present-notice">{t("Simulated receipt · stored in this tab only. Nothing was sent to a partner.", "已生成模拟接收记录 · 仅保存在当前标签页，未向合作方发送任何内容。")}</p>}</section><section className="present-scope"><h2>{t("What you can introduce today", "现在可以向外界介绍什么")}</h2>{[
                [bi("WORKING", "已实现"), bi("Assessment, plan, materials, sources, progress and bilingual presentation.", "问诊、计划、材料、来源、进度和双语展示。")],
                [bi("SIMULATED", "模拟展示"), bi("Completion records, reminders, AI explanations and partner handoffs.", "完成回填、提醒、AI解释与伙伴接力。")],
                [bi("AFTER VALIDATION", "验证后再做"), bi("Real accounts and partner connections, after privacy, agreements and service responsibilities are established.", "在隐私、协议和服务责任落实后，再启用真实账户与伙伴连接。")],
              ].map(([label, description]) => <div key={label.en}><b>{label[locale]}</b><p>{description[locale]}</p></div>)}<a className="text-link" href={`/${locale}/${view.audience === "partner" ? "partners" : "launch"}`}>{view.audience === "partner" ? t("Review the partnership model", "查看合作方式") : t("Open my business workspace", "进入我的企业工作台")}<ExternalLink size={16} /></a></section></div>}
          </div>
          <div className="present-takeaway"><span>{view.audience === "partner" ? t("PARTNER VALUE", "合作方价值") : t("FOUNDER VALUE", "客户价值")}</span><p>{chapter[view.audience][locale]}</p></div>
          {view.notes && <aside className="present-notes"><StickyNote size={20} /><div><b>{t("Presenter notes · visible to your audience if screen sharing", "讲解备注 · 共享屏幕时观众也可见")}</b><p>{chapter.note[locale]}</p></div></aside>}
          <footer className="present-footer"><span>{t("Use ← → to navigate · no real submissions", "可用 ← → 翻页 · 不进行真实办理")}</span><div><button className="btn btn-outline" disabled={view.chapter === 0} onClick={() => go(view.chapter - 1)}><ArrowLeft size={17} />{t("Previous", "上一步")}</button>{view.chapter < 5 ? <button className="btn btn-primary" onClick={() => go(view.chapter + 1)}>{t("Next chapter", "下一章节")}<ArrowRight size={17} /></button> : <a className="btn btn-primary" href={openWorkspace}>{t("Explore the product", "进入产品体验")}<ExternalLink size={17} /></a>}</div></footer>
        </main>
      </div>
      <article className="present-print-handout"><h1>Canada Business Launchpad</h1><p>{t("Ontario business planning and progress workspace", "安省创业规划与进度工作台")}</p><p>Preview / Ontario Pilot / General information only</p><p>{tasks.length} {t("task definitions", "项任务")} · {sources.length} {t("maintained sources", "条维护来源")} · {t("English + Chinese", "中英双语")}</p>{presentationChapters.map((item, index) => <section key={item.label.en}><h2>{index + 1}. {item.title[locale]}</h2><p>{item.summary[locale]}</p><p>{item[view.audience][locale]}</p></section>)}<p>{t("Not a government service. No real applications, payments, uploads or partner transfers. Official rules must be rechecked before use.", "非政府服务，不进行真实申请、支付、上传或伙伴传输。使用前须再次核验官方规则。")}</p><p>https://canada-business-launchpad-demo-2026.aideptus3.chatgpt.site/{locale}</p></article>
    </div>
  );
}

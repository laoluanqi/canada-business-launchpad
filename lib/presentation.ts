import { bi } from "./content";

export const presentationChapters = [
  {
    label: bi("The idea", "产品理念"),
    title: bi("Many services. One connected plan.", "入口可以分散，创业进度不必。"),
    summary: bi("Not another directory. A workspace that connects what to do, what to prepare, where to go and how to keep moving.", "不再增加一份网站目录，而是连接：先做什么、准备什么、去哪里办理、回来如何继续。"),
    founder: bi("You keep one clear plan while official and professional services handle their own transactions.", "您管理一份清晰的行动计划，具体办理仍由官方和专业服务完成。"),
    partner: bi("A shared workflow can organize context before a professional engagement. It does not replace your professional judgement.", "在专业服务开始前整理情境与准备状态，不取代合作方的专业判断。"),
    note: bi("Start with the fragmented journey, not AI. Point out that the platform connects preparation and progress; it does not embed government transactions.", "先讲用户流程割裂的问题，不先讲 AI。强调平台连接准备与进度，不是把政府办理系统搬进来。"),
  },
  {
    label: bi("Your situation", "情境匹配"),
    title: bi("Different businesses. Different next steps.", "不同企业，不走同一张清单。"),
    summary: bi("Switch a sample profile and see the actual preview rule set recalculate. Residency is a fact to review, not our market definition.", "切换样例画像，查看现有预览规则计算出的差异。居住地是判断变量，不是市场定位。"),
    founder: bi("Start from your stage, business structure and activities, rather than reading every government page.", "从经营阶段、企业结构和活动开始，不必先逐一阅读所有网站。"),
    partner: bi("Stage, location and activities create a clearer starting point for a conversation, not a qualified lead guarantee.", "阶段、地区和活动构成更清晰的沟通起点，不等于保证线索质量或转化。"),
    note: bi("Compare the consultant with the first-hire profile. Then choose a boundary profile: applicable tasks switch to Expert Review instead of generating a definitive answer.", "对比顾问与首次雇员画像，再选择边界画像：适用任务转专家审核，而不是强行给出确定性结论。"),
  },
  {
    label: bi("The next action", "下一步行动"),
    title: bi("See the next step. Keep the whole picture.", "下一步清楚，全局也不丢。"),
    summary: bi("Tasks retain their applicability, dependencies and sources. The workspace separates actionable work from external waiting.", "任务保留适用条件、前后依赖和来源，工作台区分可推进事项与外部等待。"),
    founder: bi("Know which action is ready now and what must happen before the others.", "知道现在可以做什么，以及其他事项还缺哪些前置条件。"),
    partner: bi("A visible milestone makes it easier to explain your role and what remains with the founder.", "以可见的里程碑说明合作方负责什么、哪些行动仍由创业者完成。"),
    note: bi("Explain Required versus Conditional. The percentage measures user-marked plan progress, not legal compliance or government approval.", "解释“必需”和“有条件适用”的区别。进度百分比是用户自报任务进度，不是合规评分或政府审批进度。"),
  },
  {
    label: bi("Prepare & hand off", "准备与办理"),
    title: bi("Prepare first. Then use the right service.", "带着准备，去正确的入口。"),
    summary: bi("Rehearse a real task checklist. Opening a website is not an application: waiting status must be recorded explicitly.", "演练真实任务的材料清单。打开网站不代表申请已提交，外部等待状态由用户明确记录。"),
    founder: bi("Keep materials, prerequisites and official sources together before leaving the workspace.", "离开平台前，把材料、前置任务和官方依据放在一起核对。"),
    partner: bi("The preparation checklist can support a more focused handoff. The receiving service still verifies the information.", "材料清单帮助聚焦交接，接收服务仍需自行验证信息。"),
    note: bi("Check each item, inspect a source, then record simulated external waiting. No application is submitted, and no real file is requested.", "勾选材料、展示来源，再记录模拟外部等待。这里不提交申请，不收取真实文件。"),
  },
  {
    label: bi("Return & continue", "回填与继续"),
    title: bi("The handoff is not the end of the journey.", "跳转不是终点，回来继续推进。"),
    summary: bi("Record a fictional completion and see the next action change. Recurring obligations remain separate from the completed milestone.", "记录虚构完成凭证，展示下一步如何变化。持续义务与本次完成的里程碑分开管理。"),
    founder: bi("Your record and next action stay together, without implying a live government status check.", "完成记录和下一步保持连接，不暗示已实时核验政府状态。"),
    partner: bi("A recorded milestone gives both sides context for the next conversation. Partner status reporting is still simulated.", "已记录的里程碑为下一次沟通提供上下文，伙伴状态回传目前仍为模拟。"),
    note: bi("Use the sample reference button. Show the changed progress and next action. Distinguish the company annual return from T2, GST/HST and payroll.", "使用样例参考号按钮，展示进度与下一步变化。说明公司年报、T2、GST/HST 与 Payroll 并非同一事项。"),
  },
  {
    label: bi("Trust & scope", "信任与边界"),
    title: bi("Useful guidance. Explicit boundaries.", "有用的指引，明确的边界。"),
    summary: bi("Professional help begins with context, disclosure and consent. This prototype demonstrates the workflow, not an existing commercial partnership.", "专业接力从情境、披露和同意开始。本版展示工作方式，不代表已有商业合作。"),
    founder: bi("Choose official self-service or professional help. You see what would be shared before making that choice.", "自行选择官方办理或专业帮助，选择前能看清哪些字段会被共享。"),
    partner: bi("Real referrals need an agreement, data boundaries, responsibilities and commercial disclosures. No lead or commission is generated here.", "真实转介须先约定协议、数据边界、责任与商业披露；这里不生成真实线索或佣金。"),
    note: bi("Demonstrate the consent gate, then finish with what works, what is simulated and what requires a partnership. Invite the audience to try the workspace.", "展示同意门槛，用“已实现／模拟／需合作”收束。最后邀请观众进入实际工作台体验。"),
  },
];

export const PRESENTATION_STORAGE_KEY = "cbl-presentation:v1";
export type PresentationState = {
  chapter: number;
  scenarioId: string;
  audience: "founder" | "partner";
  notes: boolean;
  checks: boolean[];
  rehearsal: "preparing" | "waiting" | "done";
  consent: boolean;
  received: boolean;
};
export const initialPresentation = (): PresentationState => ({
  chapter: 0, scenarioId: "toronto-consultant", audience: "founder", notes: false,
  checks: [], rehearsal: "preparing", consent: false, received: false,
});

export function restorePresentation(value: unknown, scenarioIds: string[]): PresentationState {
  const initial = initialPresentation();
  if (!value || typeof value !== "object") return initial;
  const item = value as Partial<PresentationState>;
  return {
    chapter: Number.isInteger(item.chapter) && item.chapter! >= 0 && item.chapter! < presentationChapters.length ? item.chapter! : 0,
    scenarioId: typeof item.scenarioId === "string" && scenarioIds.includes(item.scenarioId) ? item.scenarioId : initial.scenarioId,
    audience: item.audience === "partner" ? "partner" : "founder",
    notes: item.notes === true,
    checks: Array.isArray(item.checks) ? item.checks.slice(0, 30).map((checked) => checked === true) : [],
    rehearsal: item.rehearsal === "waiting" || item.rehearsal === "done" ? item.rehearsal : "preparing",
    consent: item.consent === true,
    received: item.consent === true && item.received === true,
  };
}

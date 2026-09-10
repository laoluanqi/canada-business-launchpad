import type { LocalizedText } from "./types";

type AssessmentQuestion = {
  id: string;
  label: LocalizedText;
  hint: LocalizedText;
  options: Array<{ value: string | boolean; label: LocalizedText }>;
  show?: (answers: Record<string, string | boolean>) => boolean;
};

export const assessmentQuestions: AssessmentQuestion[] = [
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
      en: "Only a confirmed registration makes the return task required in this preview; otherwise the workspace keeps it conditional.",
      zh: "本预览仅在确认已注册时将申报任务列为必需；其他情况均保留为条件任务。",
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

export const assessmentDefaults: Record<string, string | boolean> = {
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

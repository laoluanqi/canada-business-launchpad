export type Locale = "en" | "zh";

export type LocalizedText = {
  en: string;
  zh: string;
};

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "external_pending"
  | "done"
  | "not_applicable"
  | "needs_expert";

export type TaskKind =
  | "mandatory"
  | "conditional"
  | "optional"
  | "not_applicable"
  | "needs_expert";

export type BusinessProfile = {
  stage: "planning" | "registered" | "operating";
  city: "Toronto" | "Ontario";
  industry: "services" | "ecommerce" | "regulated";
  structure: "sole_prop" | "corporation" | "undecided";
  employees: "none" | "hiring" | "existing";
  revenue: "under_30k" | "near_30k" | "over_30k";
  imports: boolean;
  crossProvince: boolean;
  complexResidency: boolean;
};

export type ScenarioTask = {
  id: string;
  kind: TaskKind;
};

export type DemoScenario = {
  id: string;
  number: string;
  title: LocalizedText;
  descriptor: LocalizedText;
  outcome: LocalizedText;
  badge: LocalizedText;
  accent: "blue" | "gold" | "teal" | "purple" | "slate" | "red";
  boundary?: boolean;
  profile: BusinessProfile;
  tasks: ScenarioTask[];
};

export type SourceRecord = {
  id: string;
  authority: string;
  title: LocalizedText;
  jurisdiction: "Canada" | "Ontario" | "Toronto";
  url: string;
  verified: string;
  cadence: LocalizedText;
  status: "verified" | "review_due";
};

export type TaskDefinition = {
  id: string;
  number: string;
  phase: "plan" | "register" | "set_up" | "operate" | "comply";
  title: LocalizedText;
  shortTitle: LocalizedText;
  summary: LocalizedText;
  why?: LocalizedText;
  materials?: LocalizedText[];
  cost?: LocalizedText;
  timing?: LocalizedText;
  due?: LocalizedText;
  dependsOn?: string[];
  workflowRisk?: "low" | "medium" | "high" | "expert";
  sourceIds: string[];
  officialUrl?: string;
  full: boolean;
  tags: string[];
};

export type Provider = {
  id: string;
  name: string;
  type: "official" | "independent" | "demo_partner" | "sponsored";
  category: LocalizedText;
  description: LocalizedText;
  region: LocalizedText;
  price: LocalizedText;
  priceSource: LocalizedText;
  verified: string;
  website: string;
  sharedFields: LocalizedText[];
  commercialDisclosure?: LocalizedText;
};

export type CalendarEvent = {
  id: string;
  month: string;
  day: string;
  type: "corporate" | "tax" | "payroll" | "permit" | "privacy";
  title: LocalizedText;
  note: LocalizedText;
  sourceId: string;
};

export type EvidenceRecord = {
  taskId: string;
  reference: string;
  fileName: string;
  completedAt: string;
};

export type ConsentRecord = {
  providerId: string;
  fields: string[];
  acceptedAt: string;
};

export type ReferralRecord = {
  id: string;
  providerId: string;
  scenarioId: string;
  createdAt: string;
  status: "draft" | "demo_received";
};

export type DemoState = {
  version: 1;
  activeScenarioId: string;
  assessmentAnswers: Record<string, string | boolean>;
  taskStatus: Record<string, TaskStatus>;
  materialChecks: Record<string, boolean[]>;
  evidence: Record<string, EvidenceRecord>;
  consents: ConsentRecord[];
  referrals: ReferralRecord[];
};

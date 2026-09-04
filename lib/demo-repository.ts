"use client";

import { bi, getScenario, scenarios } from "./content";
import type {
  BusinessProfile,
  DemoScenario,
  DemoState,
  EvidenceRecord,
  ReferralRecord,
  TaskKind,
  TaskStatus,
} from "./types";

export const DEMO_STORAGE_KEY = "cbl-demo:v1";

export const createInitialState = (): DemoState => ({
  version: 1,
  activeScenarioId: "toronto-consultant",
  assessmentAnswers: {},
  taskStatus: {},
  materialChecks: {},
  evidence: {},
  consents: [],
  referrals: [],
});

const canUseStorage = () => typeof window !== "undefined";

export class DemoRepository {
  read(): DemoState {
    if (!canUseStorage()) return createInitialState();
    try {
      const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (!stored) return createInitialState();
      const parsed = JSON.parse(stored) as DemoState;
      return parsed.version === 1
        ? {
            ...createInitialState(),
            ...parsed,
            materialChecks: parsed.materialChecks ?? {},
          }
        : createInitialState();
    } catch {
      return createInitialState();
    }
  }

  save(state: DemoState): DemoState {
    if (canUseStorage()) {
      try {
        window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
      } catch {
        // The interactive demo still works when browser storage is unavailable.
      }
    }
    return state;
  }

  chooseScenario(state: DemoState, scenarioId: string): DemoState {
    const scenario = getScenario(scenarioId) ?? scenarios[0];
    return this.save({
      ...state,
      activeScenarioId: scenario.id,
      assessmentAnswers: {},
    });
  }

  saveAssessment(
    state: DemoState,
    answers: Record<string, string | boolean>,
    scenarioId: string,
  ): DemoState {
    return this.save({
      ...state,
      assessmentAnswers: answers,
      activeScenarioId: scenarioId,
    });
  }

  updateTask(
    state: DemoState,
    scenarioId: string,
    taskId: string,
    status: TaskStatus,
  ): DemoState {
    return this.save({
      ...state,
      taskStatus: {
        ...state.taskStatus,
        [`${scenarioId}:${taskId}`]: status,
      },
    });
  }

  updateMaterialCheck(
    state: DemoState,
    scenarioId: string,
    taskId: string,
    index: number,
    checked: boolean,
    total: number,
  ): DemoState {
    const key = `${scenarioId}:${taskId}`;
    const current = state.materialChecks[key] ?? Array(total).fill(false);
    const next = Array.from({ length: total }, (_, itemIndex) =>
      itemIndex === index ? checked : Boolean(current[itemIndex]),
    );
    return this.save({
      ...state,
      materialChecks: { ...state.materialChecks, [key]: next },
    });
  }

  saveEvidence(
    state: DemoState,
    scenarioId: string,
    evidence: EvidenceRecord,
  ): DemoState {
    return this.save({
      ...state,
      evidence: {
        ...state.evidence,
        [`${scenarioId}:${evidence.taskId}`]: evidence,
      },
      taskStatus: {
        ...state.taskStatus,
        [`${scenarioId}:${evidence.taskId}`]: "done",
      },
    });
  }

  createReferral(
    state: DemoState,
    providerId: string,
    fields: string[],
  ): DemoState {
    const now = new Date().toISOString();
    const referral: ReferralRecord = {
      id: `DEMO-${String(state.referrals.length + 1).padStart(3, "0")}`,
      providerId,
      scenarioId: state.activeScenarioId,
      createdAt: now,
      status: "demo_received",
    };
    return this.save({
      ...state,
      consents: [...state.consents, { providerId, fields, acceptedAt: now }],
      referrals: [...state.referrals, referral],
    });
  }

  reset(): DemoState {
    const initial = createInitialState();
    if (canUseStorage()) {
      try {
        window.localStorage.removeItem(DEMO_STORAGE_KEY);
      } catch {
        // Nothing else to clear when browser storage is unavailable.
      }
    }
    return initial;
  }
}

export const demoRepository = new DemoRepository();

export function matchScenario(
  answers: Record<string, string | boolean>,
): string {
  if (answers.complexResidency === true) return "complex-residency";
  if (answers.industry === "regulated" || answers.crossProvince === true) {
    return "regulated-business";
  }
  if (answers.employees === "hiring" || answers.employees === "existing") {
    return "first-hire";
  }
  if (answers.industry === "ecommerce" || answers.imports === true) {
    return "ecommerce-growth";
  }
  if (answers.structure === "corporation") return "service-corporation";
  return "toronto-consultant";
}

export function synthesizeAssessmentScenario(
  answers: Record<string, string | boolean>,
): DemoScenario {
  const matchedId = matchScenario(answers);
  const matched = getScenario(matchedId) ?? scenarios[0];
  const profile: BusinessProfile = {
    stage:
      answers.stage === "registered" || answers.stage === "operating"
        ? answers.stage
        : "planning",
    city: answers.city === "Ontario" ? "Ontario" : "Toronto",
    industry:
      answers.industry === "ecommerce" || answers.industry === "regulated"
        ? answers.industry
        : "services",
    structure:
      answers.structure === "corporation" || answers.structure === "undecided"
        ? answers.structure
        : "sole_prop",
    employees:
      answers.employees === "hiring" || answers.employees === "existing"
        ? answers.employees
        : "none",
    revenue:
      answers.revenue === "near_30k" || answers.revenue === "over_30k"
        ? answers.revenue
        : "under_30k",
    imports: answers.imports === true,
    crossProvince: answers.crossProvince === true,
    complexResidency: answers.complexResidency === true,
  };

  const taskKinds = new Map<string, TaskKind>();
  const add = (id: string, kind: TaskKind = "mandatory") =>
    taskKinds.set(id, kind);

  const registrationTrigger =
    profile.structure === "corporation" ||
    (profile.structure === "sole_prop" &&
      (answers.businessNameUse === "trade_name" ||
        profile.employees !== "none" ||
        answers.hasOntarioFacilityOffice === "yes"));
  const registrationConfirmed =
    profile.stage === "registered" ||
    (profile.stage === "operating" &&
      answers.registrationStatus === "registered");

  if (profile.stage === "planning") {
    add("choose-structure");
    add(
      "name-search",
      profile.structure === "corporation" ? "mandatory" : "conditional",
    );
    add(
      "ontario-registration",
      registrationTrigger ? "mandatory" : "conditional",
    );
  } else if (registrationConfirmed) {
    add("registration-review");
  } else {
    if (answers.registrationStatus !== "not_registered") {
      add("registration-review", "conditional");
    }
    add("ontario-registration", registrationTrigger ? "mandatory" : "conditional");
  }
  if (profile.structure === "undecided") {
    add("choose-structure");
    add("name-search", "conditional");
    if (!registrationConfirmed) add("ontario-registration", "conditional");
  }
  add("permit-scan");
  add("gst-decision");
  add("accounting-stack");
  add("privacy-casl", profile.stage === "registered" ? "conditional" : "mandatory");
  add("record-policy", profile.stage === "registered" ? "conditional" : "mandatory");
  add(
    "quarterly-review",
    profile.stage === "registered" ? "optional" : "mandatory",
  );
  add("insurance-review", "optional");

  if (profile.city === "Toronto") add("toronto-check", "conditional");
  if (profile.structure === "corporation") {
    add("obr-access");
    add("corporate-records");
    add("bn-accounts");
    add("business-banking", "conditional");
    add("annual-return");
    add("t2-return");
    add("t2-balance");
    add("isc-review");
  } else if (profile.structure === "undecided") {
    add("obr-access", "conditional");
    add("corporate-records", "conditional");
    add("bn-accounts", "conditional");
    add("business-banking", "optional");
    add("annual-return", "conditional");
    add("t2-return", "conditional");
    add("t2-balance", "conditional");
    add("isc-review", "conditional");
    add("name-renewal", "conditional");
  } else {
    add("business-banking", "optional");
    add("name-renewal", "conditional");
    add("annual-return", "not_applicable");
    add("t2-return", "not_applicable");
    add("t2-balance", "not_applicable");
    add("isc-review", "not_applicable");
  }
  if (answers.gstRegistered === "yes") {
    add("gst-return");
  } else if (
    profile.revenue === "near_30k" ||
    profile.revenue === "over_30k"
  ) {
    add("gst-return", "conditional");
  }
  if (profile.industry === "ecommerce") {
    add("payments");
  }
  if (profile.imports) add("import-export");
  else add("import-export", "not_applicable");
  if (profile.employees !== "none") {
    add("payroll-account");
    add("hiring-readiness");
    add("wsib", "conditional");
    add("posters");
    add("employment-baseline");
    add("insurance-review");
    add("payroll-remittance");
  } else {
    add("payroll-account", "not_applicable");
    add("hiring-readiness", "not_applicable");
    add("payroll-remittance", "not_applicable");
  }
  if (profile.industry === "regulated" || profile.crossProvince) {
    add("choose-structure", "needs_expert");
    add("permit-scan", "needs_expert");
    add("gst-decision", "needs_expert");
    if (taskKinds.has("ontario-registration")) {
      add("ontario-registration", "conditional");
    }
    if (profile.city === "Toronto") add("toronto-check", "needs_expert");
  }
  if (profile.complexResidency) {
    // Ontario corporations do not have a general director-residency requirement.
    // Review is for cross-border ownership, tax, banking and filing facts.
    add("choose-structure", "needs_expert");
    add("ontario-registration", "needs_expert");
    if (taskKinds.has("registration-review")) {
      add("registration-review", "needs_expert");
    }
    add("bn-accounts", "needs_expert");
    add("business-banking", "needs_expert");
  }

  return {
    ...matched,
    title: bi("Your matched Ontario plan", "您的安省匹配计划"),
    descriptor: bi(
      `${profile.structure.replace("_", " ")} · ${profile.city} · ${profile.revenue.replaceAll("_", " ")}`,
      `${profile.structure.replace("_", " ")} · ${profile.city} · ${profile.revenue.replaceAll("_", " ")}`,
    ),
    outcome: bi(
      "This route preserves your assessment answers and recalculates applicability from those answers.",
      "此路线保留您的问诊回答，并依据这些回答重新计算适用性。",
    ),
    boundary:
      profile.complexResidency ||
      profile.industry === "regulated" ||
      profile.crossProvince,
    profile,
    tasks: Array.from(taskKinds, ([id, kind]) => ({ id, kind })),
  };
}

"use client";

import { getScenario, scenarios } from "./content";
export { matchScenario, synthesizeAssessmentScenario } from "./rules";
import type {
  DemoState,
  EvidenceRecord,
  ReferralRecord,
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
      id: `SAMPLE-${String(state.referrals.length + 1).padStart(3, "0")}`,
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

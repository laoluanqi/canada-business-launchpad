import { assessmentDefaults, assessmentQuestions } from "./assessment";
import { getTask } from "./content";
import { synthesizeAssessmentScenario } from "./rules";
import type { TaskKind } from "./types";

export type WorkStatus = "not_started" | "in_progress" | "waiting" | "blocked" | "done" | "not_applicable";
export type WorkAction = "start" | "visit" | "waiting" | "blocked" | "complete" | "reopen" | "not_applicable" | "confirm_review";
export type WorkRecord = {
  status: WorkStatus;
  checks: boolean[];
  reason: string;
  followUp: string;
  completedAt: string;
  needsRecheck: boolean;
};
export type FollowUp = { id: string; taskId: string; period: string; dueDate: string; status: "open" | "done"; completedAt: string };
export type WorkEvent = { id: string; at: string; type: string; taskId?: string; detail?: string };
export type BusinessWorkspaceData = {
  version: 1;
  id: string;
  name: string;
  answers: Record<string, string | boolean>;
  records: Record<string, WorkRecord>;
  followUps: FollowUp[];
  history: WorkEvent[];
  planChanges: { added: string[]; removed: string[]; review: string[] };
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export class BusinessError extends Error {
  constructor(public code: string) { super(code); }
}
export const issueReasons = ["missing_materials", "provider_delay", "unclear_requirement", "professional_review"] as const;
export const skipReasons = ["activity_not_started", "not_applicable_after_review", "professional_confirmation"] as const;
const emptyRecord = (): WorkRecord => ({ status: "not_started", checks: [], reason: "", followUp: "", completedAt: "", needsRecheck: false });
export function recordFor(business: BusinessWorkspaceData, taskId: string): WorkRecord {
  return business.records[taskId] ?? emptyRecord();
}
export function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number(value.slice(0, 4)) >= 2000 && Number(value.slice(0, 4)) <= 2200 && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function ontarioDate(value = new Date().toISOString()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)!.value).join("-");
}
function boundedText(value: unknown, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max || /[\u0000-\u001f]/.test(value)) throw new BusinessError("invalid_input");
  return value.trim();
}
export function validatedAnswers(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new BusinessError("invalid_input");
  const input = value as Record<string, unknown>;
  const answers: Record<string, string | boolean> = { ...assessmentDefaults };
  for (const question of assessmentQuestions) {
    if (!question.options.some((option) => option.value === input[question.id])) throw new BusinessError("incomplete_profile");
    answers[question.id] = input[question.id] as string | boolean;
  }
  return answers;
}
export function businessPlan(business: BusinessWorkspaceData) {
  const scenario = synthesizeAssessmentScenario(business.answers);
  return { ...scenario, id: business.id, title: { en: business.name, zh: business.name } };
}
export function businessFlow(business: BusinessWorkspaceData) {
  const plan = businessPlan(business);
  const entries = plan.tasks.flatMap((item) => {
    const task = getTask(item.id);
    if (!task) return [];
    const record = recordFor(business, item.id);
    const status = item.kind === "not_applicable" ? "not_applicable" : record.needsRecheck && ["done", "not_applicable"].includes(record.status) ? "in_progress" : record.status;
    return [{ ...item, task, record, status }];
  });
  const resolved = (id: string) => {
    const item = entries.find((entry) => entry.id === id);
    return !item || (item.kind !== "needs_expert" && ["done", "not_applicable"].includes(item.status));
  };
  const items = entries.map((item) => ({ ...item, blockedBy: (item.task.dependsOn ?? []).filter((id) => !resolved(id)) }));
  const active = items.filter((item) => item.kind !== "not_applicable" && item.kind !== "optional");
  const remaining = items.filter((item) => !["done", "not_applicable"].includes(item.status));
  const candidates = remaining.filter((item) => !["waiting", "blocked"].includes(item.status) && item.blockedBy.length === 0);
  return { plan, items, active, remaining,
    next: candidates.find((item) => item.kind !== "optional") ?? candidates[0],
    waiting: remaining.filter((item) => item.status === "waiting"),
    issues: remaining.filter((item) => item.status === "blocked"),
    resolved: active.filter((item) => ["done", "not_applicable"].includes(item.status)).length,
    progress: Math.round(active.filter((item) => ["done", "not_applicable"].includes(item.status)).length / Math.max(1, active.length) * 100),
  };
}
function addEvent(business: BusinessWorkspaceData, type: string, now: string, taskId?: string, detail?: string) {
  business.history = [...business.history, { id: crypto.randomUUID(), at: now, type, taskId, detail }].slice(-200);
}
export function createBusiness(value: Record<string, unknown>, now = new Date().toISOString()): BusinessWorkspaceData {
  if (value.consent !== true) throw new BusinessError("consent_required");
  const business: BusinessWorkspaceData = { version: 1, id: crypto.randomUUID(), name: boundedText(value.name, 60), answers: validatedAnswers(value.answers), records: {}, followUps: [], history: [], planChanges: { added: [], removed: [], review: [] }, revision: 1, createdAt: now, updatedAt: now };
  addEvent(business, "created", now);
  return business;
}
export function applyBusinessCommand(current: BusinessWorkspaceData, input: Record<string, unknown>, now = new Date().toISOString()): BusinessWorkspaceData {
  if (input.businessId !== current.id || input.revision !== current.revision) throw new BusinessError("conflict");
  const next = structuredClone(current);
  if (input.type === "profile") {
    const answers = validatedAnswers(input.answers);
    next.name = boundedText(input.name, 60);
    const changed = Object.keys(answers).some((key) => answers[key] !== current.answers[key]);
    next.answers = answers;
    if (changed) {
      const old = businessPlan(current).tasks.filter((item) => item.kind !== "not_applicable");
      const updated = businessPlan(next).tasks.filter((item) => item.kind !== "not_applicable");
      next.planChanges = {
        added: updated.filter((item) => !old.some((previous) => previous.id === item.id)).map((item) => item.id),
        removed: old.filter((item) => !updated.some((latest) => latest.id === item.id)).map((item) => item.id),
        review: updated.filter((item) => ["done", "not_applicable"].includes(recordFor(next, item.id).status)).map((item) => item.id),
      };
      for (const item of updated) {
        if (next.records[item.id]) next.records[item.id] = { ...next.records[item.id], checks: [], needsRecheck: next.planChanges.review.includes(item.id) };
      }
    }
    addEvent(next, "profile", now);
  } else if (input.type === "task" || input.type === "check") {
    const entry = businessFlow(next).items.find((item) => item.id === input.taskId);
    if (!entry || entry.kind === "not_applicable") throw new BusinessError("invalid_task");
    const record = { ...recordFor(next, entry.id) };
    const materialCount = entry.task.materials?.length ?? 0;
    if (input.type === "check") {
      if (!Number.isInteger(input.index) || Number(input.index) < 0 || Number(input.index) >= materialCount || typeof input.checked !== "boolean") throw new BusinessError("invalid_input");
      if (["done", "not_applicable"].includes(record.status) && !record.needsRecheck) throw new BusinessError("reopen_required");
      record.checks = Array.from({ length: materialCount }, (_, index) => index === input.index ? input.checked as boolean : record.checks[index] === true);
    } else {
      const action = input.action as WorkAction;
      const kind: TaskKind = entry.kind;
      if (!["start", "visit", "waiting", "blocked", "complete", "reopen", "not_applicable", "confirm_review"].includes(action)) throw new BusinessError("invalid_input");
      if (["done", "not_applicable"].includes(record.status) && !record.needsRecheck && !["visit", "reopen"].includes(action)) throw new BusinessError("reopen_required");
      const finishing = action === "complete" || action === "confirm_review";
      if (kind === "needs_expert" && (finishing || action === "not_applicable")) throw new BusinessError("expert_required");
      if (finishing && entry.blockedBy.length > 0) throw new BusinessError("dependencies_required");
      if (finishing && materialCount > 0 && !Array.from({ length: materialCount }, (_, i) => record.checks[i]).every(Boolean)) throw new BusinessError("materials_required");
      if (action === "confirm_review" && !record.needsRecheck) throw new BusinessError("invalid_input");
      if ((finishing || action === "not_applicable") && input.confirmed !== true) throw new BusinessError("confirmation_required");
      if (action === "waiting" || action === "blocked") {
        if (!validDate(input.followUp)) throw new BusinessError("date_required");
        record.followUp = input.followUp;
      }
      if (action === "blocked") {
        if (!issueReasons.some((reason) => reason === input.reason)) throw new BusinessError("reason_required");
        record.reason = input.reason as string;
      }
      if (action === "not_applicable") {
        if (!["conditional", "optional"].includes(kind)) throw new BusinessError("cannot_skip");
        if (!skipReasons.some((reason) => reason === input.reason)) throw new BusinessError("reason_required");
        record.reason = input.reason as string;
      }
      if (finishing) {
        if (!validDate(input.completedAt) || input.completedAt > ontarioDate(now)) throw new BusinessError("completion_date_required");
        record.status = "done";
        record.completedAt = input.completedAt;
        record.needsRecheck = false;
        record.followUp = "";
        record.reason = "";
      } else if (action === "start" || action === "reopen") {
        record.status = "in_progress";
        record.needsRecheck = false;
        record.followUp = "";
        record.reason = "";
      } else if (action !== "visit") {
        record.status = action;
        if (action === "not_applicable") { record.needsRecheck = false; record.followUp = ""; }
      }
      if (action === "visit" && !entry.task.officialUrl && !entry.task.sourceIds.length) throw new BusinessError("invalid_task");
      addEvent(next, action, now, entry.id, action === "blocked" || action === "not_applicable" ? record.reason : finishing ? record.completedAt : record.followUp || undefined);
    }
    next.records[entry.id] = record;
  } else if (input.type === "followup") {
    if (input.confirmed !== true) throw new BusinessError("confirmation_required");
    const taskId = boundedText(input.taskId, 80);
    const entry = businessPlan(next).tasks.find((item) => item.id === taskId && item.kind !== "not_applicable");
    if (!entry || !validDate(input.dueDate)) throw new BusinessError("date_required");
    const period = boundedText(input.period, 40);
    if (next.followUps.length >= 100) throw new BusinessError("record_limit");
    if (next.followUps.some((item) => item.taskId === taskId && item.period.toLowerCase() === period.toLowerCase())) throw new BusinessError("duplicate_period");
    next.followUps.push({ id: crypto.randomUUID(), taskId, period, dueDate: input.dueDate, status: "open", completedAt: "" });
    addEvent(next, "followup_created", now, taskId, `${period} / ${input.dueDate}`);
  } else if (input.type === "followup_update") {
    const occurrence = next.followUps.find((item) => item.id === input.id);
    if (!occurrence || !validDate(input.dueDate) || input.confirmed !== true) throw new BusinessError("invalid_input");
    const period = boundedText(input.period, 40);
    if (next.followUps.some((item) => item.id !== occurrence.id && item.taskId === occurrence.taskId && item.period.toLowerCase() === period.toLowerCase())) throw new BusinessError("duplicate_period");
    const previous = `${occurrence.period} / ${occurrence.dueDate}`;
    occurrence.period = period;
    occurrence.dueDate = input.dueDate;
    addEvent(next, "followup_updated", now, occurrence.taskId, `${previous} -> ${period} / ${input.dueDate}`);
  } else if (input.type === "followup_status") {
    const occurrence = next.followUps.find((item) => item.id === input.id);
    if (!occurrence || !["open", "done"].includes(String(input.status))) throw new BusinessError("invalid_input");
    occurrence.status = input.status as "open" | "done";
    occurrence.completedAt = occurrence.status === "done" ? ontarioDate(now) : "";
    addEvent(next, occurrence.status === "done" ? "followup_done" : "followup_reopen", now, occurrence.taskId, occurrence.period);
  } else throw new BusinessError("invalid_input");
  next.revision += 1;
  next.updatedAt = now;
  return next;
}

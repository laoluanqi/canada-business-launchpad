import { getTask } from "./content";
import type { DemoScenario, DemoState, TaskDefinition, TaskKind, TaskStatus } from "./types";

export function statusFor(state: DemoState, scenario: DemoScenario, taskId: string, kind: TaskKind): TaskStatus {
  if (kind === "needs_expert") return "needs_expert";
  if (kind === "not_applicable") return "not_applicable";
  return state.taskStatus[`${scenario.id}:${taskId}`] ?? "not_started";
}

export function dependenciesForScenario(task: TaskDefinition, scenario: DemoScenario) {
  return (task.dependsOn ?? [])
    .map((id) => ({ definition: getTask(id), instance: scenario.tasks.find((item) => item.id === id) }))
    .filter((value): value is { definition: TaskDefinition; instance: { id: string; kind: TaskKind } } => Boolean(value.definition && value.instance));
}

export function taskIsBlocked(state: DemoState, scenario: DemoScenario, task: TaskDefinition) {
  return dependenciesForScenario(task, scenario).some(({ instance }) =>
    !["done", "not_applicable"].includes(statusFor(state, scenario, instance.id, instance.kind)),
  );
}

export const phaseLabels = {
  plan: { en: "Plan", zh: "规划" },
  register: { en: "Register", zh: "注册" },
  set_up: { en: "Set up", zh: "配置" },
  operate: { en: "Operate", zh: "经营" },
  comply: { en: "Stay current", zh: "持续跟进" },
};

export function summarizeWorkflow(state: DemoState, scenario: DemoScenario) {
  const entries = scenario.tasks.flatMap((item) => {
    const task = getTask(item.id);
    return task ? [{ ...item, task, status: statusFor(state, scenario, item.id, item.kind) }] : [];
  });
  const active = entries.filter((item) => !["not_applicable", "optional"].includes(item.kind));
  const done = active.filter((item) => item.status === "done").length;
  const remaining = entries.filter((item) => !["done", "not_applicable"].includes(item.status));
  const waiting = remaining.filter((item) => item.status === "external_pending");
  const ready = remaining.filter((item) => item.status !== "external_pending" && !taskIsBlocked(state, scenario, item.task));
  // Waiting items do not hide work that can proceed. Optional work follows the core plan.
  const next = ready.find((item) => item.kind !== "optional") ?? ready[0];
  return {
    entries, active, done, waiting, next,
    progress: Math.round(done / Math.max(active.length, 1) * 100),
    complete: active.length > 0 && done === active.length,
    blocked: remaining.filter((item) => item.kind !== "needs_expert" && item.status !== "external_pending" && taskIsBlocked(state, scenario, item.task)),
    phases: Object.entries(phaseLabels).map(([id, label]) => {
      const items = active.filter((item) => item.task.phase === id);
      return { id, label, total: items.length, done: items.filter((item) => item.status === "done").length };
    }),
  };
}

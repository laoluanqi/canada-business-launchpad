import { getLaunchStep, launchSteps } from "./launchpad-catalog";

export const launchStatuses = ["not_started", "in_progress", "done", "not_needed"] as const;
export type LaunchStatus = typeof launchStatuses[number];
export type LaunchRecord = { status: LaunchStatus; serviceId?: string; visitedAt?: string; updatedAt: string };
export type LaunchJourney = {
  id: string;
  revision: number;
  profile: { name: string; city: string; team: number };
  records: Record<string, LaunchRecord>;
  lastStep: string;
  updatedAt: string;
};
export const launchCities = ["Ontario", "Toronto", "Ottawa", "Mississauga", "Hamilton", "Other Ontario city"];
export function emptyLaunchJourney(): LaunchJourney {
  return { id: "", revision: 0, profile: { name: "", city: "Ontario", team: 1 }, records: {}, lastStep: "", updatedAt: "" };
}
export function launchSummary(journey: LaunchJourney) {
  const done = launchSteps.filter(step => journey.records[step.id]?.status === "done").length;
  const skipped = launchSteps.filter(step => journey.records[step.id]?.status === "not_needed").length;
  const total = launchSteps.length - skipped;
  const remaining = launchSteps.filter(step => !["done", "not_needed"].includes(journey.records[step.id]?.status ?? "not_started"));
  const lastIndex = launchSteps.findIndex(step => step.id === journey.lastStep);
  const next = remaining.find(step => step.id === journey.lastStep) ?? remaining.find(step => launchSteps.indexOf(step) > lastIndex) ?? remaining[0];
  return { done, skipped, total, remaining: remaining.length, percent: total ? Math.round(done / total * 100) : 0, next };
}
export class JourneyError extends Error {}
export function applyLaunchCommand(current: LaunchJourney, input: Record<string, unknown>, now = new Date().toISOString()): LaunchJourney {
  if (input.revision !== current.revision || input.journeyId !== current.id) throw new JourneyError("conflict");
  const next = structuredClone(current);
  if (input.type === "profile") {
    if (input.consent !== true || typeof input.name !== "string" || input.name.trim().length > 60 || !launchCities.includes(String(input.city)) || !Number.isInteger(input.team) || Number(input.team) < 1 || Number(input.team) > 5) throw new JourneyError("invalid_input");
    next.profile = { name: input.name.trim(), city: String(input.city), team: Number(input.team) };
  } else if (input.type === "status" || input.type === "visit") {
    const step = getLaunchStep(String(input.stepId));
    if (!step) throw new JourneyError("invalid_step");
    const record = next.records[step.id] ?? { status: "not_started", updatedAt: now };
    if (input.type === "status") {
      if (!launchStatuses.includes(input.status as LaunchStatus)) throw new JourneyError("invalid_input");
      record.status = input.status as LaunchStatus;
    } else {
      if (typeof input.serviceId !== "string" || !step.services.includes(input.serviceId)) throw new JourneyError("invalid_service");
      record.serviceId = input.serviceId;
      record.visitedAt = now;
    }
    record.updatedAt = now;
    next.records[step.id] = record;
    next.lastStep = step.id;
  } else throw new JourneyError("invalid_input");
  next.updatedAt = now;
  next.revision++;
  return next;
}

export function exampleLaunchJourney(): LaunchJourney {
  const journey = emptyLaunchJourney();
  journey.id = "example-only";
  journey.profile = { name: "", city: "Toronto", team: 2 };
  for (const id of ["business-idea", "market-research", "business-plan", "business-name", "domain", "visual-brand"]) journey.records[id] = { status: "done", updatedAt: "" };
  journey.records["legal-structure"] = { status: "in_progress", updatedAt: "" };
  return journey;
}

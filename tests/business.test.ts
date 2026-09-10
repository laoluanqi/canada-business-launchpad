import { test } from "node:test";
import assert from "node:assert/strict";
import { assessmentDefaults } from "../lib/assessment.ts";
import { applyBusinessCommand, businessFlow, BusinessError, createBusiness, ontarioDate, validDate } from "../lib/business.ts";
import type { BusinessWorkspaceData } from "../lib/business.ts";

const NOW = "2026-09-07T12:00:00.000Z";
const create = () => createBusiness({ name: "My Ontario project", consent: true, answers: assessmentDefaults }, NOW);
function command(business: BusinessWorkspaceData, input: Record<string, unknown>) { return applyBusinessCommand(business, { ...input, businessId: business.id, revision: business.revision }, NOW); }
function completeFirst(business: BusinessWorkspaceData) {
  const task = businessFlow(business).next!;
  let result = business;
  for (let index = 0; index < (task.task.materials?.length ?? 0); index++) result = command(result, { type: "check", taskId: task.id, index, checked: true });
  return command(result, { type: "task", taskId: task.id, action: "complete", completedAt: "2026-09-07", confirmed: true });
}
const rejects = (fn: () => unknown, code: string) => assert.throws(fn, (error) => error instanceof BusinessError && error.code === code);

test("business identity is independent from example profile, and updates retain records", () => {
  const first = completeFirst(create()); const second = create();
  assert.notEqual(first.id, second.id);
  const updated = command(first, { type: "profile", name: "Growing project", answers: { ...first.answers, employees: "hiring" } });
  assert.equal(updated.id, first.id);
  assert.equal(updated.records["choose-structure"].completedAt, "2026-09-07");
  assert.equal(updated.records["choose-structure"].needsRecheck, true);
  assert.ok(updated.planChanges.added.includes("hiring-readiness"));
  assert.equal(businessFlow(updated).items.find((item) => item.id === "choose-structure")?.status, "in_progress");
  assert.equal(updated.history.filter((item) => item.type === "complete").length, 1);
});
test("official visits never imply application submission; return outcomes drive the queue", () => {
  const initial = create();
  const visited = command(initial, { type: "task", taskId: "choose-structure", action: "visit" });
  assert.equal(visited.records["choose-structure"].status, "not_started");
  const waiting = command(visited, { type: "task", taskId: "choose-structure", action: "waiting", followUp: "2026-09-09" });
  assert.equal(businessFlow(waiting).waiting.length, 1);
  assert.notEqual(businessFlow(waiting).next?.id, "choose-structure");
  const blocked = command(waiting, { type: "task", taskId: "choose-structure", action: "blocked", followUp: "2026-09-10", reason: "missing_materials" });
  assert.equal(businessFlow(blocked).issues[0].record.followUp, "2026-09-10");
  const completed = completeFirst(command(blocked, { type: "task", taskId: "choose-structure", action: "start" }));
  assert.equal(completed.records["choose-structure"].followUp, "");
  assert.deepEqual(completed.history.map((item) => item.type), ["created", "visit", "waiting", "blocked", "start", "complete"]);
});
test("completion requires materials, prerequisites, confirmation and valid date", () => {
  const initial = create();
  rejects(() => command(initial, { type: "task", taskId: "choose-structure", action: "complete", confirmed: true, completedAt: "2026-09-07" }), "materials_required");
  rejects(() => command(initial, { type: "task", taskId: "ontario-registration", action: "complete" }), "dependencies_required");
  rejects(() => command(initial, { type: "task", taskId: "choose-structure", action: "waiting", followUp: "2026-02-30" }), "date_required");
  const done = completeFirst(initial);
  rejects(() => command(done, { type: "task", taskId: "choose-structure", action: "waiting", followUp: "2026-09-09" }), "reopen_required");
});
test("expert boundaries cannot be bypassed with task completion or non-applicability", () => {
  const initial = createBusiness({ name: "Boundary", consent: true, answers: { ...assessmentDefaults, complexResidency: true } }, NOW);
  rejects(() => command(initial, { type: "task", taskId: "choose-structure", action: "complete", confirmed: true }), "expert_required");
  rejects(() => command(initial, { type: "task", taskId: "choose-structure", action: "not_applicable", confirmed: true }), "expert_required");
});
test("conditional items can be resolved without silently changing rule classification", () => {
  const initial = create();
  const conditional = businessFlow(initial).items.find((item) => item.kind === "conditional")!;
  const updated = command(initial, { type: "task", taskId: conditional.id, action: "not_applicable", reason: "not_applicable_after_review", confirmed: true });
  assert.equal(businessFlow(updated).items.find((item) => item.id === conditional.id)?.kind, "conditional");
  assert.equal(updated.records[conditional.id].status, "not_applicable");
});
test("periods are independent of each other and of the launch task", () => {
  let business = create();
  for (const period of ["2026", "2027"]) business = command(business, { type: "followup", taskId: "choose-structure", period, dueDate: `${period}-12-01`, confirmed: true });
  const updated = command(business, { type: "followup_status", id: business.followUps[0].id, status: "done" });
  assert.equal(updated.followUps[0].status, "done");
  assert.equal(updated.followUps[1].status, "open");
  assert.equal(updated.records["choose-structure"], undefined);
  rejects(() => command(updated, { type: "followup", taskId: "choose-structure", period: "2027", dueDate: "2027-12-01", confirmed: true }), "duplicate_period");
});
test("rechecking does not hide new external-waiting or issue records", () => {
  let business = completeFirst(create());
  business = command(business, { type: "profile", name: business.name, answers: { ...business.answers, employees: "hiring" } });
  business = command(business, { type: "task", taskId: "choose-structure", action: "waiting", followUp: "2026-09-10" });
  assert.equal(businessFlow(business).waiting[0].id, "choose-structure");
});
test("optimistic concurrency rejects stale commands without mutating the current record", () => {
  const business = create();
  rejects(() => applyBusinessCommand(business, { type: "profile", revision: 0, name: "Overwrite", answers: assessmentDefaults }), "conflict");
  assert.equal(business.revision, 1);
  assert.equal(business.name, "My Ontario project");
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2028-02-29"), true);
});
test("workspace identity prevents stale tabs from mutating a replacement workspace", () => {
  const previous = create(); const replacement = create();
  rejects(() => applyBusinessCommand(replacement, { type: "profile", businessId: previous.id, revision: previous.revision, name: "Old tab", answers: assessmentDefaults }), "conflict");
});
test("a date or period can be corrected with a retained change record", () => {
  let business = command(create(), { type: "followup", taskId: "choose-structure", period: "2026 Q4", dueDate: "2026-10-01", confirmed: true });
  business = command(business, { type: "followup_update", id: business.followUps[0].id, period: "2026 Q4", dueDate: "2026-11-01", confirmed: true });
  assert.equal(business.followUps.length, 1);
  assert.equal(business.followUps[0].dueDate, "2026-11-01");
  assert.ok(business.history.at(-1)?.detail?.includes("2026-10-01 ->"));
  assert.equal(ontarioDate("2026-09-08T01:00:00Z"), "2026-09-07");
});

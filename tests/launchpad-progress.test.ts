import assert from "node:assert/strict";
import test from "node:test";
import { launchServices, launchStages, launchSteps } from "../lib/launchpad-catalog";
import { applyLaunchCommand, emptyLaunchJourney, exampleLaunchJourney, launchSummary } from "../lib/launchpad-progress";
import type { LaunchJourney } from "../lib/launchpad-progress";
const command = (state: LaunchJourney, input: Record<string, unknown>) => applyLaunchCommand(state, { journeyId: state.id, revision: state.revision, ...input });

test("catalog has eight stages, 24 unique steps and valid verified service mappings", () => {
  assert.equal(launchStages.length, 8); assert.equal(launchSteps.length, 24);
  assert.equal(new Set(launchSteps.map(s => s.id)).size, 24);
  assert.equal(new Set(launchServices.map(s => s.id)).size, launchServices.length);
  for (const stage of launchStages) assert.equal(launchSteps.filter(s => s.stage === stage.id).length, 3);
  for (const step of launchSteps) {
    assert.ok(step.title.en && step.title.zh && step.purpose.en && step.purpose.zh);
    assert.ok(step.services.length > 0);
    for (const id of step.services) assert.ok(launchServices.some(s => s.id === id));
  }
  for (const service of launchServices) { assert.equal(new URL(service.url).protocol, "https:"); assert.equal(service.checked, "2026-09-10"); }
});
test("external visits never become completion, retain the service, and reject unrelated providers", () => {
  const before = emptyLaunchJourney();
  const after = command(before, { type: "visit", stepId: "business-email", serviceId: "zoho" });
  assert.equal(after.records["business-email"].status, "not_started");
  assert.equal(after.records["business-email"].serviceId, "zoho");
  assert.ok(after.records["business-email"].visitedAt);
  assert.deepEqual(before.records, {});
  assert.throws(() => command(after, { type: "visit", stepId: "business-email", serviceId: "stripe" }), /invalid_service/);
});
test("completion continues after the chosen step and skips do not count as completed", () => {
  let state = command(emptyLaunchJourney(), { type: "status", stepId: "business-email", status: "done" });
  assert.equal(launchSummary(state).next?.id, "website");
  state = command(state, { type: "status", stepId: "website", status: "not_needed" });
  assert.equal(launchSummary(state).done, 1); assert.equal(launchSummary(state).total, 23);
  state = command(state, { type: "status", stepId: "business-email", status: "not_started" });
  assert.equal(launchSummary(state).done, 0);
});
test("fully skipped checklist is not 100 percent completed", () => {
  let state = emptyLaunchJourney();
  for (const step of launchSteps) state = command(state, { type: "status", stepId: step.id, status: "not_needed" });
  assert.equal(launchSummary(state).percent, 0); assert.equal(launchSummary(state).next, undefined);
  assert.equal(launchSummary(state).skipped, 24);
});
test("profile changes require consent and leave progress unchanged", () => {
  let state = command(emptyLaunchJourney(), { type: "status", stepId: "domain", status: "done" });
  const old = structuredClone(state.records);
  const update = { type: "profile", name: "My studio", city: "Toronto", team: 2, consent: true };
  state = command(state, update); assert.deepEqual(state.records, old);
  assert.throws(() => command(state, { ...update, consent: false }), /invalid_input/);
  assert.throws(() => command(state, { ...update, team: 6 }), /invalid_input/);
  assert.throws(() => command(state, { ...update, name: "a".repeat(61) }), /invalid_input/);
});
test("stale writes and mismatched identities are rejected", () => {
  const current = command(emptyLaunchJourney(), { type: "status", stepId: "domain", status: "done" });
  assert.throws(() => applyLaunchCommand(current, { journeyId: current.id, revision: 0, type: "status", stepId: "domain", status: "not_started" }), /conflict/);
  assert.throws(() => applyLaunchCommand(current, { journeyId: "other", revision: current.revision }), /conflict/);
  assert.throws(() => command(current, { type: "status", stepId: "__proto__", status: "done" }), /invalid_step/);
});
test("reference routes are isolated copies without real company data", () => {
  const a = exampleLaunchJourney(), b = exampleLaunchJourney();
  a.records["domain"].status = "not_started";
  assert.equal(b.records["domain"].status, "done");
  assert.equal(b.profile.name, ""); assert.deepEqual(emptyLaunchJourney().records, {});
});

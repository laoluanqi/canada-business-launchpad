import assert from "node:assert/strict";
import test from "node:test";
import { getScenario, scenarios, getTask } from "../lib/content.ts";
import { createInitialState, synthesizeAssessmentScenario } from "../lib/demo-repository.ts";
import { summarizeWorkflow, taskIsBlocked } from "../lib/workflow.ts";
import { initialPresentation, restorePresentation, presentationChapters } from "../lib/presentation.ts";

test("next action skips external waiting without marking it complete", () => {
  const scenario = getScenario("toronto-consultant")!;
  const state = createInitialState();
  state.taskStatus[`${scenario.id}:choose-structure`] = "external_pending";
  const flow = summarizeWorkflow(state, scenario);
  assert.equal(flow.waiting[0].id, "choose-structure");
  assert.equal(flow.done, 0);
  assert.notEqual(flow.next?.id, "choose-structure");
  assert.equal(taskIsBlocked(state, scenario, getTask("name-search")!), true);
});

test("completed plans never fall back to the first completed task", () => {
  const scenario = getScenario("toronto-consultant")!;
  const state = createInitialState();
  for (const item of scenario.tasks) state.taskStatus[`${scenario.id}:${item.id}`] = "done";
  const flow = summarizeWorkflow(state, scenario);
  assert.equal(flow.next, undefined);
  assert.equal(flow.progress, 100);
  assert.equal(flow.complete, true);
});

test("all-waiting plans report no ready action rather than resending an application", () => {
  const scenario = getScenario("service-corporation")!;
  const state = createInitialState();
  for (const item of scenario.tasks) state.taskStatus[`${scenario.id}:${item.id}`] = "external_pending";
  const flow = summarizeWorkflow(state, scenario);
  assert.equal(flow.next, undefined);
  assert.equal(flow.complete, false);
  assert.ok(flow.waiting.length > 0);
});

test("boundary status cannot be overridden by a sample completion", () => {
  for (const scenario of scenarios.filter((item) => item.boundary)) {
    const state = createInitialState();
    for (const item of scenario.tasks) state.taskStatus[`${scenario.id}:${item.id}`] = "done";
    const flow = summarizeWorkflow(state, scenario);
    assert.equal(flow.done, 0);
    assert.equal(flow.next?.kind, "needs_expert");
    assert.ok(flow.entries.every((item) => ["needs_expert", "not_applicable"].includes(item.status)));
  }
});

test("presentation defaults use the same task graph as each actual workspace", () => {
  for (const selected of scenarios) {
    const calculated = synthesizeAssessmentScenario({
      ...selected.profile,
      registrationStatus: selected.profile.stage === "planning" ? "unsure" : "registered",
      businessNameUse: "unsure", hasOntarioFacilityOffice: "no", gstRegistered: "unsure",
    });
    assert.deepEqual(calculated.tasks, selected.tasks);
  }
});

test("presentation session restores only allowed values and bounds", () => {
  const ids = scenarios.map((item) => item.id);
  assert.deepEqual(restorePresentation(null, ids), initialPresentation());
  const restored = restorePresentation({ chapter: 99, scenarioId: "invalid", rehearsal: "approved", consent: false, received: true, checks: [true, "true", 1] }, ids);
  assert.equal(restored.chapter, 0);
  assert.equal(restored.scenarioId, "toronto-consultant");
  assert.equal(restored.rehearsal, "preparing");
  assert.equal(restored.received, false);
  assert.deepEqual(restored.checks, [true, false, false]);
  assert.equal(presentationChapters.length, 6);
  for (const chapter of presentationChapters) for (const value of Object.values(chapter)) assert.ok(value.en && value.zh);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  calendarEvents,
  getSource,
  getTask,
  scenarios,
  sources,
  tasks,
} from "../lib/content.ts";
import {
  matchScenario,
  synthesizeAssessmentScenario,
} from "../lib/demo-repository.ts";
import type { DemoScenario } from "../lib/types.ts";

const taskIds = (scenario: DemoScenario) =>
  new Set(scenario.tasks.map((task) => task.id));

test("the four benchmark journeys have distinct profiles and task graphs", () => {
  const benchmarks = scenarios.slice(0, 4);
  assert.deepEqual(
    benchmarks.map((scenario) => scenario.id),
    [
      "toronto-consultant",
      "service-corporation",
      "ecommerce-growth",
      "first-hire",
    ],
  );

  const signatures = benchmarks.map((scenario) =>
    scenario.tasks
      .map(({ id, kind }) => `${id}:${kind}`)
      .sort()
      .join("|"),
  );
  assert.equal(new Set(signatures).size, 4, "each benchmark needs a unique task graph");

  const [consultant, corporation, ecommerce, firstHire] = benchmarks.map(taskIds);
  assert.equal(consultant.has("t2-return"), true);
  assert.equal(
    benchmarks[0].tasks.find(({ id }) => id === "t2-return")?.kind,
    "not_applicable",
  );
  assert.equal(corporation.has("t2-return"), true);
  assert.equal(corporation.has("annual-return"), true);
  assert.equal(ecommerce.has("import-export"), true);
  assert.equal(ecommerce.has("gst-return"), true);
  assert.equal(firstHire.has("payroll-account"), true);
  assert.equal(firstHire.has("payroll-remittance"), true);
  assert.equal(
    benchmarks[3].tasks.find(({ id }) => id === "gst-return")?.kind,
    "conditional",
  );

  assert.deepEqual(
    benchmarks.map(({ profile }) => [
      profile.structure,
      profile.revenue,
      profile.employees,
      profile.imports,
    ]),
    [
      ["sole_prop", "under_30k", "none", false],
      ["corporation", "under_30k", "none", false],
      ["corporation", "near_30k", "none", true],
      ["corporation", "over_30k", "hiring", false],
    ],
  );
});

test("assessment synthesis preserves structure, revenue and employee answers", () => {
  const answers = {
    stage: "planning",
    city: "Toronto",
    industry: "services",
    structure: "corporation",
    revenue: "near_30k",
    employees: "hiring",
    imports: false,
    crossProvince: false,
    complexResidency: false,
  } as const;

  assert.equal(matchScenario(answers), "first-hire");
  const result = synthesizeAssessmentScenario(answers);
  assert.equal(result.id, "first-hire");
  assert.deepEqual(result.profile, {
    stage: "planning",
    city: "Toronto",
    industry: "services",
    structure: "corporation",
    employees: "hiring",
    revenue: "near_30k",
    imports: false,
    crossProvince: false,
    complexResidency: false,
  });

  const tasks = new Map(result.tasks.map(({ id, kind }) => [id, kind]));
  assert.equal(tasks.get("annual-return"), "mandatory");
  assert.equal(tasks.get("t2-return"), "mandatory");
  assert.equal(tasks.get("gst-return"), "conditional");
  assert.equal(tasks.get("payroll-account"), "mandatory");
  assert.equal(tasks.get("hiring-readiness"), "mandatory");
  assert.equal(tasks.get("import-export"), "not_applicable");
});

test("registered and operating stages preserve registration uncertainty", () => {
  const base = {
    city: "Toronto",
    industry: "services",
    structure: "corporation",
    employees: "none",
    revenue: "under_30k",
    imports: false,
    crossProvince: false,
    complexResidency: false,
  } as const;
  const registered = synthesizeAssessmentScenario({
    ...base,
    stage: "registered",
  });
  const operatingUnknown = synthesizeAssessmentScenario({
    ...base,
    stage: "operating",
    registrationStatus: "unsure",
  });
  const operatingUnregistered = synthesizeAssessmentScenario({
    ...base,
    stage: "operating",
    registrationStatus: "not_registered",
  });

  const kinds = (scenario: DemoScenario) =>
    new Map(scenario.tasks.map(({ id, kind }) => [id, kind]));
  assert.equal(kinds(registered).get("registration-review"), "mandatory");
  assert.equal(kinds(registered).has("ontario-registration"), false);
  assert.equal(kinds(operatingUnknown).get("registration-review"), "conditional");
  assert.equal(kinds(operatingUnknown).get("ontario-registration"), "mandatory");
  assert.equal(
    kinds(operatingUnregistered).get("ontario-registration"),
    "mandatory",
  );
  assert.notDeepEqual(registered.tasks, operatingUnknown.tasks);
});

test("sole-proprietor answers do not inherit corporation or payroll tasks", () => {
  const result = synthesizeAssessmentScenario({
    stage: "planning",
    city: "Ontario",
    industry: "services",
    structure: "sole_prop",
    revenue: "under_30k",
    employees: "none",
    imports: false,
    crossProvince: false,
    complexResidency: false,
  });
  const kinds = new Map(result.tasks.map(({ id, kind }) => [id, kind]));
  assert.equal(result.id, "toronto-consultant");
  assert.equal(result.profile.city, "Ontario");
  assert.equal(kinds.get("annual-return"), "not_applicable");
  assert.equal(kinds.get("t2-return"), "not_applicable");
  assert.equal(kinds.get("payroll-account"), "not_applicable");
  assert.equal(kinds.get("import-export"), "not_applicable");
  assert.equal(
    result.tasks.find(({ id }) => id === "ontario-registration")?.kind,
    "conditional",
  );
});

test("business-name use and confirmed GST/HST registration control obligations", () => {
  const result = synthesizeAssessmentScenario({
    stage: "planning",
    city: "Ontario",
    industry: "services",
    structure: "sole_prop",
    businessNameUse: "trade_name",
    revenue: "over_30k",
    gstRegistered: "yes",
    employees: "none",
    imports: false,
    crossProvince: false,
    complexResidency: false,
  });
  const tasks = new Map(result.tasks.map(({ id, kind }) => [id, kind]));
  assert.equal(tasks.get("ontario-registration"), "mandatory");
  assert.equal(tasks.get("gst-return"), "mandatory");

  const unconfirmed = synthesizeAssessmentScenario({
    stage: "operating",
    city: "Ontario",
    industry: "services",
    structure: "corporation",
    revenue: "over_30k",
    gstRegistered: "unsure",
    employees: "none",
    imports: false,
    crossProvince: false,
    complexResidency: false,
  });
  assert.equal(
    unconfirmed.tasks.find(({ id }) => id === "gst-return")?.kind,
    "conditional",
  );
});

test("employees or an Ontario facility trigger sole-proprietor registration", () => {
  for (const answers of [
    { stage: "planning", employees: "hiring", hasOntarioFacilityOffice: "no" },
    { stage: "planning", employees: "none", hasOntarioFacilityOffice: "yes" },
    {
      stage: "operating",
      registrationStatus: "not_registered",
      employees: "hiring",
      hasOntarioFacilityOffice: "no",
    },
    {
      stage: "operating",
      registrationStatus: "not_registered",
      employees: "none",
      hasOntarioFacilityOffice: "yes",
    },
  ] as const) {
    const scenario = synthesizeAssessmentScenario({
      city: "Ontario",
      industry: "services",
      structure: "sole_prop",
      businessNameUse: "legal_name",
      revenue: "under_30k",
      imports: false,
      crossProvince: false,
      complexResidency: false,
      ...answers,
    });
    assert.equal(
      scenario.tasks.find(({ id }) => id === "ontario-registration")?.kind,
      "mandatory",
    );
  }
});

test("an undecided structure keeps corporation obligations conditional", () => {
  const result = synthesizeAssessmentScenario({
    stage: "planning",
    city: "Ontario",
    industry: "services",
    structure: "undecided",
    revenue: "under_30k",
    employees: "none",
    imports: false,
    crossProvince: false,
    complexResidency: false,
  });
  const kinds = new Map(result.tasks.map(({ id, kind }) => [id, kind]));
  assert.equal(kinds.get("choose-structure"), "mandatory");
  for (const taskId of [
    "ontario-registration",
    "name-search",
    "obr-access",
    "corporate-records",
    "annual-return",
    "t2-return",
    "t2-balance",
    "isc-review",
  ]) {
    assert.equal(kinds.get(taskId), "conditional", taskId);
  }
});

test("all demo defaults reproduce their published task graphs", () => {
  for (const scenario of scenarios) {
    const recalculated = synthesizeAssessmentScenario({
      ...scenario.profile,
      businessNameUse: "unsure",
      gstRegistered: "unsure",
      registrationStatus:
        scenario.profile.stage === "planning" ? "unsure" : "registered",
      hasOntarioFacilityOffice: "no",
    });
    assert.deepEqual(
      recalculated.tasks,
      scenario.tasks,
      `${scenario.id} must be stable when its default answers are recalculated`,
    );
  }
});

test("the demo fiscal-year calendar keeps annual return and T2 dates aligned", () => {
  const annual = calendarEvents.find(({ id }) => id === "cal-annual");
  const t2 = calendarEvents.find(({ id }) => id === "cal-t2");
  const balance = calendarEvents.find(({ id }) => id === "cal-t2-balance");
  assert.deepEqual([annual?.month, annual?.day], ["APR", "30"]);
  assert.deepEqual([t2?.month, t2?.day], ["APR", "30"]);
  assert.deepEqual([balance?.month, balance?.day], ["JAN", "31"]);
});

test("boundary answers stop at Expert Review instead of producing a conclusion", () => {
  const residency = synthesizeAssessmentScenario({
    structure: "corporation",
    industry: "services",
    complexResidency: true,
    crossProvince: false,
  });
  assert.equal(residency.id, "complex-residency");
  assert.equal(residency.boundary, true);
  assert.equal(
    residency.tasks.find(({ id }) => id === "ontario-registration")?.kind,
    "needs_expert",
  );

  const regulated = synthesizeAssessmentScenario({
    structure: "corporation",
    industry: "regulated",
    complexResidency: false,
    crossProvince: true,
  });
  assert.equal(regulated.id, "regulated-business");
  assert.equal(regulated.boundary, true);
  assert.equal(
    regulated.tasks.find(({ id }) => id === "permit-scan")?.kind,
    "needs_expert",
  );
  assert.ok(
    regulated.tasks.some(({ kind }) => kind === "needs_expert"),
    "boundary journeys must expose an Expert Review task",
  );
  for (const scenario of [residency, regulated]) {
    assert.equal(
      scenario.tasks.some(({ kind }) =>
        kind === "mandatory" || kind === "conditional" || kind === "optional"),
      false,
      `${scenario.id} must not output a definitive applicability conclusion`,
    );
  }
});

test("every scenario task resolves to a maintained task definition", () => {
  for (const scenario of scenarios) {
    for (const task of scenario.tasks) {
      assert.ok(getTask(task.id), `${scenario.id} references missing task ${task.id}`);
    }
  }
});

test("every task source resolves and every detailed CTA matches its cited source", () => {
  const sourceUrls = new Set(sources.map(({ url }) => url));

  for (const task of tasks) {
    for (const sourceId of task.sourceIds) {
      assert.ok(getSource(sourceId), `${task.id} references missing source ${sourceId}`);
    }

    if (task.full) {
      assert.ok(task.officialUrl, `${task.id} is missing its official CTA URL`);
      assert.ok(
        sourceUrls.has(task.officialUrl),
        `${task.id} CTA is absent from the maintained source ledger`,
      );
      assert.ok(
        task.sourceIds.some(
          (sourceId) => getSource(sourceId)?.url === task.officialUrl,
        ),
        `${task.id} CTA does not match one of its cited sources`,
      );
    }
  }
});

test("governance-sensitive task claims cite the scoped primary sources", () => {
  assert.deepEqual(getTask("name-search")?.sourceIds, [
    "business-name-search",
    "on-register",
  ]);
  assert.deepEqual(getTask("obr-access")?.sourceIds, ["obr-profile", "obr"]);
  assert.deepEqual(getTask("accounting-stack")?.sourceIds, ["cra-records"]);
  assert.deepEqual(getTask("record-policy")?.sourceIds, ["cra-records"]);
  assert.deepEqual(getTask("gst-return")?.sourceIds, ["gst-filing"]);
  assert.deepEqual(getTask("payroll-remittance")?.sourceIds, [
    "payroll-remit",
  ]);
  assert.deepEqual(getTask("t2-return")?.sourceIds, ["t2", "t2-filing"]);
  assert.deepEqual(getTask("employment-baseline")?.sourceIds, [
    "on-employment-standards",
    "on-accessibility-business",
    "on-small-business-safety",
  ]);
});

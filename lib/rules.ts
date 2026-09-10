import { bi, getScenario, scenarios } from "./content";
import type { BusinessProfile, DemoScenario, TaskKind } from "./types";

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

  const boundary =
    profile.complexResidency ||
    profile.industry === "regulated" ||
    profile.crossProvince;
  if (boundary) {
    for (const [id, kind] of taskKinds) {
      if (kind !== "not_applicable") taskKinds.set(id, "needs_expert");
    }
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
    boundary,
    profile,
    tasks: Array.from(taskKinds, ([id, kind]) => ({ id, kind })),
  };
}

import { LaunchpadApp } from "@/components/LaunchpadApp";
import { LaunchpadSimple } from "@/components/LaunchpadSimple";
import { scenarios, tasks } from "@/lib/content";
import type { Locale } from "@/lib/types";
import { notFound, redirect } from "next/navigation";

const singlePages = new Set([
  "start",
  "overview",
  "product",
  "launch",
  "present",
  "partners",
  "demo",
  "assessment",
  "sample-assessment",
  "providers",
  "calendar",
  "assistant",
  "support",
]);
const adminViews = new Set(["rules", "sources", "tasks", "providers", "referrals"]);

function isKnownPath(path: string[]) {
  if (path.length === 0) return true;
  if (path.length === 1) return singlePages.has(path[0]);
  if (path.length !== 2) return false;
  if (path[0] === "workspace") return scenarios.some((item) => item.id === path[1]);
  if (path[0] === "tasks") return tasks.some((item) => item.id === path[1]);
  if (path[0] === "admin") return adminViews.has(path[1]);
  return false;
}

export default async function LocalizedPage({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale: requestedLocale, slug = [] } = await params;
  if ((requestedLocale !== "en" && requestedLocale !== "zh") || !isKnownPath(slug)) {
    notFound();
  }
  const locale: Locale = requestedLocale;
  if (slug.length === 0 || slug[0] === "start") return <LaunchpadSimple locale={locale} />;
  if (slug[0] === "overview") return <LaunchpadApp locale={locale} path={[]} />;
  if (slug[0] === "assessment") redirect(`/${locale}/launch?tab=profile`);
  return <LaunchpadApp locale={locale} path={slug} />;
}

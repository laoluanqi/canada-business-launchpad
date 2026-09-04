import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Database,
  ExternalLink,
  FileText,
  Globe2,
  Link2,
  LockKeyhole,
  Mail,
  Menu,
  RotateCcw,
  Route,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

type IconName =
  | "arrow"
  | "check"
  | "chevron"
  | "calendar"
  | "building"
  | "briefcase"
  | "spark"
  | "shield"
  | "file"
  | "link"
  | "clock"
  | "users"
  | "globe"
  | "chart"
  | "menu"
  | "x"
  | "reset"
  | "search"
  | "alert"
  | "lock"
  | "route"
  | "settings"
  | "external"
  | "mail"
  | "database";

const icons: Record<IconName, LucideIcon> = {
  arrow: ArrowRight,
  check: Check,
  chevron: ChevronRight,
  calendar: CalendarDays,
  building: Building2,
  briefcase: BriefcaseBusiness,
  spark: Sparkles,
  shield: ShieldCheck,
  file: FileText,
  link: Link2,
  clock: Clock3,
  users: Users,
  globe: Globe2,
  chart: BarChart3,
  menu: Menu,
  x: X,
  reset: RotateCcw,
  search: Search,
  alert: AlertTriangle,
  lock: LockKeyhole,
  route: Route,
  settings: Settings2,
  external: ExternalLink,
  mail: Mail,
  database: Database,
};

export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const Component = icons[name];
  return (
    <Component
      aria-hidden="true"
      className={className}
      size={size}
      strokeWidth={1.8}
    />
  );
}

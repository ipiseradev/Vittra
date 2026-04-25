import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  tone?: "sky" | "teal" | "amber" | "slate" | "rose" | "violet";
};

const toneMap = {
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  teal: "bg-teal-50 text-teal-700 ring-teal-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
};

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "sky",
}: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="metric-label">{label}</p>
          <p className="metric-value">{value}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${toneMap[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {helper ? <p className="mt-3 text-sm text-slate-500">{helper}</p> : null}
    </article>
  );
}

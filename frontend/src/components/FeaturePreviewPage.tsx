import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { MetricCard } from "./MetricCard";
import { PageHeader } from "./PageHeader";

type PreviewStat = {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  tone?: "sky" | "teal" | "amber" | "slate" | "rose" | "violet";
};

type PreviewAction = {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

type PreviewSection = {
  title: string;
  description: string;
  items: string[];
};

type FeaturePreviewPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  stats: PreviewStat[];
  actions?: PreviewAction[];
  sections: PreviewSection[];
  highlights: string[];
};

export function FeaturePreviewPage({
  eyebrow,
  title,
  description,
  badge,
  stats,
  actions,
  sections,
  highlights,
}: FeaturePreviewPageProps) {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        meta={<span className="pill bg-sky-100 text-sky-800">{badge}</span>}
        actions={actions?.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={action.variant === "secondary" ? "btn-secondary" : "btn-primary"}
          >
            {action.label}
          </button>
        ))}
      />

      <section className="dashboard-grid">
        {stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="surface-card p-6 sm:p-7">
          <h2 className="section-title">Narrativa de la demo</h2>
          <p className="section-copy">
            Cada bloque está listo para mostrarse en una presentación o video
            corto sin depender todavía de integraciones complejas.
          </p>
          <div className="mt-6 grid gap-4">
            {sections.map((section) => (
              <article key={section.title} className="surface-muted p-5">
                <h3 className="text-base font-semibold text-slate-900">
                  {section.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {section.description}
                </p>
                <ul className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <aside className="surface-card p-6 sm:p-7">
          <h2 className="section-title">Puntos para mostrar</h2>
          <p className="section-copy">
            Este módulo ya tiene material suficiente para una demo comercial o un
            post de producto.
          </p>
          <div className="mt-6 space-y-3">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                <span>{highlight}</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

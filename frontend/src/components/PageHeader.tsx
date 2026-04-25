import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({
  eyebrow = "Vittra Workspace",
  title,
  description,
  actions,
  meta,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-kicker">{eyebrow}</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
          {meta ? <div className="mt-4">{meta}</div> : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

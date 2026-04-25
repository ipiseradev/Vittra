import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="surface-card flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 rounded-[24px] bg-slate-100 p-4">
        <Icon className="text-slate-600" size={32} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-6 text-slate-600">{description}</p>
      {action ? (
        <button type="button" onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

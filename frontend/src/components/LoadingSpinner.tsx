type LoadingSpinnerProps = {
  label?: string;
  fullscreen?: boolean;
};

export function LoadingSpinner({
  label = "Cargando workspace...",
  fullscreen = false,
}: LoadingSpinnerProps) {
  return (
    <div
      className={
        fullscreen
          ? "flex min-h-screen items-center justify-center px-6"
          : "flex items-center justify-center py-12"
      }
    >
      <div className="surface-card flex min-w-[220px] flex-col items-center gap-4 px-8 py-8 text-center">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-3xl bg-sky-100" />
          <div className="absolute inset-0 animate-spin rounded-3xl border-4 border-sky-100 border-t-sky-700" />
          <div className="absolute inset-3 rounded-2xl bg-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Vittra</p>
          <p className="mt-1 text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="surface-card space-y-4 p-6">
      <div className="h-4 w-1/4 animate-pulse rounded bg-slate-200" />
      <div className="space-y-3">
        <div className="h-3 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

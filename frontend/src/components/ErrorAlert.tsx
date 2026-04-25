import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
      <AlertCircle className="mt-0.5 shrink-0 text-rose-600" size={20} />
      <div className="flex-1">
        <p className="font-medium text-rose-900">Error</p>
        <p className="mt-1 text-sm text-rose-700">{message}</p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-rose-600 transition hover:text-rose-800"
        >
          <X size={18} />
        </button>
      ) : null}
    </div>
  );
}

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 shadow-sm">
      <CheckCircle2 className="mt-0.5 text-emerald-600" size={20} />
      <div>
        <p className="font-medium text-emerald-900">Éxito</p>
        <p className="mt-1 text-sm text-emerald-700">{message}</p>
      </div>
    </div>
  );
}

import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
      <div className="flex-1">
        <p className="text-red-800 font-medium">Error</p>
        <p className="text-red-700 text-sm mt-1">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800 flex-shrink-0"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="text-green-600 mt-0.5" size={20} />
      <div>
        <p className="text-green-800 font-medium">Éxito</p>
        <p className="text-green-700 text-sm mt-1">{message}</p>
      </div>
    </div>
  );
}

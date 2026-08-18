import type { ReactNode } from "react";
import { AlertCircleIcon, CheckCircleIcon } from "@/components/icons";

interface FormAlertProps {
  type?: "error" | "success";
  message?: string | ReactNode;
  className?: string;
}

export function FormAlert({ type = "error", message, className = "" }: FormAlertProps) {
  if (!message) return null;

  if (type === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-start gap-2.5 rounded-md border border-success-600/30 bg-success-600/10 p-3 text-sm font-medium text-success-600 ${className}`}
      >
        <CheckCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">{message}</div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-2.5 rounded-md border border-error-600/30 bg-error-600/10 p-3 text-sm font-medium text-error-600 ${className}`}
    >
      <AlertCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 leading-relaxed">{message}</div>
    </div>
  );
}

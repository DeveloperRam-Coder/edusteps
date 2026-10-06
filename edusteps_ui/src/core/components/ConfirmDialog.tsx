import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 border-t border-border bg-muted/40 p-3 sm:p-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-accent h-8"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-destructive/90 h-8"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

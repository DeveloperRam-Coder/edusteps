const colors: Record<string, string> = {
  success: 'border-success/30 bg-success/10 text-green-900 dark:text-green-100',
  error: 'border-destructive/30 bg-destructive/10 text-red-900 dark:text-red-100',
  info: 'border-info/30 bg-info/10 text-blue-900 dark:text-blue-100',
  warning: 'border-warning/30 bg-warning/10 text-amber-900 dark:text-amber-100',
};

export default function Toast({ message, type = 'info', onClose }: { message: string; type?: string; onClose?: () => void }) {
  return (
    <div className={`flex w-80 items-start gap-3 rounded-2xl border p-3.5 shadow-soft backdrop-blur-md ${colors[type] || colors.info}`}>
      <div className="flex-1 text-sm font-medium leading-relaxed">{message}</div>
      <button
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs opacity-70 transition hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
        onClick={onClose}
      >
        X
      </button>
    </div>
  );
}

import Toast from './Toast';

export default function ToastContainer({ toasts, onDismiss }: { toasts: Array<{ id: string; message: string; type: string }>; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed right-3 top-3 z-[120] flex max-w-[calc(100vw-1.5rem)] flex-col gap-3 sm:right-4 sm:top-4">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

interface ToastMessage { id: number; title: string; body: string }
type Notify = (title: string, body: string) => void;

const ToastContext = createContext<Notify>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const notify = useCallback<Notify>((title, body) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, title, body }].slice(-3));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-16 z-[80] flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:w-96">
        {toasts.map((toast) => (
          <div key={toast.id} role="status" className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-line bg-white p-4 text-ink shadow-lg dark:shadow-black/30">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-brand" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{toast.title}</p>
              <p className="mt-0.5 text-sm text-ink/70">{toast.body}</p>
            </div>
            <button type="button" aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-paper"><X size={15} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

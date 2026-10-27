import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import css from './Toast.module.css';

interface ToastData {
  text: string;
  action?: { label: string; run: () => void };
}

const ToastContext = createContext<(t: ToastData) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<number>(undefined);
  const { pathname } = useLocation();

  // A toast belongs to the screen it was shown on.
  useEffect(() => setToast(null), [pathname]);

  const show = useCallback((t: ToastData) => {
    window.clearTimeout(timer.current);
    setToast(t);
    timer.current = window.setTimeout(() => setToast(null), t.action ? 5000 : 2500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className={css.toast} role="status">
          <span className={css.text}>{toast.text}</span>
          {toast.action && (
            <button
              type="button"
              className={css.action}
              onClick={() => {
                toast.action!.run();
                setToast(null);
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

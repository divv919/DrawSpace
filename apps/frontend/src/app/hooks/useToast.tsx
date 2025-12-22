"use client";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
interface Toast {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}
const DURATION = 4000;
const ToastContext = createContext<{
  toast: (Toast & { id: string }) | null;
  setToast: React.Dispatch<
    React.SetStateAction<(Toast & { id: string }) | null>
  >;
  showToast: (toast: Toast) => void;
} | null>(null);
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<(Toast & { id: string }) | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (toast && timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (toast) {
      timerRef.current = setTimeout(() => {
        setToast(null);
      }, DURATION);
    }
  }, [toast]);
  const showToast = useCallback((toast: Toast) => {
    console.log("showing toast", toast);
    setToast({ ...toast, id: (toast.message + Date.now()).toString() });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, setToast, showToast }}>
      {children}
    </ToastContext.Provider>
  );
};

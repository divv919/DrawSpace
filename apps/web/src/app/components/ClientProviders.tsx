// ClientProviders.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider, useToast } from "../hooks/useToast";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: 24 * 60 * 60 * 1000 } },
});

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ClientProvidersInner>{children}</ClientProvidersInner>
    </ToastProvider>
  );
}

function ClientProvidersInner({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    console.log("toast in effect ", toast);
  }, [toast]);

  return (
    <div className="relative">
      {toast && toast.title && toast.message && toast.type && (
        <div
          key={toast.id}
          className="absolute overflow-hidden flex  flex-col gap-1 max-w-[300px] shadow-md bottom-10 bg-neutral-800 left-15 w-fit h-fit pointer-events-none z-100 px-5 py-3 pb-4 rounded-md"
        >
          <div className="flex items-center gap-[6px]">
            <AlertCircle size={16} className="pb-[1px]" />
            <div className="font-semibold text-[18px] tracking-tight ">
              {toast.title}
            </div>
          </div>
          <div className="text-sm text-neutral-300 ">{toast.message}</div>
          <div className="absolute w-full h-1 bg-transparent left-0 -bottom-0 overflow-hidden">
            <div
              className="absolute w-full h-full bg-neutral-200 left-0 animate-toast-slider  duration-300"
              style={{
                animation: "toast-loader 4s linear forwards",
              }}
            ></div>
          </div>
        </div>
      )}

      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    </div>
  );
}

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../hooks/useAuth";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
});
export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AuthProvider>
    </div>
  );
}

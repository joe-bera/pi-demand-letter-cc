'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

function ApiTokenSetup() {
  const { getToken } = useAuth();

  useEffect(() => {
    api.setTokenGetter(() => getToken());
  }, [getToken]);

  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ApiTokenSetup />
      {children}
    </QueryClientProvider>
  );
}

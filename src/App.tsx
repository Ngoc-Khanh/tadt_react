import { AtomsProvider, RouterProvider } from "@/providers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (import.meta.env.DEV) console.log({ failureCount, error });
          if (failureCount >= 0 && import.meta.env.DEV) return false;
          if (failureCount >= 3 && import.meta.env.PROD) return false;
          return !(
            error instanceof AxiosError &&
            [401, 403].includes(error.response?.status ?? 0)
          )
        },
        refetchOnWindowFocus: import.meta.env.PROD,
        staleTime: 10 * 1000, // 10 seconds
      },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <AtomsProvider>
        <RouterProvider />
      </AtomsProvider>
    </QueryClientProvider>
  )
}

export default App;
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type { ClientDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";

export function useClients() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ClientDto[]>("/api/clients", token);
    },
    enabled: isLoaded && isSignedIn,
  });
}

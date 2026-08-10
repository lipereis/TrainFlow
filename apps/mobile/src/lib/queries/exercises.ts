import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type { ExerciseDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";

export function useExercises() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<ExerciseDto[]>("/api/exercises", token);
    },
    enabled: isLoaded && isSignedIn,
  });
}

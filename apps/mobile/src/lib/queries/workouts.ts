import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type { WorkoutProgramDto, WorkoutProgramListDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";

export function useWorkouts(clientId?: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["workouts", clientId ?? "all"],
    queryFn: async () => {
      const token = await getToken();
      const path = clientId
        ? `/api/workouts?clientId=${encodeURIComponent(clientId)}`
        : "/api/workouts";
      return apiFetch<WorkoutProgramListDto[]>(path, token);
    },
    enabled: isLoaded && isSignedIn,
  });
}

export function useWorkout(id: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["workouts", "detail", id],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<WorkoutProgramDto>(`/api/workouts/${id}`, token);
    },
    enabled: isLoaded && isSignedIn && !!id,
  });
}

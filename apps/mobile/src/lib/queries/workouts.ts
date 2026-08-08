import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import { apiFetch } from "@/lib/api";

export type WorkoutSummary = {
  id: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

export function useWorkouts() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["workouts"],
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<WorkoutSummary[]>("/api/workouts", token);
    },
  });
}

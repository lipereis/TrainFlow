import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type {
  CreateWorkoutInput,
  UpdateWorkoutInput,
  WorkoutProgramDto,
} from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export function useCreateWorkout() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: CreateWorkoutInput) => {
      const token = await getToken();
      return apiFetch<WorkoutProgramDto>("/api/workouts", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useUpdateWorkout(id: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: UpdateWorkoutInput) => {
      const token = await getToken();
      return apiFetch<WorkoutProgramDto>(`/api/workouts/${id}`, token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useDeleteWorkout(id: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<undefined>(`/api/workouts/${id}`, token, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

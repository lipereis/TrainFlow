import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type { WorkoutDayInput, WorkoutDayDto, WorkoutProgramDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export function useAddDay(workoutId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: WorkoutDayInput) => {
      const token = await getToken();
      return apiFetch<WorkoutDayDto>(`/api/workouts/${workoutId}/days`, token, {
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

export function useUpdateDay(workoutId: string, dayId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<WorkoutDayInput>) => {
      const token = await getToken();
      return apiFetch<WorkoutDayDto>(`/api/workouts/${workoutId}/days/${dayId}`, token, {
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

export function useDeleteDay(workoutId: string, dayId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<undefined>(`/api/workouts/${workoutId}/days/${dayId}`, token, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useReorderDays(workoutId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: { ids: string[] }) => {
      const token = await getToken();
      return apiFetch<WorkoutProgramDto>(`/api/workouts/${workoutId}/days/reorder`, token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

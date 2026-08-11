import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import type {
  WorkoutExerciseInput,
  WorkoutExerciseDto,
  WorkoutProgramDto,
} from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export function useAddExercise(workoutId: string, dayId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: WorkoutExerciseInput) => {
      const token = await getToken();
      return apiFetch<WorkoutExerciseDto>(
        `/api/workouts/${workoutId}/days/${dayId}/exercises`,
        token,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useUpdateExercise(workoutId: string, dayId: string, exerciseId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<WorkoutExerciseInput>) => {
      const token = await getToken();
      return apiFetch<WorkoutExerciseDto>(
        `/api/workouts/${workoutId}/days/${dayId}/exercises/${exerciseId}`,
        token,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useDeleteExercise(workoutId: string, dayId: string, exerciseId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return apiFetch<undefined>(
        `/api/workouts/${workoutId}/days/${dayId}/exercises/${exerciseId}`,
        token,
        { method: "DELETE" },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useReorderExercises(workoutId: string, dayId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: { ids: string[] }) => {
      const token = await getToken();
      return apiFetch<WorkoutProgramDto>(
        `/api/workouts/${workoutId}/days/${dayId}/exercises/reorder`,
        token,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workouts"] }),
  });
}

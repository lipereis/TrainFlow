import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { useUpdateExercise } from "@/lib/queries/exerciseMutations";
import { ExerciseForm, type ExerciseFormValues } from "@/components/workouts/ExerciseForm";

export default function EditExerciseScreen() {
  const { id, dayId, exerciseId } = useLocalSearchParams<{
    id: string;
    dayId: string;
    exerciseId: string;
  }>();
  const router = useRouter();
  const workout = useWorkout(id);
  const updateExercise = useUpdateExercise(id, dayId, exerciseId);

  if (workout.isPending) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  const day = workout.data?.days.find((d) => d.id === dayId);
  const exercise = day?.exercises.find((e) => e.id === exerciseId);

  if (workout.error || !workout.data || !day || !exercise) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>
          {workout.error ? (workout.error as Error).message : "Exercise not found."}
        </Text>
      </View>
    );
  }

  async function handleSubmit(values: ExerciseFormValues) {
    await updateExercise.mutateAsync(values);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ExerciseForm
        submitLabel="Save changes"
        initialValues={{
          sets: exercise.sets,
          repsMin: exercise.repsMin,
          repsMax: exercise.repsMax,
          weight: exercise.weight,
          weightUnit: exercise.weightUnit,
          restSec: exercise.restSec,
          method: exercise.method,
        }}
        onSubmit={handleSubmit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  content: { paddingBottom: 40 },
  errorText: { fontSize: 13, color: "red" },
});

import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { useUpdateWorkout } from "@/lib/queries/workoutMutations";
import { ProgramForm, type ProgramFormValues } from "@/components/workouts/ProgramForm";

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workout = useWorkout(id);
  const updateWorkout = useUpdateWorkout(id);

  if (workout.isPending) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (workout.error || !workout.data) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>
          {workout.error ? (workout.error as Error).message : "Workout not found."}
        </Text>
      </View>
    );
  }

  const w = workout.data;

  async function handleSubmit(values: ProgramFormValues) {
    await updateWorkout.mutateAsync(values);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProgramForm
        mode="edit"
        submitLabel="Save changes"
        initialValues={{
          name: w.name,
          goal: w.goal,
          startDate: w.startDate.slice(0, 10),
          endDate: w.endDate ? w.endDate.slice(0, 10) : null,
          daysPerWeek: w.daysPerWeek,
          level: w.level,
          location: w.location,
          equipment: w.equipment,
          observations: w.observations,
          status: w.status,
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

import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { useUpdateDay } from "@/lib/queries/dayMutations";
import { DayForm, type DayFormValues } from "@/components/workouts/DayForm";

export default function EditDayScreen() {
  const { id, dayId } = useLocalSearchParams<{ id: string; dayId: string }>();
  const router = useRouter();
  const workout = useWorkout(id);
  const updateDay = useUpdateDay(id, dayId);

  if (workout.isPending) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  const day = workout.data?.days.find((d) => d.id === dayId);

  if (workout.error || !workout.data || !day) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>
          {workout.error ? (workout.error as Error).message : "Day not found."}
        </Text>
      </View>
    );
  }

  async function handleSubmit(values: DayFormValues) {
    await updateDay.mutateAsync(values);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <DayForm
        mode="edit"
        submitLabel="Save changes"
        initialValues={{
          name: day.name,
          focus: day.focus,
          estimatedDurationMin: day.estimatedDurationMin,
          warmup: day.warmup,
          cooldown: day.cooldown,
          observations: day.observations,
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

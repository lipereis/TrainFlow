import { ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ProgramForm, type ProgramFormValues } from "@/components/workouts/ProgramForm";
import { useCreateWorkout } from "@/lib/queries/workoutMutations";

export default function NewWorkoutScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const createWorkout = useCreateWorkout();

  async function handleSubmit(values: ProgramFormValues) {
    const result = await createWorkout.mutateAsync({ ...values, clientId });
    router.replace(`/workouts/${result.id}`);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProgramForm mode="create" clientId={clientId} submitLabel="Create program" onSubmit={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  content: { paddingBottom: 40 },
});

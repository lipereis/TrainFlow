import { useState } from "react";
import { View, Text, TextInput, FlatList, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useExercises } from "@/lib/queries/exercises";
import { useAddExercise } from "@/lib/queries/exerciseMutations";
import type { ExerciseDto } from "@trainflow/shared-types";

function defaultExercisePayload(exercise: ExerciseDto) {
  return {
    exerciseId: exercise.id,
    customName: exercise.name,
    muscleGroup: exercise.primaryMuscle,
    category: exercise.category,
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    weight: null,
    weightUnit: "KG" as const,
    restSec: 90,
    method: "Standard sets" as const,
  };
}

export default function AddExerciseScreen() {
  const { id, dayId } = useLocalSearchParams<{ id: string; dayId: string }>();
  const router = useRouter();
  const exercises = useExercises();
  const addExercise = useAddExercise(id, dayId);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = (exercises.data ?? []).filter((exercise) =>
    exercise.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  async function handlePick(exercise: ExerciseDto) {
    setError(null);
    try {
      await addExercise.mutateAsync(defaultExercisePayload(exercise));
      router.back();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search exercises"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {exercises.isPending ? <ActivityIndicator /> : null}
      {exercises.error ? (
        <Text style={styles.errorText}>{(exercises.error as Error).message}</Text>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => handlePick(item)} disabled={addExercise.isPending}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.primaryMuscle} · {item.category}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !exercises.isPending && !exercises.error ? <Text>No exercises found.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 15 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
    gap: 4,
  },
  name: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, color: "#666" },
  errorText: { fontSize: 13, color: "red" },
});

import { View, Text, FlatList, ActivityIndicator, Pressable, Linking, StyleSheet } from "react-native";
import { useExercises } from "@/lib/queries/exercises";
import type { ExerciseDto } from "@trainflow/shared-types";

function ExerciseRow({ exercise }: { exercise: ExerciseDto }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.badge}>{exercise.trainerId ? "Custom" : "Library"}</Text>
      </View>
      <Text style={styles.meta}>
        {exercise.primaryMuscle} · {exercise.category} · {exercise.equipment}
      </Text>
      {exercise.defaultInstructions ? (
        <Text style={styles.instructions} numberOfLines={2}>
          {exercise.defaultInstructions}
        </Text>
      ) : null}
      {exercise.videoUrl ? (
        <Pressable onPress={() => Linking.openURL(exercise.videoUrl as string)}>
          <Text style={styles.videoLink}>Video</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function ExercisesListScreen() {
  const exercises = useExercises();

  return (
    <View style={styles.screen}>
      {exercises.isPending ? <ActivityIndicator /> : null}
      {exercises.error ? (
        <Text style={styles.errorText}>{(exercises.error as Error).message}</Text>
      ) : null}
      <FlatList
        data={exercises.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExerciseRow exercise={item} />}
        ListEmptyComponent={
          !exercises.isPending && !exercises.error ? <Text>No exercises yet.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
    gap: 4,
  },
  rowHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 16, fontWeight: "600" },
  badge: {
    fontSize: 11,
    color: "#666",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  meta: { fontSize: 13, color: "#666" },
  instructions: { fontSize: 13, color: "#444" },
  videoLink: { fontSize: 13, color: "#0066cc", textDecorationLine: "underline" },
  errorText: { fontSize: 13, color: "red" },
});

import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { formatRepRange, formatRest, formatWeight, emptyDisplay } from "@trainflow/workout-math";
import type { WorkoutDayDto, WorkoutExerciseDto } from "@trainflow/shared-types";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value === "" ? "—" : emptyDisplay(value)}</Text>
    </View>
  );
}

function ExerciseRow({ exercise }: { exercise: WorkoutExerciseDto }) {
  return (
    <View style={styles.exerciseRow}>
      <Text style={styles.exerciseName}>{exercise.customName?.trim() || "Exercise"}</Text>
      <Text style={styles.exerciseMeta}>
        {exercise.sets} × {formatRepRange(exercise.repsMin, exercise.repsMax)}
        {" · "}
        {formatWeight(exercise.weight, exercise.weightUnit)}
        {" · rest "}
        {formatRest(exercise.restSec)}
        {" · "}
        {exercise.method}
      </Text>
    </View>
  );
}

function DaySection({ day }: { day: WorkoutDayDto }) {
  return (
    <View style={styles.daySection}>
      <Text style={styles.dayName}>{day.name}</Text>
      {day.focus ? <Text style={styles.dayFocus}>{day.focus}</Text> : null}
      <Text style={styles.dayTotals}>
        {day.totals.totalSets} sets · {formatRepRange(day.totals.minReps, day.totals.maxReps)} reps ·{" "}
        {day.totals.estimatedDurationMin} min
      </Text>
      {day.exercises.map((exercise) => (
        <ExerciseRow key={exercise.id} exercise={exercise} />
      ))}
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkout(id);

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{w.name}</Text>
      <Text style={styles.status}>{w.status}</Text>

      <Field label="Goal" value={w.goal} />
      <Field label="Start date" value={w.startDate.slice(0, 10)} />
      <Field label="End date" value={w.endDate ? w.endDate.slice(0, 10) : null} />
      <Field label="Days per week" value={w.daysPerWeek} />
      <Field label="Level" value={w.level} />
      <Field label="Location" value={w.location} />
      <Field label="Equipment" value={w.equipment} />
      <Field label="Observations" value={w.observations} />

      <Text style={styles.sectionTitle}>Weekly summary</Text>
      <Text style={styles.summary}>
        {w.summary.sessions} sessions · {w.summary.totalSets} sets ·{" "}
        {w.summary.minVolume === null || w.summary.maxVolume === null
          ? "—"
          : `${w.summary.minVolume}–${w.summary.maxVolume}`}{" "}
        volume · {w.summary.estimatedDurationMin} min/week
      </Text>

      <Text style={styles.sectionTitle}>Days</Text>
      {w.days.length === 0 ? <Text>No days yet.</Text> : null}
      {w.days.map((day) => (
        <DaySection key={day.id} day={day} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  content: { gap: 12, paddingBottom: 24 },
  name: { fontSize: 22, fontWeight: "700" },
  status: { fontSize: 13, color: "#666", marginBottom: 8 },
  field: { gap: 2 },
  fieldLabel: { fontSize: 12, textTransform: "uppercase", color: "#888" },
  fieldValue: { fontSize: 15, color: "#111" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  summary: { fontSize: 13, color: "#444" },
  daySection: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
    gap: 4,
  },
  dayName: { fontSize: 16, fontWeight: "600" },
  dayFocus: { fontSize: 13, color: "#666" },
  dayTotals: { fontSize: 12, color: "#888" },
  exerciseRow: {
    paddingVertical: 6,
    paddingLeft: 8,
    gap: 2,
  },
  exerciseName: { fontSize: 14, fontWeight: "500" },
  exerciseMeta: { fontSize: 12, color: "#666" },
  errorText: { fontSize: 13, color: "red" },
});

import { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWorkout } from "@/lib/queries/workouts";
import { useDeleteWorkout } from "@/lib/queries/workoutMutations";
import { useDeleteDay, useReorderDays } from "@/lib/queries/dayMutations";
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

function DaySection({
  day,
  workoutId,
  isFirst,
  isLast,
  onMove,
}: {
  day: WorkoutDayDto;
  workoutId: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dayId: string, direction: "up" | "down") => Promise<void>;
}) {
  const router = useRouter();
  const deleteDay = useDeleteDay(workoutId, day.id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  function handleDelete() {
    Alert.alert("Delete day?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setActionError(null);
          try {
            await deleteDay.mutateAsync();
          } catch (err) {
            setActionError((err as Error).message);
          }
        },
      },
    ]);
  }

  async function handleMove(direction: "up" | "down") {
    setActionError(null);
    setMoving(true);
    try {
      await onMove(day.id, direction);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setMoving(false);
    }
  }

  return (
    <View style={styles.daySection}>
      <View style={styles.dayHeaderRow}>
        <Text style={styles.dayName} numberOfLines={1}>{day.name}</Text>
        <View style={styles.dayActionRow}>
          <Pressable onPress={() => handleMove("up")} disabled={isFirst || moving}>
            <Text style={[styles.dayActionLink, isFirst ? styles.dayActionDisabled : null]}>Up</Text>
          </Pressable>
          <Pressable onPress={() => handleMove("down")} disabled={isLast || moving}>
            <Text style={[styles.dayActionLink, isLast ? styles.dayActionDisabled : null]}>Down</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/workouts/${workoutId}/days/${day.id}/edit`)}>
            <Text style={styles.dayActionLink}>Edit</Text>
          </Pressable>
          <Pressable onPress={handleDelete}>
            <Text style={styles.dayDeleteLink}>Delete</Text>
          </Pressable>
        </View>
      </View>
      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
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
  const router = useRouter();
  const deleteWorkout = useDeleteWorkout(id);
  const reorderDays = useReorderDays(id);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function moveDay(dayId: string, direction: "up" | "down") {
    const days = w.days;
    const index = days.findIndex((d) => d.id === dayId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= days.length) {
      return;
    }
    const reordered = [...days];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    await reorderDays.mutateAsync({ ids: reordered.map((d) => d.id) });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{w.name}</Text>
      <Text style={styles.status}>{w.status}</Text>

      <View style={styles.actionRow}>
        <Pressable onPress={() => router.push(`/workouts/${id}/edit`)}>
          <Text style={styles.actionLink}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Alert.alert("Delete program?", "This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  setDeleteError(null);
                  try {
                    await deleteWorkout.mutateAsync();
                    router.replace(`/clients/${w.clientId}`);
                  } catch (err) {
                    setDeleteError((err as Error).message);
                  }
                },
              },
            ]);
          }}
        >
          <Text style={styles.deleteLink}>Delete</Text>
        </Pressable>
      </View>
      {deleteError ? <Text style={styles.errorText}>{deleteError}</Text> : null}

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

      <View style={styles.dayListHeader}>
        <Text style={styles.sectionTitleFlat}>Days</Text>
        <Pressable onPress={() => router.push(`/workouts/${id}/days/new`)}>
          <Text style={styles.actionLink}>Add day</Text>
        </Pressable>
      </View>
      {w.days.length === 0 ? <Text>No days yet.</Text> : null}
      {w.days.map((day, index) => (
        <DaySection
          key={day.id}
          day={day}
          workoutId={id}
          isFirst={index === 0}
          isLast={index === w.days.length - 1}
          onMove={moveDay}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  content: { gap: 12, paddingBottom: 24 },
  name: { fontSize: 22, fontWeight: "700" },
  status: { fontSize: 13, color: "#666", marginBottom: 8 },
  actionRow: { flexDirection: "row", gap: 16, marginBottom: 8 },
  actionLink: { fontSize: 14, color: "#0066cc" },
  deleteLink: { fontSize: 14, color: "red" },
  field: { gap: 2 },
  fieldLabel: { fontSize: 12, textTransform: "uppercase", color: "#888" },
  fieldValue: { fontSize: 15, color: "#111" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  sectionTitleFlat: { fontSize: 16, fontWeight: "600" },
  dayListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  summary: { fontSize: 13, color: "#444" },
  daySection: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
    gap: 4,
  },
  dayHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayActionRow: { flexDirection: "row", gap: 12, flexShrink: 0 },
  dayActionLink: { fontSize: 13, color: "#0066cc" },
  dayDeleteLink: { fontSize: 13, color: "red" },
  dayActionDisabled: { color: "#ccc" },
  dayName: { fontSize: 16, fontWeight: "600", flexShrink: 1 },
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

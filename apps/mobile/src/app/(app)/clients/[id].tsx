import { View, Text, ScrollView, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useClient } from "@/lib/queries/clients";
import { useWorkouts } from "@/lib/queries/workouts";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value === null || value === undefined || value === "" ? "—" : value}</Text>
    </View>
  );
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useClient(id);
  const router = useRouter();
  const workouts = useWorkouts(id);

  if (client.isPending) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (client.error || !client.data) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>
          {client.error ? (client.error as Error).message : "Client not found."}
        </Text>
      </View>
    );
  }

  const c = client.data;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{c.name}</Text>
      <Text style={styles.email}>{c.email}</Text>

      <Field label="Status" value={c.status} />
      <Field label="Phone" value={c.phone} />
      <Field label="Birth date" value={c.birthDate ? c.birthDate.slice(0, 10) : null} />
      <Field label="Experience" value={c.experienceLevel} />
      <Field label="Height" value={c.heightCm != null ? `${c.heightCm} cm` : null} />
      <Field label="Weight" value={c.weightKg != null ? `${c.weightKg} kg` : null} />
      <Field label="Goal" value={c.goal} />
      <Field label="Weekly availability" value={c.weeklyAvailability} />
      <Field label="Injuries" value={c.injuries} />
      <Field label="Restrictions" value={c.restrictions} />
      <Field label="Equipment" value={c.equipment} />
      <Field label="Observations" value={c.observations} />
      <Text style={styles.sectionTitle}>Programs</Text>
      {/* Guard on `id`: useWorkouts falls back to the unscoped global list when
          clientId is falsy, so without this guard a transient falsy `id` would
          render every trainer's program here instead of this client's. */}
      {!id ? null : (
        <>
          {workouts.isPending ? <ActivityIndicator /> : null}
          {workouts.error ? (
            <Text style={styles.errorText}>{(workouts.error as Error).message}</Text>
          ) : null}
          {!workouts.isPending && !workouts.error && (workouts.data ?? []).length === 0 ? (
            <Text>No programs yet.</Text>
          ) : null}
          {(workouts.data ?? []).map((program) => (
            <Pressable key={program.id} onPress={() => router.push(`/workouts/${program.id}`)}>
              <Text style={styles.programRow}>
                {program.name} — {program.status}
              </Text>
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  content: { gap: 12, paddingBottom: 24 },
  name: { fontSize: 22, fontWeight: "700" },
  email: { fontSize: 14, color: "#666", marginBottom: 8 },
  field: { gap: 2 },
  fieldLabel: { fontSize: 12, textTransform: "uppercase", color: "#888" },
  fieldValue: { fontSize: 15, color: "#111" },
  errorText: { fontSize: 13, color: "red" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  programRow: { fontSize: 14, paddingVertical: 6 },
});

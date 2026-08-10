import { View, Text, FlatList, ActivityIndicator, Button, Pressable, StyleSheet } from "react-native";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useWorkouts } from "@/lib/queries/workouts";
import { useClients } from "@/lib/queries/clients";
import { queryClient } from "@/lib/queryClient";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const workouts = useWorkouts();
  const clients = useClients();

  const recentWorkouts = (workouts.data ?? []).slice(0, 8);
  const recentClients = (clients.data ?? []).slice(0, 8);
  const activeCount = (workouts.data ?? []).filter((w) => w.status === "ACTIVE").length;

  const isLoading = workouts.isPending || clients.isPending;

  return (
    <View style={styles.screen}>
      <Text style={styles.greeting}>
        Hi {user?.firstName ?? user?.primaryEmailAddress?.emailAddress}
      </Text>

      {isLoading ? <ActivityIndicator /> : null}

      <View style={styles.statRow}>
        <Pressable style={styles.statBlock} onPress={() => router.push("/clients")}>
          <Text style={styles.statLabel}>Clients</Text>
          <Text style={styles.statValue}>
            {clients.error || clients.isPending ? "—" : clients.data?.length ?? 0}
          </Text>
          {clients.error ? (
            <Text style={styles.errorText}>{(clients.error as Error).message}</Text>
          ) : null}
        </Pressable>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Programs</Text>
          <Text style={styles.statValue}>
            {workouts.error || workouts.isPending ? "—" : workouts.data?.length ?? 0}
          </Text>
          {workouts.error ? (
            <Text style={styles.errorText}>{(workouts.error as Error).message}</Text>
          ) : null}
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statValue}>
            {workouts.error || workouts.isPending ? "—" : activeCount}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent programs</Text>
      <FlatList
        data={recentWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text>
            {item.name} — {item.status}
          </Text>
        )}
        ListEmptyComponent={
          !workouts.isPending && !workouts.error ? <Text>No workouts yet.</Text> : null
        }
      />

      <Text style={styles.sectionTitle}>Clients</Text>
      <FlatList
        data={recentClients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/clients/${item.id}`)}>
            <Text>
              {item.name} — {item.status}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !clients.isPending && !clients.error ? <Text>No clients yet.</Text> : null
        }
      />

      <Pressable style={styles.link} onPress={() => router.push("/exercises")}>
        <Text style={styles.linkText}>Exercise library</Text>
      </Pressable>

      <Button
        title="Sign out"
        onPress={async () => {
          await signOut();
          queryClient.clear();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 12 },
  greeting: { fontSize: 20, fontWeight: "600" },
  statRow: { flexDirection: "row", gap: 16 },
  statBlock: { flex: 1 },
  statLabel: { fontSize: 13, color: "#666" },
  statValue: { fontSize: 24, fontWeight: "700" },
  errorText: { fontSize: 11, color: "red" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  link: { marginTop: 8 },
  linkText: { fontSize: 15, color: "#0066cc" },
});

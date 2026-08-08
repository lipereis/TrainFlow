import { View, Text, FlatList, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useClients } from "@/lib/queries/clients";

export default function ClientsListScreen() {
  const router = useRouter();
  const clients = useClients();

  return (
    <View style={styles.screen}>
      {clients.isPending ? <ActivityIndicator /> : null}
      {clients.error ? (
        <Text style={styles.errorText}>{(clients.error as Error).message}</Text>
      ) : null}
      <FlatList
        data={clients.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/clients/${item.id}`)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !clients.isPending && !clients.error ? <Text>No clients yet.</Text> : null
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
  },
  name: { fontSize: 16, fontWeight: "600" },
  email: { fontSize: 13, color: "#666" },
  status: { fontSize: 12, color: "#999", marginTop: 2 },
  errorText: { fontSize: 13, color: "red" },
});

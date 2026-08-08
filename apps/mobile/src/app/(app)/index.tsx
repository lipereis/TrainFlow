import { View, Text, FlatList, ActivityIndicator, Button } from "react-native";
import { useAuth, useUser } from "@clerk/expo";
import { useWorkouts } from "@/lib/queries/workouts";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { data, isLoading, error } = useWorkouts();

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>
        Hi {user?.firstName ?? user?.primaryEmailAddress?.emailAddress}
      </Text>
      {isLoading ? <ActivityIndicator /> : null}
      {error ? (
        <Text style={{ color: "red" }}>{(error as Error).message}</Text>
      ) : null}
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text>
            {item.name} — {item.status}
          </Text>
        )}
        ListEmptyComponent={!isLoading ? <Text>No workouts yet.</Text> : null}
      />
      <Button title="Sign out" onPress={() => signOut()} />
    </View>
  );
}

import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="clients/index" options={{ headerShown: true, title: "Clients" }} />
      <Stack.Screen name="clients/[id]" options={{ headerShown: true, title: "Client" }} />
      <Stack.Screen name="exercises/index" options={{ headerShown: true, title: "Exercises" }} />
      <Stack.Screen name="workouts/[id]" options={{ headerShown: true, title: "Program" }} />
      <Stack.Screen name="workouts/new" options={{ headerShown: true, title: "New Program" }} />
      <Stack.Screen name="workouts/[id]/edit" options={{ headerShown: true, title: "Edit Program" }} />
      <Stack.Screen name="workouts/[id]/days/new" options={{ headerShown: true, title: "New Day" }} />
      <Stack.Screen name="workouts/[id]/days/[dayId]/edit" options={{ headerShown: true, title: "Edit Day" }} />
      <Stack.Screen name="workouts/[id]/days/[dayId]/exercises/add" options={{ headerShown: true, title: "Add Exercise" }} />
    </Stack>
  );
}

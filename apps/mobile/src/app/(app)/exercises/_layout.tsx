import { Stack } from "expo-router";

export default function ExercisesLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Exercises" }} />
    </Stack>
  );
}

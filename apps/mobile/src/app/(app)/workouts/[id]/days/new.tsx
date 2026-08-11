import { ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DayForm, type DayFormValues } from "@/components/workouts/DayForm";
import { useAddDay } from "@/lib/queries/dayMutations";

export default function NewDayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addDay = useAddDay(id);

  async function handleSubmit(values: DayFormValues) {
    await addDay.mutateAsync(values);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <DayForm mode="create" submitLabel="Add day" onSubmit={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  content: { paddingBottom: 40 },
});

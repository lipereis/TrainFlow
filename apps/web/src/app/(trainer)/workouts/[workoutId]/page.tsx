import { WorkoutSpreadsheet } from "@/components/workouts/spreadsheet";

export default async function WorkoutSpreadsheetPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  return (
    <div className="max-w-none">
      <WorkoutSpreadsheet workoutId={workoutId} />
    </div>
  );
}

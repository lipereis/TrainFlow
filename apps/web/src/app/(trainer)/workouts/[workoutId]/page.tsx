import { WorkoutSpreadsheet } from "@/components/workouts/spreadsheet";

export default function WorkoutSpreadsheetPage({
  params,
}: {
  params: { workoutId: string };
}) {
  return (
    <div className="max-w-none">
      <WorkoutSpreadsheet workoutId={params.workoutId} />
    </div>
  );
}

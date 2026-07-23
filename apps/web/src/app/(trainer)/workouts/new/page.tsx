import { apiFetch } from "@/lib/api";
import { WorkoutWizard } from "@/components/workouts/wizard/workout-wizard";

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const params = await searchParams;
  const clientId = params.clientId?.trim() || null;

  let clientName: string | null = null;
  if (clientId) {
    try {
      const client = await apiFetch<{ name: string }>(`/clients/${clientId}`);
      clientName = client.name;
    } catch {
      // Fall back to step 1 if client missing / unauthorized
      return <WorkoutWizard />;
    }
  }

  return (
    <WorkoutWizard
      initialClientId={clientId}
      initialClientName={clientName}
    />
  );
}

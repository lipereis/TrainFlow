const base = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Client-side authenticated blob download for workout exports.
 * Pass `getToken` from Clerk `useAuth()`.
 */
export async function downloadWorkoutExport(
  workoutId: string,
  format: "xlsx" | "pdf",
  getToken: () => Promise<string | null>,
): Promise<void> {
  const token = await getToken();
  const res = await fetch(
    `${base()}/workouts/${workoutId}/export.${format}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(body.message ?? `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `workout-${workoutId}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

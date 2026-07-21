import Link from "next/link";
import type { ClientDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";

type WorkoutListItem = {
  id: string;
  name: string;
  status?: string;
  clientId?: string;
  updatedAt?: string;
};

export default async function DashboardPage() {
  let clients: ClientDto[] = [];
  let clientsError: string | null = null;
  try {
    clients = await apiFetch<ClientDto[]>("/clients");
  } catch (e) {
    clientsError = e instanceof Error ? e.message : "Failed to load clients";
  }

  let workouts: WorkoutListItem[] = [];
  try {
    workouts = await apiFetch<WorkoutListItem[]>("/workouts");
  } catch {
    workouts = [];
  }

  const recent = workouts.slice(0, 5);

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/clients/new"
            className="rounded bg-zinc-900 px-3 py-2 text-white"
          >
            New client
          </Link>
          <Link
            href="/workouts/new"
            className="rounded border border-zinc-300 bg-white px-3 py-2"
          >
            New workout
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Clients</p>
          <p className="mt-1 text-3xl font-semibold">
            {clientsError ? "—" : clients.length}
          </p>
          {clientsError ? (
            <p className="mt-2 text-sm text-red-600">{clientsError}</p>
          ) : null}
        </div>
        <div className="rounded border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Programs</p>
          <p className="mt-1 text-3xl font-semibold">{workouts.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent programs</h2>
          <Link href="/clients" className="text-sm text-zinc-600 hover:underline">
            View clients
          </Link>
        </div>
        <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
          {recent.map((w) => (
            <li key={w.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{w.name}</p>
                {w.status ? (
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {w.status}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
          {recent.length === 0 ? (
            <li className="px-4 py-8 text-center text-zinc-500">
              No programs yet.
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

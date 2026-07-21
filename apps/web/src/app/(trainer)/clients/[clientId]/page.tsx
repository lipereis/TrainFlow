import Link from "next/link";
import { notFound } from "next/navigation";
import type { ClientDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";
import { DeleteClientButton } from "@/components/delete-client-button";

type WorkoutListItem = {
  id: string;
  name: string;
  status: string;
  updatedAt?: string;
  startDate?: string;
  goal?: string | null;
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-900">
        {value?.trim() ? value : "—"}
      </dd>
    </div>
  );
}

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ clientId: string }> | { clientId: string };
}) {
  const { clientId } = await Promise.resolve(params);

  let client: ClientDto;
  try {
    client = await apiFetch<ClientDto>(`/clients/${clientId}`);
  } catch {
    notFound();
  }

  let programs: WorkoutListItem[] = [];
  try {
    programs = await apiFetch<WorkoutListItem[]>(
      `/workouts?clientId=${encodeURIComponent(clientId)}`,
    );
  } catch {
    programs = [];
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/clients" className="hover:underline">
              Clients
            </Link>
            <span className="mx-1">/</span>
            {client.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{client.name}</h1>
          <p className="text-sm text-zinc-500">{client.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/workouts/new?clientId=${client.id}`}
            className="rounded bg-zinc-900 px-3 py-2 text-sm text-white"
          >
            New workout
          </Link>
          <Link
            href={`/clients/${client.id}/edit`}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            Edit
          </Link>
          <DeleteClientButton clientId={client.id} clientName={client.name} />
        </div>
      </div>

      <dl className="grid gap-4 rounded border border-zinc-200 bg-white p-6 sm:grid-cols-2">
        <Field label="Status" value={client.status} />
        <Field label="Phone" value={client.phone} />
        <Field
          label="Birth date"
          value={client.birthDate ? client.birthDate.slice(0, 10) : null}
        />
        <Field label="Experience" value={client.experienceLevel} />
        <Field
          label="Height"
          value={client.heightCm != null ? `${client.heightCm} cm` : null}
        />
        <Field
          label="Weight"
          value={client.weightKg != null ? `${client.weightKg} kg` : null}
        />
        <Field label="Goal" value={client.goal} />
        <Field label="Weekly availability" value={client.weeklyAvailability} />
        <Field label="Injuries" value={client.injuries} />
        <Field label="Restrictions" value={client.restrictions} />
        <Field label="Equipment" value={client.equipment} />
        <Field label="Observations" value={client.observations} />
      </dl>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Workout programs</h2>
          <Link
            href={`/workouts/new?clientId=${client.id}`}
            className="text-sm text-zinc-600 hover:underline"
          >
            Create program
          </Link>
        </div>
        <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
          {programs.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div className="min-w-0">
                <Link
                  href={`/workouts/${p.id}`}
                  className="font-medium hover:underline"
                >
                  {p.name}
                </Link>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {p.status}
                  {p.goal ? ` · ${p.goal}` : ""}
                </p>
              </div>
              <Link
                href={`/workouts/${p.id}`}
                className="text-sm text-zinc-600 hover:underline"
              >
                Open spreadsheet
              </Link>
            </li>
          ))}
          {programs.length === 0 ? (
            <li className="px-4 py-8 text-center text-zinc-500">
              No programs for this client yet.
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

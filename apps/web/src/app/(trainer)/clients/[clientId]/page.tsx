import Link from "next/link";
import { notFound } from "next/navigation";
import type { ClientDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";
import { DeleteClientButton } from "@/components/delete-client-button";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-900">{value?.trim() ? value : "—"}</dd>
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

  return (
    <section className="space-y-6">
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
        <div className="flex gap-2">
          <Link
            href={`/clients/${client.id}/edit`}
            className="rounded bg-zinc-900 px-3 py-2 text-sm text-white"
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
    </section>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { ClientDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";
import { EditClientForm } from "./edit-form";

export default async function EditClientPage({
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
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href={`/clients/${client.id}`} className="hover:underline">
              {client.name}
            </Link>
            <span className="mx-1">/</span>
            Edit
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Edit client</h1>
        </div>
        <Link
          href={`/clients/${client.id}`}
          className="text-sm text-zinc-600 hover:underline"
        >
          Cancel
        </Link>
      </div>
      <EditClientForm client={client} />
    </section>
  );
}

import Link from "next/link";
import type { ClientDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";

export default async function ClientsPage() {
  let clients: ClientDto[] = [];
  let error: string | null = null;
  try {
    clients = await apiFetch<ClientDto[]>("/clients");
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load clients";
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link
          href="/clients/invite"
          className="rounded bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          Invite client
        </Link>
      </div>
      {error ? <p className="text-red-600">{error}</p> : null}
      <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
        {clients.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-zinc-500">{c.email}</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              {c.status}
            </span>
          </li>
        ))}
        {clients.length === 0 && !error ? (
          <li className="px-4 py-8 text-center text-zinc-500">No clients yet.</li>
        ) : null}
      </ul>
    </section>
  );
}

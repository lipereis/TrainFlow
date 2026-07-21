import Link from "next/link";
import type { ClientDto } from "@trainflow/shared-types";
import { DeleteClientButton } from "@/components/delete-client-button";
import { apiFetch } from "@/lib/api";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }> | { q?: string };
}) {
  const params = await Promise.resolve(searchParams);
  const q = params.q?.trim() ?? "";

  let clients: ClientDto[] = [];
  let error: string | null = null;
  try {
    const path = q ? `/clients?q=${encodeURIComponent(q)}` : "/clients";
    clients = await apiFetch<ClientDto[]>(path);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load clients";
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/clients/new"
            className="rounded bg-zinc-900 px-3 py-2 text-white"
          >
            New client
          </Link>
          <Link
            href="/clients/invite"
            className="rounded border border-zinc-300 bg-white px-3 py-2"
          >
            Invite
          </Link>
        </div>
      </div>

      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email"
          className="w-full max-w-sm rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          Search
        </button>
        {q ? (
          <Link
            href="/clients"
            className="rounded px-3 py-2 text-sm text-zinc-600 hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {error ? <p className="text-red-600">{error}</p> : null}

      <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
        {clients.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <Link
                href={`/clients/${c.id}`}
                className="font-medium hover:underline"
              >
                {c.name}
              </Link>
              <p className="text-sm text-zinc-500">{c.email}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                {c.status}
              </span>
              <Link
                href={`/clients/${c.id}/edit`}
                className="text-zinc-700 hover:underline"
              >
                Edit
              </Link>
              <DeleteClientButton
                clientId={c.id}
                clientName={c.name}
                variant="link"
              />
            </div>
          </li>
        ))}
        {clients.length === 0 && !error ? (
          <li className="px-4 py-8 text-center text-zinc-500">
            {q ? "No clients match your search." : "No clients yet."}
          </li>
        ) : null}
      </ul>
    </section>
  );
}

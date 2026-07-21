"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { ClientDto, CreateClientInput } from "@trainflow/shared-types";
import { ClientForm } from "@/components/client-form";
import { browserApiFetch } from "@/lib/browser-api";
import { btnPrimary, btnSecondary, inputClass } from "./types";

type Props = {
  selectedId: string | null;
  selectedName: string | null;
  onSelect: (client: { id: string; name: string }) => void;
  onContinue: () => void;
};

export function StepClient({
  selectedId,
  selectedName,
  onSelect,
  onContinue,
}: Props) {
  const { getToken } = useAuth();
  const [mode, setMode] = useState<"select" | "create">("select");
  const [q, setQ] = useState("");
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const path = query.trim()
          ? `/clients?q=${encodeURIComponent(query.trim())}`
          : "/clients";
        const list = await browserApiFetch<ClientDto[]>(path, token);
        setClients(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load clients");
      } finally {
        setLoading(false);
      }
    },
    [getToken],
  );

  useEffect(() => {
    void load("");
  }, [load]);

  async function onCreate(data: CreateClientInput) {
    const token = await getToken();
    const created = await browserApiFetch<ClientDto>("/clients", token, {
      method: "POST",
      body: JSON.stringify(data),
    });
    onSelect({ id: created.id, name: created.name });
    setMode("select");
    await load("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Select or create client</h2>
        <p className="text-sm text-zinc-500">
          Choose who this program is for, or create a new client.
        </p>
      </div>

      <div className="flex gap-2 text-sm">
        <button
          type="button"
          className={mode === "select" ? btnPrimary : btnSecondary}
          onClick={() => setMode("select")}
        >
          Select existing
        </button>
        <button
          type="button"
          className={mode === "create" ? btnPrimary : btnSecondary}
          onClick={() => setMode("create")}
        >
          Create new
        </button>
      </div>

      {mode === "create" ? (
        <ClientForm
          mode="create"
          onSubmit={onCreate}
          submitLabel="Create and select"
        />
      ) : (
        <div className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void load(q);
            }}
          >
            <input
              className={inputClass}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email"
            />
            <button type="submit" className={btnSecondary}>
              Search
            </button>
          </form>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : (
            <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
              {clients.map((c) => {
                const selected = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onSelect({ id: c.id, name: c.name })}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50 ${
                        selected ? "bg-zinc-100" : ""
                      }`}
                    >
                      <span>
                        <span className="font-medium">{c.name}</span>
                        <span className="mt-0.5 block text-sm text-zinc-500">
                          {c.email}
                        </span>
                      </span>
                      {selected ? (
                        <span className="text-xs font-medium uppercase tracking-wide text-zinc-700">
                          Selected
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
              {clients.length === 0 ? (
                <li className="px-4 py-8 text-center text-zinc-500">
                  No clients found.
                </li>
              ) : null}
            </ul>
          )}

          {selectedId ? (
            <p className="text-sm text-zinc-600">
              Selected: <span className="font-medium">{selectedName}</span>
            </p>
          ) : null}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className={btnPrimary}
          disabled={!selectedId}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

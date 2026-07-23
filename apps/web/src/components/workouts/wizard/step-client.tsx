"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import type { ClientDto, CreateClientInput } from "@trainflow/shared-types";
import { ClientForm } from "@/components/client-form";
import { browserApiFetch } from "@/lib/browser-api";
import { btnPrimary, btnSecondary, inputClass } from "./types";

type Props = {
  selectedId: string | null;
  selectedName: string | null;
  locked?: boolean;
  onSelect: (client: { id: string; name: string }) => void;
  onContinue: () => void;
};

export function StepClient({
  selectedId,
  selectedName,
  locked = false,
  onSelect,
  onContinue,
}: Props) {
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
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
        setError(e instanceof Error ? e.message : t("loadClientsFailed"));
      } finally {
        setLoading(false);
      }
    },
    [getToken, t],
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

  if (locked) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("stepClient")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("clientLockedDesc")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {t("selectedClient")}
          </p>
          <p className="font-medium text-foreground">
            {selectedName ?? tCommon("emDash")}
          </p>
        </div>
        <div className="flex justify-end">
          <button type="button" className={btnPrimary} onClick={onContinue}>
            {t("continue")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("selectOrCreateTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("selectOrCreateDesc")}
        </p>
      </div>

      <div className="flex gap-2 text-sm">
        <button
          type="button"
          className={mode === "select" ? btnPrimary : btnSecondary}
          onClick={() => setMode("select")}
        >
          {t("selectExisting")}
        </button>
        <button
          type="button"
          className={mode === "create" ? btnPrimary : btnSecondary}
          onClick={() => setMode("create")}
        >
          {t("createNew")}
        </button>
      </div>

      {mode === "create" ? (
        <ClientForm
          mode="create"
          onSubmit={onCreate}
          submitLabel={t("createAndSelect")}
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
              placeholder={t("searchClientsPlaceholder")}
            />
            <button type="submit" className={btnSecondary}>
              {tCommon("search")}
            </button>
          </form>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          {loading ? (
            <p className="text-sm text-muted-foreground">
              {tCommon("loading")}
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {clients.map((c) => {
                const selected = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onSelect({ id: c.id, name: c.name })}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted ${
                        selected ? "bg-muted" : ""
                      }`}
                    >
                      <span>
                        <span className="font-medium text-foreground">
                          {c.name}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {c.email}
                        </span>
                      </span>
                      {selected ? (
                        <span className="text-xs font-medium uppercase tracking-wide text-foreground">
                          {t("selected")}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
              {clients.length === 0 ? (
                <li className="px-4 py-8 text-center text-muted-foreground">
                  {t("noClientsFound")}
                </li>
              ) : null}
            </ul>
          )}

          {selectedId ? (
            <p className="text-sm text-muted-foreground">
              {t("selectedNamed", { name: selectedName ?? "" })}
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
          {t("continue")}
        </button>
      </div>
    </div>
  );
}

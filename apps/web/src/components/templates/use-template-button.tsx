"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ClientDto } from "@trainflow/shared-types";
import { browserApiFetch } from "@/lib/browser-api";

type TemplateListItem = {
  id: string;
  name: string;
  goal: string | null;
  daysPerWeek: number | null;
  level: string | null;
  isSample: boolean;
};

export function UseTemplateButton({
  template,
  clients,
}: {
  template: TemplateListItem;
  clients: ClientDto[];
}) {
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");
  const { getToken } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => Boolean(clientId) && clients.length > 0 && !loading,
    [clientId, clients.length, loading],
  );

  async function onUse() {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const program = await browserApiFetch<{ id: string }>(
        `/workouts/from-template/${template.id}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({ clientId }),
        },
      );
      setOpen(false);
      router.push(`/workouts/${program.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("createFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        disabled={clients.length === 0}
        title={
          clients.length === 0
            ? t("createClientFirst")
            : t("useTemplateTitle", { name: template.name })
        }
      >
        {t("useTemplate")}
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("pickClient")}
          </p>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="mb-3 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {error ? (
            <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded px-2 py-1 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="button"
              onClick={onUse}
              disabled={!canSubmit}
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {loading ? t("creating") : t("createDraft")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

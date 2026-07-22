"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { inviteClientSchema } from "@trainflow/shared-types";

export default function InviteClientPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const t = useTranslations("clients");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = inviteClientSchema.safeParse({ name, email });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? t("invalidForm"));
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/clients/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? t("inviteFailed"));
      }
      router.push("/clients");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inviteFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        {t("inviteTitle")}
      </h1>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <label className="block space-y-1 text-sm text-zinc-900 dark:text-zinc-100">
          <span>{t("fullName")}</span>
          <input
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-sm text-zinc-900 dark:text-zinc-100">
          <span>{t("email")}</span>
          <input
            type="email"
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? t("sending") : t("sendInvite")}
        </button>
      </form>
    </section>
  );
}

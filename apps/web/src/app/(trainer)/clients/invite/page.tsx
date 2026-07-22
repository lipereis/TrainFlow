"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { inviteClientSchema } from "@trainflow/shared-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const labelClass = "block space-y-1 text-sm text-foreground";

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
      <h1 className="text-2xl font-semibold text-foreground">
        {t("inviteTitle")}
      </h1>
      <Card className="space-y-4 p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className={labelClass}>
            <span>{t("fullName")}</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className={labelClass}>
            <span>{t("email")}</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("sending") : t("sendInvite")}
          </Button>
        </form>
      </Card>
    </section>
  );
}

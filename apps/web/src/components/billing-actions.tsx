"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { browserApiFetch } from "@/lib/browser-api";

export function BillingActions({
  hasCustomer,
  isPro,
}: {
  hasCustomer: boolean;
  isPro: boolean;
}) {
  const { getToken } = useAuth();
  const t = useTranslations("billing");
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function postBilling(path: "/billing/checkout" | "/billing/portal") {
    setLoading(path === "/billing/checkout" ? "checkout" : "portal");
    setError(null);
    try {
      const token = await getToken();
      const data = await browserApiFetch<{ url: string }>(path, token, {
        method: "POST",
      });
      if (!data?.url) {
        throw new Error(t("configureMissing"));
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("actionFailed"));
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!isPro ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={loading !== null}
            onClick={() => void postBilling("/billing/checkout")}
          >
            {loading === "checkout" ? t("upgrade") + "…" : t("upgrade")}
          </Button>
        ) : null}
        {hasCustomer ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading !== null}
            onClick={() => void postBilling("/billing/portal")}
          >
            {loading === "portal" ? t("manage") + "…" : t("manage")}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}

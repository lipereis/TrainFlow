"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { browserApiFetch } from "@/lib/browser-api";

export function DeleteClientButton({
  clientId,
  clientName,
  variant = "button",
}: {
  clientId: string;
  clientName: string;
  variant?: "button" | "link";
}) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (
      !window.confirm(
        `Delete client "${clientName}"? Associated workout programs will also be deleted. This cannot be undone.`,
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      await browserApiFetch<void>(`/clients/${clientId}`, token, {
        method: "DELETE",
      });
      router.push("/clients");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  const buttonClassName =
    variant === "link"
      ? "text-red-600 hover:underline disabled:opacity-50"
      : "rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50";

  return (
    <div className={variant === "link" ? "inline-flex flex-col items-end" : "space-y-1"}>
      <button
        type="button"
        onClick={onDelete}
        disabled={loading}
        className={buttonClassName}
      >
        {loading ? "Deleting…" : "Delete"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

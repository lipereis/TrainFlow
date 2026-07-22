"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ClientDto, CreateClientInput } from "@trainflow/shared-types";
import { ClientForm } from "@/components/client-form";
import { browserApiFetch } from "@/lib/browser-api";

export default function NewClientPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const t = useTranslations("clients");

  async function onSubmit(data: CreateClientInput) {
    const token = await getToken();
    const created = await browserApiFetch<ClientDto>("/clients", token, {
      method: "POST",
      body: JSON.stringify(data),
    });
    router.push(`/clients/${created.id}`);
    router.refresh();
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("newClient")}
        </h1>
        <Link
          href="/clients"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          {t("back")}
        </Link>
      </div>
      <ClientForm
        mode="create"
        onSubmit={onSubmit}
        submitLabel={t("createClient")}
      />
    </section>
  );
}

"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ClientDto, CreateClientInput } from "@trainflow/shared-types";
import { ClientForm } from "@/components/client-form";
import { browserApiFetch } from "@/lib/browser-api";

export function NewClientForm() {
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
    <ClientForm
      mode="create"
      onSubmit={onSubmit}
      submitLabel={t("createClient")}
    />
  );
}

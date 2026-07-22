"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ClientDto, CreateClientInput } from "@trainflow/shared-types";
import { ClientForm } from "@/components/client-form";
import { browserApiFetch } from "@/lib/browser-api";

export function EditClientForm({ client }: { client: ClientDto }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const t = useTranslations("clients");

  async function onSubmit(data: CreateClientInput) {
    const token = await getToken();
    await browserApiFetch<ClientDto>(`/clients/${client.id}`, token, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    router.push(`/clients/${client.id}`);
    router.refresh();
  }

  return (
    <ClientForm
      mode="edit"
      defaultValues={client}
      onSubmit={onSubmit}
      submitLabel={t("saveChanges")}
    />
  );
}

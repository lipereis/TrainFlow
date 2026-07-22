import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ClientDto } from "@trainflow/shared-types";
import { apiFetch } from "@/lib/api";
import { EditClientForm } from "./edit-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }> | { clientId: string };
}) {
  const t = await getTranslations("clients");
  const tCommon = await getTranslations("common");
  const { clientId } = await Promise.resolve(params);

  let client: ClientDto;
  try {
    client = await apiFetch<ClientDto>(`/clients/${clientId}`);
  } catch {
    notFound();
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={`/clients/${client.id}`} className="hover:underline">
              {client.name}
            </Link>
            <span className="mx-1">/</span>
            {t("edit")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            {t("editClient")}
          </h1>
        </div>
        <Link
          href={`/clients/${client.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          {tCommon("cancel")}
        </Link>
      </div>
      <EditClientForm client={client} />
    </section>
  );
}

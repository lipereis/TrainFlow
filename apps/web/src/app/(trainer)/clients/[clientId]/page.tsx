import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ClientDto } from "@trainflow/shared-types";
import { DeleteClientButton } from "@/components/delete-client-button";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { statusBadgeVariant } from "@/lib/status-badge";

type WorkoutListItem = {
  id: string;
  name: string;
  status: string;
  updatedAt?: string;
  startDate?: string;
  goal?: string | null;
};

function Field({
  label,
  value,
  empty,
}: {
  label: string;
  value: string | null | undefined;
  empty: string;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
        {value?.trim() ? value : empty}
      </dd>
    </div>
  );
}

function clientStatusLabel(
  status: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (status === "ACTIVE") return t("statusActive");
  if (status === "PENDING") return t("statusPending");
  if (status === "INACTIVE") return t("statusInactive");
  return status;
}

function experienceLabel(
  level: string | null | undefined,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (level === "BEGINNER") return t("experienceBeginner");
  if (level === "INTERMEDIATE") return t("experienceIntermediate");
  if (level === "ADVANCED") return t("experienceAdvanced");
  return level ?? null;
}

function programStatusLabel(
  status: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (status === "DRAFT") return t("programStatusDraft");
  if (status === "ACTIVE") return t("programStatusActive");
  if (status === "ARCHIVED") return t("programStatusArchived");
  return status;
}

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
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

  let programs: WorkoutListItem[] = [];
  try {
    programs = await apiFetch<WorkoutListItem[]>(
      `/workouts?clientId=${encodeURIComponent(clientId)}`,
    );
  } catch {
    programs = [];
  }

  const empty = tCommon("emDash");

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/clients" className="hover:underline">
              {t("title")}
            </Link>
            <span className="mx-1">/</span>
            {client.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {client.name}
          </h1>
          <p className="text-sm text-muted-foreground">{client.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/workouts/new?clientId=${client.id}`}
            className={buttonClassName("primary", "sm")}
          >
            {t("newWorkout")}
          </Link>
          <Link
            href={`/clients/${client.id}/edit`}
            className={buttonClassName("secondary", "sm")}
          >
            {t("edit")}
          </Link>
          <DeleteClientButton clientId={client.id} clientName={client.name} />
        </div>
      </div>

      <Card className="p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("status")}
            </dt>
            <dd className="mt-1">
              <Badge variant={statusBadgeVariant(client.status)}>
                {clientStatusLabel(client.status, t)}
              </Badge>
            </dd>
          </div>
          <Field label={t("phone")} value={client.phone} empty={empty} />
          <Field
            label={t("birthDate")}
            value={client.birthDate ? client.birthDate.slice(0, 10) : null}
            empty={empty}
          />
          <Field
            label={t("experience")}
            value={experienceLabel(client.experienceLevel, t)}
            empty={empty}
          />
          <Field
            label={t("height")}
            value={
              client.heightCm != null
                ? t("heightValue", { value: client.heightCm })
                : null
            }
            empty={empty}
          />
          <Field
            label={t("weight")}
            value={
              client.weightKg != null
                ? t("weightValue", { value: client.weightKg })
                : null
            }
            empty={empty}
          />
          <Field label={t("goal")} value={client.goal} empty={empty} />
          <Field
            label={t("weeklyAvailability")}
            value={client.weeklyAvailability}
            empty={empty}
          />
          <Field label={t("injuries")} value={client.injuries} empty={empty} />
          <Field
            label={t("restrictions")}
            value={client.restrictions}
            empty={empty}
          />
          <Field label={t("equipment")} value={client.equipment} empty={empty} />
          <Field
            label={t("observations")}
            value={client.observations}
            empty={empty}
          />
        </dl>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-foreground">
            {t("workoutPrograms")}
          </h2>
          <Link
            href={`/workouts/new?clientId=${client.id}`}
            className={buttonClassName("ghost", "sm")}
          >
            {t("createProgram")}
          </Link>
        </div>
        <Card className="overflow-hidden divide-y divide-border">
          <ul className="divide-y divide-border">
            {programs.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/workouts/${p.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {p.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadgeVariant(p.status)}>
                      {programStatusLabel(p.status, t)}
                    </Badge>
                    {p.goal ? (
                      <span className="text-xs text-muted-foreground">
                        {p.goal}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Link
                  href={`/workouts/${p.id}`}
                  className={buttonClassName("ghost", "sm")}
                >
                  {t("openSpreadsheet")}
                </Link>
              </li>
            ))}
            {programs.length === 0 ? (
              <li className="px-4 py-8 text-center text-muted-foreground">
                {t("noPrograms")}
              </li>
            ) : null}
          </ul>
        </Card>
      </div>
    </section>
  );
}

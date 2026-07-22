"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  createClientSchema,
  updateClientSchema,
  type ClientDto,
  type CreateClientInput,
} from "@trainflow/shared-types";
import { ObservationTemplateInsert } from "@/components/observation-template-insert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

const labelClass = "block space-y-1 text-sm text-foreground";
const selectTextareaClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type ClientFormProps = {
  mode?: "create" | "edit";
  defaultValues?: Partial<ClientDto>;
  onSubmit: (data: CreateClientInput) => Promise<void>;
  submitLabel: string;
};

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toFormDefaults(values?: Partial<ClientDto>): CreateClientInput {
  return {
    name: values?.name ?? "",
    email: values?.email ?? "",
    status: values?.status ?? "ACTIVE",
    phone: values?.phone ?? null,
    birthDate: values?.birthDate ? values.birthDate.slice(0, 10) : null,
    heightCm: values?.heightCm ?? null,
    weightKg: values?.weightKg ?? null,
    goal: values?.goal ?? null,
    experienceLevel: values?.experienceLevel ?? null,
    weeklyAvailability: values?.weeklyAvailability ?? null,
    injuries: values?.injuries ?? null,
    restrictions: values?.restrictions ?? null,
    equipment: values?.equipment ?? null,
    observations: values?.observations ?? null,
  };
}

export function ClientForm({
  mode = "create",
  defaultValues,
  onSubmit,
  submitLabel,
}: ClientFormProps) {
  const t = useTranslations("clients");
  const tCommon = useTranslations("common");
  const schema = mode === "edit" ? updateClientSchema : createClientSchema;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateClientInput>({
    // edit schema is partial; form still collects full profile values
    resolver: zodResolver(schema) as Resolver<CreateClientInput>,
    defaultValues: toFormDefaults(defaultValues),
  });

  const observations = watch("observations") ?? "";

  async function submit(raw: CreateClientInput) {
    const payload: CreateClientInput = {
      ...raw,
      name: raw.name.trim(),
      email: raw.email.trim(),
      phone: emptyToNull(raw.phone ?? undefined),
      birthDate: emptyToNull(raw.birthDate ?? undefined),
      goal: emptyToNull(raw.goal ?? undefined),
      weeklyAvailability: emptyToNull(raw.weeklyAvailability ?? undefined),
      injuries: emptyToNull(raw.injuries ?? undefined),
      restrictions: emptyToNull(raw.restrictions ?? undefined),
      equipment: emptyToNull(raw.equipment ?? undefined),
      observations: emptyToNull(raw.observations ?? undefined),
      heightCm:
        raw.heightCm == null || Number.isNaN(raw.heightCm as number)
          ? null
          : raw.heightCm,
      weightKg:
        raw.weightKg == null || Number.isNaN(raw.weightKg as number)
          ? null
          : raw.weightKg,
      experienceLevel: raw.experienceLevel || null,
    };

    try {
      await onSubmit(payload);
    } catch (e) {
      setError("root", {
        message: e instanceof Error ? e.message : tCommon("saveFailed"),
      });
    }
  }

  return (
    <Card className="space-y-4 p-6">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span>{t("fullName")}</span>
            <Input
              className={cn(errors.name && "border-red-500")}
              {...register("name")}
              required
            />
            {errors.name ? (
              <span className="text-red-600 dark:text-red-400">
                {errors.name.message}
              </span>
            ) : null}
          </label>
          <label className={labelClass}>
            <span>{t("email")}</span>
            <Input
              type="email"
              className={cn(errors.email && "border-red-500")}
              {...register("email")}
              required
            />
            {errors.email ? (
              <span className="text-red-600 dark:text-red-400">
                {errors.email.message}
              </span>
            ) : null}
          </label>
          <label className={labelClass}>
            <span>{t("phone")}</span>
            <Input {...register("phone")} />
          </label>
          <label className={labelClass}>
            <span>{t("status")}</span>
            <select className={selectTextareaClass} {...register("status")}>
              <option value="ACTIVE">{t("statusActive")}</option>
              <option value="PENDING">{t("statusPending")}</option>
              <option value="INACTIVE">{t("statusInactive")}</option>
            </select>
          </label>
          <label className={labelClass}>
            <span>{t("birthDate")}</span>
            <Input type="date" {...register("birthDate")} />
          </label>
          <label className={labelClass}>
            <span>{t("experience")}</span>
            <select
              className={selectTextareaClass}
              {...register("experienceLevel", {
                setValueAs: (v: string) => (v === "" ? null : v),
              })}
            >
              <option value="">{tCommon("emDash")}</option>
              <option value="BEGINNER">{t("experienceBeginner")}</option>
              <option value="INTERMEDIATE">{t("experienceIntermediate")}</option>
              <option value="ADVANCED">{t("experienceAdvanced")}</option>
            </select>
          </label>
          <label className={labelClass}>
            <span>{t("heightCm")}</span>
            <Input
              type="number"
              step="any"
              className={cn(errors.heightCm && "border-red-500")}
              {...register("heightCm", {
                setValueAs: (v: string) =>
                  v === "" || v == null ? null : Number(v),
              })}
            />
            {errors.heightCm ? (
              <span className="text-red-600 dark:text-red-400">
                {errors.heightCm.message}
              </span>
            ) : null}
          </label>
          <label className={labelClass}>
            <span>{t("weightKg")}</span>
            <Input
              type="number"
              step="any"
              className={cn(errors.weightKg && "border-red-500")}
              {...register("weightKg", {
                setValueAs: (v: string) =>
                  v === "" || v == null ? null : Number(v),
              })}
            />
            {errors.weightKg ? (
              <span className="text-red-600 dark:text-red-400">
                {errors.weightKg.message}
              </span>
            ) : null}
          </label>
        </div>

        <label className={labelClass}>
          <span>{t("goal")}</span>
          <Input {...register("goal")} />
        </label>
        <label className={labelClass}>
          <span>{t("weeklyAvailability")}</span>
          <Input {...register("weeklyAvailability")} />
        </label>
        <label className={labelClass}>
          <span>{t("injuries")}</span>
          <textarea
            className={selectTextareaClass}
            rows={2}
            {...register("injuries")}
          />
        </label>
        <label className={labelClass}>
          <span>{t("restrictions")}</span>
          <textarea
            className={selectTextareaClass}
            rows={2}
            {...register("restrictions")}
          />
        </label>
        <label className={labelClass}>
          <span>{t("equipment")}</span>
          <textarea
            className={selectTextareaClass}
            rows={2}
            {...register("equipment")}
          />
        </label>
        <label className={labelClass}>
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span>{t("observations")}</span>
            <ObservationTemplateInsert
              value={observations}
              onInsert={(next) =>
                setValue("observations", next, { shouldDirty: true })
              }
            />
          </span>
          <textarea
            className={selectTextareaClass}
            rows={3}
            {...register("observations")}
          />
        </label>

        {errors.root ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.root.message}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : submitLabel}
        </Button>
      </form>
    </Card>
  );
}

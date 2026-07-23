"use client";

import { useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { experienceLevelSchema } from "@trainflow/shared-types";
import { ObservationTemplateInsert } from "@/components/observation-template-insert";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from "./types";

export type ProgramFormValues = {
  name: string;
  goal?: string | null;
  startDate: string;
  endDate?: string | null;
  daysPerWeek: number;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  location?: string | null;
  equipment?: string | null;
  observations?: string | null;
};

type Props = {
  clientName: string;
  defaultValues?: Partial<ProgramFormValues>;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: (values: ProgramFormValues) => Promise<void>;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function StepProgram({
  clientName,
  defaultValues,
  submitting,
  error,
  onBack,
  onSubmit,
}: Props) {
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");

  const programFormSchema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("nameRequired")).max(200),
        goal: z.string().trim().max(500).optional().nullable(),
        startDate: z.string().min(1, t("startDateRequired")),
        endDate: z.string().optional().nullable(),
        daysPerWeek: z.coerce.number().int().min(1).max(7),
        level: experienceLevelSchema.optional().nullable(),
        location: z.string().trim().max(200).optional().nullable(),
        equipment: z.string().trim().max(1000).optional().nullable(),
        observations: z.string().trim().max(5000).optional().nullable(),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema) as Resolver<ProgramFormValues>,
    defaultValues: {
      name: defaultValues?.name ?? "",
      goal: defaultValues?.goal ?? "",
      startDate: defaultValues?.startDate?.slice(0, 10) ?? todayIsoDate(),
      endDate: defaultValues?.endDate?.slice(0, 10) ?? "",
      daysPerWeek: defaultValues?.daysPerWeek ?? 3,
      level: defaultValues?.level ?? null,
      location: defaultValues?.location ?? "",
      equipment: defaultValues?.equipment ?? "",
      observations: defaultValues?.observations ?? "",
    },
  });

  const observationsValue = watch("observations") ?? "";

  async function submit(raw: ProgramFormValues) {
    await onSubmit({
      ...raw,
      name: raw.name.trim(),
      goal: emptyToNull(raw.goal ?? undefined),
      endDate: emptyToNull(raw.endDate ?? undefined),
      location: emptyToNull(raw.location ?? undefined),
      equipment: emptyToNull(raw.equipment ?? undefined),
      observations: emptyToNull(raw.observations ?? undefined),
      level: raw.level || null,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("programTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t.rich("programDesc", {
            clientName,
            name: (chunks) => (
              <span className="font-medium text-foreground">
                {chunks}
              </span>
            ),
          })}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(submit)}
        className="space-y-4 rounded-xl border border-border bg-card p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>
            <span>{t("programName")}</span>
            <input className={inputClass} {...register("name")} required />
            {errors.name ? (
              <span className="text-red-600 dark:text-red-400">
                {errors.name.message}
              </span>
            ) : null}
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            <span>{t("goal")}</span>
            <input className={inputClass} {...register("goal")} />
          </label>
          <label className={labelClass}>
            <span>{t("startDate")}</span>
            <input
              type="date"
              className={inputClass}
              {...register("startDate")}
              required
            />
            {errors.startDate ? (
              <span className="text-red-600 dark:text-red-400">
                {errors.startDate.message}
              </span>
            ) : null}
          </label>
          <label className={labelClass}>
            <span>{t("endDate")}</span>
            <input type="date" className={inputClass} {...register("endDate")} />
          </label>
          <label className={labelClass}>
            <span>{t("daysPerWeek")}</span>
            <input
              type="number"
              min={1}
              max={7}
              className={inputClass}
              {...register("daysPerWeek")}
              required
            />
            {errors.daysPerWeek ? (
              <span className="text-red-600 dark:text-red-400">
                {errors.daysPerWeek.message}
              </span>
            ) : null}
          </label>
          <label className={labelClass}>
            <span>{t("level")}</span>
            <select
              className={inputClass}
              {...register("level", {
                setValueAs: (v: string) => (v === "" ? null : v),
              })}
            >
              <option value="">{tCommon("emDash")}</option>
              <option value="BEGINNER">{t("levelBeginner")}</option>
              <option value="INTERMEDIATE">{t("levelIntermediate")}</option>
              <option value="ADVANCED">{t("levelAdvanced")}</option>
            </select>
          </label>
          <label className={labelClass}>
            <span>{t("location")}</span>
            <input className={inputClass} {...register("location")} />
          </label>
          <label className={labelClass}>
            <span>{t("equipment")}</span>
            <input className={inputClass} {...register("equipment")} />
          </label>
        </div>
        <label className={labelClass}>
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span>{t("observations")}</span>
            <ObservationTemplateInsert
              value={observationsValue}
              ariaLabel={t("insertObservationAria")}
              onInsert={(next) =>
                setValue("observations", next, { shouldDirty: true })
              }
            />
          </span>
          <textarea
            className={inputClass}
            rows={3}
            {...register("observations")}
          />
        </label>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <div className="flex justify-between gap-2">
          <button type="button" className={btnSecondary} onClick={onBack}>
            {tCommon("back")}
          </button>
          <button type="submit" className={btnPrimary} disabled={submitting}>
            {submitting ? t("saving") : t("saveDraftContinue")}
          </button>
        </div>
      </form>
    </div>
  );
}

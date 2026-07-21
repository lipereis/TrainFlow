"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { experienceLevelSchema } from "@trainflow/shared-types";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from "./types";

const programFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  goal: z.string().trim().max(500).optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  daysPerWeek: z.coerce.number().int().min(1).max(7),
  level: experienceLevelSchema.optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  equipment: z.string().trim().max(1000).optional().nullable(),
  observations: z.string().trim().max(5000).optional().nullable(),
});

export type ProgramFormValues = z.infer<typeof programFormSchema>;

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
  const {
    register,
    handleSubmit,
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
        <h2 className="text-lg font-semibold">Program info</h2>
        <p className="text-sm text-zinc-500">
          For <span className="font-medium text-zinc-700">{clientName}</span>.
          Saves as a draft when you continue.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(submit)}
        className="space-y-4 rounded border border-zinc-200 bg-white p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={`${labelClass} sm:col-span-2`}>
            <span>Program name</span>
            <input className={inputClass} {...register("name")} required />
            {errors.name ? (
              <span className="text-red-600">{errors.name.message}</span>
            ) : null}
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            <span>Goal</span>
            <input className={inputClass} {...register("goal")} />
          </label>
          <label className={labelClass}>
            <span>Start date</span>
            <input
              type="date"
              className={inputClass}
              {...register("startDate")}
              required
            />
            {errors.startDate ? (
              <span className="text-red-600">{errors.startDate.message}</span>
            ) : null}
          </label>
          <label className={labelClass}>
            <span>End date</span>
            <input type="date" className={inputClass} {...register("endDate")} />
          </label>
          <label className={labelClass}>
            <span>Days per week</span>
            <input
              type="number"
              min={1}
              max={7}
              className={inputClass}
              {...register("daysPerWeek")}
              required
            />
            {errors.daysPerWeek ? (
              <span className="text-red-600">{errors.daysPerWeek.message}</span>
            ) : null}
          </label>
          <label className={labelClass}>
            <span>Level</span>
            <select
              className={inputClass}
              {...register("level", {
                setValueAs: (v: string) => (v === "" ? null : v),
              })}
            >
              <option value="">—</option>
              <option value="BEGINNER">BEGINNER</option>
              <option value="INTERMEDIATE">INTERMEDIATE</option>
              <option value="ADVANCED">ADVANCED</option>
            </select>
          </label>
          <label className={labelClass}>
            <span>Location</span>
            <input className={inputClass} {...register("location")} />
          </label>
          <label className={labelClass}>
            <span>Equipment</span>
            <input className={inputClass} {...register("equipment")} />
          </label>
        </div>
        <label className={labelClass}>
          <span>Observations</span>
          <textarea
            className={inputClass}
            rows={3}
            {...register("observations")}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex justify-between gap-2">
          <button type="button" className={btnSecondary} onClick={onBack}>
            Back
          </button>
          <button type="submit" className={btnPrimary} disabled={submitting}>
            {submitting ? "Saving…" : "Save draft & continue"}
          </button>
        </div>
      </form>
    </div>
  );
}

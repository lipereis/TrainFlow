"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createClientSchema,
  updateClientSchema,
  type ClientDto,
  type CreateClientInput,
} from "@trainflow/shared-types";
import { ObservationTemplateInsert } from "@/components/observation-template-insert";

const inputClass =
  "w-full rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-50";
const labelClass = "block space-y-1 text-sm";

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
        message: e instanceof Error ? e.message : "Save failed",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="space-y-4 rounded border border-zinc-200 bg-white p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span>Full name</span>
          <input className={inputClass} {...register("name")} required />
          {errors.name ? (
            <span className="text-red-600">{errors.name.message}</span>
          ) : null}
        </label>
        <label className={labelClass}>
          <span>Email</span>
          <input
            type="email"
            className={inputClass}
            {...register("email")}
            required
          />
          {errors.email ? (
            <span className="text-red-600">{errors.email.message}</span>
          ) : null}
        </label>
        <label className={labelClass}>
          <span>Phone</span>
          <input className={inputClass} {...register("phone")} />
        </label>
        <label className={labelClass}>
          <span>Status</span>
          <select className={inputClass} {...register("status")}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </label>
        <label className={labelClass}>
          <span>Birth date</span>
          <input type="date" className={inputClass} {...register("birthDate")} />
        </label>
        <label className={labelClass}>
          <span>Experience</span>
          <select
            className={inputClass}
            {...register("experienceLevel", {
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
          <span>Height (cm)</span>
          <input
            type="number"
            step="any"
            className={inputClass}
            {...register("heightCm", {
              setValueAs: (v: string) =>
                v === "" || v == null ? null : Number(v),
            })}
          />
          {errors.heightCm ? (
            <span className="text-red-600">{errors.heightCm.message}</span>
          ) : null}
        </label>
        <label className={labelClass}>
          <span>Weight (kg)</span>
          <input
            type="number"
            step="any"
            className={inputClass}
            {...register("weightKg", {
              setValueAs: (v: string) =>
                v === "" || v == null ? null : Number(v),
            })}
          />
          {errors.weightKg ? (
            <span className="text-red-600">{errors.weightKg.message}</span>
          ) : null}
        </label>
      </div>

      <label className={labelClass}>
        <span>Goal</span>
        <input className={inputClass} {...register("goal")} />
      </label>
      <label className={labelClass}>
        <span>Weekly availability</span>
        <input className={inputClass} {...register("weeklyAvailability")} />
      </label>
      <label className={labelClass}>
        <span>Injuries</span>
        <textarea className={inputClass} rows={2} {...register("injuries")} />
      </label>
      <label className={labelClass}>
        <span>Restrictions</span>
        <textarea className={inputClass} rows={2} {...register("restrictions")} />
      </label>
      <label className={labelClass}>
        <span>Equipment</span>
        <textarea className={inputClass} rows={2} {...register("equipment")} />
      </label>
      <label className={labelClass}>
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span>Observations</span>
          <ObservationTemplateInsert
            value={observations}
            onInsert={(next) =>
              setValue("observations", next, { shouldDirty: true })
            }
          />
        </span>
        <textarea className={inputClass} rows={3} {...register("observations")} />
      </label>

      {errors.root ? (
        <p className="text-sm text-red-600">{errors.root.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

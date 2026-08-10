import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { createWorkoutSchema, updateWorkoutSchema } from "@trainflow/shared-types";

export type ProgramFormValues = {
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string | null;
  daysPerWeek: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  location: string | null;
  equipment: string | null;
  observations: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

type FieldState = {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  daysPerWeek: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  location: string;
  equipment: string;
  observations: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

function toFieldState(initial: Partial<ProgramFormValues> | undefined): FieldState {
  return {
    name: initial?.name ?? "",
    goal: initial?.goal ?? "",
    startDate: initial?.startDate ?? "",
    endDate: initial?.endDate ?? "",
    daysPerWeek: initial?.daysPerWeek != null ? String(initial.daysPerWeek) : "",
    level: initial?.level ?? null,
    location: initial?.location ?? "",
    equipment: initial?.equipment ?? "",
    observations: initial?.observations ?? "",
    status: initial?.status ?? "DRAFT",
  };
}

function buildPayload(state: FieldState): ProgramFormValues {
  return {
    name: state.name,
    goal: state.goal.trim() === "" ? null : state.goal,
    startDate: state.startDate,
    endDate: state.endDate.trim() === "" ? null : state.endDate,
    daysPerWeek: state.daysPerWeek.trim() === "" ? NaN : Number(state.daysPerWeek),
    level: state.level,
    location: state.location.trim() === "" ? null : state.location,
    equipment: state.equipment.trim() === "" ? null : state.equipment,
    observations: state.observations.trim() === "" ? null : state.observations,
    status: state.status,
  };
}

const LEVEL_OPTIONS: { value: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const STATUS_OPTIONS: { value: "DRAFT" | "ACTIVE" | "ARCHIVED"; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
];

const RENDERED_FIELD_KEYS = [
  "name",
  "goal",
  "startDate",
  "endDate",
  "daysPerWeek",
  "level",
  "location",
  "equipment",
  "observations",
  "status",
];

function ToggleRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.toggleOption, value === option.value ? styles.toggleOptionActive : null]}
        >
          <Text style={value === option.value ? styles.toggleLabelActive : styles.toggleLabel}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ProgramForm({
  mode,
  initialValues,
  clientId,
  submitLabel,
  onSubmit,
}: {
  mode: "create" | "edit";
  initialValues?: Partial<ProgramFormValues>;
  clientId?: string;
  submitLabel: string;
  onSubmit: (values: ProgramFormValues) => Promise<void>;
}) {
  const [state, setState] = useState<FieldState>(() => toFieldState(initialValues));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FieldState>(key: K, value: FieldState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSubmitError(null);
    const payload = buildPayload(state);
    const result =
      mode === "create"
        ? createWorkoutSchema.safeParse({ ...payload, clientId })
        : updateWorkoutSchema.safeParse(payload);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={state.name} onChangeText={(v) => update("name", v)} />
      {fieldErrors.name ? <Text style={styles.fieldError}>{fieldErrors.name}</Text> : null}

      <Text style={styles.label}>Goal</Text>
      <TextInput style={styles.input} value={state.goal} onChangeText={(v) => update("goal", v)} />
      {fieldErrors.goal ? <Text style={styles.fieldError}>{fieldErrors.goal}</Text> : null}

      <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={state.startDate}
        onChangeText={(v) => update("startDate", v)}
        placeholder="YYYY-MM-DD"
      />
      {fieldErrors.startDate ? <Text style={styles.fieldError}>{fieldErrors.startDate}</Text> : null}

      <Text style={styles.label}>End date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={state.endDate}
        onChangeText={(v) => update("endDate", v)}
        placeholder="YYYY-MM-DD"
      />
      {fieldErrors.endDate ? <Text style={styles.fieldError}>{fieldErrors.endDate}</Text> : null}

      <Text style={styles.label}>Days per week</Text>
      <TextInput
        style={styles.input}
        value={state.daysPerWeek}
        onChangeText={(v) => update("daysPerWeek", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.daysPerWeek ? <Text style={styles.fieldError}>{fieldErrors.daysPerWeek}</Text> : null}

      <Text style={styles.label}>Level</Text>
      <ToggleRow options={LEVEL_OPTIONS} value={state.level} onChange={(v) => update("level", v)} />
      {fieldErrors.level ? <Text style={styles.fieldError}>{fieldErrors.level}</Text> : null}

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={state.location} onChangeText={(v) => update("location", v)} />
      {fieldErrors.location ? <Text style={styles.fieldError}>{fieldErrors.location}</Text> : null}

      <Text style={styles.label}>Equipment</Text>
      <TextInput style={styles.input} value={state.equipment} onChangeText={(v) => update("equipment", v)} />
      {fieldErrors.equipment ? <Text style={styles.fieldError}>{fieldErrors.equipment}</Text> : null}

      <Text style={styles.label}>Observations</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={state.observations}
        onChangeText={(v) => update("observations", v)}
        multiline
      />
      {fieldErrors.observations ? <Text style={styles.fieldError}>{fieldErrors.observations}</Text> : null}

      {mode === "edit" ? (
        <>
          <Text style={styles.label}>Status</Text>
          <ToggleRow options={STATUS_OPTIONS} value={state.status} onChange={(v) => update("status", v)} />
          {fieldErrors.status ? <Text style={styles.fieldError}>{fieldErrors.status}</Text> : null}
        </>
      ) : null}

      {Object.entries(fieldErrors)
        .filter(([key]) => !RENDERED_FIELD_KEYS.includes(key))
        .map(([key, message]) => (
          <Text key={key} style={styles.fieldError}>
            {message}
          </Text>
        ))}

      <Pressable
        style={[styles.submitButton, submitting ? styles.submitButtonDisabled : null]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>{submitting ? "Saving..." : submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 8 },
  label: { fontSize: 12, textTransform: "uppercase", color: "#888", marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 15 },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  fieldError: { fontSize: 12, color: "red" },
  errorText: { fontSize: 13, color: "red" },
  toggleRow: { flexDirection: "row", gap: 8 },
  toggleOption: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toggleOptionActive: { borderColor: "#0066cc", backgroundColor: "#e6f0fb" },
  toggleLabel: { fontSize: 13, color: "#333" },
  toggleLabelActive: { fontSize: 13, color: "#0066cc", fontWeight: "600" },
  submitButton: {
    backgroundColor: "#0066cc",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

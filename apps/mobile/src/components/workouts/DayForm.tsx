import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { workoutDaySchema } from "@trainflow/shared-types";

export type DayFormValues = {
  name: string;
  focus: string | null;
  estimatedDurationMin: number | null;
  warmup: string | null;
  cooldown: string | null;
  observations: string | null;
};

type FieldState = {
  name: string;
  focus: string;
  estimatedDurationMin: string;
  warmup: string;
  cooldown: string;
  observations: string;
};

const createDaySchema = workoutDaySchema.omit({ id: true, exercises: true });
const updateDaySchema = createDaySchema.partial();

function toFieldState(initial: Partial<DayFormValues> | undefined): FieldState {
  return {
    name: initial?.name ?? "",
    focus: initial?.focus ?? "",
    estimatedDurationMin:
      initial?.estimatedDurationMin != null ? String(initial.estimatedDurationMin) : "",
    warmup: initial?.warmup ?? "",
    cooldown: initial?.cooldown ?? "",
    observations: initial?.observations ?? "",
  };
}

function buildPayload(state: FieldState): DayFormValues {
  return {
    name: state.name,
    focus: state.focus.trim() === "" ? null : state.focus,
    estimatedDurationMin:
      state.estimatedDurationMin.trim() === "" ? null : Number(state.estimatedDurationMin),
    warmup: state.warmup.trim() === "" ? null : state.warmup,
    cooldown: state.cooldown.trim() === "" ? null : state.cooldown,
    observations: state.observations.trim() === "" ? null : state.observations,
  };
}

const RENDERED_FIELD_KEYS = ["name", "focus", "estimatedDurationMin", "warmup", "cooldown", "observations"];

export function DayForm({
  mode,
  initialValues,
  submitLabel,
  onSubmit,
}: {
  mode: "create" | "edit";
  initialValues?: Partial<DayFormValues>;
  submitLabel: string;
  onSubmit: (values: DayFormValues) => Promise<void>;
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
    const result = (mode === "create" ? createDaySchema : updateDaySchema).safeParse(payload);

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

      <Text style={styles.label}>Focus</Text>
      <TextInput style={styles.input} value={state.focus} onChangeText={(v) => update("focus", v)} />
      {fieldErrors.focus ? <Text style={styles.fieldError}>{fieldErrors.focus}</Text> : null}

      <Text style={styles.label}>Estimated duration (minutes)</Text>
      <TextInput
        style={styles.input}
        value={state.estimatedDurationMin}
        onChangeText={(v) => update("estimatedDurationMin", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.estimatedDurationMin ? (
        <Text style={styles.fieldError}>{fieldErrors.estimatedDurationMin}</Text>
      ) : null}

      <Text style={styles.label}>Warmup</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={state.warmup}
        onChangeText={(v) => update("warmup", v)}
        multiline
      />
      {fieldErrors.warmup ? <Text style={styles.fieldError}>{fieldErrors.warmup}</Text> : null}

      <Text style={styles.label}>Cooldown</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={state.cooldown}
        onChangeText={(v) => update("cooldown", v)}
        multiline
      />
      {fieldErrors.cooldown ? <Text style={styles.fieldError}>{fieldErrors.cooldown}</Text> : null}

      <Text style={styles.label}>Observations</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={state.observations}
        onChangeText={(v) => update("observations", v)}
        multiline
      />
      {fieldErrors.observations ? <Text style={styles.fieldError}>{fieldErrors.observations}</Text> : null}

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

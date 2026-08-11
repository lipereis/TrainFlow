import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { EXECUTION_METHODS } from "@trainflow/shared-types";

export type ExerciseFormValues = {
  sets: number;
  repsMin: number;
  repsMax: number;
  weight: number | null;
  weightUnit: "KG" | "LB";
  restSec: number | null;
  method: (typeof EXECUTION_METHODS)[number];
};

type FieldState = {
  sets: string;
  repsMin: string;
  repsMax: string;
  weight: string;
  weightUnit: "KG" | "LB";
  restSec: string;
  method: (typeof EXECUTION_METHODS)[number];
};

function toFieldState(initial: ExerciseFormValues): FieldState {
  return {
    sets: String(initial.sets),
    repsMin: String(initial.repsMin),
    repsMax: String(initial.repsMax),
    weight: initial.weight != null ? String(initial.weight) : "",
    weightUnit: initial.weightUnit,
    restSec: initial.restSec != null ? String(initial.restSec) : "",
    method: initial.method,
  };
}

function buildPayload(state: FieldState) {
  return {
    sets: state.sets.trim() === "" ? NaN : Number(state.sets),
    repsMin: state.repsMin.trim() === "" ? NaN : Number(state.repsMin),
    repsMax: state.repsMax.trim() === "" ? NaN : Number(state.repsMax),
    weight: state.weight.trim() === "" ? null : Number(state.weight),
    weightUnit: state.weightUnit,
    restSec: state.restSec.trim() === "" ? null : Number(state.restSec),
    method: state.method,
  };
}

const WEIGHT_UNIT_OPTIONS: { value: "KG" | "LB"; label: string }[] = [
  { value: "KG", label: "kg" },
  { value: "LB", label: "lb" },
];

const METHOD_OPTIONS: { value: (typeof EXECUTION_METHODS)[number]; label: string }[] =
  EXECUTION_METHODS.map((method) => ({ value: method, label: method }));

function ToggleRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
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

export function ExerciseForm({
  initialValues,
  submitLabel,
  onSubmit,
}: {
  initialValues: ExerciseFormValues;
  submitLabel: string;
  onSubmit: (values: ExerciseFormValues) => Promise<void>;
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
    const errors: Record<string, string> = {};

    if (!Number.isFinite(payload.sets) || payload.sets <= 0) {
      errors.sets = "Sets must be a positive number";
    }
    if (!Number.isFinite(payload.repsMin) || payload.repsMin <= 0) {
      errors.repsMin = "Rep min must be a positive number";
    }
    if (!Number.isFinite(payload.repsMax) || payload.repsMax <= 0) {
      errors.repsMax = "Rep max must be a positive number";
    }
    if (
      Number.isFinite(payload.repsMin) &&
      Number.isFinite(payload.repsMax) &&
      payload.repsMin > payload.repsMax
    ) {
      errors.repsMax = "Rep max must be greater than or equal to rep min";
    }
    if (payload.weight !== null && (!Number.isFinite(payload.weight) || payload.weight < 0)) {
      errors.weight = "Weight must be zero or a positive number";
    }
    if (payload.restSec !== null && (!Number.isFinite(payload.restSec) || payload.restSec < 0)) {
      errors.restSec = "Rest must be zero or a positive number";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await onSubmit(payload as ExerciseFormValues);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <Text style={styles.label}>Sets</Text>
      <TextInput
        style={styles.input}
        value={state.sets}
        onChangeText={(v) => update("sets", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.sets ? <Text style={styles.fieldError}>{fieldErrors.sets}</Text> : null}

      <Text style={styles.label}>Rep min</Text>
      <TextInput
        style={styles.input}
        value={state.repsMin}
        onChangeText={(v) => update("repsMin", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.repsMin ? <Text style={styles.fieldError}>{fieldErrors.repsMin}</Text> : null}

      <Text style={styles.label}>Rep max</Text>
      <TextInput
        style={styles.input}
        value={state.repsMax}
        onChangeText={(v) => update("repsMax", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.repsMax ? <Text style={styles.fieldError}>{fieldErrors.repsMax}</Text> : null}

      <Text style={styles.label}>Weight</Text>
      <TextInput
        style={styles.input}
        value={state.weight}
        onChangeText={(v) => update("weight", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.weight ? <Text style={styles.fieldError}>{fieldErrors.weight}</Text> : null}

      <Text style={styles.label}>Weight unit</Text>
      <ToggleRow
        options={WEIGHT_UNIT_OPTIONS}
        value={state.weightUnit}
        onChange={(v) => update("weightUnit", v)}
      />

      <Text style={styles.label}>Rest (seconds)</Text>
      <TextInput
        style={styles.input}
        value={state.restSec}
        onChangeText={(v) => update("restSec", v)}
        keyboardType="number-pad"
      />
      {fieldErrors.restSec ? <Text style={styles.fieldError}>{fieldErrors.restSec}</Text> : null}

      <Text style={styles.label}>Method</Text>
      <ToggleRow options={METHOD_OPTIONS} value={state.method} onChange={(v) => update("method", v)} />

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
  fieldError: { fontSize: 12, color: "red" },
  errorText: { fontSize: 13, color: "red" },
  toggleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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

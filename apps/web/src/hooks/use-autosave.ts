"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

type UseAutosaveOptions<T> = {
  save: (payload: T) => Promise<void>;
  delayMs?: number;
  /** Dedupes pending payloads so concurrent field edits are not dropped. */
  keyFor?: (payload: T) => string;
  /** Merge a new payload into an existing pending one for the same key. */
  merge?: (existing: T, incoming: T) => T;
};

export function useAutosave<T>({
  save,
  delayMs = 600,
  keyFor,
  merge,
}: UseAutosaveOptions<T>) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(new Map<string, T>());
  const saveRef = useRef(save);
  const keyForRef = useRef(keyFor);
  const mergeRef = useRef(merge);
  const seqRef = useRef(0);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    keyForRef.current = keyFor;
  }, [keyFor]);

  useEffect(() => {
    mergeRef.current = merge;
  }, [merge]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const payloads = [...pendingRef.current.values()];
    pendingRef.current.clear();
    if (payloads.length === 0) return;

    const seq = ++seqRef.current;
    setStatus("saving");
    try {
      for (const payload of payloads) {
        await saveRef.current(payload);
      }
      if (seq === seqRef.current) setStatus("saved");
    } catch {
      if (seq === seqRef.current) setStatus("error");
    }
  }, []);

  const schedule = useCallback(
    (payload: T) => {
      const key = keyForRef.current?.(payload) ?? "__default__";
      const existing = pendingRef.current.get(key);
      const next =
        existing && mergeRef.current
          ? mergeRef.current(existing, payload)
          : payload;
      pendingRef.current.set(key, next);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush();
      }, delayMs);
    },
    [delayMs, flush],
  );

  return { status, schedule, flush };
}

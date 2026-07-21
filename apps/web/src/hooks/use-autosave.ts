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
  const mountedRef = useRef(true);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    keyForRef.current = keyFor;
  }, [keyFor]);

  useEffect(() => {
    mergeRef.current = merge;
  }, [merge]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const entries = [...pendingRef.current.entries()];
    pendingRef.current.clear();
    if (entries.length === 0) return;

    const seq = ++seqRef.current;
    if (mountedRef.current) setStatus("saving");
    try {
      for (const [, payload] of entries) {
        await saveRef.current(payload);
      }
      if (mountedRef.current && seq === seqRef.current) setStatus("saved");
    } catch {
      // Re-queue failed payloads; merge with anything scheduled during the attempt.
      for (const [key, payload] of entries) {
        const existing = pendingRef.current.get(key);
        if (existing && mergeRef.current) {
          pendingRef.current.set(key, mergeRef.current(payload, existing));
        } else if (!existing) {
          pendingRef.current.set(key, payload);
        }
      }
      if (mountedRef.current && seq === seqRef.current) setStatus("error");
    }
  }, []);

  const cancel = useCallback((keys?: string[]) => {
    if (!keys) {
      pendingRef.current.clear();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    for (const key of keys) {
      pendingRef.current.delete(key);
    }
    if (pendingRef.current.size === 0 && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Best-effort: cancel debounce and flush pending saves on leave.
      void flush();
    };
  }, [flush]);

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

  const retry = useCallback(() => {
    void flush();
  }, [flush]);

  return { status, schedule, flush, cancel, retry };
}

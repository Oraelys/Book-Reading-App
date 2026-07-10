// hooks/useAutosave.ts
import { useEffect, useRef, useState, useCallback } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Debounces `value` and calls `onSave(value)` once it stops changing for
 * `delay` ms. Comparison is by JSON serialization so it works for plain
 * objects/strings alike. Call `flush()` to force an immediate save
 * (e.g. before navigating away or switching chapters).
 */
export function useAutosave<T>(
  value: T,
  onSave: (value: T) => Promise<void>,
  delay = 1500,
) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedSnapshotRef = useRef<string>(JSON.stringify(value));
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const doSave = useCallback(async (nextValue: T, snapshot: string) => {
    setStatus('saving');
    try {
      await onSaveRef.current(nextValue);
      savedSnapshotRef.current = snapshot;
      setStatus('saved');
    } catch (e) {
      console.warn('[useAutosave] save failed:', e);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const snapshot = JSON.stringify(value);
    if (snapshot === savedSnapshotRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      doSave(value, snapshot);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  const flush = useCallback(async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const snapshot = JSON.stringify(value);
    if (snapshot === savedSnapshotRef.current) return;
    await doSave(value, snapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, doSave]);

  return { status, flush };
}
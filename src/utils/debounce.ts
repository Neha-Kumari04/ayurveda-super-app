import { useCallback, useEffect, useRef, useState } from 'react';

export type DebouncedFn<T extends (...args: never[]) => void> = T & { cancel: () => void };

/** Wraps a function so calls coalesce until `delayMs` of quiet. */
export function debounce<T extends (...args: never[]) => void>(fn: T, delayMs: number): DebouncedFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delayMs);
  }) as DebouncedFn<T>;

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return debounced;
}

/** Debounced value hook — the workhorse for search inputs over big lists. */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/** Stable debounced callback whose identity never changes between renders. */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
  fn: T,
  delayMs = 300,
): DebouncedFn<T> {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current(...args);
      }, delayMs);
    },
    [delayMs],
  ) as DebouncedFn<T>;

  debounced.cancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => () => debounced.cancel(), [debounced]);

  return debounced;
}

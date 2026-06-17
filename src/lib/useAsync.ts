"use client";

import * as React from "react";

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

/**
 * Fetch-on-mount helper with loading/error/refetch. Used by feature hooks for
 * read queries (the per-feature `api.ts` holds the calls).
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;
  const [state, setState] = React.useState<AsyncState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });

  // Keep the latest fn without retriggering on identity change.
  const fnRef = React.useRef(fn);
  fnRef.current = fn;

  const run = React.useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  React.useEffect(() => {
    if (enabled) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, enabled]);

  return { ...state, refetch: run, setData: (d: T) => setState((s) => ({ ...s, data: d })) };
}

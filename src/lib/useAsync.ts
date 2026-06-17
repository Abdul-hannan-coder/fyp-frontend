"use client";

import * as React from "react";
import { readCache, writeCache, subscribe } from "@/lib/cache";

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

/**
 * Fetch-on-mount helper with loading/error/refetch. Used by feature hooks for
 * read queries (the per-feature `api.ts` holds the calls).
 *
 * Pass `options.key` to make the query cache-backed:
 *  - renders cached data instantly (no skeleton) while it revalidates in the
 *    background, so navigating around the app feels fast;
 *  - re-runs automatically when `invalidate()` / `invalidateFeature()` is called
 *    for that key (or a parent key), so an action in one feature reloads every
 *    connected screen.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: { enabled?: boolean; key?: string } = {},
) {
  const { enabled = true, key } = options;
  const cached = key ? readCache<T>(key) : undefined;

  const [state, setState] = React.useState<AsyncState<T>>({
    data: cached ?? null,
    loading: enabled && cached === undefined,
    error: null,
  });

  // Keep the latest fn without retriggering on identity change.
  const fnRef = React.useRef(fn);
  fnRef.current = fn;

  const run = React.useCallback(async () => {
    // Keep showing cached data while we revalidate (only show the skeleton when
    // we have nothing yet).
    setState((s) => ({ ...s, loading: s.data == null, error: null }));
    try {
      const data = await fnRef.current();
      if (key) writeCache(key, data);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      setState((s) => ({ data: s.data, loading: false, error: (err as Error).message }));
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  React.useEffect(() => {
    if (enabled) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, enabled]);

  // Revalidate when this key (or a parent) is invalidated by an action.
  React.useEffect(() => {
    if (!key || !enabled) return;
    return subscribe(key, () => { run(); });
  }, [key, enabled, run]);

  return { ...state, refetch: run, setData: (d: T) => setState((s) => ({ ...s, data: d })) };
}

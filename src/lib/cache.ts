"use client";

// ──────────────────────────────────────────────────────────────────────────
// Tiny global client cache + cross-feature invalidation.
//
// Model the user asked for: every feature reads through a cache key. When an
// action (create/update/delete) happens, we "deload" the related keys so every
// mounted screen bound to them refetches automatically.
//
//   key convention:  "<feature>"            → a list/collection
//                    "<feature>:<id>"       → a single detail record
//   invalidate("allocations") also revalidates "allocations:<id>" (prefix match)
// ──────────────────────────────────────────────────────────────────────────

type Entry = { data: unknown; ts: number };

const store = new Map<string, Entry>();
const subscribers = new Map<string, Set<() => void>>();

export function readCache<T>(key: string): T | undefined {
  return store.get(key)?.data as T | undefined;
}

export function writeCache(key: string, data: unknown): void {
  store.set(key, { data, ts: Date.now() });
}

export function subscribe(key: string, revalidate: () => void): () => void {
  let set = subscribers.get(key);
  if (!set) {
    set = new Set();
    subscribers.set(key, set);
  }
  set.add(revalidate);
  return () => {
    set!.delete(revalidate);
    if (set!.size === 0) subscribers.delete(key);
  };
}

// Drop cached data for the given keys and tell every mounted subscriber whose
// key matches (exact, or "<key>:..." for details) to refetch.
export function invalidate(...keys: string[]): void {
  for (const key of keys) {
    for (const [subKey, fns] of subscribers) {
      if (subKey === key || subKey.startsWith(`${key}:`)) {
        store.delete(subKey);
        fns.forEach((fn) => fn());
      }
    }
    // also clear cached entries with no live subscriber
    for (const storeKey of store.keys()) {
      if (storeKey === key || storeKey.startsWith(`${key}:`)) store.delete(storeKey);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Cross-feature graph: performing an action in one feature reloads the data of
// every connected feature. e.g. approving an allocation changes the room's
// occupancy and raises a payment, so "allocations", "rooms" and "fees" all
// need fresh data.
// ──────────────────────────────────────────────────────────────────────────

export const RELATED: Record<string, string[]> = {
  users: ["users", "students", "staff", "reports"],
  students: ["students", "users", "allocations", "reports"],
  staff: ["staff", "users"],
  rooms: ["rooms", "roomTypes", "packages", "allocations", "transfers", "public", "reports"],
  roomTypes: ["roomTypes", "rooms", "packages", "public"],
  amenities: ["amenities", "rooms", "roomTypes", "packages"],
  packages: ["packages", "rooms", "public"],
  allocations: ["allocations", "rooms", "students", "fees", "transfers", "reports"],
  transfers: ["transfers", "allocations", "rooms", "students", "reports"],
  fees: ["fees", "students", "reports"],
  refunds: ["refunds", "fees", "students", "reports"],
  mess: ["mess", "students", "reports"],
  attendance: ["attendance", "students", "reports"],
  visitors: ["visitors", "students", "reports"],
  support: ["support", "students", "reports"],
  announcements: ["announcements"],
  assets: ["assets", "rooms", "reports"],
  reports: ["reports"],
};

// Invalidate a feature and everything connected to it.
export function invalidateFeature(feature: string): void {
  invalidate(...(RELATED[feature] ?? [feature]));
}

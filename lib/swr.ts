import type { SWRConfiguration } from "swr"

/** Shared fetcher that throws on non-2xx so SWR surfaces a real error state. */
export async function fetcher<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Request failed (${r.status})`)
  return r.json() as Promise<T>
}

// Sensible defaults: don't refetch on every window focus, dedupe identical
// requests within 60s (so navigating back to a list doesn't re-hit the API),
// and retry a couple times on transient errors.
export const swrDefaults: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  dedupingInterval: 60_000,
  errorRetryCount: 2,
}

import type { SupabaseClient } from "@supabase/supabase-js"

export function mountLadder(
  root: HTMLElement,
  opts: { supabase: SupabaseClient; user: { id: string; email: string | null } },
): () => void

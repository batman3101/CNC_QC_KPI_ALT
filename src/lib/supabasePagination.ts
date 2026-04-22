/**
 * Supabase pagination helper.
 *
 * Supabase caps single `.select()` responses at 1000 rows by default. For
 * "fetch everything" queries (master data lookups, analytics aggregation)
 * that silently truncates results and breaks UUID→name lookups, counts, and
 * rate calculations.
 *
 * Pass a builder that applies `.range(from, to)` to produce the next chunk;
 * `paginatedFetch` walks the ranges until the last short page.
 *
 * @example
 *   const machines = await paginatedFetch<Machine>((from, to) =>
 *     supabase.from('machines').select('*').eq('status', 'active').range(from, to)
 *   )
 */
import type { PostgrestError } from '@supabase/supabase-js'

export const DEFAULT_PAGE_SIZE = 1000

type SupabaseResponse<T> = { data: T[] | null; error: PostgrestError | null }

export async function paginatedFetch<T>(
  build: (from: number, to: number) => PromiseLike<SupabaseResponse<T>>,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const allRows: T[] = []
  let from = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await build(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows.push(...data)
    hasMore = data.length === pageSize
    from += pageSize
  }

  return allRows
}

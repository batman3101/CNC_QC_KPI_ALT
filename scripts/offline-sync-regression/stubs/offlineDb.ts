// In-memory stand-in for the Dexie table - only what offlineSyncService calls.
/* eslint-disable @typescript-eslint/no-explicit-any */
export const rows = new Map<string, any>()

function query(match: (r: any) => boolean) {
  let extra: (r: any) => boolean = () => true
  const q = {
    filter(fn: (r: any) => boolean) { extra = fn; return q },
    async toArray() { return [...rows.values()].filter(r => match(r) && extra(r)).map(r => ({ ...r })) },
    async count() { return (await q.toArray()).length },
  }
  return q
}

const table = {
  where(field: string) {
    return {
      anyOf: (vals: string[]) => query(r => vals.includes(r[field])),
      equals: (val: string) => query(r => r[field] === val),
    }
  },
  async add(r: any) { rows.set(r.id, { ...r }) },
  async get(id: string) { const r = rows.get(id); return r ? { ...r } : undefined },
  async update(id: string, changes: any) { const r = rows.get(id); if (r) Object.assign(r, changes) },
  async bulkUpdate(list: { key: string; changes: any }[]) { for (const u of list) await table.update(u.key, u.changes) },
  async bulkDelete(ids: string[]) { for (const id of ids) rows.delete(id) },
}

export const offlineDb = { offlineInspections: table, transaction: async () => {} }
export function generateOfflineId() { return `offline_${Date.now()}_${Math.random().toString(36).slice(2, 11)}` }
export async function cleanupSyncedInspections() { return 0 }
export type OfflineInspection = any

// Controllable stand-in for the Supabase-backed service: a scenario can hold a
// call open (to overlap two syncs) or make it fail.
export const submitted: string[] = []
export const gates = new Map<string, { promise: Promise<void>; release: () => void; fail?: boolean }>()

export function gate(clientRef: string, fail = false) {
  let release!: () => void
  const promise = new Promise<void>((res) => { release = res })
  gates.set(clientRef, { promise, release, fail })
}

export async function submitInspectionRecord(data: { clientRef: string }): Promise<string> {
  const g = gates.get(data.clientRef)
  if (g) await g.promise
  submitted.push(data.clientRef)
  if (g?.fail) throw new Error(`simulated failure for ${data.clientRef}`)
  return `server-${data.clientRef}`
}

export async function uploadDefectPhoto(): Promise<string> { return 'https://example/photo.jpg' }

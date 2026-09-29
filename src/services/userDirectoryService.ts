import { supabase } from '@/lib/supabase'

export interface DirectoryUser {
  id: string
  name: string
  role: 'admin' | 'manager' | 'inspector'
  factory_id: string | null
  // Deactivated users stay in the directory so old inspections keep their
  // inspector's name; pickers leave them out. Absent in copies cached offline
  // before this field existed, which reads as active.
  deactivated_at?: string | null
}

export async function getUserDirectory(): Promise<DirectoryUser[]> {
  const { data, error } = await supabase.rpc('get_user_directory')
  if (error) throw error
  return data ?? []
}

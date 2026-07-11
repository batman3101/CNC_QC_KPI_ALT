import { supabase } from '@/lib/supabase'

export interface DirectoryUser {
  id: string
  name: string
  role: 'admin' | 'manager' | 'inspector'
  factory_id: string | null
}

export async function getUserDirectory(): Promise<DirectoryUser[]> {
  const { data, error } = await supabase.rpc('get_user_directory')
  if (error) throw error
  return data ?? []
}

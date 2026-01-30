export type FactoryCode = 'ALT' | 'ALV'

export interface Factory {
  id: string
  name: string
  name_vi: string | null
  code: string
  is_active: boolean
  created_at: string
}

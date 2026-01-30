export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      defect_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          description_vi: string | null
          id: string
          is_active: boolean
          name: string
          name_vi: string | null
          severity: 'low' | 'medium' | 'high'
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          description_vi?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_vi?: string | null
          severity?: 'low' | 'medium' | 'high'
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          description_vi?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_vi?: string | null
          severity?: 'low' | 'medium' | 'high'
        }
        Relationships: []
      }
      factories: {
        Row: {
          id: string
          name: string
          name_vi: string | null
          code: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          name_vi?: string | null
          code: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_vi?: string | null
          code?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      defects: {
        Row: {
          created_at: string
          defect_type: string
          description: string
          factory_id: string | null
          id: string
          inspection_id: string
          model_id: string
          photo_url: string | null
          status: 'pending' | 'in_progress' | 'resolved'
        }
        Insert: {
          created_at?: string
          defect_type: string
          description: string
          factory_id?: string | null
          id?: string
          inspection_id: string
          model_id: string
          photo_url?: string | null
          status?: 'pending' | 'in_progress' | 'resolved'
        }
        Update: {
          created_at?: string
          defect_type?: string
          description?: string
          factory_id?: string | null
          id?: string
          inspection_id?: string
          model_id?: string
          photo_url?: string | null
          status?: 'pending' | 'in_progress' | 'resolved'
        }
        Relationships: []
      }
      inspection_items: {
        Row: {
          created_at: string
          data_type: 'numeric' | 'ok_ng'
          id: string
          model_id: string
          name: string
          process_id: string | null
          standard_value: number
          tolerance_max: number
          tolerance_min: number
          unit: string
        }
        Insert: {
          created_at?: string
          data_type?: 'numeric' | 'ok_ng'
          id?: string
          model_id: string
          name: string
          process_id?: string | null
          standard_value: number
          tolerance_max: number
          tolerance_min: number
          unit: string
        }
        Update: {
          created_at?: string
          data_type?: 'numeric' | 'ok_ng'
          id?: string
          model_id?: string
          name?: string
          process_id?: string | null
          standard_value?: number
          tolerance_max?: number
          tolerance_min?: number
          unit?: string
        }
        Relationships: []
      }
      inspection_processes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          description_vi: string | null
          id: string
          is_active: boolean
          name: string
          name_vi: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          description_vi?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_vi?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          description_vi?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_vi?: string | null
        }
        Relationships: []
      }
      inspection_results: {
        Row: {
          created_at: string
          id: string
          inspection_id: string
          item_id: string
          measured_value: number
          result: 'pass' | 'fail'
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_id: string
          item_id: string
          measured_value: number
          result: 'pass' | 'fail'
        }
        Update: {
          created_at?: string
          id?: string
          inspection_id?: string
          item_id?: string
          measured_value?: number
          result?: 'pass' | 'fail'
        }
        Relationships: []
      }
      inspections: {
        Row: {
          created_at: string
          defect_quantity: number
          defect_type: string | null
          factory_id: string | null
          id: string
          inspection_process: string
          inspection_quantity: number
          machine_id: string | null
          model_id: string
          photo_url: string | null
          status: 'pass' | 'fail' | 'pending'
          user_id: string
        }
        Insert: {
          created_at?: string
          defect_quantity?: number
          defect_type?: string | null
          factory_id?: string | null
          id?: string
          inspection_process: string
          inspection_quantity?: number
          machine_id?: string | null
          model_id: string
          photo_url?: string | null
          status?: 'pass' | 'fail' | 'pending'
          user_id: string
        }
        Update: {
          created_at?: string
          defect_quantity?: number
          defect_type?: string | null
          factory_id?: string | null
          id?: string
          inspection_process?: string
          inspection_quantity?: number
          machine_id?: string | null
          model_id?: string
          photo_url?: string | null
          status?: 'pass' | 'fail' | 'pending'
          user_id?: string
        }
        Relationships: []
      }
      machines: {
        Row: {
          created_at: string
          factory_id: string | null
          id: string
          model: string
          name: string
          status: 'active' | 'inactive' | 'maintenance'
        }
        Insert: {
          created_at?: string
          factory_id?: string | null
          id?: string
          model: string
          name: string
          status?: 'active' | 'inactive' | 'maintenance'
        }
        Update: {
          created_at?: string
          factory_id?: string | null
          id?: string
          model?: string
          name?: string
          status?: 'active' | 'inactive' | 'maintenance'
        }
        Relationships: []
      }
      product_models: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          factory_id: string | null
          id: string
          name: string
          role: 'admin' | 'manager' | 'inspector'
        }
        Insert: {
          created_at?: string
          email: string
          factory_id?: string | null
          id?: string
          name: string
          role?: 'admin' | 'manager' | 'inspector'
        }
        Update: {
          created_at?: string
          email?: string
          factory_id?: string | null
          id?: string
          name?: string
          role?: 'admin' | 'manager' | 'inspector'
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

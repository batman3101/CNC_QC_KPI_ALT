export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'manager' | 'inspector'
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'admin' | 'manager' | 'inspector'
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'manager' | 'inspector'
          name?: string
          created_at?: string
        }
      }
      machines: {
        Row: {
          id: string
          name: string
          model: string
          status: 'active' | 'inactive' | 'maintenance'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          model: string
          status?: 'active' | 'inactive' | 'maintenance'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          model?: string
          status?: 'active' | 'inactive' | 'maintenance'
          created_at?: string
        }
      }
      product_models: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          created_at?: string
        }
      }
      inspection_processes: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      defect_types: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          severity: 'low' | 'medium' | 'high'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          severity?: 'low' | 'medium' | 'high'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          severity?: 'low' | 'medium' | 'high'
          is_active?: boolean
          created_at?: string
        }
      }
      inspection_items: {
        Row: {
          id: string
          model_id: string
          name: string
          standard_value: number
          tolerance_min: number
          tolerance_max: number
          unit: string
          data_type: 'numeric' | 'ok_ng'
          created_at: string
        }
        Insert: {
          id?: string
          model_id: string
          name: string
          standard_value: number
          tolerance_min: number
          tolerance_max: number
          unit: string
          data_type?: 'numeric' | 'ok_ng'
          created_at?: string
        }
        Update: {
          id?: string
          model_id?: string
          name?: string
          standard_value?: number
          tolerance_min?: number
          tolerance_max?: number
          unit?: string
          data_type?: 'numeric' | 'ok_ng'
          created_at?: string
        }
      }
      inspections: {
        Row: {
          id: string
          user_id: string
          machine_id: string | null
          model_id: string
          inspection_process: 'IQC' | 'PQC' | 'OQC' | 'H/G' | 'MMS' | 'CNC-OQC' | 'POSITION' | '외관' | 'TRI'
          defect_type: string | null
          inspection_quantity: number
          defect_quantity: number
          photo_url: string | null
          status: 'pass' | 'fail' | 'pending'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          machine_id?: string | null
          model_id: string
          inspection_process: 'IQC' | 'PQC' | 'OQC' | 'H/G' | 'MMS' | 'CNC-OQC' | 'POSITION' | '외관' | 'TRI'
          defect_type?: string | null
          inspection_quantity: number
          defect_quantity: number
          photo_url?: string | null
          status?: 'pass' | 'fail' | 'pending'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          machine_id?: string | null
          model_id?: string
          inspection_process?: 'IQC' | 'PQC' | 'OQC' | 'H/G' | 'MMS' | 'CNC-OQC' | 'POSITION' | '외관' | 'TRI'
          defect_type?: string | null
          inspection_quantity?: number
          defect_quantity?: number
          photo_url?: string | null
          status?: 'pass' | 'fail' | 'pending'
          created_at?: string
        }
      }
      inspection_results: {
        Row: {
          id: string
          inspection_id: string
          item_id: string
          measured_value: number
          result: 'pass' | 'fail'
          created_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          item_id: string
          measured_value: number
          result: 'pass' | 'fail'
          created_at?: string
        }
        Update: {
          id?: string
          inspection_id?: string
          item_id?: string
          measured_value?: number
          result?: 'pass' | 'fail'
          created_at?: string
        }
      }
      defects: {
        Row: {
          id: string
          inspection_id: string
          defect_type: string
          description: string
          photo_url: string | null
          status: 'pending' | 'in_progress' | 'resolved'
          created_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          defect_type: string
          description: string
          photo_url?: string | null
          status?: 'pending' | 'in_progress' | 'resolved'
          created_at?: string
        }
        Update: {
          id?: string
          inspection_id?: string
          defect_type?: string
          description?: string
          photo_url?: string | null
          status?: 'pending' | 'in_progress' | 'resolved'
          created_at?: string
        }
      }
    }
  }
}

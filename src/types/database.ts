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
      app_features: {
        Row: {
          key: string
          label_key: string
          route: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          key: string
          label_key: string
          route: string
          sort_order: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          key?: string
          label_key?: string
          route?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      role_feature_permissions: {
        Row: {
          factory_id: string
          role: 'admin' | 'manager' | 'inspector'
          feature_key: string
          allowed: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          factory_id: string
          role: 'admin' | 'manager' | 'inspector'
          feature_key: string
          allowed?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          factory_id?: string
          role?: 'admin' | 'manager' | 'inspector'
          feature_key?: string
          allowed?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      permission_audit: {
        Row: {
          id: number
          factory_id: string
          role: 'admin' | 'manager' | 'inspector'
          feature_key: string
          old_allowed: boolean | null
          new_allowed: boolean
          changed_by: string
          changed_at: string
        }
        Insert: {
          id?: number
          factory_id: string
          role: 'admin' | 'manager' | 'inspector'
          feature_key: string
          old_allowed?: boolean | null
          new_allowed: boolean
          changed_by: string
          changed_at?: string
        }
        Update: {
          id?: number
          factory_id?: string
          role?: 'admin' | 'manager' | 'inspector'
          feature_key?: string
          old_allowed?: boolean | null
          new_allowed?: boolean
          changed_by?: string
          changed_at?: string
        }
        Relationships: []
      }
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
          machining_process: string | null
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
          machining_process?: string | null
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
          machining_process?: string | null
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
      spc_alerts: {
        Row: {
          id: string
          model_id: string
          item_id: string | null
          alert_type: string
          rule_code: string | null
          rule_description: string | null
          measured_value: number | null
          control_limit_value: number | null
          severity: string
          status: string
          factory_id: string | null
          acknowledged_by: string | null
          acknowledged_at: string | null
          resolved_by: string | null
          resolved_at: string | null
          resolution_note: string | null
          root_cause: string | null
          corrective_action: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          model_id: string
          item_id?: string | null
          alert_type: string
          rule_code?: string | null
          rule_description?: string | null
          measured_value?: number | null
          control_limit_value?: number | null
          severity?: string
          status?: string
          factory_id?: string | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_note?: string | null
          root_cause?: string | null
          corrective_action?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          model_id?: string
          item_id?: string | null
          alert_type?: string
          rule_code?: string | null
          rule_description?: string | null
          measured_value?: number | null
          control_limit_value?: number | null
          severity?: string
          status?: string
          factory_id?: string | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_note?: string | null
          root_cause?: string | null
          corrective_action?: string | null
          created_at?: string
          updated_at?: string | null
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
      get_my_permissions: {
        Args: Record<PropertyKey, never>
        Returns: { feature_key: string }[]
      }
      get_user_directory: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          role: 'admin' | 'manager' | 'inspector'
          factory_id: string | null
        }[]
      }
      get_public_monitor_data: {
        Args: {
          p_factory_id: string
          p_start_at: string
          p_end_at: string
        }
        Returns: Json
      }
      get_role_permissions: {
        Args: { p_factory_id: string }
        Returns: {
          factory_id: string
          role: 'admin' | 'manager' | 'inspector'
          feature_key: string
          allowed: boolean
          updated_at: string | null
          updated_by: string | null
        }[]
      }
      set_role_permissions: {
        Args: { p_factory_id: string; p_changes: Json }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

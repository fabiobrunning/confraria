export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      companies: {
        Row: {
          address: string | null
          address_cep: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          city: string | null
          cnpj: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          instagram: string | null
          name: string
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      consortium_groups: {
        Row: {
          asset_value: number
          created_at: string
          description: string
          id: string
          monthly_value: number
          total_quotas: number
          updated_at: string
        }
        Insert: {
          asset_value: number
          created_at?: string
          description: string
          id?: string
          monthly_value: number
          total_quotas: number
          updated_at?: string
        }
        Update: {
          asset_value?: number
          created_at?: string
          description?: string
          id?: string
          monthly_value?: number
          total_quotas?: number
          updated_at?: string
        }
        Relationships: []
      }
      draws: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          draw_date: string | null
          drawn_numbers: Json
          group_id: string
          id: string
          updated_at: string | null
          winner_position: number
          winning_number: number
          winning_quota_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          draw_date?: string | null
          drawn_numbers?: Json
          group_id: string
          id?: string
          updated_at?: string | null
          winner_position: number
          winning_number: number
          winning_quota_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          draw_date?: string | null
          drawn_numbers?: Json
          group_id?: string
          id?: string
          updated_at?: string | null
          winner_position?: number
          winning_number?: number
          winning_quota_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draws_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_winning_quota_id_fkey"
            columns: ["winning_quota_id"]
            isOneToOne: false
            referencedRelation: "quotas"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          adjustment_type: Database["public"]["Enums"]["adjustment_type"] | null
          adjustment_value: number | null
          admin_id: string | null
          asset_value: number
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          monthly_value: number
          name: string
          total_quotas: number
          updated_at: string
        }
        Insert: {
          adjustment_type?:
            | Database["public"]["Enums"]["adjustment_type"]
            | null
          adjustment_value?: number | null
          admin_id?: string | null
          asset_value?: number
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_value?: number
          name: string
          total_quotas?: number
          updated_at?: string
        }
        Update: {
          adjustment_type?:
            | Database["public"]["Enums"]["adjustment_type"]
            | null
          adjustment_value?: number | null
          admin_id?: string | null
          asset_value?: number
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_value?: number
          name?: string
          total_quotas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      member_companies: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          member_id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          member_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          member_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_companies_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string
          group_id: string
          id: string
          joined_at: string
          phone: string
          pre_registered: boolean
          profile_id: string | null
          registration_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          group_id: string
          id?: string
          joined_at?: string
          phone: string
          pre_registered?: boolean
          profile_id?: string | null
          registration_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          group_id?: string
          id?: string
          joined_at?: string
          phone?: string
          pre_registered?: boolean
          profile_id?: string | null
          registration_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_cep: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          created_at: string
          full_name: string
          id: string
          instagram: string | null
          phone: string
          pre_registered: boolean
          role: string
          updated_at: string
        }
        Insert: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          created_at?: string
          full_name?: string
          id: string
          instagram?: string | null
          phone: string
          pre_registered?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          created_at?: string
          full_name?: string
          id?: string
          instagram?: string | null
          phone?: string
          pre_registered?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          business_sector: string
          company_name: string
          contacted_at: string | null
          contacted_by: string | null
          converted_at: string | null
          created_at: string
          email: string
          full_name: string
          has_networking_experience: boolean
          how_found_us: string
          id: string
          networking_experience: string | null
          notes: string | null
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          business_sector: string
          company_name: string
          contacted_at?: string | null
          contacted_by?: string | null
          converted_at?: string | null
          created_at?: string
          email: string
          full_name: string
          has_networking_experience?: boolean
          how_found_us: string
          id?: string
          networking_experience?: string | null
          notes?: string | null
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_sector?: string
          company_name?: string
          contacted_at?: string | null
          contacted_by?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string
          full_name?: string
          has_networking_experience?: boolean
          how_found_us?: string
          id?: string
          networking_experience?: string | null
          notes?: string | null
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotas: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          member_id: string | null
          quota_number: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          member_id?: string | null
          quota_number: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          member_id?: string | null
          quota_number?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotas_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotas_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      adjustment_type: "monthly" | "annual" | "none"
      quota_status: "active" | "contemplated"
      user_role: "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      adjustment_type: ["monthly", "annual", "none"],
      quota_status: ["active", "contemplated"],
      user_role: ["admin", "member"],
    },
  },
} as const

// Convenience types for common tables
export type Prospect = Tables<'prospects'>
export type ProspectInsert = TablesInsert<'prospects'>
export type ProspectUpdate = TablesUpdate<'prospects'>

export type PreRegistrationAttempt = Tables<'pre_registration_attempts'>
export type PreRegistrationAttemptInsert = TablesInsert<'pre_registration_attempts'>
export type PreRegistrationAttemptUpdate = TablesUpdate<'pre_registration_attempts'>

export type ProspectStatus = 'new' | 'contacted' | 'in_progress' | 'converted' | 'rejected'

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
  public: {
    Tables: {
      business_transactions: {
        Row: {
          id: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          member_from_id: string
          member_to_id: string | null
          amount: number
          description: string
          transaction_date: string
          consortium_group_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          member_from_id: string
          member_to_id?: string | null
          amount: number
          description: string
          transaction_date?: string
          consortium_group_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          member_from_id?: string
          member_to_id?: string | null
          amount?: number
          description?: string
          transaction_date?: string
          consortium_group_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_transactions_member_from_id_fkey"
            columns: ["member_from_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_transactions_member_to_id_fkey"
            columns: ["member_to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_transactions_consortium_group_id_fkey"
            columns: ["consortium_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address_cep: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          cnpj: string | null
          created_at: string
          description: string | null
          id: string
          instagram: string | null
          name: string
          phone: string | null
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
          cnpj?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          name: string
          phone?: string | null
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
          cnpj?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          name?: string
          phone?: string | null
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
      member_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          member_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          member_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          member_id?: string
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
          role: Database["public"]["Enums"]["user_role"]
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
          full_name: string
          id: string
          instagram?: string | null
          phone: string
          pre_registered?: boolean
          role?: Database["public"]["Enums"]["user_role"]
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
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      quotas: {
        Row: {
          created_at: string
          group_id: string
          id: string
          member_id: string
          quota_number: number
          status: Database["public"]["Enums"]["quota_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          member_id: string
          quota_number: number
          status?: Database["public"]["Enums"]["quota_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          member_id?: string
          quota_number?: number
          status?: Database["public"]["Enums"]["quota_status"]
          updated_at?: string
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
      draws: {
        Row: {
          id: string
          group_id: string
          winning_quota_id: string | null
          winning_number: number
          drawn_numbers: number[]
          winner_position: number
          draw_date: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          winning_quota_id?: string | null
          winning_number: number
          drawn_numbers: number[]
          winner_position: number
          draw_date?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          winning_quota_id?: string | null
          winning_number?: number
          drawn_numbers?: number[]
          winner_position?: number
          draw_date?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
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
          id: string
          name: string
          description: string | null
          asset_value: number
          total_quotas: number
          monthly_value: number
          adjustment_type: 'monthly' | 'annual' | 'none' | null
          adjustment_value: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          asset_value: number
          total_quotas: number
          monthly_value: number
          adjustment_type?: 'monthly' | 'annual' | 'none' | null
          adjustment_value?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          asset_value?: number
          total_quotas?: number
          monthly_value?: number
          adjustment_type?: 'monthly' | 'annual' | 'none' | null
          adjustment_value?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      quota_status: "active" | "contemplated"
      transaction_type: "direct_business" | "referral" | "consortium"
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
  public: {
    Enums: {
      quota_status: ["active", "contemplated"],
      transaction_type: ["direct_business", "referral", "consortium"],
      user_role: ["admin", "member"],
    },
  },
} as const

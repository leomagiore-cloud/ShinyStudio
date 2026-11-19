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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          notes: string | null
          service_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          title: string
          updated_at: string
          vehicle_id: string | null
          studio_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          notes?: string | null
          service_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title: string
          updated_at?: string
          vehicle_id?: string | null
          studio_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          notes?: string | null
          service_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title?: string
          updated_at?: string
          vehicle_id?: string | null
          studio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          whatsapp: string | null
          studio_id: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
          studio_id?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
          studio_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          studio_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          studio_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          studio_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_catalog: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
          studio_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
          studio_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
          studio_id?: string | null
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          amount: number
          appointment_id: string | null
          checklist: Json | null
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          installments: number
          notes: string | null
          order_number: number
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          service_id: string | null
          service_name: string
          started_at: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          vehicle_id: string | null
          studio_id: string | null
        }
        Insert: {
          amount?: number
          appointment_id?: string | null
          checklist?: Json | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          installments?: number
          notes?: string | null
          order_number?: number
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          service_id?: string | null
          service_name: string
          started_at?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          vehicle_id?: string | null
          studio_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          checklist?: Json | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          installments?: number
          notes?: string | null
          order_number?: number
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          service_id?: string | null
          service_name?: string
          started_at?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          vehicle_id?: string | null
          studio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["photo_kind"]
          order_id: string
          storage_path: string
          uploaded_by: string | null
          studio_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["photo_kind"]
          order_id: string
          storage_path: string
          uploaded_by?: string | null
          studio_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["photo_kind"]
          order_id?: string
          storage_path?: string
          uploaded_by?: string | null
          studio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_photos_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          base_salary: number
          commission_percent: number
          created_at: string
          created_by: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          pay_type: Database["public"]["Enums"]["pay_type"]
          phone: string | null
          pix_key: string | null
          role_title: string | null
          updated_at: string
          studio_id: string | null
        }
        Insert: {
          base_salary?: number
          commission_percent?: number
          created_at?: string
          created_by?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          pay_type?: Database["public"]["Enums"]["pay_type"]
          phone?: string | null
          pix_key?: string | null
          role_title?: string | null
          updated_at?: string
          studio_id?: string | null
        }
        Update: {
          base_salary?: number
          commission_percent?: number
          created_at?: string
          created_by?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          pay_type?: Database["public"]["Enums"]["pay_type"]
          phone?: string | null
          pix_key?: string | null
          role_title?: string | null
          updated_at?: string
          studio_id?: string | null
        }
        Relationships: []
      }
      employee_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference_month: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          studio_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference_month: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          studio_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference_month?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          studio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_payments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string | null
          client_id: string
          color: string | null
          created_at: string
          id: string
          model: string | null
          notes: string | null
          plate: string | null
          updated_at: string
          year: number | null
          studio_id: string | null
        }
        Insert: {
          brand?: string | null
          client_id: string
          color?: string | null
          created_at?: string
          id?: string
          model?: string | null
          notes?: string | null
          plate?: string | null
          updated_at?: string
          year?: number | null
          studio_id?: string | null
        }
        Update: {
          brand?: string | null
          client_id?: string
          color?: string | null
          created_at?: string
          id?: string
          model?: string | null
          notes?: string | null
          plate?: string | null
          updated_at?: string
          year?: number | null
          studio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "colaborador"
      appointment_status:
        | "pendente"
        | "confirmado"
        | "em_andamento"
        | "concluido"
        | "cancelado"
      payment_method:
        | "dinheiro"
        | "pix"
        | "cartao_credito"
        | "cartao_debito"
        | "transferencia"
        | "convenio"
        | "pendente"
      photo_kind: "antes" | "depois"
      pay_type: "mensalista" | "diarista" | "comissionado"
      payment_status: "pendente" | "pago" | "cancelado"
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
      app_role: ["admin", "colaborador"],
      appointment_status: [
        "pendente",
        "confirmado",
        "em_andamento",
        "concluido",
        "cancelado",
      ],
      payment_method: [
        "dinheiro",
        "pix",
        "cartao_credito",
        "cartao_debito",
        "transferencia",
        "convenio",
        "pendente",
      ],
      photo_kind: ["antes", "depois"],
      pay_type: ["mensalista", "diarista", "comissionado"],
      payment_status: ["pendente", "pago", "cancelado"],
    },
  },
} as const

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bom_recipes: {
        Row: {
          created_at: string
          id: string
          material_id: string
          product_id: string
          usage_quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          product_id: string
          usage_quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          product_id?: string
          usage_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "bom_recipes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "sku_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "sku_products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_logs: {
        Row: {
          created_at: string
          diff: number
          id: string
          material_id: string
          new_qty: number
          previous_qty: number
          reason: string | null
          store_id: string
          type: string
        }
        Insert: {
          created_at?: string
          diff?: number
          id?: string
          material_id: string
          new_qty?: number
          previous_qty?: number
          reason?: string | null
          store_id: string
          type?: string
        }
        Update: {
          created_at?: string
          diff?: number
          id?: string
          material_id?: string
          new_qty?: number
          previous_qty?: number
          reason?: string | null
          store_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "sku_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      restock_batches: {
        Row: {
          created_at: string
          delivery_date: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["restock_status"]
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["restock_status"]
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["restock_status"]
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restock_batches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      restock_items: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          material_id: string
          quantity: number
          source_type: Database["public"]["Enums"]["restock_source"]
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          material_id: string
          quantity?: number
          source_type?: Database["public"]["Enums"]["restock_source"]
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          material_id?: string
          quantity?: number
          source_type?: Database["public"]["Enums"]["restock_source"]
        }
        Relationships: [
          {
            foreignKeyName: "restock_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "restock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "sku_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      sku_materials: {
        Row: {
          category: Database["public"]["Enums"]["material_category"]
          conversion_rate: number
          cost: number
          created_at: string
          id: string
          name: string
          unit_purchase: string
          unit_usage: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["material_category"]
          conversion_rate?: number
          cost?: number
          created_at?: string
          id?: string
          name: string
          unit_purchase?: string
          unit_usage?: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["material_category"]
          conversion_rate?: number
          cost?: number
          created_at?: string
          id?: string
          name?: string
          unit_purchase?: string
          unit_usage?: string
          updated_at?: string
        }
        Relationships: []
      }
      sku_products: {
        Row: {
          attributes: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          name_en: string | null
          notes: string | null
          price: number
          spec_ml: number | null
          updated_at: string
        }
        Insert: {
          attributes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          name_en?: string | null
          notes?: string | null
          price?: number
          spec_ml?: number | null
          updated_at?: string
        }
        Update: {
          attributes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          name_en?: string | null
          notes?: string | null
          price?: number
          spec_ml?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stocktake_records: {
        Row: {
          actual_qty: number
          created_at: string
          difference_qty: number
          difference_reason: string | null
          id: string
          material_id: string
          stocktake_date: string
          store_id: string
          theoretical_qty: number
        }
        Insert: {
          actual_qty?: number
          created_at?: string
          difference_qty?: number
          difference_reason?: string | null
          id?: string
          material_id: string
          stocktake_date?: string
          store_id: string
          theoretical_qty?: number
        }
        Update: {
          actual_qty?: number
          created_at?: string
          difference_qty?: number
          difference_reason?: string | null
          id?: string
          material_id?: string
          stocktake_date?: string
          store_id?: string
          theoretical_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "stocktake_records_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "sku_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_inventory: {
        Row: {
          current_quantity: number
          id: string
          last_stocktake_at: string | null
          material_id: string
          store_id: string
          theoretical_quantity: number
          updated_at: string
        }
        Insert: {
          current_quantity?: number
          id?: string
          last_stocktake_at?: string | null
          material_id: string
          store_id: string
          theoretical_quantity?: number
          updated_at?: string
        }
        Update: {
          current_quantity?: number
          id?: string
          last_stocktake_at?: string | null
          material_id?: string
          store_id?: string
          theoretical_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_inventory_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "sku_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["store_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          store_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
      has_store_access: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "merchant" | "public_user"
      material_category: "bean" | "milk" | "packaging" | "syrup" | "other"
      restock_source: "system_calc" | "merchant_add" | "manual"
      restock_status:
        | "pending"
        | "approved"
        | "shipped"
        | "received"
        | "cancelled"
      store_status: "active" | "inactive" | "renovating"
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
      app_role: ["admin", "merchant", "public_user"],
      material_category: ["bean", "milk", "packaging", "syrup", "other"],
      restock_source: ["system_calc", "merchant_add", "manual"],
      restock_status: [
        "pending",
        "approved",
        "shipped",
        "received",
        "cancelled",
      ],
      store_status: ["active", "inactive", "renovating"],
    },
  },
} as const

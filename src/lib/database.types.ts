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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          name_ro: string
          name_ru: string
          slug: string
          sort_order: number
        }
        Insert: {
          id: number
          name_ro: string
          name_ru: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: number
          name_ro?: string
          name_ru?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string | null
          created_at: string
          id: string
          last_message_at: string
          listing_id: string | null
          seller_id: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id?: string | null
          seller_id?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id?: string | null
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_compatibility: {
        Row: {
          id: number
          listing_id: string
          make_id: number
          model_id: number | null
          year_from: number
          year_to: number
        }
        Insert: {
          id?: number
          listing_id: string
          make_id: number
          model_id?: number | null
          year_from: number
          year_to: number
        }
        Update: {
          id?: number
          listing_id?: string
          make_id?: number
          model_id?: number | null
          year_from?: number
          year_to?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_compatibility_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_compatibility_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "vehicle_makes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_compatibility_model_id_make_id_fkey"
            columns: ["model_id", "make_id"]
            isOneToOne: false
            referencedRelation: "vehicle_models"
            referencedColumns: ["id", "make_id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          position: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          position: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          position?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_private: {
        Row: {
          imei: string | null
          listing_id: string
          vin: string | null
        }
        Insert: {
          imei?: string | null
          listing_id: string
          vin?: string | null
        }
        Update: {
          imei?: string | null
          listing_id?: string
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_private_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          attributes: Json
          category_id: number
          condition: string
          created_at: string
          currency: string
          description: string
          expires_at: string
          id: string
          locality_id: number
          negotiable: boolean
          price: number
          search_vector: unknown
          status: string
          title: string
          updated_at: string
          user_id: string
          views: number
        }
        Insert: {
          attributes?: Json
          category_id: number
          condition: string
          created_at?: string
          currency?: string
          description?: string
          expires_at?: string
          id?: string
          locality_id: number
          negotiable?: boolean
          price: number
          search_vector?: unknown
          status?: string
          title: string
          updated_at?: string
          user_id: string
          views?: number
        }
        Update: {
          attributes?: Json
          category_id?: number
          condition?: string
          created_at?: string
          currency?: string
          description?: string
          expires_at?: string
          id?: string
          locality_id?: number
          negotiable?: boolean
          price?: number
          search_vector?: unknown
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_locality_id_fkey"
            columns: ["locality_id"]
            isOneToOne: false
            referencedRelation: "localities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      localities: {
        Row: {
          id: number
          name_ro: string
          name_ru: string
          sort_order: number
        }
        Insert: {
          id: number
          name_ro: string
          name_ru: string
          sort_order?: number
        }
        Update: {
          id?: number
          name_ro?: string
          name_ru?: string
          sort_order?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          is_flagged: boolean
          read_at: string | null
          sender_id: string | null
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          is_flagged?: boolean
          read_at?: string | null
          sender_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_flagged?: boolean
          read_at?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_brands: {
        Row: {
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          id?: number
          name: string
          sort_order?: number
        }
        Update: {
          id?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      phone_models: {
        Row: {
          brand_id: number
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          brand_id: number
          id?: number
          name: string
          sort_order?: number
        }
        Update: {
          brand_id?: number
          id?: number
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "phone_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "phone_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_private: {
        Row: {
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_blocked: boolean
          language: string
          locality_id: number | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          is_blocked?: boolean
          language?: string
          locality_id?: number | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_blocked?: boolean
          language?: string
          locality_id?: number | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_locality_id_fkey"
            columns: ["locality_id"]
            isOneToOne: false
            referencedRelation: "localities"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string
          id: string
          listing_id: string | null
          message_id: string | null
          reason: string
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          listing_id?: string | null
          message_id?: string | null
          reason: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          listing_id?: string | null
          message_id?: string | null
          reason?: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vehicles: {
        Row: {
          created_at: string
          id: string
          label: string
          make_id: number
          model_id: number | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          make_id: number
          model_id?: number | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          make_id?: number
          model_id?: number | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_vehicles_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "vehicle_makes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vehicles_model_id_make_id_fkey"
            columns: ["model_id", "make_id"]
            isOneToOne: false
            referencedRelation: "vehicle_models"
            referencedColumns: ["id", "make_id"]
          },
          {
            foreignKeyName: "user_vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_makes: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      vehicle_models: {
        Row: {
          id: number
          make_id: number
          name: string
        }
        Insert: {
          id?: number
          make_id: number
          name: string
        }
        Update: {
          id?: number
          make_id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_models_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "vehicle_makes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      build_search_query: { Args: { p_text: string }; Returns: unknown }
      category_min_photos: { Args: { p_category_id: number }; Returns: number }
      count_unread_messages: { Args: never; Returns: number }
      delete_my_account: { Args: never; Returns: undefined }
      get_listing_badges: {
        Args: { p_listing_id: string }
        Returns: {
          has_imei: boolean
          has_vin: boolean
        }[]
      }
      get_listing_contact: {
        Args: { p_listing_id: string }
        Returns: {
          imei: string
          phone: string
          vin: string
        }[]
      }
      get_my_conversations: {
        Args: { p_conversation_id?: string }
        Returns: {
          can_reply: boolean
          i_am_seller: boolean
          id: string
          last_body: string
          last_from_me: boolean
          last_message_at: string
          listing_available: boolean
          listing_cover: string
          listing_currency: string
          listing_id: string
          listing_price: number
          listing_title: string
          other_name: string
          other_user_id: string
          unread_count: number
        }[]
      }
      immutable_unaccent: { Args: { input: string }; Returns: string }
      increment_listing_views: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_api_request: { Args: never; Returns: boolean }
      is_suspicious_message: { Args: { body: string }; Returns: boolean }
      is_valid_imei: { Args: { imei: string }; Returns: boolean }
      is_valid_vin: { Args: { vin: string }; Returns: boolean }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      owns_listing_folder: { Args: { object_name: string }; Returns: boolean }
      price_in_mdl: {
        Args: { p_currency: string; p_price: number }
        Returns: number
      }
      publish_listing: { Args: { p_listing_id: string }; Returns: undefined }
      reactivate_listing: { Args: { p_listing_id: string }; Returns: string }
      search_listings: {
        Args: {
          p_attributes?: Json
          p_category_id?: number
          p_compat_make_id?: number
          p_compat_model_id?: number
          p_compat_year?: number
          p_condition?: string
          p_currency?: string
          p_exclude_id?: string
          p_limit?: number
          p_locality_id?: number
          p_offset?: number
          p_price_max?: number
          p_price_min?: number
          p_query?: string
          p_ranges?: Json
          p_sort?: string
          p_user_id?: string
        }
        Returns: {
          attributes: Json
          category_id: number
          condition: string
          cover_path: string
          created_at: string
          currency: string
          has_imei: boolean
          has_vin: boolean
          id: string
          locality_id: number
          negotiable: boolean
          price: number
          title: string
          total_count: number
          user_id: string
        }[]
      }
      start_conversation: { Args: { p_listing_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

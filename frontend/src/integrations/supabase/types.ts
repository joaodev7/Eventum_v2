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
      event_users: {
        Row: {
          created_at: string
          event_id: string
          id: string
          role: Database["public"]["Enums"]["event_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          role?: Database["public"]["Enums"]["event_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          role?: Database["public"]["Enums"]["event_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_users_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          event_date: string | null
          event_name: string
          event_time: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          gallery_images: string[] | null
          hero_image_url: string | null
          id: string
          invite_image_url: string | null
          settings: Json | null
          slug: string
          status: Database["public"]["Enums"]["event_status"]
          theme_config: Json | null
          updated_at: string
          venue_address: string | null
          venue_maps_link: string | null
          venue_name: string | null
          welcome_message: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_date?: string | null
          event_name: string
          event_time?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          gallery_images?: string[] | null
          hero_image_url?: string | null
          id?: string
          invite_image_url?: string | null
          settings?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["event_status"]
          theme_config?: Json | null
          updated_at?: string
          venue_address?: string | null
          venue_maps_link?: string | null
          venue_name?: string | null
          welcome_message?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_date?: string | null
          event_name?: string
          event_time?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          gallery_images?: string[] | null
          hero_image_url?: string | null
          id?: string
          invite_image_url?: string | null
          settings?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["event_status"]
          theme_config?: Json | null
          updated_at?: string
          venue_address?: string | null
          venue_maps_link?: string | null
          venue_name?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          color: string
          created_at: string
          event_id: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          event_id: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          event_id?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          due_date: string | null
          event_id: string
          id: string
          notes: string | null
          paid_amount: number
          paid_at: string | null
          status: Database["public"]["Enums"]["expense_status"]
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          event_id: string
          id?: string
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          feature_key: string
          id: string
          min_plan: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          feature_key: string
          id?: string
          min_plan: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          feature_key?: string
          id?: string
          min_plan?: string
        }
        Relationships: []
      }
      gift_payments: {
        Row: {
          confirmed_at: string | null
          created_at: string
          event_id: string | null
          gift_id: string
          guest_name: string | null
          id: string
          message: string | null
          status: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          event_id?: string | null
          gift_id: string
          guest_name?: string | null
          id?: string
          message?: string | null
          status?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          event_id?: string | null
          gift_id?: string
          guest_name?: string | null
          id?: string
          message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_payments_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          image_url: string | null
          is_flexible_value: boolean
          min_value: number | null
          name: string
          reserved_at: string | null
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          image_url?: string | null
          is_flexible_value?: boolean
          min_value?: number | null
          name: string
          reserved_at?: string | null
          status?: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          image_url?: string | null
          is_flexible_value?: boolean
          min_value?: number | null
          name?: string
          reserved_at?: string | null
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "gifts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_companions: {
        Row: {
          created_at: string
          event_id: string
          guest_id: string
          id: string
          name: string
          will_attend: boolean | null
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_id: string
          id?: string
          name: string
          will_attend?: boolean | null
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_id?: string
          id?: string
          name?: string
          will_attend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_companions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_companions_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          companions: number | null
          created_at: string
          email: string | null
          event_id: string
          guest_group: Database["public"]["Enums"]["guest_group"]
          has_viewed: boolean
          id: string
          invite_email_sent_at: string | null
          name: string
          notes: string | null
          phone: string | null
          reconfirmation_token: string | null
          responded_at: string | null
          second_confirmation_companions: number | null
          second_confirmation_responded_at: string | null
          second_confirmation_sent: boolean | null
          second_confirmation_status: string | null
          status: Database["public"]["Enums"]["invite_status"]
          table_id: string | null
          token: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          companions?: number | null
          created_at?: string
          email?: string | null
          event_id: string
          guest_group?: Database["public"]["Enums"]["guest_group"]
          has_viewed?: boolean
          id?: string
          invite_email_sent_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          reconfirmation_token?: string | null
          responded_at?: string | null
          second_confirmation_companions?: number | null
          second_confirmation_responded_at?: string | null
          second_confirmation_sent?: boolean | null
          second_confirmation_status?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          table_id?: string | null
          token?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          companions?: number | null
          created_at?: string
          email?: string | null
          event_id?: string
          guest_group?: Database["public"]["Enums"]["guest_group"]
          has_viewed?: boolean
          id?: string
          invite_email_sent_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          reconfirmation_token?: string | null
          responded_at?: string | null
          second_confirmation_companions?: number | null
          second_confirmation_responded_at?: string | null
          second_confirmation_sent?: boolean | null
          second_confirmation_status?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          table_id?: string | null
          token?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_emails: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          guest_id: string
          id: string
          resend_id: string | null
          sent_at: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          guest_id: string
          id?: string
          resend_id?: string | null
          sent_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          guest_id?: string
          id?: string
          resend_id?: string | null
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_emails_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_emails_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      mercadopago_connections: {
        Row: {
          access_token_encrypted: string
          connected_at: string | null
          event_id: string
          id: string
          mp_email: string | null
          mp_public_key: string | null
          mp_user_id: string
          refresh_token_encrypted: string
          token_expires_at: string
          updated_at: string | null
        }
        Insert: {
          access_token_encrypted: string
          connected_at?: string | null
          event_id: string
          id?: string
          mp_email?: string | null
          mp_public_key?: string | null
          mp_user_id: string
          refresh_token_encrypted: string
          token_expires_at: string
          updated_at?: string | null
        }
        Update: {
          access_token_encrypted?: string
          connected_at?: string | null
          event_id?: string
          id?: string
          mp_email?: string | null
          mp_public_key?: string | null
          mp_user_id?: string
          refresh_token_encrypted?: string
          token_expires_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mercadopago_connections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_config: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          pix_key: string | null
          qr_code_url: string | null
          recipient_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          pix_key?: string | null
          qr_code_url?: string | null
          recipient_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          pix_key?: string | null
          qr_code_url?: string | null
          recipient_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_config_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          stripe_customer_id: string | null
          trial_ends_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          display_name: string
          features: Json
          id: string
          is_active: boolean
          limits: Json
          name: string
          platform_fee_percent: number
          price_monthly: number
          price_yearly: number
          sort_order: number
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name: string
          platform_fee_percent?: number
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name?: string
          platform_fee_percent?: number
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          contact_name: string | null
          contract_value: number | null
          contracted: boolean | null
          created_at: string
          email: string | null
          event_id: string
          id: string
          instagram: string | null
          name: string
          notes: string | null
          paid_amount: number | null
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_name?: string | null
          contract_value?: number | null
          contracted?: boolean | null
          created_at?: string
          email?: string | null
          event_id: string
          id?: string
          instagram?: string | null
          name: string
          notes?: string | null
          paid_amount?: number | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_name?: string | null
          contract_value?: number | null
          contracted?: boolean | null
          created_at?: string
          email?: string | null
          event_id?: string
          id?: string
          instagram?: string | null
          name?: string
          notes?: string | null
          paid_amount?: number | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          event_id: string
          id: string
          name: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          name: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      wedding_settings: {
        Row: {
          couple_names: string
          created_at: string
          gallery_images: string[] | null
          hero_image_url: string | null
          id: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
          wedding_date: string | null
          welcome_message: string | null
        }
        Insert: {
          couple_names?: string
          created_at?: string
          gallery_images?: string[] | null
          hero_image_url?: string | null
          id?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          wedding_date?: string | null
          welcome_message?: string | null
        }
        Update: {
          couple_names?: string
          created_at?: string
          gallery_images?: string[] | null
          hero_image_url?: string | null
          id?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          wedding_date?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_event: { Args: { _event_id: string }; Returns: boolean }
      create_event_with_owner: {
        Args: {
          _event_date?: string
          _event_name: string
          _event_type: Database["public"]["Enums"]["event_type"]
          _slug: string
          _venue_address?: string
          _venue_name?: string
        }
        Returns: string
      }
      get_event_by_slug: {
        Args: { _slug: string }
        Returns: {
          event_date: string
          event_name: string
          event_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          gallery_images: string[]
          hero_image_url: string
          id: string
          settings: Json
          slug: string
          status: Database["public"]["Enums"]["event_status"]
          theme_config: Json
          venue_address: string
          venue_maps_link: string
          venue_name: string
          welcome_message: string
        }[]
      }
      get_guest_by_reconfirmation_token: {
        Args: { _token: string }
        Returns: {
          companions: number
          companions_list: Json
          created_at: string
          email: string
          event_id: string
          event_info: Json
          guest_group: Database["public"]["Enums"]["guest_group"]
          has_viewed: boolean
          id: string
          name: string
          notes: string
          phone: string
          reconfirmation_token: string
          responded_at: string
          second_confirmation_companions: number
          second_confirmation_responded_at: string
          second_confirmation_sent: boolean
          second_confirmation_status: string
          status: Database["public"]["Enums"]["invite_status"]
          table_id: string
          table_info: Json
          token: string
          updated_at: string
          viewed_at: string
        }[]
      }
      get_guest_by_token: {
        Args: { _token: string }
        Returns: {
          companions: number
          companions_list: Json
          created_at: string
          email: string
          event_id: string
          event_info: Json
          guest_group: Database["public"]["Enums"]["guest_group"]
          has_viewed: boolean
          id: string
          name: string
          notes: string
          phone: string
          responded_at: string
          status: Database["public"]["Enums"]["invite_status"]
          table_id: string
          table_info: Json
          token: string
          updated_at: string
          viewed_at: string
        }[]
      }
      get_guest_public_info: {
        Args: { _guest_id: string }
        Returns: {
          companions: number
          guest_group: Database["public"]["Enums"]["guest_group"]
          id: string
          name: string
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
      has_event_access: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      has_event_role: {
        Args: {
          _event_id: string
          _role: Database["public"]["Enums"]["event_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_feature_access: {
        Args: { _feature_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      mark_invite_viewed: { Args: { _token: string }; Returns: boolean }
      release_expired_reservations: { Args: never; Returns: undefined }
      reserve_gift: { Args: { _gift_id: string }; Returns: boolean }
      respond_to_invite: {
        Args: {
          _companions: number
          _status: Database["public"]["Enums"]["invite_status"]
          _token: string
        }
        Returns: boolean
      }
      respond_to_invite_with_companions: {
        Args: {
          _companion_ids: string[]
          _status: Database["public"]["Enums"]["invite_status"]
          _token: string
        }
        Returns: boolean
      }
      respond_to_reconfirmation: {
        Args: { _companions?: number; _status: string; _token: string }
        Returns: boolean
      }
      respond_to_reconfirmation_with_companions: {
        Args: { _companion_ids?: string[]; _status: string; _token: string }
        Returns: boolean
      }
      send_second_confirmation: {
        Args: { _guest_id: string }
        Returns: boolean
      }
      send_second_confirmation_to_all: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user" | "superadmin"
      event_role: "owner" | "admin" | "collaborator" | "viewer"
      event_status: "draft" | "active" | "archived"
      event_type:
        | "wedding"
        | "birthday"
        | "graduation"
        | "party"
        | "corporate"
        | "other"
      expense_status: "pending" | "partial" | "paid"
      guest_group: "family" | "friends" | "work" | "other"
      invite_status: "pending" | "accepted" | "declined"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
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
      app_role: ["admin", "user", "superadmin"],
      event_role: ["owner", "admin", "collaborator", "viewer"],
      event_status: ["draft", "active", "archived"],
      event_type: [
        "wedding",
        "birthday",
        "graduation",
        "party",
        "corporate",
        "other",
      ],
      expense_status: ["pending", "partial", "paid"],
      guest_group: ["family", "friends", "work", "other"],
      invite_status: ["pending", "accepted", "declined"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "incomplete",
      ],
    },
  },
} as const

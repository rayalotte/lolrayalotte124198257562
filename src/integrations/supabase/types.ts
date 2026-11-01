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
      abilities: {
        Row: {
          character_id: string
          cooldown: string | null
          cost: string | null
          damage: string | null
          description: string | null
          duration: string | null
          effects: string | null
          icon_url: string | null
          id: string
          name: string | null
          notes: string | null
          range: string | null
          slot: string
          target: string | null
        }
        Insert: {
          character_id: string
          cooldown?: string | null
          cost?: string | null
          damage?: string | null
          description?: string | null
          duration?: string | null
          effects?: string | null
          icon_url?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          range?: string | null
          slot: string
          target?: string | null
        }
        Update: {
          character_id?: string
          cooldown?: string | null
          cost?: string | null
          damage?: string | null
          description?: string | null
          duration?: string | null
          effects?: string | null
          icon_url?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          range?: string | null
          slot?: string
          target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abilities_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          art_url: string | null
          attack_types: string[]
          biography: string | null
          changelog: string | null
          created_at: string
          custom_stats: Json
          damage_types: string[]
          difficulty: number | null
          gallery: Json
          id: string
          items: Json
          lanes: string[]
          name: string
          notes: string | null
          portrait_url: string | null
          power_spike: string | null
          power_spikes: string[]
          resource: string | null
          role: string | null
          short_description: string | null
          slug: string
          stats: Json
          tags: string[]
          title: string | null
          updated_at: string
        }
        Insert: {
          art_url?: string | null
          attack_types?: string[]
          biography?: string | null
          changelog?: string | null
          created_at?: string
          custom_stats?: Json
          damage_types?: string[]
          difficulty?: number | null
          gallery?: Json
          id?: string
          items?: Json
          lanes?: string[]
          name: string
          notes?: string | null
          portrait_url?: string | null
          power_spike?: string | null
          power_spikes?: string[]
          resource?: string | null
          role?: string | null
          short_description?: string | null
          slug: string
          stats?: Json
          tags?: string[]
          title?: string | null
          updated_at?: string
        }
        Update: {
          art_url?: string | null
          attack_types?: string[]
          biography?: string | null
          changelog?: string | null
          created_at?: string
          custom_stats?: Json
          damage_types?: string[]
          difficulty?: number | null
          gallery?: Json
          id?: string
          items?: Json
          lanes?: string[]
          name?: string
          notes?: string | null
          portrait_url?: string | null
          power_spike?: string | null
          power_spikes?: string[]
          resource?: string | null
          role?: string | null
          short_description?: string | null
          slug?: string
          stats?: Json
          tags?: string[]
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      counters: {
        Row: {
          character_id: string
          id: string
          kind: string
          note: string | null
          target_id: string
        }
        Insert: {
          character_id: string
          id?: string
          kind: string
          note?: string | null
          target_id: string
        }
        Update: {
          character_id?: string
          id?: string
          kind?: string
          note?: string | null
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counters_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const

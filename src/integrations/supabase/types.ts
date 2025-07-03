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
      ai_category_learning: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          description_pattern: string
          id: string
          last_used: string | null
          suggested_category: string
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          description_pattern: string
          id?: string
          last_used?: string | null
          suggested_category: string
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          description_pattern?: string
          id?: string
          last_used?: string | null
          suggested_category?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: string
          metadata: Json | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type: string
          metadata?: Json | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_processing_sessions: {
        Row: {
          confidence_scores: Json | null
          created_at: string | null
          id: string
          original_transcription: string
          processed_expenses: Json
          processing_metadata: Json | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          confidence_scores?: Json | null
          created_at?: string | null
          id?: string
          original_transcription: string
          processed_expenses: Json
          processing_metadata?: Json | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          confidence_scores?: Json | null
          created_at?: string | null
          id?: string
          original_transcription?: string
          processed_expenses?: Json
          processing_metadata?: Json | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_user_preferences: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          last_used: string | null
          preference_key: string
          preference_type: string
          preference_value: Json
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          preference_key: string
          preference_type: string
          preference_value: Json
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          preference_key?: string
          preference_type?: string
          preference_value?: Json
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_voice_analytics: {
        Row: {
          category_prediction_accuracy: number | null
          created_at: string | null
          expense_extraction_confidence: number | null
          id: string
          processing_time_ms: number | null
          session_id: string
          transcription_confidence: number | null
          user_feedback: Json | null
          user_id: string | null
        }
        Insert: {
          category_prediction_accuracy?: number | null
          created_at?: string | null
          expense_extraction_confidence?: number | null
          id?: string
          processing_time_ms?: number | null
          session_id: string
          transcription_confidence?: number | null
          user_feedback?: Json | null
          user_id?: string | null
        }
        Update: {
          category_prediction_accuracy?: number | null
          created_at?: string | null
          expense_extraction_confidence?: number | null
          id?: string
          processing_time_ms?: number | null
          session_id?: string
          transcription_confidence?: number | null
          user_feedback?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      debts: {
        Row: {
          amount: number
          currency: string
          date_created: string | null
          id: string
          is_settled: boolean | null
          name: string
          note: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          currency: string
          date_created?: string | null
          id?: string
          is_settled?: boolean | null
          name: string
          note?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          currency?: string
          date_created?: string | null
          id?: string
          is_settled?: boolean | null
          name?: string
          note?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          description: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fx_rates: {
        Row: {
          base_code: string
          id: string
          last_updated: string
          quote_code: string
          rate: number
        }
        Insert: {
          base_code: string
          id?: string
          last_updated?: string
          quote_code: string
          rate: number
        }
        Update: {
          base_code?: string
          id?: string
          last_updated?: string
          quote_code?: string
          rate?: number
        }
        Relationships: []
      }
      user_budgets: {
        Row: {
          budget_amount: number
          budget_currency: string | null
          created_at: string | null
          id: string
          month: string
          user_id: string | null
        }
        Insert: {
          budget_amount: number
          budget_currency?: string | null
          created_at?: string | null
          id?: string
          month: string
          user_id?: string | null
        }
        Update: {
          budget_amount?: number
          budget_currency?: string | null
          created_at?: string | null
          id?: string
          month?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          active_currency: string | null
          created_at: string | null
          full_name: string | null
          id: string
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active_currency?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active_currency?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      voice_usage: {
        Row: {
          created_at: string | null
          id: string
          limit: number
          month_id: string
          user_id: string | null
          voice_count: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          limit?: number
          month_id: string
          user_id?: string | null
          voice_count?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          limit?: number
          month_id?: string
          user_id?: string | null
          voice_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_ai_preferences: {
        Args: { p_user_id: string; p_preference_type?: string }
        Returns: {
          preference_type: string
          preference_key: string
          preference_value: Json
          confidence_score: number
          usage_count: number
        }[]
      }
      learn_category_pattern: {
        Args: {
          p_user_id: string
          p_description_pattern: string
          p_suggested_category: string
          p_confidence_score?: number
        }
        Returns: undefined
      }
      update_ai_preference: {
        Args: {
          p_user_id: string
          p_preference_type: string
          p_preference_key: string
          p_preference_value: Json
          p_confidence_score?: number
        }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

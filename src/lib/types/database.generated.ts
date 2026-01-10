export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      achievement_definitions: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string
          metadata: Json | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon: string
          metadata?: Json | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          metadata?: Json | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      exercise_attempts: {
        Row: {
          attempted_at: string | null
          coaching_shown: boolean | null
          created_at: string
          exercise_slug: string
          generated_params: Json | null
          grading_method: string | null
          hint_used: boolean | null
          id: string
          is_correct: boolean | null
          is_first_attempt: boolean | null
          last_seen_at: string | null
          points_earned: number | null
          quality_score: number | null
          rating: number | null
          response_time_ms: number | null
          seed: string | null
          times_correct: number
          times_seen: number
          timezone_offset_minutes: number | null
          used_target_construct: boolean | null
          user_id: string
        }
        Insert: {
          attempted_at?: string | null
          coaching_shown?: boolean | null
          created_at?: string
          exercise_slug: string
          generated_params?: Json | null
          grading_method?: string | null
          hint_used?: boolean | null
          id?: string
          is_correct?: boolean | null
          is_first_attempt?: boolean | null
          last_seen_at?: string | null
          points_earned?: number | null
          quality_score?: number | null
          rating?: number | null
          response_time_ms?: number | null
          seed?: string | null
          times_correct?: number
          times_seen?: number
          timezone_offset_minutes?: number | null
          used_target_construct?: boolean | null
          user_id: string
        }
        Update: {
          attempted_at?: string | null
          coaching_shown?: boolean | null
          created_at?: string
          exercise_slug?: string
          generated_params?: Json | null
          grading_method?: string | null
          hint_used?: boolean | null
          id?: string
          is_correct?: boolean | null
          is_first_attempt?: boolean | null
          last_seen_at?: string | null
          points_earned?: number | null
          quality_score?: number | null
          rating?: number | null
          response_time_ms?: number | null
          seed?: string | null
          times_correct?: number
          times_seen?: number
          timezone_offset_minutes?: number | null
          used_target_construct?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          accepted_solutions: string[] | null
          avg_success_rate: number | null
          blank_position: number | null
          category: string
          code: string | null
          concept: string | null
          created_at: string | null
          difficulty: number
          exercise_type: string | null
          expected_answer: string
          explanation: string | null
          generator: string | null
          hints: Json | null
          id: string
          language: string
          level: string | null
          objective: string | null
          pattern: string | null
          prereqs: string[] | null
          prompt: string
          slug: string
          subconcept: string | null
          tags: string[] | null
          target_construct: Json | null
          targets: string[] | null
          template: string | null
          times_practiced: number | null
          title: string
          updated_at: string | null
          verify_by_execution: boolean | null
        }
        Insert: {
          accepted_solutions?: string[] | null
          avg_success_rate?: number | null
          blank_position?: number | null
          category: string
          code?: string | null
          concept?: string | null
          created_at?: string | null
          difficulty: number
          exercise_type?: string | null
          expected_answer: string
          explanation?: string | null
          generator?: string | null
          hints?: Json | null
          id?: string
          language: string
          level?: string | null
          objective?: string | null
          pattern?: string | null
          prereqs?: string[] | null
          prompt: string
          slug: string
          subconcept?: string | null
          tags?: string[] | null
          target_construct?: Json | null
          targets?: string[] | null
          template?: string | null
          times_practiced?: number | null
          title: string
          updated_at?: string | null
          verify_by_execution?: boolean | null
        }
        Update: {
          accepted_solutions?: string[] | null
          avg_success_rate?: number | null
          blank_position?: number | null
          category?: string
          code?: string | null
          concept?: string | null
          created_at?: string | null
          difficulty?: number
          exercise_type?: string | null
          expected_answer?: string
          explanation?: string | null
          generator?: string | null
          hints?: Json | null
          id?: string
          language?: string
          level?: string | null
          objective?: string | null
          pattern?: string | null
          prereqs?: string[] | null
          prompt?: string
          slug?: string
          subconcept?: string | null
          tags?: string[] | null
          target_construct?: Json | null
          targets?: string[] | null
          template?: string | null
          times_practiced?: number | null
          title?: string
          updated_at?: string | null
          verify_by_execution?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_streak: number | null
          daily_goal: number | null
          display_name: string | null
          experience_level: string | null
          id: string
          last_activity_date: string | null
          last_freeze_earned_at: string | null
          longest_streak: number | null
          notification_time: string | null
          preferred_language: string | null
          streak_freezes: number | null
          total_exercises_completed: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          daily_goal?: number | null
          display_name?: string | null
          experience_level?: string | null
          id: string
          last_activity_date?: string | null
          last_freeze_earned_at?: string | null
          longest_streak?: number | null
          notification_time?: string | null
          preferred_language?: string | null
          streak_freezes?: number | null
          total_exercises_completed?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          daily_goal?: number | null
          display_name?: string | null
          experience_level?: string | null
          id?: string
          last_activity_date?: string | null
          last_freeze_earned_at?: string | null
          longest_streak?: number | null
          notification_time?: string | null
          preferred_language?: string | null
          streak_freezes?: number | null
          total_exercises_completed?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      subconcept_progress: {
        Row: {
          concept_slug: string
          created_at: string
          difficulty: number | null
          elapsed_days: number | null
          fsrs_state: number | null
          id: string
          lapses: number | null
          last_reviewed: string | null
          next_review: string
          reps: number | null
          scheduled_days: number | null
          stability: number | null
          subconcept_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concept_slug: string
          created_at?: string
          difficulty?: number | null
          elapsed_days?: number | null
          fsrs_state?: number | null
          id?: string
          lapses?: number | null
          last_reviewed?: string | null
          next_review?: string
          reps?: number | null
          scheduled_days?: number | null
          stability?: number | null
          subconcept_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concept_slug?: string
          created_at?: string
          difficulty?: number | null
          elapsed_days?: number | null
          fsrs_state?: number | null
          id?: string
          lapses?: number | null
          last_reviewed?: string | null
          next_review?: string
          reps?: number | null
          scheduled_days?: number | null
          stability?: number | null
          subconcept_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transfer_assessments: {
        Row: {
          assessed_at: string
          exercise_slug: string
          grading_method: string | null
          id: string
          last_practice_at: string | null
          practice_count: number
          response_time_ms: number | null
          subconcept_slug: string
          user_id: string
          was_correct: boolean
        }
        Insert: {
          assessed_at?: string
          exercise_slug: string
          grading_method?: string | null
          id?: string
          last_practice_at?: string | null
          practice_count: number
          response_time_ms?: number | null
          subconcept_slug: string
          user_id: string
          was_correct: boolean
        }
        Update: {
          assessed_at?: string
          exercise_slug?: string
          grading_method?: string | null
          id?: string
          last_practice_at?: string | null
          practice_count?: number
          response_time_ms?: number | null
          subconcept_slug?: string
          user_id?: string
          was_correct?: boolean
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_slug: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_slug: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_slug?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_slug_fkey"
            columns: ["achievement_slug"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
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
      calculate_attempt_points: {
        Args: {
          p_is_correct: boolean
          p_is_first_attempt: boolean
          p_rating: number
          p_response_time_ms: number
          p_subconcept_stability: number
          p_used_hint: boolean
          p_user_id: string
        }
        Returns: number
      }
      check_achievements: { Args: { p_user_id: string }; Returns: Json }
      get_contribution_history: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: Json
      }
      get_points_summary: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: Json
      }
      repair_user_stats: { Args: { p_user_id: string }; Returns: Json }
      update_profile_stats_atomic: {
        Args: {
          p_current_streak: number
          p_exercises_completed: number
          p_longest_streak: number
          p_user_id: string
        }
        Returns: undefined
      }
      update_streak: {
        Args: { p_activity_date: string; p_user_id: string }
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
    Enums: {},
  },
} as const


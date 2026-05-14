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
      assessments: {
        Row: {
          breakdown: Json
          created_at: string
          id: string
          score: number
          topic: string
          total: number
          user_id: string
        }
        Insert: {
          breakdown?: Json
          created_at?: string
          id?: string
          score?: number
          topic: string
          total?: number
          user_id: string
        }
        Update: {
          breakdown?: Json
          created_at?: string
          id?: string
          score?: number
          topic?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      employability_scores: {
        Row: {
          composite: number
          computed_at: string
          id: string
          market_fit: number
          resume_score: number
          skills_score: number
          user_id: string
        }
        Insert: {
          composite?: number
          computed_at?: string
          id?: string
          market_fit?: number
          resume_score?: number
          skills_score?: number
          user_id: string
        }
        Update: {
          composite?: number
          computed_at?: string
          id?: string
          market_fit?: number
          resume_score?: number
          skills_score?: number
          user_id?: string
        }
        Relationships: []
      }
      interview_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          created_at: string
          id: string
          role_target: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_target?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_target?: string
          user_id?: string
        }
        Relationships: []
      }
      market_demand_seed: {
        Row: {
          demand_score: number
          id: string
          role: string
          skill: string
        }
        Insert: {
          demand_score?: number
          id?: string
          role: string
          skill: string
        }
        Update: {
          demand_score?: number
          id?: string
          role?: string
          skill?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college: string | null
          created_at: string
          full_name: string | null
          headline: string | null
          id: string
          target_role: string | null
          updated_at: string
          year: string | null
        }
        Insert: {
          avatar_url?: string | null
          college?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id: string
          target_role?: string | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          avatar_url?: string | null
          college?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id?: string
          target_role?: string | null
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      resume_analyses: {
        Row: {
          ats_score: number
          created_at: string
          gaps: Json
          id: string
          keywords: Json
          resume_id: string
          strengths: Json
          suggestions: Json
          summary: string | null
          user_id: string
        }
        Insert: {
          ats_score?: number
          created_at?: string
          gaps?: Json
          id?: string
          keywords?: Json
          resume_id: string
          strengths?: Json
          suggestions?: Json
          summary?: string | null
          user_id: string
        }
        Update: {
          ats_score?: number
          created_at?: string
          gaps?: Json
          id?: string
          keywords?: Json
          resume_id?: string
          strengths?: Json
          suggestions?: Json
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_analyses_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          file_path: string
          id: string
          original_name: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_path: string
          id?: string
          original_name: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_path?: string
          id?: string
          original_name?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_items: {
        Row: {
          created_at: string
          description: string | null
          est_minutes: number
          id: string
          order_index: number
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          est_minutes?: number
          id?: string
          order_index?: number
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          est_minutes?: number
          id?: string
          order_index?: number
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          level: number
          name: string
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          level?: number
          name: string
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          level?: number
          name?: string
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      app_role:
        | "student"
        | "recruiter"
        | "college_admin"
        | "institute_admin"
        | "gov_admin"
        | "admin"
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
      app_role: [
        "student",
        "recruiter",
        "college_admin",
        "institute_admin",
        "gov_admin",
        "admin",
      ],
    },
  },
} as const

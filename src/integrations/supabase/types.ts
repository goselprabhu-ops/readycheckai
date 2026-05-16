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
      ai_usage_daily: {
        Row: {
          count: number
          day: string
          feature: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          day?: string
          feature: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          day?: string
          feature?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assessment_attempts: {
        Row: {
          assessment_id: string
          completed_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          max_score: number
          started_at: string
          status: string
          total_score: number
          user_id: string
        }
        Insert: {
          assessment_id: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          max_score?: number
          started_at?: string
          status?: string
          total_score?: number
          user_id: string
        }
        Update: {
          assessment_id?: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          max_score?: number
          started_at?: string
          status?: string
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_definitions: {
        Row: {
          category: Database["public"]["Enums"]["assessment_category"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          role_id: string
          title: string
        }
        Insert: {
          category: Database["public"]["Enums"]["assessment_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          role_id: string
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["assessment_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          role_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_definitions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "target_roles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
          evaluation: Json | null
          id: string
          question_key: string | null
          question_type: string | null
          role: string
          score: number | null
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          evaluation?: Json | null
          id?: string
          question_key?: string | null
          question_type?: string | null
          role: string
          score?: number | null
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          evaluation?: Json | null
          id?: string
          question_key?: string | null
          question_type?: string | null
          role?: string
          score?: number | null
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
          category: string
          communication_score: number | null
          confidence_score: number | null
          created_at: string
          current_index: number
          difficulty: string
          duration_target_seconds: number
          ended_at: string | null
          evaluations: Json
          feedback: Json
          id: string
          overall_score: number | null
          plan: Json
          role_target: string
          started_at: string
          status: string
          technical_score: number | null
          user_id: string
        }
        Insert: {
          category?: string
          communication_score?: number | null
          confidence_score?: number | null
          created_at?: string
          current_index?: number
          difficulty?: string
          duration_target_seconds?: number
          ended_at?: string | null
          evaluations?: Json
          feedback?: Json
          id?: string
          overall_score?: number | null
          plan?: Json
          role_target?: string
          started_at?: string
          status?: string
          technical_score?: number | null
          user_id: string
        }
        Update: {
          category?: string
          communication_score?: number | null
          confidence_score?: number | null
          created_at?: string
          current_index?: number
          difficulty?: string
          duration_target_seconds?: number
          ended_at?: string | null
          evaluations?: Json
          feedback?: Json
          id?: string
          overall_score?: number | null
          plan?: Json
          role_target?: string
          started_at?: string
          status?: string
          technical_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      learning_path_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          item_key: string
          path_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          item_key: string
          path_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          item_key?: string
          path_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_progress_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string
          focus: string | null
          id: string
          inputs_snapshot: Json
          projects: Json
          skill_heatmap: Json
          status: string
          target_role: string
          updated_at: string
          user_id: string
          weeks: Json
        }
        Insert: {
          created_at?: string
          focus?: string | null
          id?: string
          inputs_snapshot?: Json
          projects?: Json
          skill_heatmap?: Json
          status?: string
          target_role: string
          updated_at?: string
          user_id: string
          weeks?: Json
        }
        Update: {
          created_at?: string
          focus?: string | null
          id?: string
          inputs_snapshot?: Json
          projects?: Json
          skill_heatmap?: Json
          status?: string
          target_role?: string
          updated_at?: string
          user_id?: string
          weeks?: Json
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
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          achievements: Json
          avatar_url: string | null
          certifications: Json
          college: string | null
          created_at: string
          dob: string | null
          education: Json
          experience: Json
          full_name: string | null
          gender: string | null
          github_url: string | null
          headline: string | null
          id: string
          interests: Json
          languages: Json
          linkedin_url: string | null
          location: string | null
          onboarded: boolean
          phone: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          photo_url: string | null
          portfolio_url: string | null
          projects: Json
          summary: string | null
          target_role: string | null
          updated_at: string
          year: string | null
        }
        Insert: {
          achievements?: Json
          avatar_url?: string | null
          certifications?: Json
          college?: string | null
          created_at?: string
          dob?: string | null
          education?: Json
          experience?: Json
          full_name?: string | null
          gender?: string | null
          github_url?: string | null
          headline?: string | null
          id: string
          interests?: Json
          languages?: Json
          linkedin_url?: string | null
          location?: string | null
          onboarded?: boolean
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          photo_url?: string | null
          portfolio_url?: string | null
          projects?: Json
          summary?: string | null
          target_role?: string | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          achievements?: Json
          avatar_url?: string | null
          certifications?: Json
          college?: string | null
          created_at?: string
          dob?: string | null
          education?: Json
          experience?: Json
          full_name?: string | null
          gender?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          interests?: Json
          languages?: Json
          linkedin_url?: string | null
          location?: string | null
          onboarded?: boolean
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          photo_url?: string | null
          portfolio_url?: string | null
          projects?: Json
          summary?: string | null
          target_role?: string | null
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      question_secrets: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
          question_id: string
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation?: string | null
          question_id: string
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_secrets_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_secrets_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          options: Json
          order_index: number
          points: number
          prompt: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          options?: Json
          order_index?: number
          points?: number
          prompt: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          options?: Json
          order_index?: number
          points?: number
          prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      readiness_history: {
        Row: {
          computed_at: string
          id: string
          level: string
          python_score: number
          readiness: number
          resume_score: number
          sql_score: number
          user_id: string
          weights: Json
        }
        Insert: {
          computed_at?: string
          id?: string
          level?: string
          python_score?: number
          readiness?: number
          resume_score?: number
          sql_score?: number
          user_id: string
          weights?: Json
        }
        Update: {
          computed_at?: string
          id?: string
          level?: string
          python_score?: number
          readiness?: number
          resume_score?: number
          sql_score?: number
          user_id?: string
          weights?: Json
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          attempt_id: string | null
          category: Database["public"]["Enums"]["assessment_category"] | null
          created_at: string
          description: string | null
          expires_at: string | null
          generated_at: string
          id: string
          priority: number
          resource_url: string | null
          rule_key: string | null
          source: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          attempt_id?: string | null
          category?: Database["public"]["Enums"]["assessment_category"] | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          priority?: number
          resource_url?: string | null
          rule_key?: string | null
          source?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          attempt_id?: string | null
          category?: Database["public"]["Enums"]["assessment_category"] | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          priority?: number
          resource_url?: string | null
          rule_key?: string | null
          source?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_analyses: {
        Row: {
          ats_breakdown: Json
          ats_score: number
          created_at: string
          extraction_confidence: number | null
          extraction_error: string | null
          gaps: Json
          id: string
          keywords: Json
          method: string
          parsed_fields: Json
          parser_status: string | null
          quality_breakdown: Json
          resume_id: string
          rewrites: Json
          role_matches: Json
          status: string
          strengths: Json
          suggestions: Json
          summary: string | null
          user_id: string
        }
        Insert: {
          ats_breakdown?: Json
          ats_score?: number
          created_at?: string
          extraction_confidence?: number | null
          extraction_error?: string | null
          gaps?: Json
          id?: string
          keywords?: Json
          method?: string
          parsed_fields?: Json
          parser_status?: string | null
          quality_breakdown?: Json
          resume_id: string
          rewrites?: Json
          role_matches?: Json
          status?: string
          strengths?: Json
          suggestions?: Json
          summary?: string | null
          user_id: string
        }
        Update: {
          ats_breakdown?: Json
          ats_score?: number
          created_at?: string
          extraction_confidence?: number | null
          extraction_error?: string | null
          gaps?: Json
          id?: string
          keywords?: Json
          method?: string
          parsed_fields?: Json
          parser_status?: string | null
          quality_breakdown?: Json
          resume_id?: string
          rewrites?: Json
          role_matches?: Json
          status?: string
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
      scores: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          points_awarded: number
          question_id: string
          selected_answer: string | null
          user_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean
          points_awarded?: number
          question_id: string
          selected_answer?: string | null
          user_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          points_awarded?: number
          question_id?: string
          selected_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json
          route: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          route?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          route?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          latency_ms: number | null
          message: string | null
          metadata: Json
          route: string | null
          severity: string
          source: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          latency_ms?: number | null
          message?: string | null
          metadata?: Json
          route?: string | null
          severity?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          latency_ms?: number | null
          message?: string | null
          metadata?: Json
          route?: string | null
          severity?: string
          source?: string | null
        }
        Relationships: []
      }
      target_roles: {
        Row: {
          benchmark_ranges: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          skill_weights: Json
          slug: string
        }
        Insert: {
          benchmark_ranges?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          skill_weights?: Json
          slug: string
        }
        Update: {
          benchmark_ranges?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          skill_weights?: Json
          slug?: string
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
      questions_public: {
        Row: {
          assessment_id: string | null
          created_at: string | null
          id: string | null
          options: Json | null
          order_index: number | null
          points: number | null
          prompt: string | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string | null
          id?: string | null
          options?: Json | null
          order_index?: number | null
          points?: number | null
          prompt?: string | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string | null
          id?: string | null
          options?: Json | null
          order_index?: number | null
          points?: number | null
          prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_action_cooldown: {
        Args: { _action: string; _cooldown_seconds: number }
        Returns: number
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_usage: {
        Args: { _feature: string; _hard_cap: number; _user_id: string }
        Returns: number
      }
      log_security_event: {
        Args: {
          _event_type: string
          _ip?: string
          _metadata?: Json
          _route?: string
          _severity?: string
          _user_agent?: string
        }
        Returns: string
      }
      log_system_event: {
        Args: {
          _event_type: string
          _latency_ms?: number
          _message?: string
          _metadata?: Json
          _route?: string
          _severity?: string
          _source?: string
        }
        Returns: string
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      prune_failed_resume_analyses: {
        Args: { _older_than_days?: number }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      system_health_summary: { Args: never; Returns: Json }
    }
    Enums: {
      app_role:
        | "student"
        | "recruiter"
        | "college_admin"
        | "institute_admin"
        | "gov_admin"
        | "admin"
      assessment_category:
        | "sql"
        | "python"
        | "resume"
        | "power_bi"
        | "tableau"
        | "excel"
        | "statistics"
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
      assessment_category: [
        "sql",
        "python",
        "resume",
        "power_bi",
        "tableau",
        "excel",
        "statistics",
      ],
    },
  },
} as const

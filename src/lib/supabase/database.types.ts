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
      challenges: {
        Row: {
          created_at: string
          deadline: string
          id: string
          league_id: string
          prompt: string
          scoring_criteria: Json
          sponsor_id: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          deadline: string
          id: string
          league_id: string
          prompt: string
          scoring_criteria?: Json
          sponsor_id?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          deadline?: string
          id?: string
          league_id?: string
          prompt?: string
          scoring_criteria?: Json
          sponsor_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          id: string
          label: string
          sort_order?: number
        }
        Update: {
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      league_enrollments: {
        Row: {
          enrolled_at: string
          league_id: string
          participant_id: string
          status: string
        }
        Insert: {
          enrolled_at?: string
          league_id: string
          participant_id: string
          status?: string
        }
        Update: {
          enrolled_at?: string
          league_id?: string
          participant_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_enrollments_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_enrollments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      league_hosts: {
        Row: {
          created_at: string
          id: string
          name: string
          organization: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          organization: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization?: string
        }
        Relationships: []
      }
      leagues: {
        Row: {
          created_at: string
          host_id: string
          id: string
          name: string
          season_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          host_id: string
          id: string
          name: string
          season_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          host_id?: string
          id?: string
          name?: string
          season_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leagues_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "league_hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leagues_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string
          discipline_id: string
          handle: string
          id: string
        }
        Insert: {
          created_at?: string
          discipline_id: string
          handle: string
          id: string
        }
        Update: {
          created_at?: string
          discipline_id?: string
          handle?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          criteria_scores: Json
          id: string
          judge_id: string
          rationale: string
          scored_at: string
          submission_id: string
          total_score: number
        }
        Insert: {
          criteria_scores?: Json
          id: string
          judge_id: string
          rationale: string
          scored_at?: string
          submission_id: string
          total_score: number
        }
        Update: {
          criteria_scores?: Json
          id?: string
          judge_id?: string
          rationale?: string
          scored_at?: string
          submission_id?: string
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "scores_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      season_periods: {
        Row: {
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          id: string
          label: string
          sort_order?: number
        }
        Update: {
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          period_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id: string
          name: string
          period_id: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          period_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "season_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_attachments: {
        Row: {
          attached_at: string
          brief: Json
          challenge_id: string
          id: string
          outcome: Json | null
          sponsor_id: string
        }
        Insert: {
          attached_at?: string
          brief: Json
          challenge_id: string
          id: string
          outcome?: Json | null
          sponsor_id: string
        }
        Update: {
          attached_at?: string
          brief?: Json
          challenge_id?: string
          id?: string
          outcome?: Json | null
          sponsor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_attachments_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_attachments_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          contact_email: string
          created_at: string
          id: string
          name: string
          organization: string
        }
        Insert: {
          contact_email: string
          created_at?: string
          id: string
          name: string
          organization: string
        }
        Update: {
          contact_email?: string
          created_at?: string
          id?: string
          name?: string
          organization?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          artifact: Json
          challenge_id: string
          id: string
          is_public: boolean
          participant_id: string
          submitted_at: string
        }
        Insert: {
          artifact: Json
          challenge_id: string
          id: string
          is_public?: boolean
          participant_id: string
          submitted_at?: string
        }
        Update: {
          artifact?: Json
          challenge_id?: string
          id?: string
          is_public?: boolean
          participant_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          joined_at: string
          participant_id: string
          team_id: string
        }
        Insert: {
          joined_at?: string
          participant_id: string
          team_id: string
        }
        Update: {
          joined_at?: string
          participant_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          league_id: string
          name: string
        }
        Insert: {
          created_at?: string
          id: string
          league_id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const

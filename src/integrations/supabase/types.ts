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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      championships: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          nome: string
          regras_pontuacao: Json | null
          status: Database["public"]["Enums"]["championship_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          nome: string
          regras_pontuacao?: Json | null
          status?: Database["public"]["Enums"]["championship_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          nome?: string
          regras_pontuacao?: Json | null
          status?: Database["public"]["Enums"]["championship_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "championships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          capacidade_times: number | null
          championship_id: string
          created_at: string | null
          id: string
          nome_grupo: string
        }
        Insert: {
          capacidade_times?: number | null
          championship_id: string
          created_at?: string | null
          id?: string
          nome_grupo: string
        }
        Update: {
          capacidade_times?: number | null
          championship_id?: string
          created_at?: string | null
          id?: string
          nome_grupo?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          championship_id: string
          created_at: string | null
          data_hora_queda: string | null
          group_id: string | null
          id: string
          ordem_queda: number
          status: Database["public"]["Enums"]["match_status"] | null
        }
        Insert: {
          championship_id: string
          created_at?: string | null
          data_hora_queda?: string | null
          group_id?: string | null
          id?: string
          ordem_queda: number
          status?: Database["public"]["Enums"]["match_status"] | null
        }
        Update: {
          championship_id?: string
          created_at?: string | null
          data_hora_queda?: string | null
          group_id?: string | null
          id?: string
          ordem_queda?: number
          status?: Database["public"]["Enums"]["match_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      print_evidence: {
        Row: {
          ai_extracted_data: Json | null
          confidence_score: number | null
          data_upload: string | null
          id: string
          match_id: string
          status_processamento:
            | Database["public"]["Enums"]["print_status"]
            | null
          uploaded_by: string | null
          url_imagem: string
        }
        Insert: {
          ai_extracted_data?: Json | null
          confidence_score?: number | null
          data_upload?: string | null
          id?: string
          match_id: string
          status_processamento?:
            | Database["public"]["Enums"]["print_status"]
            | null
          uploaded_by?: string | null
          url_imagem: string
        }
        Update: {
          ai_extracted_data?: Json | null
          confidence_score?: number | null
          data_upload?: string | null
          id?: string
          match_id?: string
          status_processamento?:
            | Database["public"]["Enums"]["print_status"]
            | null
          uploaded_by?: string | null
          url_imagem?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_evidence_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          data_registro: string | null
          id: string
          kills: number | null
          match_id: string
          pontos_obtidos: number | null
          posicao_final: number | null
          team_id: string
        }
        Insert: {
          data_registro?: string | null
          id?: string
          kills?: number | null
          match_id: string
          pontos_obtidos?: number | null
          posicao_final?: number | null
          team_id: string
        }
        Update: {
          data_registro?: string | null
          id?: string
          kills?: number | null
          match_id?: string
          pontos_obtidos?: number | null
          posicao_final?: number | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          championship_id: string
          created_at: string | null
          group_id: string | null
          id: string
          logo_url: string | null
          nome_line: string
          nome_time: string
          tag: string | null
        }
        Insert: {
          championship_id: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          logo_url?: string | null
          nome_line: string
          nome_time: string
          tag?: string | null
        }
        Update: {
          championship_id?: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          logo_url?: string | null
          nome_line?: string
          nome_time?: string
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          joined_at: string | null
          role: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          data_criacao: string | null
          id: string
          manager_id: string | null
          nome: string
          status: string | null
        }
        Insert: {
          data_criacao?: string | null
          id?: string
          manager_id?: string | null
          nome: string
          status?: string | null
        }
        Update: {
          data_criacao?: string | null
          id?: string
          manager_id?: string | null
          nome?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenants_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          data_cadastro: string | null
          email: string
          id: string
          nome_usuario: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
        }
        Insert: {
          auth_user_id?: string | null
          data_cadastro?: string | null
          email: string
          id?: string
          nome_usuario: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
        }
        Update: {
          auth_user_id?: string | null
          data_cadastro?: string | null
          email?: string
          id?: string
          nome_usuario?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      app_role: "manager" | "co-manager" | "team-captain" | "player" | "viewer" | "super_admin"
      championship_status: "rascunho" | "ativo" | "finalizado"
      match_status:
        | "pendente"
        | "processando"
        | "concluido"
        | "erro_ia"
        | "validacao_manual"
      print_status: "pendente" | "processado" | "erro" | "baixa_qualidade"
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
      app_role: ["manager", "co-manager", "team-captain", "player", "viewer", "super_admin"],
      championship_status: ["rascunho", "ativo", "finalizado"],
      match_status: [
        "pendente",
        "processando",
        "concluido",
        "erro_ia",
        "validacao_manual",
      ],
      print_status: ["pendente", "processado", "erro", "baixa_qualidade"],
    },
  },
} as const

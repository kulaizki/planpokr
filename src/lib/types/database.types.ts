export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          created_at: string
          name: string
          status: string
          current_round: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          status?: string
          current_round?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          status?: string
          current_round?: number | null
        }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          game_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            referencedRelation: "games"
            referencedColumns: ["id"]
          }
        ]
      }
      votes: {
        Row: {
          id: string
          player_id: string
          game_id: string
          round: number
          vote: string
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          game_id: string
          round: number
          vote: string
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          game_id?: string
          round?: number
          vote?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_game_id_fkey"
            columns: ["game_id"]
            referencedRelation: "games"
            referencedColumns: ["id"]
          }
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

// Convenience types for database tables
export type Game = Database['public']['Tables']['games']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']

// Insert types
export type GameInsert = Database['public']['Tables']['games']['Insert']
export type PlayerInsert = Database['public']['Tables']['players']['Insert']
export type VoteInsert = Database['public']['Tables']['votes']['Insert']

// Update types
export type GameUpdate = Database['public']['Tables']['games']['Update']
export type PlayerUpdate = Database['public']['Tables']['players']['Update']
export type VoteUpdate = Database['public']['Tables']['votes']['Update'] 
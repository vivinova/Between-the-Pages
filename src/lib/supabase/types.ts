// Hand-written to match supabase/migrations/*.sql. Once the Supabase CLI is
// available, regenerate with:
//   supabase gen types typescript --local > src/lib/supabase/types.ts
// and reconcile with any hand-added JSDoc.

export type UserRole = "user" | "moderator" | "admin";

export type ContentLabel =
  | "grief_death"
  | "self_harm"
  | "abuse_violence"
  | "eating_disorders"
  | "addiction"
  | "sexual_content";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          age_confirmed: boolean;
          blocked_labels: ContentLabel[];
          notification_settings: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          age_confirmed?: boolean;
          blocked_labels?: ContentLabel[];
          notification_settings?: Record<string, unknown>;
        };
        Update: Partial<{
          role: UserRole;
          age_confirmed: boolean;
          blocked_labels: ContentLabel[];
          notification_settings: Record<string, unknown>;
        }>;
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          owner_id: string;
          prompt_id: string | null;
          title: string | null;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          prompt_id?: string | null;
          title?: string | null;
          body?: string;
        };
        Update: Partial<{
          prompt_id: string | null;
          title: string | null;
          body: string;
        }>;
        Relationships: [];
      };
      prompts: {
        Row: {
          id: string;
          prompt_text: string;
          theme: string | null;
          active_date: string | null;
          status: "draft" | "active" | "archived";
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_text: string;
          theme?: string | null;
          active_date?: string | null;
          status?: "draft" | "active" | "archived";
        };
        Update: Partial<{
          prompt_text: string;
          theme: string | null;
          active_date: string | null;
          status: "draft" | "active" | "archived";
        }>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

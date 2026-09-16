// Hand-written to match supabase/migrations/*.sql. Once the Supabase CLI is
// available, regenerate with:
//   supabase gen types typescript --local > src/lib/supabase/types.ts
// and reconcile with any hand-added JSDoc.

export type ModerationState = "pending_review" | "published" | "removed";
export type InteractionKind = "me_too" | "sending_love" | "reply";
export type ReportTarget = "confession" | "interaction";
export type ReportReviewState = "open" | "resolved" | "dismissed" | "escalated";

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          sort_order: number;
          is_hidden: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          sort_order?: number;
          is_hidden?: boolean;
        };
        Update: Partial<{
          slug: string;
          name: string;
          description: string;
          sort_order: number;
          is_hidden: boolean;
        }>;
        Relationships: [];
      };
      confessions: {
        Row: {
          id: string;
          category_id: string;
          body_text: string;
          moderation_state: ModerationState;
          moderation_reasons: string[];
          contact_email: string | null;
          email_opt_in: boolean;
          owner_token_hash: string;
          created_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          category_id: string;
          body_text: string;
          moderation_state?: ModerationState;
          moderation_reasons?: string[];
          contact_email?: string | null;
          email_opt_in?: boolean;
          owner_token_hash: string;
          published_at?: string | null;
        };
        Update: Partial<{
          moderation_state: ModerationState;
          moderation_reasons: string[];
          published_at: string | null;
        }>;
        Relationships: [];
      };
      interactions: {
        Row: {
          id: string;
          confession_id: string;
          type: InteractionKind;
          body_text: string | null;
          moderation_state: ModerationState;
          moderation_reasons: string[];
          fingerprint_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          confession_id: string;
          type: InteractionKind;
          body_text?: string | null;
          moderation_state: ModerationState;
          moderation_reasons?: string[];
          fingerprint_hash: string;
        };
        Update: Partial<{
          moderation_state: ModerationState;
          moderation_reasons: string[];
        }>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          target_type: ReportTarget;
          target_id: string;
          reason: string;
          reporter_fingerprint_hash: string;
          review_state: ReportReviewState;
          created_at: string;
        };
        Insert: {
          id?: string;
          target_type: ReportTarget;
          target_id: string;
          reason: string;
          reporter_fingerprint_hash: string;
          review_state?: ReportReviewState;
        };
        Update: Partial<{
          review_state: ReportReviewState;
        }>;
        Relationships: [];
      };
      rate_limit_events: {
        Row: {
          id: string;
          key: string;
          action: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          action: string;
        };
        Update: never;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor?: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      // Column-restricted read surface for anon/authenticated — see the
      // migration for why contact_email/email_opt_in/owner_token_hash/
      // moderation_reasons are deliberately absent here.
      public_confessions: {
        Row: {
          id: string;
          category_id: string;
          body_text: string;
          created_at: string;
          published_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
}

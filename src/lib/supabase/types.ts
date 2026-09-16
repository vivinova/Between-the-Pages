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

export type BookModerationState =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "removed"
  | "archived";

export type ReportReason =
  | "harassment"
  | "hate_speech"
  | "dangerous_advice"
  | "graphic_content"
  | "personal_information"
  | "spam"
  | "incorrect_labels"
  | "immediate_safety_concern"
  | "other";

export type InteractionType = "needed_this" | "pressed_flower" | "margin_note";

export type InteractionModerationState =
  | "pending_review"
  | "published"
  | "rejected"
  | "removed";

export type NotificationType =
  | "needed_this"
  | "pressed_flower"
  | "margin_note_approved"
  | "margin_note_rejected";

export type ReportReviewState = "open" | "reviewing" | "resolved" | "dismissed" | "escalated";

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
          reduced_motion: boolean;
          default_allow_margin_notes: boolean;
          default_notes_visible_to_readers: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          age_confirmed?: boolean;
          blocked_labels?: ContentLabel[];
          notification_settings?: Record<string, unknown>;
          reduced_motion?: boolean;
          default_allow_margin_notes?: boolean;
          default_notes_visible_to_readers?: boolean;
        };
        Update: Partial<{
          role: UserRole;
          age_confirmed: boolean;
          blocked_labels: ContentLabel[];
          notification_settings: Record<string, unknown>;
          reduced_motion: boolean;
          default_allow_margin_notes: boolean;
          default_notes_visible_to_readers: boolean;
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
      shelves: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          sort_order: number;
          is_hidden: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          is_hidden?: boolean;
        };
        Update: Partial<{
          slug: string;
          name: string;
          description: string | null;
          sort_order: number;
          is_hidden: boolean;
        }>;
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          owner_id: string;
          source_entry_id: string | null;
          excerpt_text: string;
          shelf_id: string;
          labels: ContentLabel[];
          allow_margin_notes: boolean;
          notes_visible_to_readers: boolean;
          moderation_state: BookModerationState;
          moderation_reasons: string[];
          view_count: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          archived_at: string | null;
          removed_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          source_entry_id?: string | null;
          excerpt_text: string;
          shelf_id: string;
          labels?: ContentLabel[];
          allow_margin_notes?: boolean;
          notes_visible_to_readers?: boolean;
          moderation_state?: BookModerationState;
          moderation_reasons?: string[];
        };
        Update: Partial<{
          excerpt_text: string;
          shelf_id: string;
          labels: ContentLabel[];
          allow_margin_notes: boolean;
          notes_visible_to_readers: boolean;
          moderation_state: BookModerationState;
          moderation_reasons: string[];
          published_at: string | null;
          archived_at: string | null;
          removed_at: string | null;
        }>;
        Relationships: [];
      };
      bookmarks: {
        Row: {
          reader_id: string;
          book_id: string;
          created_at: string;
        };
        Insert: {
          reader_id: string;
          book_id: string;
        };
        Update: Partial<{
          reader_id: string;
          book_id: string;
        }>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          book_id: string | null;
          interaction_id: string | null;
          reason: ReportReason;
          review_state: ReportReviewState;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          book_id?: string | null;
          interaction_id?: string | null;
          reason: ReportReason;
          review_state?: ReportReviewState;
        };
        Update: Partial<{
          review_state: ReportReviewState;
        }>;
        Relationships: [];
      };
      interactions: {
        Row: {
          id: string;
          book_id: string;
          reader_id: string;
          type: InteractionType;
          note_text: string | null;
          moderation_state: InteractionModerationState;
          moderation_reasons: string[];
          is_visible_to_readers: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          reader_id: string;
          type: InteractionType;
          note_text?: string | null;
          moderation_state?: InteractionModerationState;
          moderation_reasons?: string[];
          is_visible_to_readers?: boolean;
        };
        Update: Partial<{
          note_text: string | null;
          moderation_state: InteractionModerationState;
          moderation_reasons: string[];
          is_visible_to_readers: boolean;
        }>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          type: NotificationType;
          book_id: string | null;
          interaction_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          type: NotificationType;
          book_id?: string | null;
          interaction_id?: string | null;
          read_at?: string | null;
        };
        Update: Partial<{
          read_at: string | null;
        }>;
        Relationships: [];
      };
      rate_limit_events: {
        Row: {
          id: string;
          actor_id: string;
          action: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          action: string;
        };
        Update: never;
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
    Functions: {
      increment_book_view_count: {
        Args: { target_book_id: string };
        Returns: undefined;
      };
    };
  };
}

import type { ContentLabel } from "@/lib/supabase/types";

export const CONTENT_LABELS: { value: ContentLabel; name: string }[] = [
  { value: "grief_death", name: "Grief and death" },
  { value: "self_harm", name: "Self-harm or suicidal thoughts" },
  { value: "abuse_violence", name: "Abuse or violence" },
  { value: "eating_disorders", name: "Eating disorders" },
  { value: "addiction", name: "Addiction" },
  { value: "sexual_content", name: "Sexual content" },
];

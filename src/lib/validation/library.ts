import { z } from "zod";

export const reportReasonSchema = z.enum([
  "harassment",
  "hate_speech",
  "dangerous_advice",
  "graphic_content",
  "personal_information",
  "spam",
  "incorrect_labels",
  "immediate_safety_concern",
  "other",
]);

export const reportBookSchema = z.object({
  bookId: z.string().uuid(),
  reason: reportReasonSchema,
});

export type ReportBookInput = z.infer<typeof reportBookSchema>;

export const reportInteractionSchema = z.object({
  interactionId: z.string().uuid(),
  reason: reportReasonSchema,
});

export type ReportInteractionInput = z.infer<typeof reportInteractionSchema>;

import { z } from "zod";

export const marginNoteSchema = z.object({
  bookId: z.string().uuid(),
  noteText: z
    .string()
    .trim()
    .min(1, "Write something before submitting.")
    .max(240, "Margin notes are limited to 240 characters."),
});

export type MarginNoteInput = z.infer<typeof marginNoteSchema>;

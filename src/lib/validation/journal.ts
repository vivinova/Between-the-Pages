import { z } from "zod";

export const journalEntrySchema = z.object({
  title: z.string().trim().max(200, "Titles are limited to 200 characters.").optional(),
  body: z.string().max(20000, "Entries are limited to 20,000 characters."),
  promptId: z.string().uuid().nullable().optional(),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;

export const journalSearchSchema = z.object({
  query: z.string().trim().max(200).optional(),
});

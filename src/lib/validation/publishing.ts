import { z } from "zod";

const contentLabelEnum = z.enum([
  "grief_death",
  "self_harm",
  "abuse_violence",
  "eating_disorders",
  "addiction",
  "sexual_content",
]);

export const submitBookSchema = z
  .object({
    sourceEntryId: z.string().uuid(),
    excerptText: z
      .string()
      .trim()
      .min(1, "Write or select at least a few words to share.")
      .max(500, "Passages are limited to 500 characters."),
    shelfId: z.string().uuid("Choose a shelf."),
    labels: z.array(contentLabelEnum).max(contentLabelEnum.options.length),
    allowMarginNotes: z.boolean(),
    notesVisibleToReaders: z.boolean(),
    confirmedPrivacy: z.literal(true, {
      errorMap: () => ({
        message: "Confirm that the rest of your journal entry stays private.",
      }),
    }),
    confirmedAnonymous: z.literal(true, {
      errorMap: () => ({ message: "Confirm that this passage will be shared anonymously." }),
    }),
  })
  .refine((data) => data.allowMarginNotes || !data.notesVisibleToReaders, {
    message: "Notes can only be shown to readers if margin notes are allowed.",
    path: ["notesVisibleToReaders"],
  });

export type SubmitBookInput = z.infer<typeof submitBookSchema>;

import { z } from "zod";
import { REPORT_REASON_VALUES } from "@/lib/report-reasons";

export const reactionTypeSchema = z.enum(["me_too", "sending_love"]);
export type ReactionType = z.infer<typeof reactionTypeSchema>;

export const toggleReactionSchema = z.object({
  confessionId: z.string().uuid(),
  type: reactionTypeSchema,
});

export const submitReplySchema = z.object({
  confessionId: z.string().uuid(),
  bodyText: z
    .string()
    .trim()
    .min(1, "Write something before replying.")
    .max(500, "That's too long — keep it under 500 characters."),
});

export const reportSchema = z.object({
  targetType: z.enum(["confession", "interaction"]),
  targetId: z.string().uuid(),
  reason: z.enum(REPORT_REASON_VALUES),
});

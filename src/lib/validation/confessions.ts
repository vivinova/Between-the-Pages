import { z } from "zod";

export const submitConfessionSchema = z
  .object({
    categoryId: z.string().uuid("Choose a category."),
    bodyText: z
      .string()
      .trim()
      .min(20, "Say a little more — at least 20 characters.")
      .max(3000, "That's too long — keep it under 3000 characters."),
    emailOptIn: z.boolean().default(false),
    contactEmail: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => !data.emailOptIn || !!data.contactEmail, {
    message: "Enter an email address, or turn off the email option.",
    path: ["contactEmail"],
  });

export type SubmitConfessionInput = z.infer<typeof submitConfessionSchema>;

export const deleteConfessionSchema = z.object({
  confessionId: z.string().uuid(),
  ownerToken: z.string().min(1, "Missing delete token."),
});

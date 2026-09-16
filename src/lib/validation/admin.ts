import { z } from "zod";

export const createShelfSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  name: z.string().trim().min(1, "Name is required.").max(100),
  description: z.string().trim().max(500).optional(),
});

export const updateShelfSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  description: z.string().trim().max(500).optional(),
  isHidden: z.boolean(),
});

export const createPromptSchema = z.object({
  promptText: z.string().trim().min(1, "Prompt text is required.").max(500),
  theme: z.string().trim().max(60).optional(),
});

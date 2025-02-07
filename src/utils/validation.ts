
import { z } from "zod";

export const urlSchema = z.object({
  github: z
    .string()
    .url()
    .regex(/^https:\/\/github\.com\/[a-zA-Z0-9-]+\/?$/i, "Invalid GitHub URL format"),
  linkedin: z
    .string()
    .url()
    .regex(/^https:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/i, "Invalid LinkedIn URL format"),
  portfolio: z.string().url("Must be a valid URL"),
});

export type UrlInputs = z.infer<typeof urlSchema>;

import { z } from "zod";

export const commentSchema = z.object({
  requestId: z.number().int().positive(),
  text: z
    .string()
    .trim()
    .min(1, "Please share a short message for the requester.")
    .max(500, "Keep comments under 500 characters."),
});

export type CommentInput = z.infer<typeof commentSchema>;

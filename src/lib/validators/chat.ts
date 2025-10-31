import { z } from "zod";

export const chatMessageSchema = z.object({
  receiverId: z.number().int().positive(),
  text: z
    .string()
    .trim()
    .min(1, "Please enter a message before sending.")
    .max(2000, "Messages should stay under 2000 characters."),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

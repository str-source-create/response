import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  HOSTAWAY_ACCOUNT_ID: z.string().min(1),
  HOSTAWAY_API_KEY: z.string().min(1),
  HOSTAWAY_BASE_URL: z.string().default("https://api.hostaway.com/v1"),
  HOSTAWAY_LISTINGS_PATH: z.string().default("/listings"),
  HOSTAWAY_RESERVATIONS_PATH: z.string().default("/reservations"),
  HOSTAWAY_CONVERSATIONS_PATH: z.string().default("/conversations"),
  HOSTAWAY_CONVERSATION_MESSAGES_TEMPLATE: z
    .string()
    .default("/conversations/{conversationId}/messages"),
});

export const env = envSchema.parse(process.env);

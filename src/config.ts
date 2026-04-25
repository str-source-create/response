import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  HOSTAWAY_BASE_URL: z.string().url().default("https://api.hostaway.com"),
  HOSTAWAY_CLIENT_ID: z.string().min(1, "HOSTAWAY_CLIENT_ID is required"),
  HOSTAWAY_CLIENT_SECRET: z.string().min(1, "HOSTAWAY_CLIENT_SECRET is required"),
  HOSTAWAY_TOKEN_PATH: z.string().default("/v1/accessTokens"),
  HOSTAWAY_LISTINGS_PATH: z.string().default("/v1/listings"),
  HOSTAWAY_RESERVATIONS_PATH: z.string().default("/v1/reservations"),
  HOSTAWAY_CONVERSATIONS_PATH: z.string().default("/v1/conversations"),
  HOSTAWAY_MESSAGES_PATH: z.string().default("/v1/messages")
});

const parsed = ConfigSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${formatted}`);
}

export const config = parsed.data;

import { z } from "zod";

// ==============================================================================
// Server-Side Environment Schema (ENV-2, ENV-3, ENV-4)
// ==============================================================================
export const ServerEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_BASE_URL: z.string().url().default("http://localhost:3000"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

    // Database
    DATABASE_URL: z.string().url(),
    DATABASE_MIGRATION_URL: z.string().url().optional(),

    // Auth
    AUTH_SECRET: z.string().min(16),
    AUTH_ISSUER_URL: z.string().url().default("http://localhost:3000"),
    AUTH_CLIENT_ID: z.string().default("dispatchx-web"),
    AUTH_CLIENT_SECRET: z.string().optional(),

    // Worker & Optimization
    OPTIMIZER_BASE_URL: z.string().url().default("http://localhost:8000"),
    OPTIMIZER_SHARED_SECRET: z.string().min(16),

    // Routing
    VALHALLA_BASE_URL: z.string().url().default("http://localhost:8002"),
    PHOTON_BASE_URL: z.string().url().optional(),

    // Voice & Speech AI (ElevenLabs)
    ELEVENLABS_API_KEY: z.string().optional(),
    ELEVENLABS_VOICE_ID: z.string().optional(),
    ELEVENLABS_MODEL_ID: z.string().default("eleven_multilingual_v2").optional(),

    // Local Speech Models
    STT_MODEL_PATH: z.string().optional(),
    TTS_MODEL_PATH: z.string().optional(),

    // Object Storage
    AUDIO_STORAGE_ENDPOINT: z.string().url().optional(),
    AUDIO_STORAGE_BUCKET: z.string().optional(),
    AUDIO_STORAGE_ACCESS_KEY: z.string().optional(),
    AUDIO_STORAGE_SECRET_KEY: z.string().optional(),

    // Observability
    SENTRY_DSN: z.string().url().optional(),
  })
  // ENV-4: Optional groups validated together
  .refine(
    (data) => {
      if (data.ELEVENLABS_API_KEY && !data.ELEVENLABS_VOICE_ID) {
        return false;
      }
      return true;
    },
    {
      message: "ELEVENLABS_VOICE_ID is required when ELEVENLABS_API_KEY is provided",
      path: ["ELEVENLABS_VOICE_ID"],
    }
  )
  .refine(
    (data) => {
      const storageFields = [
        data.AUDIO_STORAGE_ENDPOINT,
        data.AUDIO_STORAGE_BUCKET,
        data.AUDIO_STORAGE_ACCESS_KEY,
        data.AUDIO_STORAGE_SECRET_KEY,
      ];
      const anyProvided = storageFields.some(Boolean);
      const allProvided = storageFields.every(Boolean);
      return !anyProvided || allProvided;
    },
    {
      message:
        "All audio storage fields (ENDPOINT, BUCKET, ACCESS_KEY, SECRET_KEY) must be provided together",
      path: ["AUDIO_STORAGE_ENDPOINT"],
    }
  );

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

// ==============================================================================
// Client-Side Environment Schema (ENV-1, ENV-2)
// ==============================================================================
export const ClientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("DispatchX"),
  NEXT_PUBLIC_MAP_STYLE_URL: z
    .string()
    .url()
    .default("https://demotiles.maplibre.org/style.json"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3000/api/v1"),
  NEXT_PUBLIC_WS_URL: z.string().default("ws://localhost:3000/api/v1/ws"),
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;

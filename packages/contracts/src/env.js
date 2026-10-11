"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientEnvSchema = exports.ServerEnvSchema = void 0;
const zod_1 = require("zod");
// ==============================================================================
// Server-Side Environment Schema (ENV-2, ENV-3, ENV-4)
// ==============================================================================
exports.ServerEnvSchema = zod_1.z
    .object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    APP_BASE_URL: zod_1.z.string().url().default("http://localhost:3000"),
    LOG_LEVEL: zod_1.z.enum(["debug", "info", "warn", "error"]).default("info"),
    // Database
    DATABASE_URL: zod_1.z.string().url(),
    DATABASE_MIGRATION_URL: zod_1.z.string().url().optional(),
    // Auth
    AUTH_SECRET: zod_1.z.string().min(16),
    AUTH_ISSUER_URL: zod_1.z.string().url().default("http://localhost:3000"),
    AUTH_CLIENT_ID: zod_1.z.string().default("dispatchx-web"),
    AUTH_CLIENT_SECRET: zod_1.z.string().optional(),
    // Worker & Optimization
    OPTIMIZER_BASE_URL: zod_1.z.string().url().default("http://localhost:8000"),
    OPTIMIZER_SHARED_SECRET: zod_1.z.string().min(16),
    // Routing
    VALHALLA_BASE_URL: zod_1.z.string().url().default("http://localhost:8002"),
    PHOTON_BASE_URL: zod_1.z.string().url().optional(),
    // Voice & Speech AI (ElevenLabs)
    ELEVENLABS_API_KEY: zod_1.z.string().optional(),
    ELEVENLABS_VOICE_ID: zod_1.z.string().optional(),
    ELEVENLABS_MODEL_ID: zod_1.z.string().default("eleven_multilingual_v2").optional(),
    // Local Speech Models
    STT_MODEL_PATH: zod_1.z.string().optional(),
    TTS_MODEL_PATH: zod_1.z.string().optional(),
    // Object Storage
    AUDIO_STORAGE_ENDPOINT: zod_1.z.string().url().optional(),
    AUDIO_STORAGE_BUCKET: zod_1.z.string().optional(),
    AUDIO_STORAGE_ACCESS_KEY: zod_1.z.string().optional(),
    AUDIO_STORAGE_SECRET_KEY: zod_1.z.string().optional(),
    // Observability
    SENTRY_DSN: zod_1.z.string().url().optional(),
})
    // ENV-4: Optional groups validated together
    .refine((data) => {
    if (data.ELEVENLABS_API_KEY && !data.ELEVENLABS_VOICE_ID) {
        return false;
    }
    return true;
}, {
    message: "ELEVENLABS_VOICE_ID is required when ELEVENLABS_API_KEY is provided",
    path: ["ELEVENLABS_VOICE_ID"],
})
    .refine((data) => {
    const storageFields = [
        data.AUDIO_STORAGE_ENDPOINT,
        data.AUDIO_STORAGE_BUCKET,
        data.AUDIO_STORAGE_ACCESS_KEY,
        data.AUDIO_STORAGE_SECRET_KEY,
    ];
    const anyProvided = storageFields.some(Boolean);
    const allProvided = storageFields.every(Boolean);
    return !anyProvided || allProvided;
}, {
    message: "All audio storage fields (ENDPOINT, BUCKET, ACCESS_KEY, SECRET_KEY) must be provided together",
    path: ["AUDIO_STORAGE_ENDPOINT"],
});
// ==============================================================================
// Client-Side Environment Schema (ENV-1, ENV-2)
// ==============================================================================
exports.ClientEnvSchema = zod_1.z.object({
    NEXT_PUBLIC_APP_NAME: zod_1.z.string().default("DispatchX"),
    NEXT_PUBLIC_MAP_STYLE_URL: zod_1.z
        .string()
        .url()
        .default("https://demotiles.maplibre.org/style.json"),
    NEXT_PUBLIC_API_URL: zod_1.z.string().url().default("http://localhost:3000/api/v1"),
    NEXT_PUBLIC_WS_URL: zod_1.z.string().default("ws://localhost:3000/api/v1/ws"),
});

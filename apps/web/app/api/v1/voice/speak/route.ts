import { NextRequest, NextResponse } from "next/server";
import { generateElevenLabsSpeech } from "@/lib/voice/elevenlabs";

export async function POST(req: NextRequest) {
  try {
    const { text, voice_id } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'text' payload" }, { status: 400 });
    }

    const audioBuffer = await generateElevenLabsSpeech(text, voice_id);

    if (audioBuffer) {
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // If ElevenLabs API key is not configured, inform client to use Web Speech API fallback
    return NextResponse.json({
      fallback_to_speech_synth: true,
      text,
      message: "ElevenLabs API key not configured. Using client-side Web Speech synthesis fallback.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "TTS error" }, { status: 500 });
  }
}

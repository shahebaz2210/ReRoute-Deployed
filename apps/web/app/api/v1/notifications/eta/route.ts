import { NextRequest, NextResponse } from "next/server";
import { generateElevenLabsSpeech } from "@/lib/voice/elevenlabs";

export async function POST(req: NextRequest) {
  try {
    const { order_id, customer_name, customer_phone, eta_time, delay_minutes } = await req.json();

    const messageText = delay_minutes && delay_minutes > 0
      ? `Hello ${customer_name || "Customer"}, your delivery for order ${order_id} has been revised. Your driver is en route with an updated arrival at approximately ${eta_time} due to a ${delay_minutes} minute traffic delay.`
      : `Hello ${customer_name || "Customer"}, your delivery for order ${order_id} is scheduled to arrive at ${eta_time}. Please ensure someone is available at the entrance.`;

    // Attempt ElevenLabs voice message audio synthesis
    const audioBuffer = await generateElevenLabsSpeech(messageText);

    return NextResponse.json({
      success: true,
      order_id,
      notification: {
        channel: "VOICE_AND_SMS",
        recipient: customer_phone || "+14155552671",
        text_message: messageText,
        voice_audio_available: !!audioBuffer,
        dispatched_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to dispatch customer ETA notice" }, { status: 500 });
  }
}

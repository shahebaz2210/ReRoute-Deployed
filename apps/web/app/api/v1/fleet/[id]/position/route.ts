import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PositionUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speedKmh: z.number().min(0).optional(),
  odometerKm: z.number().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = PositionUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { latitude, longitude, heading, speedKmh } = parsed.data;

    // Log live vehicle position telemetry
    console.info(`[TELEMETRY] Vehicle ${id} position update: lat=${latitude}, lng=${longitude}, speed=${speedKmh || 0} km/h`);

    return NextResponse.json({
      success: true,
      vehicleId: id,
      position: {
        latitude,
        longitude,
        heading: heading ?? 0,
        speedKmh: speedKmh ?? 0,
        recordedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to update vehicle position" },
      { status: 500 }
    );
  }
}

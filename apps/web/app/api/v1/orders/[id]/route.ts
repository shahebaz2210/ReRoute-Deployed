import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateOrderSchema = z.object({
  deliveryAddress: z.string().optional(),
  timeWindowStart: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
  timeWindowEnd: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
  status: z.enum(["PENDING", "IN_TRANSIT", "DELIVERED", "FAILED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_FAILED", details: parsed.error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: id,
      updatedFields: parsed.data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to update order" },
      { status: 500 }
    );
  }
}

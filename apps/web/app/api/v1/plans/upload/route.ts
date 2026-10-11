import { NextRequest, NextResponse } from "next/server";
import { parseDeliveryPlanBuffer } from "@/lib/ingestion/plan-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "NO_FILE_PROVIDED", message: "Please select an Excel (.xlsx/.xls) or CSV delivery plan file." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = parseDeliveryPlanBuffer(buffer, file.name);

    return NextResponse.json(result, {
      status: result.success ? 200 : 422,
    });
  } catch (error: unknown) {
    console.error("Plan upload failed:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Failed to process delivery plan file." },
      { status: 500 }
    );
  }
}

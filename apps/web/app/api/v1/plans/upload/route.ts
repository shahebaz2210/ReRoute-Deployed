import { NextRequest, NextResponse } from "next/server";
import { parseDeliveryPlanBuffer, parseVehiclesPlanBuffer } from "@/lib/ingestion/plan-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const ordersFile = (formData.get("ordersFile") || formData.get("file")) as File | null;
    const vehiclesFile = formData.get("vehiclesFile") as File | null;

    if (!ordersFile && !vehiclesFile) {
      return NextResponse.json(
        { error: "NO_FILE_PROVIDED", message: "Please select orders.csv and vehicles.csv files." },
        { status: 400 }
      );
    }

    let ordersResult = null;
    let vehiclesResult = null;

    if (ordersFile) {
      const ordersBuffer = Buffer.from(await ordersFile.arrayBuffer());
      ordersResult = parseDeliveryPlanBuffer(ordersBuffer, ordersFile.name);
    }

    if (vehiclesFile) {
      const vehiclesBuffer = Buffer.from(await vehiclesFile.arrayBuffer());
      const defaultDepot = ordersResult && ordersResult.validRows.length > 0
        ? {
            latitude: ordersResult.validRows.reduce((s, r) => s + r.latitude, 0) / ordersResult.validRows.length,
            longitude: ordersResult.validRows.reduce((s, r) => s + r.longitude, 0) / ordersResult.validRows.length,
          }
        : { latitude: 18.5018, longitude: 73.8586 };

      vehiclesResult = parseVehiclesPlanBuffer(vehiclesBuffer, vehiclesFile.name, defaultDepot);
    }

    const overallSuccess = (ordersResult ? ordersResult.success : true) && (vehiclesResult ? vehiclesResult.success : true);

    return NextResponse.json({
      success: overallSuccess,
      ordersResult,
      vehiclesResult,
      depotCenter: vehiclesResult?.depotCenter || {
        id: "DEPOT-PUNE-SWARGATE",
        latitude: 18.5018,
        longitude: 73.8586,
      },
    }, {
      status: overallSuccess ? 200 : 422,
    });
  } catch (error: unknown) {
    console.error("Plan upload failed:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Failed to process delivery plan files." },
      { status: 500 }
    );
  }
}

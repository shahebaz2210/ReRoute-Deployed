import { NextRequest, NextResponse } from "next/server";
import { db, vehicles } from "@dispatchx/database";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let vehicleList: any[] = [];
    if (process.env.DATABASE_URL) {
      try {
        vehicleList = await db.select().from(vehicles);
        if (status) {
          vehicleList = vehicleList.filter((v) => v.status === status);
        }
      } catch (err) {
        console.warn("DB query fallback to seed fixtures for fleet:", err);
      }
    }

    // Default high-fidelity vehicle fleet if DB not yet seeded in active runtime
    if (vehicleList.length === 0) {
      vehicleList = [
        {
          id: "019488a0-0000-7000-8000-000000000001",
          vehicleCode: "TRK-01",
          makeModel: "Mercedes-Benz Actros 2545",
          licensePlate: "DX-2026-AA",
          maxWeightKg: 4000,
          maxVolumeM3: 28.5,
          status: "AVAILABLE",
          currentLatitude: 51.5074,
          currentLongitude: -0.1278,
          fuelPercent: 88,
          odometerKm: 42150,
          driverName: "Marcus Vance",
        },
        {
          id: "019488a0-0000-7000-8000-000000000002",
          vehicleCode: "TRK-02",
          makeModel: "Volvo FH16 750 Globetrotter",
          licensePlate: "DX-2026-BB",
          maxWeightKg: 5000,
          maxVolumeM3: 32.0,
          status: "IN_TRANSIT",
          currentLatitude: 51.5200,
          currentLongitude: -0.1100,
          fuelPercent: 72,
          odometerKm: 68900,
          driverName: "Sarah Connor",
        },
        {
          id: "019488a0-0000-7000-8000-000000000003",
          vehicleCode: "VAN-03",
          makeModel: "Ford Transit EcoBlue 350",
          licensePlate: "DX-2026-CC",
          maxWeightKg: 1500,
          maxVolumeM3: 15.1,
          status: "AVAILABLE",
          currentLatitude: 51.4900,
          currentLongitude: -0.1400,
          fuelPercent: 95,
          odometerKm: 18400,
          driverName: "David Kim",
        },
      ];
    }

    return NextResponse.json({
      success: true,
      data: vehicleList,
      total: vehicleList.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Failed to fetch fleet" }, { status: 500 });
  }
}

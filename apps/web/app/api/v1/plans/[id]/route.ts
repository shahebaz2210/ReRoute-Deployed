import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return NextResponse.json({
    success: true,
    data: {
      id,
      planName: "Morning Shift Dispatch Plan",
      status: "ACTIVE",
      activeVersionNumber: 1,
      depotId: "DEPOT-CENTRAL",
      totalOrders: 12,
      totalVehicles: 3,
      totalDistanceKm: 142.6,
      totalDurationMinutes: 380,
      routes: [
        {
          vehicleId: "019488a0-0000-7000-8000-000000000001",
          vehicleCode: "TRK-01",
          driverName: "Marcus Vance",
          stopsCount: 4,
          weightUtilizationPercent: 78,
          volumeUtilizationPercent: 65,
          distanceKm: 46.2,
          durationMinutes: 120,
          stops: [
            { stopNumber: 1, type: "DEPOT_DEPARTURE", locationName: "Central Hub", eta: "08:00", status: "COMPLETED" },
            { stopNumber: 2, type: "DELIVERY", orderRef: "ORD-1001", locationName: "Tech Hub Stop #1", eta: "08:45", status: "DELIVERED" },
            { stopNumber: 3, type: "DELIVERY", orderRef: "ORD-1002", locationName: "Tech Hub Stop #2", eta: "09:30", status: "DELIVERED" },
            { stopNumber: 4, type: "DELIVERY", orderRef: "ORD-1004", locationName: "Tech Hub Stop #4", eta: "11:45", status: "PENDING" },
          ],
        },
        {
          vehicleId: "019488a0-0000-7000-8000-000000000002",
          vehicleCode: "TRK-02",
          driverName: "Sarah Connor",
          stopsCount: 5,
          weightUtilizationPercent: 92,
          volumeUtilizationPercent: 88,
          distanceKm: 58.4,
          durationMinutes: 160,
          stops: [
            { stopNumber: 1, type: "DEPOT_DEPARTURE", locationName: "Central Hub", eta: "08:00", status: "COMPLETED" },
            { stopNumber: 2, type: "DELIVERY", orderRef: "ORD-1003", locationName: "Industrial Park Gate A", eta: "09:15", status: "DELIVERED" },
            { stopNumber: 3, type: "DELIVERY", orderRef: "ORD-1005", locationName: "Industrial Park Gate B", eta: "12:15", status: "DELAYED" },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
    },
  });
}

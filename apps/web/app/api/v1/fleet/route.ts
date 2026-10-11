import { NextRequest, NextResponse } from "next/server";
import { FLEET_UNITS, plansStore } from "@/lib/plans/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // Retrieve active plan if any
    const allStoredPlans = Array.from(plansStore.values());
    const activePlan = allStoredPlans.length > 0 ? allStoredPlans[allStoredPlans.length - 1] : null;

    let vehicleList = FLEET_UNITS.map((u) => {
      const activeRoute = activePlan?.routes?.find(
        (r) => r.vehicleId === u.id || r.vehicleCode === u.vehicleCode
      );

      const assignedWeight = activeRoute?.totalWeightKg || Math.round(u.capacityWeightKg * 0.72);
      const assignedVolume = activeRoute?.totalVolumeM3 || Math.round(u.capacityVolumeM3 * 0.68 * 10) / 10;
      const isFailed = activeRoute?.isFailed;
      const hasStucked = activeRoute?.stops?.some((s) => s.status === "STUCKED");

      let vStatus = "AVAILABLE";
      if (isFailed) {
        vStatus = "MAINTENANCE";
      } else if (hasStucked) {
        vStatus = "DELAYED_ROUTE";
      } else if (activeRoute && activeRoute.stops.length > 0) {
        vStatus = "IN_TRANSIT";
      }

      // Infer current location from active route stops
      const activeDelivery = activeRoute?.stops?.find((s) => s.status === "IN_TRANSIT" || s.status === "STUCKED");
      const currentLat = activeDelivery?.lat || (u.id === "VH-001" ? 37.7749 : u.id === "VH-002" ? 37.785 : 37.76);
      const currentLng = activeDelivery?.lng || (u.id === "VH-001" ? -122.4194 : u.id === "VH-002" ? -122.405 : -122.42);
      const locName = activeDelivery?.locationName || (u.id === "VH-001" ? "SOMA Arterial Corridor" : u.id === "VH-002" ? "Industrial Bypass" : "Mission Commercial Zone");

      return {
        id: u.id,
        vehicleCode: u.vehicleCode,
        makeModel:
          u.id === "VH-001"
            ? "Mercedes-Benz Sprinter 3500"
            : u.id === "VH-002"
            ? "Ford E-Transit Electric High-Roof"
            : "Ram ProMaster 2500 Cargo",
        licensePlate:
          u.id === "VH-001" ? "SF-789-TX" : u.id === "VH-002" ? "SF-104-EQ" : "SF-552-KL",
        maxWeightKg: u.capacityWeightKg,
        maxVolumeM3: u.capacityVolumeM3,
        currentWeightKg: assignedWeight,
        currentVolumeM3: assignedVolume,
        status: vStatus,
        currentLatitude: currentLat,
        currentLongitude: currentLng,
        currentLocationName: locName,
        fuelPercent: u.id === "VH-002" ? 92 : 84,
        odometerKm: u.id === "VH-001" ? 42150 : u.id === "VH-002" ? 28400 : 36800,
        driverName: u.driverName,
        fuelEfficiencyKmPerL: u.fuelEfficiencyKmPerL,
        fuelConsumedLiters: activeRoute?.fuelConsumedLiters || 14.2,
        co2EmittedKg: activeRoute?.co2EmittedKg || 38.0,
        stopsCount: activeRoute?.stopsCount || 4,
        distanceKm: activeRoute?.distanceKm || 68.5,
      };
    });

    if (status && status !== "ALL") {
      vehicleList = vehicleList.filter((v) => v.status === status);
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

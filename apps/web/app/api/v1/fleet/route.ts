import { NextRequest, NextResponse } from "next/server";
import { FLEET_UNITS, getActivePlan, FLEET_ROUTE_PALETTE } from "@/lib/plans/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // Retrieve active plan (reflects uploaded orders & vehicles)
    const activePlan = getActivePlan();
    const sourceFleet =
      activePlan?.fleet && activePlan.fleet.length > 0 ? activePlan.fleet : FLEET_UNITS;

    let vehicleList = sourceFleet.map((u: any, idx: number) => {
      const activeRoute = activePlan?.routes?.find(
        (r) => r.vehicleId === u.id || r.vehicleCode === u.vehicleCode
      );

      const assignedWeight =
        activeRoute?.totalWeightKg ?? Math.round((u.capacityWeightKg || 1500) * 0.72);
      const assignedVolume =
        activeRoute?.totalVolumeM3 ??
        Math.round((u.capacityVolumeM3 || 14.0) * 0.68 * 10) / 10;
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

      // Infer current location from active route stops or central depot
      const activeDelivery = activeRoute?.stops?.find(
        (s) => s.status === "IN_TRANSIT" || s.status === "STUCKED"
      );
      const currentLat =
        activeDelivery?.lat ??
        (activePlan?.depot?.lat ? activePlan.depot.lat + (idx * 0.005 - 0.01) : 18.5018);
      const currentLng =
        activeDelivery?.lng ??
        (activePlan?.depot?.lng ? activePlan.depot.lng + (idx * 0.005 - 0.01) : 73.8586);
      const locName =
        activeDelivery?.locationName ??
        (activePlan?.depot?.name || "Swargate Central Logistics Hub");

      const color = FLEET_ROUTE_PALETTE[idx % FLEET_ROUTE_PALETTE.length];

      return {
        id: u.id,
        vehicleCode: u.vehicleCode || u.id,
        makeModel: u.name || (u.id.includes("VAN") ? "Cargo Delivery Van" : "Commercial Haulage Truck"),
        licensePlate: u.vehicleCode || u.id,
        maxWeightKg: u.capacityWeightKg || 2500,
        maxVolumeM3: u.capacityVolumeM3 || 18.0,
        currentWeightKg: assignedWeight,
        currentVolumeM3: assignedVolume,
        status: vStatus,
        color,
        currentLatitude: currentLat,
        currentLongitude: currentLng,
        currentLocationName: locName,
        fuelPercent: idx % 2 === 0 ? 88 : 94,
        odometerKm: 24000 + idx * 4500,
        driverName: u.driverName || `Driver #${idx + 1}`,
        fuelEfficiencyKmPerL: u.fuelEfficiencyKmPerL || 5.4,
        fuelConsumedLiters: activeRoute?.fuelConsumedLiters || Math.round((28.5 / (u.fuelEfficiencyKmPerL || 5.4)) * 10) / 10,
        co2EmittedKg: activeRoute?.co2EmittedKg || Math.round((28.5 / (u.fuelEfficiencyKmPerL || 5.4) * 2.68) * 10) / 10,
        stopsCount: activeRoute?.stopsCount || (activeRoute?.stops?.length || 0),
        distanceKm: activeRoute?.distanceKm || 32.4,
      };
    });

    if (status && status !== "ALL") {
      vehicleList = vehicleList.filter((v: any) => v.status === status);
    }

    return NextResponse.json({
      success: true,
      data: vehicleList,
      total: vehicleList.length,
      planId: activePlan?.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to fetch fleet" },
      { status: 500 }
    );
  }
}

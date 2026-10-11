import { NextRequest, NextResponse } from "next/server";

export interface DriverRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  assignedVehicleId: string;
  assignedVehicleModel: string;
  licensePlate: string;
  depot: string;
  status: "EN_ROUTE" | "LOADING" | "ON_BREAK" | "DELAYED" | "OFF_DUTY";
  statusReason?: string;
  shiftStart: string;
  shiftEnd: string;
  hoursWorked: number;
  currentRouteId: string;
  stopsTotal: number;
  stopsCompleted: number;
  currentStopName: string;
  currentStopEta: string;
  currentPayloadKg: number;
  maxPayloadKg: number;
  currentPayloadM3: number;
  maxPayloadM3: number;
  onTimeRatePercent: number;
  rating: number;
  licenseType: string;
  notes?: string;
}

// In-memory persistent state across requests for dynamic dispatch updates
let DRIVERS_STORE: DriverRecord[] = [
  {
    id: "DRV-101",
    name: "Alex Vance",
    phone: "+1 (415) 555-0192",
    email: "alex.vance@vortexa.logistics",
    assignedVehicleId: "TRK-01",
    assignedVehicleModel: "Mercedes Actros 2545",
    licensePlate: "DX-2026-AA",
    depot: "DEPOT-CENTRAL",
    status: "EN_ROUTE",
    shiftStart: "06:00 AM",
    shiftEnd: "02:00 PM",
    hoursWorked: 4.2,
    currentRouteId: "RTE-SF-DOWNTOWN",
    stopsTotal: 4,
    stopsCompleted: 1,
    currentStopName: "Marina Grocers (2200 Chestnut St)",
    currentStopEta: "09:30 AM",
    currentPayloadKg: 278,
    maxPayloadKg: 4000,
    currentPayloadM3: 2.35,
    maxPayloadM3: 28.5,
    onTimeRatePercent: 99.2,
    rating: 4.95,
    licenseType: "Commercial Class A",
    notes: "Top-tier route adherence. Familiar with medical deliveries.",
  },
  {
    id: "DRV-102",
    name: "Sarah Connor",
    phone: "+1 (415) 555-4819",
    email: "sarah.c@vortexa.logistics",
    assignedVehicleId: "TRK-02",
    assignedVehicleModel: "Volvo FH16 750",
    licensePlate: "DX-2026-BB",
    depot: "DEPOT-CENTRAL",
    status: "DELAYED",
    statusReason: "Bay Bridge construction detour (+22 mins)",
    shiftStart: "06:30 AM",
    shiftEnd: "02:30 PM",
    hoursWorked: 3.8,
    currentRouteId: "RTE-BAY-CORRIDOR",
    stopsTotal: 5,
    stopsCompleted: 2,
    currentStopName: "Embarcadero Retail Hub",
    currentStopEta: "10:15 AM",
    currentPayloadKg: 1850,
    maxPayloadKg: 5000,
    currentPayloadM3: 14.2,
    maxPayloadM3: 32.0,
    onTimeRatePercent: 96.4,
    rating: 4.88,
    licenseType: "Commercial Class A + Hazmat",
    notes: "Detour reported via ElevenLabs voice assistant. Re-planning active.",
  },
  {
    id: "DRV-103",
    name: "Marcus Brody",
    phone: "+1 (415) 555-7731",
    email: "marcus.b@vortexa.logistics",
    assignedVehicleId: "VAN-03",
    assignedVehicleModel: "Ford Transit EcoBlue 350",
    licensePlate: "DX-2026-CC",
    depot: "DEPOT-NORTH",
    status: "LOADING",
    shiftStart: "07:00 AM",
    shiftEnd: "03:00 PM",
    hoursWorked: 2.1,
    currentRouteId: "RTE-NORTH-BAY-02",
    stopsTotal: 6,
    stopsCompleted: 0,
    currentStopName: "North Logistics Hub (Loading Bay 3)",
    currentStopEta: "08:15 AM Departure",
    currentPayloadKg: 890,
    maxPayloadKg: 1500,
    currentPayloadM3: 9.4,
    maxPayloadM3: 15.1,
    onTimeRatePercent: 98.1,
    rating: 4.91,
    licenseType: "Commercial Class B",
    notes: "Specializes in high-density urban parcel delivery.",
  },
  {
    id: "DRV-104",
    name: "Elena Rostova",
    phone: "+1 (415) 555-9204",
    email: "elena.r@vortexa.logistics",
    assignedVehicleId: "VAN-04",
    assignedVehicleModel: "Iveco Daily 35S18",
    licensePlate: "DX-2026-DD",
    depot: "DEPOT-NORTH",
    status: "ON_BREAK",
    statusReason: "Mandatory 30-min DOT rest break (15 mins remaining)",
    shiftStart: "05:30 AM",
    shiftEnd: "01:30 PM",
    hoursWorked: 4.5,
    currentRouteId: "RTE-PACIFIC-01",
    stopsTotal: 5,
    stopsCompleted: 3,
    currentStopName: "Stonestown Express Point",
    currentStopEta: "09:50 AM",
    currentPayloadKg: 420,
    maxPayloadKg: 1400,
    currentPayloadM3: 4.8,
    maxPayloadM3: 12.0,
    onTimeRatePercent: 99.5,
    rating: 4.97,
    licenseType: "Commercial Class B",
    notes: "Zero incidents in last 180 days. DOT compliance 100%.",
  },
  {
    id: "DRV-105",
    name: "David Chen",
    phone: "+1 (415) 555-3398",
    email: "david.c@vortexa.logistics",
    assignedVehicleId: "EV-05",
    assignedVehicleModel: "Renault Master E-Tech",
    licensePlate: "DX-2026-EE",
    depot: "DEPOT-EAST",
    status: "EN_ROUTE",
    shiftStart: "07:30 AM",
    shiftEnd: "03:30 PM",
    hoursWorked: 1.5,
    currentRouteId: "RTE-MISSION-GREEN",
    stopsTotal: 4,
    stopsCompleted: 1,
    currentStopName: "Potrero Medical Center",
    currentStopEta: "09:15 AM",
    currentPayloadKg: 310,
    maxPayloadKg: 1100,
    currentPayloadM3: 3.5,
    maxPayloadM3: 10.8,
    onTimeRatePercent: 97.8,
    rating: 4.85,
    licenseType: "Commercial Class B",
    notes: "Zero-emissions EV route specialist. Battery state 82%.",
  },
  {
    id: "DRV-106",
    name: "Tara Washington",
    phone: "+1 (415) 555-6612",
    email: "tara.w@vortexa.logistics",
    assignedVehicleId: "TRK-06",
    assignedVehicleModel: "Scania R 500 V8",
    licensePlate: "DX-2026-FF",
    depot: "DEPOT-EAST",
    status: "OFF_DUTY",
    shiftStart: "02:00 PM",
    shiftEnd: "10:00 PM",
    hoursWorked: 0,
    currentRouteId: "RTE-EVENING-TRANSFER",
    stopsTotal: 0,
    stopsCompleted: 0,
    currentStopName: "Depot Staging Area",
    currentStopEta: "--",
    currentPayloadKg: 0,
    maxPayloadKg: 5500,
    currentPayloadM3: 0,
    maxPayloadM3: 35.0,
    onTimeRatePercent: 98.9,
    rating: 4.92,
    licenseType: "Commercial Class A + Heavy Haul",
    notes: "Scheduled for afternoon inter-hub feeder transfer.",
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const depot = searchParams.get("depot");
    const search = searchParams.get("search")?.toLowerCase();

    let filtered = [...DRIVERS_STORE];

    if (status && status !== "ALL") {
      filtered = filtered.filter((d) => d.status === status);
    }

    if (depot && depot !== "ALL") {
      filtered = filtered.filter((d) => d.depot === depot);
    }

    if (search) {
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(search) ||
          d.id.toLowerCase().includes(search) ||
          d.assignedVehicleId.toLowerCase().includes(search) ||
          d.phone.includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      totalCount: DRIVERS_STORE.length,
      filteredCount: filtered.length,
      metrics: {
        totalDrivers: DRIVERS_STORE.length,
        enRoute: DRIVERS_STORE.filter((d) => d.status === "EN_ROUTE").length,
        loading: DRIVERS_STORE.filter((d) => d.status === "LOADING").length,
        delayed: DRIVERS_STORE.filter((d) => d.status === "DELAYED").length,
        onBreak: DRIVERS_STORE.filter((d) => d.status === "ON_BREAK").length,
        offDuty: DRIVERS_STORE.filter((d) => d.status === "OFF_DUTY").length,
        averageOnTimeRate:
          Math.round(
            (DRIVERS_STORE.reduce((acc, d) => acc + d.onTimeRatePercent, 0) /
              DRIVERS_STORE.length) *
              10
          ) / 10,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { driverId, assignedVehicleId, assignedVehicleModel, status, notes } = body;

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: "driverId is required" },
        { status: 400 }
      );
    }

    const driverIndex = DRIVERS_STORE.findIndex((d) => d.id === driverId);
    if (driverIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Driver not found" },
        { status: 404 }
      );
    }

    if (assignedVehicleId !== undefined) {
      DRIVERS_STORE[driverIndex].assignedVehicleId = assignedVehicleId;
    }
    if (assignedVehicleModel !== undefined) {
      DRIVERS_STORE[driverIndex].assignedVehicleModel = assignedVehicleModel;
    }
    if (status !== undefined) {
      DRIVERS_STORE[driverIndex].status = status;
    }
    if (notes !== undefined) {
      DRIVERS_STORE[driverIndex].notes = notes;
    }

    return NextResponse.json({
      success: true,
      message: "Driver record updated successfully",
      data: DRIVERS_STORE[driverIndex],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Update failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newId = `DRV-${100 + DRIVERS_STORE.length + 1}`;

    const newDriver: DriverRecord = {
      id: newId,
      name: body.name || "New Driver",
      phone: body.phone || "+1 (415) 555-0000",
      email: body.email || `driver.${newId.toLowerCase()}@vortexa.logistics`,
      assignedVehicleId: body.assignedVehicleId || "UNASSIGNED",
      assignedVehicleModel: body.assignedVehicleModel || "None",
      licensePlate: body.licensePlate || "PENDING",
      depot: body.depot || "DEPOT-CENTRAL",
      status: body.status || "OFF_DUTY",
      shiftStart: body.shiftStart || "08:00 AM",
      shiftEnd: body.shiftEnd || "04:00 PM",
      hoursWorked: 0,
      currentRouteId: body.currentRouteId || "UNASSIGNED",
      stopsTotal: 0,
      stopsCompleted: 0,
      currentStopName: "Depot Staging Area",
      currentStopEta: "--",
      currentPayloadKg: 0,
      maxPayloadKg: 2000,
      currentPayloadM3: 0,
      maxPayloadM3: 15.0,
      onTimeRatePercent: 100,
      rating: 5.0,
      licenseType: body.licenseType || "Commercial Class B",
      notes: body.notes || "Newly enrolled driver in fleet management.",
    };

    DRIVERS_STORE.push(newDriver);

    return NextResponse.json({
      success: true,
      message: "Driver registered successfully",
      data: newDriver,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create driver" },
      { status: 500 }
    );
  }
}

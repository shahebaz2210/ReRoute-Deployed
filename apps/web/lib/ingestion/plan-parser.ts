import * as XLSX from "xlsx";

export interface ParsedOrderRow {
  rowNumber: number;
  orderReference: string;
  customerName: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  weightKg: number;
  volumeM3: number;
  timeWindowStart: string; // "HH:MM"
  timeWindowEnd: string;   // "HH:MM"
  serviceDurationMinutes: number;
  priority: "STANDARD" | "EXPRESS" | "CRITICAL";
  driverName?: string;
  licensePlate?: string;
  rawRow: Record<string, unknown>;
}

export interface IngestionRowError {
  rowNumber: number;
  column: string;
  value: unknown;
  code: string;
  message: string;
}

export interface IngestionResult {
  success: boolean;
  fileName: string;
  totalRows: number;
  validRows: ParsedOrderRow[];
  errors: IngestionRowError[];
  summary: {
    totalWeightKg: number;
    totalVolumeM3: number;
    validCount: number;
    errorCount: number;
  };
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB limit (PRD AC-03.3)
const FORMULA_INJECTION_CHARS = ["=", "+", "-", "@"];

// Fleet default maximum vehicle capacity for validation (e.g. Mercedes Actros 4000kg, Volvo 5000kg)
export const FLEET_MAX_WEIGHT_KG = 5000;
export const FLEET_MAX_VOLUME_M3 = 30.0;

function sanitizeCellString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function hasFormulaInjection(val: string): boolean {
  if (!val) return false;
  return FORMULA_INJECTION_CHARS.some((char) => val.startsWith(char));
}

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  // Handle HH:MM:SS or HH:MM
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function parseDeliveryPlanBuffer(buffer: Buffer | ArrayBuffer, fileName: string): IngestionResult {
  const byteLength = buffer instanceof Buffer ? buffer.length : buffer.byteLength;

  if (byteLength > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      fileName,
      totalRows: 0,
      validRows: [],
      errors: [
        {
          rowNumber: 0,
          column: "file",
          value: `${(byteLength / (1024 * 1024)).toFixed(2)} MB`,
          code: "FILE_TOO_LARGE",
          message: "Uploaded plan exceeds maximum allowed file size of 2 MB.",
        },
      ],
      summary: { totalWeightKg: 0, totalVolumeM3: 0, validCount: 0, errorCount: 1 },
    };
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch (err: unknown) {
    return {
      success: false,
      fileName,
      totalRows: 0,
      validRows: [],
      errors: [
        {
          rowNumber: 0,
          column: "file",
          value: fileName,
          code: "INVALID_FILE_FORMAT",
          message: "Unable to parse Excel/CSV document. Please verify sheet integrity.",
        },
      ],
      summary: { totalWeightKg: 0, totalVolumeM3: 0, validCount: 0, errorCount: 1 },
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      success: false,
      fileName,
      totalRows: 0,
      validRows: [],
      errors: [
        {
          rowNumber: 0,
          column: "sheet",
          value: null,
          code: "EMPTY_WORKBOOK",
          message: "File contains no sheets.",
        },
      ],
      summary: { totalWeightKg: 0, totalVolumeM3: 0, validCount: 0, errorCount: 1 },
    };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const errors: IngestionRowError[] = [];
  const validRows: ParsedOrderRow[] = [];
  const seenReferences = new Set<string>();

  let totalWeight = 0;
  let totalVolume = 0;

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // 1-based indexing + header row
    let rowHasError = false;

    // Normalizing column names (case-insensitive, trims, underscores)
    const normalized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[\s.-]+/g, "_");
      normalized[cleanKey] = val;
    }

    // 1. Order Reference
    const rawRef = sanitizeCellString(
      normalized["order_id"] || normalized["order_reference"] || normalized["order_ref"] || normalized["id"]
    );
    if (!rawRef) {
      errors.push({
        rowNumber,
        column: "order_id",
        value: rawRef,
        code: "REQUIRED_FIELD_MISSING",
        message: "Order reference is required.",
      });
      rowHasError = true;
    } else if (hasFormulaInjection(rawRef)) {
      errors.push({
        rowNumber,
        column: "order_id",
        value: rawRef,
        code: "FORMULA_INJECTION_DETECTED",
        message: "Dangerous spreadsheet formula characters (=, +, -, @) are forbidden.",
      });
      rowHasError = true;
    } else if (seenReferences.has(rawRef)) {
      errors.push({
        rowNumber,
        column: "order_id",
        value: rawRef,
        code: "DUPLICATE_ORDER_REFERENCE",
        message: `Duplicate order reference '${rawRef}' found in delivery plan.`,
      });
      rowHasError = true;
    } else {
      seenReferences.add(rawRef);
    }

    // 2. Customer Name
    const customerName = sanitizeCellString(normalized["customer_name"] || normalized["customer"]);
    if (customerName && hasFormulaInjection(customerName)) {
      errors.push({
        rowNumber,
        column: "customer_name",
        value: customerName,
        code: "FORMULA_INJECTION_DETECTED",
        message: "Customer name contains unsafe spreadsheet formula characters.",
      });
      rowHasError = true;
    }

    // 3. Address
    const deliveryAddress = sanitizeCellString(normalized["delivery_address"] || normalized["address"] || "Customer Location");

    // 4. Coordinates
    const rawLat = Number(normalized["latitude"] ?? normalized["lat"]);
    const rawLng = Number(normalized["longitude"] ?? normalized["lng"] ?? normalized["lon"]);

    if (isNaN(rawLat) || rawLat < -90 || rawLat > 90) {
      errors.push({
        rowNumber,
        column: "latitude",
        value: normalized["latitude"],
        code: "INVALID_COORDINATES",
        message: "Latitude must be a valid float between -90.0 and 90.0.",
      });
      rowHasError = true;
    }

    if (isNaN(rawLng) || rawLng < -180 || rawLng > 180) {
      errors.push({
        rowNumber,
        column: "longitude",
        value: normalized["longitude"],
        code: "INVALID_COORDINATES",
        message: "Longitude must be a valid float between -180.0 and 180.0.",
      });
      rowHasError = true;
    }

    // 5. Weight (kg) > 0
    const rawWeight = Number(normalized["weight_kg"] ?? normalized["weight"]);
    if (isNaN(rawWeight) || rawWeight <= 0) {
      errors.push({
        rowNumber,
        column: "weight_kg",
        value: normalized["weight_kg"],
        code: "INVALID_WEIGHT",
        message: "Package weight must be greater than 0 kg.",
      });
      rowHasError = true;
    } else if (rawWeight > FLEET_MAX_WEIGHT_KG) {
      errors.push({
        rowNumber,
        column: "weight_kg",
        value: rawWeight,
        code: "ORDER_EXCEEDS_ALL_VEHICLES",
        message: `Order weight (${rawWeight} kg) exceeds maximum fleet vehicle capacity (${FLEET_MAX_WEIGHT_KG} kg).`,
      });
      rowHasError = true;
    }

    // 6. Volume (m3) > 0
    const rawVol = Number(normalized["volume_m3"] ?? normalized["volume"] ?? 0.1);
    if (isNaN(rawVol) || rawVol <= 0) {
      errors.push({
        rowNumber,
        column: "volume_m3",
        value: normalized["volume_m3"],
        code: "INVALID_VOLUME",
        message: "Package volume must be greater than 0 m³.",
      });
      rowHasError = true;
    } else if (rawVol > FLEET_MAX_VOLUME_M3) {
      errors.push({
        rowNumber,
        column: "volume_m3",
        value: rawVol,
        code: "ORDER_EXCEEDS_ALL_VEHICLES",
        message: `Order volume (${rawVol} m³) exceeds maximum fleet vehicle volume (${FLEET_MAX_VOLUME_M3} m³).`,
      });
      rowHasError = true;
    }

    // 7. Time Windows
    const startStr = sanitizeCellString(normalized["time_window_start"] || normalized["window_start"] || "08:00");
    const endStr = sanitizeCellString(normalized["time_window_end"] || normalized["window_end"] || "18:00");

    const startMin = parseTimeToMinutes(startStr);
    const endMin = parseTimeToMinutes(endStr);

    if (startMin === null) {
      errors.push({
        rowNumber,
        column: "time_window_start",
        value: startStr,
        code: "INVALID_TIME_WINDOW",
        message: "Start time must be formatted as HH:MM (e.g. 08:30).",
      });
      rowHasError = true;
    }

    if (endMin === null) {
      errors.push({
        rowNumber,
        column: "time_window_end",
        value: endStr,
        code: "INVALID_TIME_WINDOW",
        message: "End time must be formatted as HH:MM (e.g. 17:00).",
      });
      rowHasError = true;
    }

    if (startMin !== null && endMin !== null && startMin >= endMin) {
      errors.push({
        rowNumber,
        column: "time_window_end",
        value: `${startStr} -> ${endStr}`,
        code: "INVALID_TIME_WINDOW_RANGE",
        message: "Delivery time window start must precede window end.",
      });
      rowHasError = true;
    }

    // 8. Service duration
    const serviceDur = Number(normalized["service_duration_min"] ?? normalized["service_duration"] ?? 10);

    // 9. Priority
    let priority: "STANDARD" | "EXPRESS" | "CRITICAL" = "STANDARD";
    const rawPriority = sanitizeCellString(normalized["priority"]).toUpperCase();
    if (rawPriority === "EXPRESS" || rawPriority === "CRITICAL") {
      priority = rawPriority;
    }

    if (!rowHasError) {
      validRows.push({
        rowNumber,
        orderReference: rawRef,
        customerName: customerName || "Customer Delivery",
        deliveryAddress,
        latitude: rawLat,
        longitude: rawLng,
        weightKg: rawWeight,
        volumeM3: rawVol,
        timeWindowStart: startStr,
        timeWindowEnd: endStr,
        serviceDurationMinutes: isNaN(serviceDur) ? 10 : serviceDur,
        priority,
        rawRow: row,
      });

      totalWeight += rawWeight;
      totalVolume += rawVol;
    }
  });

  return {
    success: errors.length === 0,
    fileName,
    totalRows: rawRows.length,
    validRows,
    errors,
    summary: {
      totalWeightKg: Math.round(totalWeight * 100) / 100,
      totalVolumeM3: Math.round(totalVolume * 100) / 100,
      validCount: validRows.length,
      errorCount: errors.length,
    },
  };
}

export interface ParsedVehicleRow {
  rowNumber: number;
  vehicleId: string;
  vehicleCode: string;
  weightCapacityKg: number;
  volumeCapacityM3: number;
  fuelEfficiencyKmPerL: number;
  fuelEfficiencyUnit: string;
  vehicleType: string;
  available: boolean;
  shiftStartTime: string;
  shiftEndTime: string;
  startLocation: string;
  endLocation: string;
  depotLatitude?: number;
  depotLongitude?: number;
  driverName?: string;
  licensePlate?: string;
  rawRow: Record<string, unknown>;
}

export interface VehiclesIngestionResult {
  success: boolean;
  fileName: string;
  totalRows: number;
  validRows: ParsedVehicleRow[];
  errors: IngestionRowError[];
  depotCenter: {
    id: string;
    latitude: number;
    longitude: number;
  };
}

/**
 * Parses and validates vehicles.csv.
 * Enforces that every vehicle belongs to strictly one Depot Center / Dispatcher workplace.
 */
export function parseVehiclesPlanBuffer(
  buffer: Buffer | ArrayBuffer,
  fileName: string,
  defaultDepotCoords = { latitude: 18.5018, longitude: 73.8586 }
): VehiclesIngestionResult {
  const byteLength = buffer instanceof Buffer ? buffer.length : buffer.byteLength;

  if (byteLength > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      fileName,
      totalRows: 0,
      validRows: [],
      errors: [
        {
          rowNumber: 0,
          column: "file",
          value: `${(byteLength / (1024 * 1024)).toFixed(2)} MB`,
          code: "FILE_TOO_LARGE",
          message: "Vehicles plan exceeds maximum allowed file size of 2 MB.",
        },
      ],
      depotCenter: { id: "DC01", ...defaultDepotCoords },
    };
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return {
      success: false,
      fileName,
      totalRows: 0,
      validRows: [],
      errors: [
        {
          rowNumber: 0,
          column: "file",
          value: fileName,
          code: "INVALID_FILE_FORMAT",
          message: "Unable to parse vehicles CSV/Excel file.",
        },
      ],
      depotCenter: { id: "DC01", ...defaultDepotCoords },
    };
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const errors: IngestionRowError[] = [];
  const validRows: ParsedVehicleRow[] = [];
  const seenIds = new Set<string>();

  let commonDepotLat = defaultDepotCoords.latitude;
  let commonDepotLng = defaultDepotCoords.longitude;
  let depotLocked = false;
  let depotId = "DC01";

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    let rowHasError = false;

    const normalized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[\s.-]+/g, "_");
      normalized[cleanKey] = val;
    }

    // 1. Vehicle ID
    const rawId = sanitizeCellString(
      normalized["vehicle_id"] || normalized["id"] || normalized["code"]
    );
    if (!rawId) {
      errors.push({
        rowNumber,
        column: "vehicle_id",
        value: rawId,
        code: "REQUIRED_FIELD_MISSING",
        message: "Vehicle ID is required.",
      });
      rowHasError = true;
    } else if (hasFormulaInjection(rawId)) {
      errors.push({
        rowNumber,
        column: "vehicle_id",
        value: rawId,
        code: "FORMULA_INJECTION_DETECTED",
        message: "Dangerous formula characters are forbidden.",
      });
      rowHasError = true;
    } else if (seenIds.has(rawId)) {
      errors.push({
        rowNumber,
        column: "vehicle_id",
        value: rawId,
        code: "DUPLICATE_VEHICLE_ID",
        message: `Duplicate vehicle ID '${rawId}' detected.`,
      });
      rowHasError = true;
    } else {
      seenIds.add(rawId);
    }

    // 2. Weight Capacity
    const weightCap = Number(
      normalized["weight_capacity"] || normalized["max_weight_kg"] || normalized["capacity_kg"]
    );
    if (isNaN(weightCap) || weightCap <= 0) {
      errors.push({
        rowNumber,
        column: "weight_capacity",
        value: normalized["weight_capacity"],
        code: "INVALID_CAPACITY",
        message: "Vehicle weight capacity must be greater than 0 kg.",
      });
      rowHasError = true;
    }

    // 3. Volume Capacity
    const volCap = Number(
      normalized["volume_capacity"] || normalized["max_volume_m3"] || normalized["capacity_m3"]
    );
    if (isNaN(volCap) || volCap <= 0) {
      errors.push({
        rowNumber,
        column: "volume_capacity",
        value: normalized["volume_capacity"],
        code: "INVALID_CAPACITY",
        message: "Vehicle volume capacity must be greater than 0 m³.",
      });
      rowHasError = true;
    }

    // 4. Fuel Efficiency
    const fuelEff = Number(
      normalized["fuel_efficiency"] || normalized["fuel_efficiency_km_l"] || normalized["km_per_liter"] || 5.4
    );

    // 5. Shift Times
    const shiftStart = sanitizeCellString(normalized["shift_start_time"] || normalized["shift_start"] || "08:00");
    const shiftEnd = sanitizeCellString(normalized["shift_end_time"] || normalized["shift_end"] || "18:00");

    // 6. Depot Location Verification (All vehicles must share the same Depot Center)
    const rawDepotId = sanitizeCellString(normalized["start_location"] || normalized["depot_id"] || "DC01");
    if (rawDepotId) {
      depotId = rawDepotId;
    }

    const rowLat = Number(normalized["depot_latitude"] ?? normalized["start_latitude"] ?? normalized["latitude"]);
    const rowLng = Number(normalized["depot_longitude"] ?? normalized["start_longitude"] ?? normalized["longitude"]);

    if (!isNaN(rowLat) && !isNaN(rowLng) && rowLat >= -90 && rowLat <= 90 && rowLng >= -180 && rowLng <= 180) {
      if (!depotLocked) {
        commonDepotLat = rowLat;
        commonDepotLng = rowLng;
        depotLocked = true;
      } else {
        // Enforce strictly one depot center for the dispatcher
        const diffLat = Math.abs(commonDepotLat - rowLat);
        const diffLng = Math.abs(commonDepotLng - rowLng);
        if (diffLat > 0.05 || diffLng > 0.05) {
          errors.push({
            rowNumber,
            column: "start_location",
            value: `${rowLat}, ${rowLng}`,
            code: "MULTIPLE_DEPOTS_FORBIDDEN",
            message: `Dispatcher belongs to strictly one depot center (${commonDepotLat.toFixed(4)}, ${commonDepotLng.toFixed(4)}). All vehicles must start at this same workplace.`,
          });
          rowHasError = true;
        }
      }
    }

    if (!rowHasError) {
      validRows.push({
        rowNumber,
        vehicleId: rawId,
        vehicleCode: sanitizeCellString(normalized["vehicle_code"] || rawId),
        weightCapacityKg: weightCap,
        volumeCapacityM3: volCap,
        fuelEfficiencyKmPerL: isNaN(fuelEff) || fuelEff <= 0 ? 5.4 : fuelEff,
        fuelEfficiencyUnit: sanitizeCellString(normalized["fuel_efficiency_unit"] || "km_per_litre"),
        vehicleType: sanitizeCellString(normalized["vehicle_type"] || "medium_truck"),
        driverName: sanitizeCellString(normalized["driver_name"] || normalized["driver"] || normalized["operator"]) || undefined,
        licensePlate: sanitizeCellString(normalized["license_plate"] || normalized["plate"] || normalized["registration_number"]) || undefined,
        available: normalized["available"] !== false && normalized["available"] !== "false" && normalized["available"] !== 0,
        shiftStartTime: shiftStart,
        shiftEndTime: shiftEnd,
        startLocation: rawDepotId,
        endLocation: rawDepotId,
        depotLatitude: commonDepotLat,
        depotLongitude: commonDepotLng,
        rawRow: row,
      });
    }
  });

  return {
    success: errors.length === 0,
    fileName,
    totalRows: rawRows.length,
    validRows,
    errors,
    depotCenter: {
      id: depotId,
      latitude: commonDepotLat,
      longitude: commonDepotLng,
    },
  };
}


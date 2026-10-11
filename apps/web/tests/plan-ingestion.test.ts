import { describe, it, expect } from "vitest";
import { parseDeliveryPlanBuffer, FLEET_MAX_WEIGHT_KG } from "../lib/ingestion/plan-parser";

describe("Phase 4: Excel/CSV Delivery Plan Ingestion Engine", () => {
  it("successfully parses a valid delivery plan CSV with all constraints", () => {
    const csv = `order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end,priority
ORD-101,Acme Logistics,100 High St,51.5074,-0.1278,250,1.5,08:30,11:30,STANDARD
ORD-102,Beta Labs,200 Park Rd,51.5200,-0.1100,450,2.8,09:00,12:00,EXPRESS`;

    const result = parseDeliveryPlanBuffer(Buffer.from(csv), "test_valid.csv");

    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.validRows.length).toBe(2);
    expect(result.validRows[0].orderReference).toBe("ORD-101");
    expect(result.validRows[0].weightKg).toBe(250);
    expect(result.summary.totalWeightKg).toBe(700);
  });

  it("rejects formula injection characters (=, +, -, @) in order references and customer names", () => {
    const csv = `order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end
=cmd|' /C calc'!A0,Safe Customer,100 High St,51.5,-0.12,100,0.5,08:00,10:00
ORD-103,@malicious_call,200 High St,51.5,-0.12,100,0.5,08:00,10:00`;

    const result = parseDeliveryPlanBuffer(Buffer.from(csv), "injection_test.csv");

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.code === "FORMULA_INJECTION_DETECTED")).toBe(true);
  });

  it("detects and flags invalid/negative weight constraints", () => {
    const csv = `order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end
ORD-104,Customer One,100 Road,51.5,-0.12,-20,1.0,08:00,10:00
ORD-105,Customer Two,100 Road,51.5,-0.12,0,1.0,08:00,10:00`;

    const result = parseDeliveryPlanBuffer(Buffer.from(csv), "negative_weight.csv");

    expect(result.success).toBe(false);
    const weightErrors = result.errors.filter((e) => e.code === "INVALID_WEIGHT");
    expect(weightErrors.length).toBe(2);
  });

  it("enforces ORDER_EXCEEDS_ALL_VEHICLES constraint when weight exceeds maximum fleet limit", () => {
    const hugeWeight = FLEET_MAX_WEIGHT_KG + 1000;
    const csv = `order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end
ORD-106,Giant Freight,100 Road,51.5,-0.12,${hugeWeight},1.0,08:00,10:00`;

    const result = parseDeliveryPlanBuffer(Buffer.from(csv), "overweight.csv");

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.code === "ORDER_EXCEEDS_ALL_VEHICLES")).toBe(true);
  });

  it("enforces time-window chronological validity (start < end)", () => {
    const csv = `order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end
ORD-107,Late Start,100 Road,51.5,-0.12,100,1.0,17:00,09:00`;

    const result = parseDeliveryPlanBuffer(Buffer.from(csv), "time_window.csv");

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_TIME_WINDOW_RANGE")).toBe(true);
  });

  it("rejects duplicate order references within the same delivery plan", () => {
    const csv = `order_id,customer_name,delivery_address,latitude,longitude,weight_kg,volume_m3,time_window_start,time_window_end
ORD-DUP,Customer One,100 Road,51.5,-0.12,100,1.0,08:00,10:00
ORD-DUP,Customer Two,200 Road,51.5,-0.12,150,1.2,10:00,12:00`;

    const result = parseDeliveryPlanBuffer(Buffer.from(csv), "duplicate.csv");

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.code === "DUPLICATE_ORDER_REFERENCE")).toBe(true);
  });
});

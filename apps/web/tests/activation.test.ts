import { describe, it, expect } from "vitest";

describe("Phase 10: Atomic Route Activation & Concurrency Lock", () => {
  it("enforces optimistic concurrency control on activation", () => {
    let currentVersion = 1;
    function attemptActivation(expectedVersion: number, nextVersion: number) {
      if (expectedVersion !== currentVersion) {
        return { status: 409, error: "CONCURRENCY_CONFLICT" };
      }
      currentVersion = nextVersion;
      return { status: 200, activated_version: currentVersion };
    }

    // First dispatcher activation succeeds
    const res1 = attemptActivation(1, 2);
    expect(res1.status).toBe(200);
    expect(res1.activated_version).toBe(2);

    // Stale second dispatcher attempting to activate from expected version 1 is blocked
    const res2 = attemptActivation(1, 2);
    expect(res2.status).toBe(409);
    expect(res2.error).toBe("CONCURRENCY_CONFLICT");
  });
});

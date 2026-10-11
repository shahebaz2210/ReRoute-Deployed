import { describe, it, expect } from "vitest";
import { authenticateCredentials } from "../lib/auth/users";
import { signToken, verifyToken, SessionData } from "../lib/auth/session";
import { hasRequiredRole, hasPermission } from "../lib/auth/rbac";
import { checkLoginRateLimit } from "../lib/auth/rate-limit";

describe("Phase 2 Authentication & Authorization Suite", () => {
  it("authenticates valid demo dispatcher credentials (Task 74)", async () => {
    const user = await authenticateCredentials("dispatcher@vortexa.com", "dispatch123");
    expect(user).not.toBeNull();
    expect(user?.role).toBe("dispatcher");
    expect(user?.email).toBe("dispatcher@vortexa.com");
  });

  it("authenticates valid demo manager credentials (Task 74)", async () => {
    const user = await authenticateCredentials("manager@vortexa.com", "manage123");
    expect(user).not.toBeNull();
    expect(user?.role).toBe("admin");
  });

  it("rejects invalid password", async () => {
    const user = await authenticateCredentials("dispatcher@vortexa.com", "wrong-password");
    expect(user).toBeNull();
  });

  it("enforces session token cryptographic signing and verification (Task 67)", () => {
    const mockSession: SessionData = {
      sessionId: "sess_12345",
      userId: "usr_01",
      email: "test@vortexa.com",
      name: "Test User",
      role: "dispatcher",
      organizationId: "org_01",
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    const token = signToken(mockSession);
    expect(token).toContain(".");

    const verified = verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe("usr_01");

    // Tampered token test
    const tampered = token.slice(0, -4) + "abcd";
    expect(verifyToken(tampered)).toBeNull();
  });

  it("enforces RBAC role hierarchy and permissions (Task 71)", () => {
    expect(hasRequiredRole("admin", "dispatcher")).toBe(true);
    expect(hasRequiredRole("dispatcher", "driver")).toBe(true);
    expect(hasRequiredRole("driver", "dispatcher")).toBe(false);
    expect(hasRequiredRole("viewer", "dispatcher")).toBe(false);

    expect(hasPermission("dispatcher", "plans:activate")).toBe(true);
    expect(hasPermission("driver", "plans:activate")).toBe(false);
    expect(hasPermission("admin", "admin:manage")).toBe(true);
    expect(hasPermission("dispatcher", "admin:manage")).toBe(false);
  });

  it("enforces sliding window rate limit on login attempts (Task 72)", () => {
    const testIp = `test-ip-${Date.now()}`;

    // 5 attempts allowed
    for (let i = 0; i < 5; i++) {
      const res = checkLoginRateLimit(testIp);
      expect(res.allowed).toBe(true);
    }

    // 6th attempt must be rate-limited
    const blocked = checkLoginRateLimit(testIp);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});

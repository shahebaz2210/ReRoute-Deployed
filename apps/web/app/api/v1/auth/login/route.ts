import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateCredentials } from "@/lib/auth/users";
import { createSession } from "@/lib/auth/session";
import { checkLoginRateLimit } from "@/lib/auth/rate-limit";
import { recordAuditEvent } from "@/lib/audit/audit-logger";

const LoginRequestSchema = z
  .object({
    email: z.string().optional(),
    username: z.string().optional(),
    password: z.string().min(1),
  })
  .refine((data) => Boolean(data.email || data.username), {
    message: "Email or username is required",
  });

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await req.json();
    const parsed = LoginRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const identifier = (parsed.data.username || parsed.data.email || "").trim();
    const { password } = parsed.data;
    const rateLimitKey = `${ip}:${identifier.toLowerCase()}`;
    const rateLimit = checkLoginRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      await recordAuditEvent({
        organizationId: "00000000-0000-0000-0000-000000000000",
        actorId: identifier,
        action: "AUTH_LOGIN_LOCKED",
        entityType: "USER",
        entityId: "00000000-0000-0000-0000-000000000000",
        afterState: { ip, reason: "Rate limit exceeded" },
      });

      return NextResponse.json(
        {
          error: "RATE_LIMITED",
          message: `Too many login attempts. Please wait ${rateLimit.retryAfterSeconds} seconds.`,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds || 60) },
        }
      );
    }

    const user = await authenticateCredentials(identifier, password);
    if (!user) {
      await recordAuditEvent({
        organizationId: "00000000-0000-0000-0000-000000000000",
        actorId: identifier,
        action: "AUTH_LOGIN_FAILURE",
        entityType: "USER",
        entityId: "00000000-0000-0000-0000-000000000000",
        afterState: { ip, identifier, remainingAttempts: rateLimit.remaining },
      });

      return NextResponse.json(
        {
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
          remainingAttempts: rateLimit.remaining,
        },
        { status: 401 }
      );
    }

    const session = await createSession(user);

    await recordAuditEvent({
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "AUTH_LOGIN_SUCCESS",
      entityType: "USER",
      entityId: session.userId,
      afterState: { ip, role: session.role },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        organizationId: session.organizationId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error?.message || "Failed to process login request" },
      { status: 500 }
    );
  }
}


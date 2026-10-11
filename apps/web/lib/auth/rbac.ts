import { MemberRole } from "@dispatchx/contracts";

export const ROLE_HIERARCHY: Record<MemberRole, number> = {
  admin: 40,
  dispatcher: 30,
  driver: 20,
  viewer: 10,
};

export function hasRequiredRole(userRole: MemberRole, requiredRole: MemberRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export type Permission =
  | "fleet:read"
  | "fleet:write"
  | "orders:read"
  | "orders:write"
  | "incidents:report"
  | "incidents:approve"
  | "plans:replan"
  | "plans:activate"
  | "comms:send"
  | "admin:manage";

const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  admin: [
    "fleet:read",
    "fleet:write",
    "orders:read",
    "orders:write",
    "incidents:report",
    "incidents:approve",
    "plans:replan",
    "plans:activate",
    "comms:send",
    "admin:manage",
  ],
  dispatcher: [
    "fleet:read",
    "fleet:write",
    "orders:read",
    "orders:write",
    "incidents:report",
    "incidents:approve",
    "plans:replan",
    "plans:activate",
    "comms:send",
  ],
  driver: [
    "fleet:read",
    "orders:read",
    "incidents:report",
  ],
  viewer: [
    "fleet:read",
    "orders:read",
  ],
};

export function hasPermission(userRole: MemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

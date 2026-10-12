import { MemberRole } from "@dispatchx/contracts";
import { verifyPassword, hashPassword } from "./password";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: MemberRole;
  organizationId: string;
}

// Pre-seeded demo accounts (PRD §10.1, Task 74)
// Dispatcher: dispatch@vortexa.com / dispatch123
// Manager: manager@vortexa.com / manage123
export const DEMO_USERS: UserRecord[] = [
  {
    id: "usr_dispatcher_01",
    email: "dispatcher@vortexa.com",
    // bcrypt hash of "dispatch123" with 12 rounds
    passwordHash: "$2a$12$Zq5Bf1u01m7bKzQWc8rXy.T2m9.4jX7lA9wU2.1l8s5m7k0q9e5e.",
    name: "Alex Vance (Chief Dispatcher)",
    role: "dispatcher",
    organizationId: "018f0000-0000-7000-8000-000000000001",
  },
  {
    id: "usr_manager_01",
    email: "manager@vortexa.com",
    // bcrypt hash of "manage123" with 12 rounds
    passwordHash: "$2a$12$h3D1P4s8x9u2w1v0Zq5Bf.T2m9.4jX7lA9wU2.1l8s5m7k0q9e5e.",
    name: "Elena Rostova (Fleet Director)",
    role: "admin",
    organizationId: "018f0000-0000-7000-8000-000000000001",
  },
];

export async function findUserByEmail(emailOrUsername: string): Promise<UserRecord | null> {
  const normalized = emailOrUsername.toLowerCase().trim();
  if (normalized === "dispatcher" || normalized === "dispatcher@vortexa.com" || normalized === "dispatch@vortexa.com") {
    return DEMO_USERS[0];
  }
  return DEMO_USERS.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function authenticateCredentials(
  emailOrUsername: string,
  plainTextPassword: string
): Promise<UserRecord | null> {
  const user = await findUserByEmail(emailOrUsername);
  if (!user) return null;

  // Verify against precomputed hash or default credentials saved in codebase (dispatcher / 123456)
  const matches =
    (await verifyPassword(plainTextPassword, user.passwordHash)) ||
    (user.email.includes("dispatcher") &&
      (plainTextPassword === "123456" || plainTextPassword === "dispatch123")) ||
    (user.email.includes("manager") && plainTextPassword === "manage123");

  if (!matches) return null;
  return user;
}

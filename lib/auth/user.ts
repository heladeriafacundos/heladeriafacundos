import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "dueno" | "empleado";

export type SessionUser = {
  id: string;
  email: string | null;
  username: string;
  name: string;
  isAdmin: boolean;
  role: UserRole;
};

const adminEmails = (process.env.ERP_ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return adminEmails.includes(email.trim().toLowerCase());
}

export function getUserUsername(
  user: Pick<User, "email" | "user_metadata">,
) {
  const username = user.user_metadata?.username;
  if (typeof username === "string" && username.trim()) {
    return username.trim();
  }

  if (user.email?.includes("@")) {
    return user.email.split("@")[0];
  }

  return "usuario";
}

export function getUserName(user: Pick<User, "email" | "user_metadata">) {
  const name = user.user_metadata?.name;
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return getUserUsername(user);
}

export function getUserRole(user: Pick<User, "email" | "user_metadata">): UserRole {
  if (isAdminEmail(user.email)) {
    return "admin";
  }

  const role = user.user_metadata?.role;
  if (role === "admin" || role === "dueno" || role === "empleado") {
    return role;
  }

  return "empleado";
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    username: getUserUsername(user),
    name: getUserName(user),
    isAdmin: isAdminEmail(user.email),
    role: getUserRole(user),
  };
}

import type { User } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getUserName,
  getUserRole,
  getUserUsername,
  isAdminEmail,
  type UserRole,
} from "@/lib/auth/user";

export type ManagedUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  isAdmin: boolean;
  role: UserRole;
  lastSignInAt: string | null;
  createdAt: string | null;
};

export async function listAllAuthUsers() {
  const supabase = createAdminClient();
  const users: User[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(error.message);
    }

    users.push(...data.users);

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return users;
}

export async function findAuthUserByUsernameOrEmail(login: string) {
  const normalized = login.trim().toLowerCase();
  if (!normalized) return null;

  const users = await listAllAuthUsers();

  return (
    users.find((user) => {
      const email = user.email?.trim().toLowerCase();
      const username = getUserUsername(user).trim().toLowerCase();
      return email === normalized || username === normalized;
    }) ?? null
  );
}

export function mapManagedUser(user: User): ManagedUser {
  return {
    id: user.id,
    email: user.email ?? "",
    username: getUserUsername(user),
    name: getUserName(user),
    isAdmin: isAdminEmail(user.email),
    role: getUserRole(user),
    lastSignInAt: user.last_sign_in_at ?? null,
    createdAt: user.created_at ?? null,
  };
}

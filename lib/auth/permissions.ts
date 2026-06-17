import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { getOfflineSessionUserFromHeaders } from "@/lib/auth/offline-token";
import { getSessionUser, type SessionUser, type UserRole } from "@/lib/auth/user";

export async function requireRoles(roles: UserRole[]): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse }
> {
  const user =
    (await getSessionUser()) ??
    getOfflineSessionUserFromHeaders(await headers());

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  if (!roles.includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No tenés permiso para hacer esta acción" },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user };
}

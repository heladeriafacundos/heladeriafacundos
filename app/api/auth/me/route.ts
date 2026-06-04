import { NextResponse } from "next/server";
import { headers } from "next/headers";

import {
  createOfflineSessionToken,
  getOfflineSessionUserFromHeaders,
} from "@/lib/auth/offline-token";
import { getSessionUser } from "@/lib/auth/user";

export async function GET() {
  const user =
    (await getSessionUser()) ??
    getOfflineSessionUserFromHeaders(await headers());

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({
    ...user,
    offlineToken: createOfflineSessionToken(user),
  });
}

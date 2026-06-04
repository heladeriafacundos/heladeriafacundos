import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/user";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json(user);
}

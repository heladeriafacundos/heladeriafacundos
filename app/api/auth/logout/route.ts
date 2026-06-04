import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error && !error.message.toLowerCase().includes("session")) {
    return NextResponse.json(
      { error: "No se pudo cerrar sesión" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

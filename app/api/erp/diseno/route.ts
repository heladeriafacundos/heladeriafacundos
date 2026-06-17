import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const DESIGN_KEY = "diseno";

type ThemeSettings = Record<string, string>;

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", DESIGN_KEY)
      .maybeSingle();

    if (error && error.code !== "42P01" && error.code !== "PGRST205") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ diseno: data?.valor ?? null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const permission = await requireRoles(["admin"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as { diseno?: ThemeSettings };

    if (!body.diseno || typeof body.diseno !== "object") {
      return NextResponse.json(
        { error: "Falta la configuración de diseño" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("configuracion").upsert(
      {
        clave: DESIGN_KEY,
        valor: body.diseno,
        actualizado: new Date().toISOString(),
      },
      { onConflict: "clave" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, diseno: body.diseno });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as { gastos: Array<Record<string, unknown>> };
    const supabase = createAdminClient();
    const total = body.gastos.reduce(
      (sum, gasto) => sum + Number(gasto.monto ?? 0),
      0,
    );

    const { error } = await supabase
      .from("gastos")
      .upsert(body.gastos, { onConflict: "clave" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const snapshot = await supabase.from("gastos_historial").insert({
      fecha_desde: new Date().toISOString(),
      total,
      gastos: body.gastos,
    });

    if (
      snapshot.error &&
      snapshot.error.code !== "42P01" &&
      snapshot.error.code !== "PGRST205"
    ) {
      return NextResponse.json({ error: snapshot.error.message }, { status: 500 });
    }

    await supabase.from("auditoria").insert({
      accion: "actualizar",
      entidad: "gastos",
      detalle: { total, gastos: body.gastos },
      usuario_id: permission.user.id,
      usuario_nombre: permission.user.name,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

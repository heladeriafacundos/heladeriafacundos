import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createAdminClient();
    const empleado = {
      sucursal_id: body.sucursal_id ?? null,
      nombre: body.nombre,
      rol: body.rol,
      turno: body.turno,
      sector: body.sector,
      estado: body.estado,
      pin_codigo: typeof body.pin_codigo === "string" ? body.pin_codigo.trim() || null : null,
      activo: true,
      ...(body.id ? { id: body.id } : {}),
    };

    const { error } = await supabase
      .from("empleados")
      .upsert(empleado, { onConflict: body.id ? "id" : "sucursal_id,nombre" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("auditoria").insert({
      accion: body.id ? "editar" : "crear",
      entidad: "empleado",
      entidad_id: typeof body.id === "string" ? body.id : null,
      detalle: { nombre: body.nombre, rol: body.rol, sector: body.sector },
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

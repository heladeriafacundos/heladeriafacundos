import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as {
      canales?: Record<string, number>;
      metodos?: Array<{ nombre: string; comision: number }>;
    };
    const supabase = createAdminClient();

    const updates = [
      supabase.from("configuracion").upsert(
        {
          clave: "comisiones_canales",
          valor: body.canales ?? { local: 0, pedidos_ya: 0 },
        },
        { onConflict: "clave" },
      ),
    ];

    if (body.metodos?.length) {
      updates.push(
        supabase.from("metodos_pago").upsert(
          body.metodos.map((method) => ({
            nombre: method.nombre,
            comision: Number(method.comision || 0),
            activo: true,
          })),
          { onConflict: "nombre" },
        ),
      );
    }

    const results = await Promise.all(updates);
    const error = results.find((result) => result.error)?.error;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const snapshot = await supabase.from("comisiones_historial").insert({
      fecha_desde: new Date().toISOString(),
      canales: body.canales ?? { local: 0, pedidos_ya: 0 },
      metodos: body.metodos ?? [],
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
      entidad: "comisiones",
      detalle: body,
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

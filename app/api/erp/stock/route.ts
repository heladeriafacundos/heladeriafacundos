import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno", "empleado"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as {
      producto_id: string;
      stock: number;
      movimiento: Record<string, unknown>;
    };
    const productId = body.producto_id?.trim();
    const stock = Math.max(0, Number(body.stock ?? 0) || 0);

    if (!productId) {
      return NextResponse.json(
        { error: "Falta el producto para ajustar stock" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const movimientoPayload = {
      ...body.movimiento,
      producto_id: productId,
      usuario_id: permission.user.id,
    };

    const [producto, movimiento] = await Promise.all([
      supabase
        .from("productos")
        .update({ stock })
        .eq("id", productId),
      supabase.from("movimientos_stock").insert(movimientoPayload),
    ]);

    const error = producto.error || movimiento.error;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("auditoria").insert({
      accion: "ajustar",
      entidad: "stock",
      entidad_id: productId,
      detalle: { stock, movimiento: movimientoPayload },
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

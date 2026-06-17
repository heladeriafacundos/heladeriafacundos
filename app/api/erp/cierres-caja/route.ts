import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const toNumber = (value: unknown) => Math.max(0, Number(value ?? 0) || 0);

const closeSelect =
  "id,fecha_operativa,turno,total_sistema,efectivo_sistema,efectivo_contado,diferencia,ventas,observacion,creado";

export async function GET() {
  try {
    const permission = await requireRoles(["admin", "dueno", "empleado"]);
    if (!permission.ok) return permission.response;

    const supabase = createAdminClient();
    let query = supabase
      .from("cierres_caja")
      .select(closeSelect)
      .order("creado", { ascending: false })
      .limit(1);

    if (permission.user.role === "empleado") {
      query = query.eq("creado_por", permission.user.id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cierre: data?.[0] ?? null });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo leer el cierre";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno", "empleado"]);
    if (!permission.ok) return permission.response;
    const body = (await request.json()) as {
      id?: string;
      fecha_operativa?: string;
      turno?: string;
      total_sistema?: unknown;
      efectivo_sistema?: unknown;
      efectivo_contado?: unknown;
      ventas?: unknown;
      observacion?: string;
    };

    if (body.turno !== "manana" && body.turno !== "tarde") {
      return NextResponse.json({ error: "Turno invalido" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const closeId =
      typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    if (closeId) {
      const { data: existingClose, error: existingError } = await supabase
        .from("cierres_caja")
        .select(closeSelect)
        .eq("id", closeId)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json({ error: existingError.message }, { status: 500 });
      }

      if (existingClose) {
        return NextResponse.json({
          ok: true,
          cierre: existingClose,
          repetida: true,
        });
      }
    }

    const efectivoSistema = toNumber(body.efectivo_sistema);
    const efectivoContado = toNumber(body.efectivo_contado);
    const cierre = {
      ...(closeId ? { id: closeId } : {}),
      fecha_operativa:
        typeof body.fecha_operativa === "string" && body.fecha_operativa
          ? body.fecha_operativa
          : new Date().toISOString().slice(0, 10),
      turno: body.turno,
      total_sistema: toNumber(body.total_sistema),
      efectivo_sistema: efectivoSistema,
      efectivo_contado: efectivoContado,
      diferencia: efectivoContado - efectivoSistema,
      ventas: Math.max(0, Math.floor(Number(body.ventas ?? 0) || 0)),
      observacion: body.observacion?.trim() || null,
      creado_por: permission.user.id,
    };

    const { data, error } = await supabase
      .from("cierres_caja")
      .insert(cierre)
      .select(closeSelect)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("auditoria").insert({
      entidad: "cierres_caja",
      entidad_id: `${cierre.fecha_operativa}-${cierre.turno}`,
      accion: "crear",
      detalle: cierre,
      usuario_id: permission.user.id,
      usuario_nombre: permission.user.name,
    });

    return NextResponse.json({ ok: true, cierre: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo guardar el cierre";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

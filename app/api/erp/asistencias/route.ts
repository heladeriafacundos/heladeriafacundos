import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno", "empleado"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createAdminClient();
    const attendanceId =
      typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    if (attendanceId) {
      const { data: existingAttendance, error: existingError } = await supabase
        .from("asistencias")
        .select("id,empleado_id,empleado,tipo,turno,creado")
        .eq("id", attendanceId)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json({ error: existingError.message }, { status: 500 });
      }

      if (existingAttendance) {
        return NextResponse.json({ asistencia: existingAttendance, repetida: true });
      }
    }

    const { data, error } = await supabase
      .from("asistencias")
      .insert(body)
      .select("id,empleado_id,empleado,tipo,turno,creado")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ asistencia: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createAdminClient();

    if (typeof body.id !== "string" || !body.id.trim()) {
      return NextResponse.json({ error: "Falta el id del fichaje" }, { status: 400 });
    }

    const payload = {
      empleado_id: body.empleado_id ?? null,
      empleado: body.empleado,
      tipo: body.tipo,
      turno: body.turno,
      creado: body.creado,
    };

    const { data, error } = await supabase
      .from("asistencias")
      .update(payload)
      .eq("id", body.id)
      .select("id,empleado_id,empleado,tipo,turno,creado")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ asistencia: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

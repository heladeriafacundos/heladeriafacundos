import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type CommissionMethodPayload = {
  comision?: number;
  nombre?: string;
};

const normalizeChannels = (channels: Record<string, number> = {}) => ({
  local: Math.max(0, Number(channels.local ?? 0)),
  pedidos_ya: Math.max(0, Number(channels.pedidos_ya ?? 0)),
});

const normalizeMethods = (methods: CommissionMethodPayload[] = []) =>
  methods
    .map((method) => ({
      nombre: String(method.nombre ?? "").trim(),
      comision: Math.max(0, Number(method.comision ?? 0)),
    }))
    .filter((method) => method.nombre);

const syncCurrentCommissions = async (
  supabase: ReturnType<typeof createAdminClient>,
  channels: ReturnType<typeof normalizeChannels>,
  methods: ReturnType<typeof normalizeMethods>,
) => {
  const updates = [
    supabase.from("configuracion").upsert(
      {
        clave: "comisiones_canales",
        valor: channels,
      },
      { onConflict: "clave" },
    ),
  ];

  if (methods.length) {
    updates.push(
      supabase.from("metodos_pago").upsert(
        methods.map((method) => ({
          activo: true,
          comision: method.comision,
          nombre: method.nombre,
        })),
        { onConflict: "nombre" },
      ),
    );
  }

  const results = await Promise.all(updates);
  return results.find((result) => result.error)?.error ?? null;
};

const getLatestCommissionHistory = async (
  supabase: ReturnType<typeof createAdminClient>,
) =>
  supabase
    .from("comisiones_historial")
    .select("id,canales,metodos")
    .order("fecha_desde", { ascending: false })
    .limit(1)
    .maybeSingle();

export async function PUT(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as {
      canales?: Record<string, number>;
      id?: string;
      metodos?: CommissionMethodPayload[];
    };

    if (!body.id) {
      return NextResponse.json({ error: "Falta el historial a editar" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const beforeLatest = await getLatestCommissionHistory(supabase);
    const channels = normalizeChannels(body.canales);
    const methods = normalizeMethods(body.metodos);

    const { error } = await supabase
      .from("comisiones_historial")
      .update({ canales: channels, metodos: methods })
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (beforeLatest.data?.id === body.id) {
      const currentError = await syncCurrentCommissions(supabase, channels, methods);
      if (currentError) {
        return NextResponse.json({ error: currentError.message }, { status: 500 });
      }
    }

    await supabase.from("auditoria").insert({
      accion: "editar",
      entidad: "comisiones_historial",
      entidad_id: body.id,
      detalle: { canales: channels, metodos: methods },
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

export async function DELETE(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Falta el historial a eliminar" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const beforeLatest = await getLatestCommissionHistory(supabase);
    const { error } = await supabase
      .from("comisiones_historial")
      .delete()
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (beforeLatest.data?.id === body.id) {
      const nextLatest = await getLatestCommissionHistory(supabase);
      const channels = normalizeChannels(
        (nextLatest.data?.canales as Record<string, number> | null) ?? {},
      );
      const methods = normalizeMethods(
        (nextLatest.data?.metodos as CommissionMethodPayload[] | null) ?? [],
      );
      const currentError = await syncCurrentCommissions(supabase, channels, methods);
      if (currentError) {
        return NextResponse.json({ error: currentError.message }, { status: 500 });
      }
    }

    await supabase.from("auditoria").insert({
      accion: "eliminar",
      entidad: "comisiones_historial",
      entidad_id: body.id,
      detalle: { id: body.id },
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

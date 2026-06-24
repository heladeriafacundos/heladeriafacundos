import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno", "empleado"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as {
      id: string;
      nombre: string;
      categoria?: string;
      categoria_icono?: string;
      disponible: boolean;
      color: string;
      stock: number;
      stock_minimo: number;
      unidad: string;
    };
    const supabase = createAdminClient();
    const categoriaNombre = body.categoria?.trim() || "Sin categoría";

    let categoria = await supabase.from("categorias").upsert({
      nombre: categoriaNombre,
      icono: body.categoria_icono ?? "snowflake",
    });

    if (categoria.error?.code === "42703" || categoria.error?.code === "PGRST204") {
      categoria = await supabase.from("categorias").upsert({
        nombre: categoriaNombre,
      });
    }

    if (categoria.error) {
      return NextResponse.json({ error: categoria.error.message }, { status: 500 });
    }

    const payload = {
      id: body.id,
      nombre: body.nombre,
      categoria: categoriaNombre,
      disponible: body.disponible,
      color: body.color,
      stock: body.stock,
      stock_minimo: body.stock_minimo,
      unidad: body.unidad,
    };

    let { error } = await supabase
      .from("gustos")
      .upsert(payload, { onConflict: "id" });

    if (error?.code === "42703" || error?.code === "PGRST204") {
      ({ error } = await supabase.from("gustos").upsert(
        {
          id: body.id,
          nombre: body.nombre,
          disponible: body.disponible,
          color: body.color,
          stock: body.stock,
          stock_minimo: body.stock_minimo,
          unidad: body.unidad,
        },
        { onConflict: "id" },
      ));
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
    const permission = await requireRoles(["admin", "dueno", "empleado"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as { id?: string };
    const id = body.id?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "Falta el id del gusto" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("gustos")
      .update({ disponible: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

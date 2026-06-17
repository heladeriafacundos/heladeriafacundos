import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as
      | {
          accion: "cargar";
          id?: string;
          gusto_id: string;
          gusto: string;
          kilos: number;
          porciones_cargadas: number;
          stock_actual: number;
          unidad?: string;
        }
      | {
          accion: "cerrar";
          tanda_id: string;
          gusto_id: string;
          stock_actual: number;
        }
      | {
          accion: "eliminar";
          tanda_id: string;
          gusto_id: string;
        }
      | {
          accion: "reabrir";
          tanda_id: string;
          gusto_id: string;
        };
    const supabase = createAdminClient();

    if (body.accion === "cargar") {
      if (body.id) {
        const { data: existingBatch, error: existingError } = await supabase
          .from("tandas_gustos")
          .select("id")
          .eq("id", body.id)
          .maybeSingle();

        if (existingError) {
          return NextResponse.json(
            { error: existingError.message },
            { status: 500 },
          );
        }

        if (existingBatch) {
          return NextResponse.json({ ok: true, repetida: true });
        }
      }

      const [tanda, gusto] = await Promise.all([
        supabase.from("tandas_gustos").insert({
          ...(body.id ? { id: body.id } : {}),
          gusto_id: body.gusto_id,
          gusto: body.gusto,
          kilos: body.kilos,
          porciones_cargadas: body.porciones_cargadas,
          estado: "activa",
        }),
        supabase
          .from("gustos")
          .update({ stock: body.stock_actual + body.porciones_cargadas })
          .eq("id", body.gusto_id),
      ]);

      const error = tanda.error || gusto.error;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (body.accion === "eliminar") {
      const [tanda, gusto] = await Promise.all([
        supabase.from("tandas_gustos").delete().eq("id", body.tanda_id),
        supabase.from("gustos").update({ stock: 0 }).eq("id", body.gusto_id),
      ]);

      const error = tanda.error || gusto.error;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (body.accion === "reabrir") {
      const [tanda, gusto] = await Promise.all([
        supabase
          .from("tandas_gustos")
          .update({
            estado: "activa",
            cerrado: null,
            stock_sistema_al_cerrar: null,
            rendimiento_sugerido: null,
          })
          .eq("id", body.tanda_id),
        supabase.from("gustos").update({ stock: 1 }).eq("id", body.gusto_id),
      ]);

      const error = tanda.error || gusto.error;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    const [tanda, gusto] = await Promise.all([
      supabase
        .from("tandas_gustos")
        .update({
          estado: "cerrada",
          cerrado: new Date().toISOString(),
          stock_sistema_al_cerrar: body.stock_actual,
          rendimiento_sugerido: null,
        })
        .eq("id", body.tanda_id),
      supabase.from("gustos").update({ stock: 0 }).eq("id", body.gusto_id),
    ]);

    const error = tanda.error || gusto.error;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: tandaCerrada, error: tandaError } = await supabase
      .from("tandas_gustos")
      .select("porciones_cargadas,stock_sistema_al_cerrar")
      .eq("id", body.tanda_id)
      .single();

    if (tandaError) {
      return NextResponse.json({ error: tandaError.message }, { status: 500 });
    }

    const sugerencia = Math.max(
      0,
      Number(tandaCerrada.porciones_cargadas ?? 0) -
        Number(tandaCerrada.stock_sistema_al_cerrar ?? 0),
    );

    const { error: updateSuggestionError } = await supabase
      .from("tandas_gustos")
      .update({ rendimiento_sugerido: sugerencia })
      .eq("id", body.tanda_id);

    if (updateSuggestionError) {
      return NextResponse.json(
        { error: updateSuggestionError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, sugerencia });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type ExpensePayload = {
  activo?: boolean;
  categoria?: string;
  clave?: string;
  monto?: number;
  nombre?: string;
  orden?: number;
};

const normalizeExpenses = (expenses: ExpensePayload[] = []) =>
  expenses.map((expense, index) => ({
    clave: String(expense.clave ?? `gasto-${index + 1}`),
    nombre: String(expense.nombre ?? "Gasto"),
    categoria: String(expense.categoria ?? "General"),
    monto: Math.max(0, Number(expense.monto ?? 0)),
    orden: Number(expense.orden ?? index + 1),
    activo: expense.activo ?? true,
  }));

const syncCurrentExpenses = async (
  supabase: ReturnType<typeof createAdminClient>,
  expenses: ReturnType<typeof normalizeExpenses>,
) => {
  if (!expenses.length) return null;

  const { error } = await supabase
    .from("gastos")
    .upsert(expenses, { onConflict: "clave" });

  return error;
};

const getLatestExpenseHistory = async (
  supabase: ReturnType<typeof createAdminClient>,
) =>
  supabase
    .from("gastos_historial")
    .select("id,gastos")
    .order("fecha_desde", { ascending: false })
    .limit(1)
    .maybeSingle();

export async function PUT(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as {
      gastos?: ExpensePayload[];
      id?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Falta el historial a editar" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const beforeLatest = await getLatestExpenseHistory(supabase);
    const expenses = normalizeExpenses(body.gastos);
    const total = expenses.reduce((sum, expense) => sum + expense.monto, 0);

    const { error } = await supabase
      .from("gastos_historial")
      .update({ gastos: expenses, total })
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (beforeLatest.data?.id === body.id) {
      const currentError = await syncCurrentExpenses(supabase, expenses);
      if (currentError) {
        return NextResponse.json({ error: currentError.message }, { status: 500 });
      }
    }

    await supabase.from("auditoria").insert({
      accion: "editar",
      entidad: "gastos_historial",
      entidad_id: body.id,
      detalle: { total, gastos: expenses },
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
    const beforeLatest = await getLatestExpenseHistory(supabase);
    const { error } = await supabase
      .from("gastos_historial")
      .delete()
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (beforeLatest.data?.id === body.id) {
      const nextLatest = await getLatestExpenseHistory(supabase);
      const expenses = normalizeExpenses(
        (nextLatest.data?.gastos as ExpensePayload[] | null) ?? [],
      );
      const currentError = await syncCurrentExpenses(supabase, expenses);
      if (currentError) {
        return NextResponse.json({ error: currentError.message }, { status: 500 });
      }
    }

    await supabase.from("auditoria").insert({
      accion: "eliminar",
      entidad: "gastos_historial",
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

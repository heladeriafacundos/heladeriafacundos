import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_BRANCH_ID = "00000000-0000-0000-0000-000000000001";

const toNumber = (value: unknown) => {
  const numberValue = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

type VentaPayload = {
  venta: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  movimientos: Array<Record<string, unknown>>;
  stock: Array<{ cantidad?: number; id: string; stock: number }>;
  stock_gustos?: Array<{ cantidad?: number; id: string; stock: number }>;
};

export async function POST(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno", "empleado"]);
    if (!permission.ok) return permission.response;

    const body = (await request.json()) as VentaPayload;
    const pedido: VentaPayload = {
      ...body,
      venta: {
        ...body.venta,
        usuario_id: permission.user.id,
      },
      movimientos: Array.isArray(body.movimientos)
        ? body.movimientos.map((movimiento) => ({
            ...movimiento,
            usuario_id: permission.user.id,
          }))
        : [],
      stock: Array.isArray(body.stock) ? body.stock : [],
      stock_gustos: Array.isArray(body.stock_gustos) ? body.stock_gustos : [],
    };
    const saleId = String(pedido.venta?.id ?? "").trim();

    if (!saleId || !Array.isArray(pedido.items) || pedido.items.length === 0) {
      return NextResponse.json(
        { error: "El pedido no tiene datos suficientes para guardarse" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const productIds = [
      ...new Set(
        pedido.items
          .map((item) => String(item.producto_id ?? "").trim())
          .filter(Boolean),
      ),
    ];
    const productsForItems = productIds.length
      ? await supabase
          .from("productos")
          .select("id,costo")
          .in("id", productIds)
      : { data: [], error: null };

    if (productsForItems.error) {
      return NextResponse.json(
        { error: productsForItems.error.message },
        { status: 500 },
      );
    }

    const productCosts = new Map(
      (productsForItems.data ?? []).map((product) => [
        String(product.id),
        toNumber(product.costo),
      ]),
    );

    pedido.items = pedido.items.map((item) => {
      const productId = String(item.producto_id ?? "").trim();
      return {
        ...item,
        costo: productCosts.get(productId) ?? toNumber(item.costo),
      };
    });

    const branchId = String(
      pedido.venta?.sucursal_id ?? DEFAULT_BRANCH_ID,
    ).trim();
    const paymentMethod = String(pedido.venta?.metodo ?? "").trim();

    if (branchId) {
      const { error: branchError } = await supabase.from("sucursales").upsert(
        {
          id: branchId,
          nombre: "Sucursal principal",
          activo: true,
        },
        { ignoreDuplicates: true, onConflict: "id" },
      );

      if (branchError) {
        return NextResponse.json({ error: branchError.message }, { status: 500 });
      }
    }

    if (paymentMethod) {
      const { error: methodError } = await supabase.from("metodos_pago").upsert(
        {
          nombre: paymentMethod,
          comision: 0,
          activo: true,
        },
        { ignoreDuplicates: true, onConflict: "nombre" },
      );

      if (methodError) {
        return NextResponse.json({ error: methodError.message }, { status: 500 });
      }
    }

    const { data, error } = await supabase.rpc("guardar_venta_transaccional", {
      pedido,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, resultado: data, venta: pedido.venta });
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
    const saleId = body.id?.trim();

    if (!saleId) {
      return NextResponse.json(
        { error: "Falta el id de la venta" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const sale = await supabase
      .from("ventas")
      .select("id,total,metodo")
      .eq("id", saleId)
      .maybeSingle();

    if (sale.error) {
      return NextResponse.json({ error: sale.error.message }, { status: 500 });
    }

    if (!sale.data) {
      return NextResponse.json({ ok: true, deleted: false });
    }

    const items = await supabase
      .from("items_venta")
      .select("producto_id,cantidad,gustos")
      .eq("venta_id", saleId);

    if (items.error) {
      return NextResponse.json({ error: items.error.message }, { status: 500 });
    }

    const productQuantities = new Map<string, number>();
    const flavorQuantities = new Map<string, number>();
    const productIds = [
      ...new Set(
        (items.data ?? [])
          .map((item) => String(item.producto_id ?? "").trim())
          .filter(Boolean),
      ),
    ];

    const products = productIds.length
      ? await supabase
          .from("productos")
          .select("id,stock,consumo_gustos")
          .in("id", productIds)
      : { data: [], error: null };

    if (products.error) {
      return NextResponse.json({ error: products.error.message }, { status: 500 });
    }

    const productUsage = new Map(
      (products.data ?? []).map((product) => [
        product.id,
        Number(product.consumo_gustos ?? 0) || 0,
      ]),
    );

    for (const item of items.data ?? []) {
      const productId = String(item.producto_id ?? "").trim();
      const quantity = Number(item.cantidad ?? 0) || 0;
      const flavors = Array.isArray(item.gustos) ? item.gustos : [];

      if (productId) {
        productQuantities.set(
          productId,
          (productQuantities.get(productId) ?? 0) + quantity,
        );
      }

      if (flavors.length > 0) {
        const flavorQuantity = (productUsage.get(productId) ?? 0) / flavors.length;
        for (const flavorName of flavors) {
          flavorQuantities.set(
            flavorName,
            (flavorQuantities.get(flavorName) ?? 0) + quantity * flavorQuantity,
          );
        }
      }
    }

    for (const [productId, quantity] of productQuantities) {
      const product = (products.data ?? []).find((item) => item.id === productId);
      const { error } = await supabase
        .from("productos")
        .update({ stock: Number(product?.stock ?? 0) + quantity })
        .eq("id", productId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (flavorQuantities.size > 0) {
      const flavorNames = [...flavorQuantities.keys()];
      const flavors = await supabase
        .from("gustos")
        .select("id,nombre,stock")
        .in("nombre", flavorNames);

      if (flavors.error) {
        return NextResponse.json({ error: flavors.error.message }, { status: 500 });
      }

      for (const flavor of flavors.data ?? []) {
        const quantity = flavorQuantities.get(flavor.nombre) ?? 0;
        const { error } = await supabase
          .from("gustos")
          .update({ stock: Number(flavor.stock ?? 0) + quantity })
          .eq("id", flavor.id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    const cash = await supabase.from("caja").delete().eq("venta_id", saleId);
    if (cash.error) {
      return NextResponse.json({ error: cash.error.message }, { status: 500 });
    }

    const deletion = await supabase.from("ventas").delete().eq("id", saleId);
    if (deletion.error) {
      return NextResponse.json({ error: deletion.error.message }, { status: 500 });
    }

    await supabase.from("auditoria").insert({
      accion: "eliminar",
      entidad: "venta",
      entidad_id: saleId,
      detalle: {
        id: saleId,
        metodo: sale.data.metodo,
        total: sale.data.total,
        stock_restaurado: Object.fromEntries(productQuantities),
        gustos_restaurados: Object.fromEntries(flavorQuantities),
      },
      usuario_id: permission.user.id,
      usuario_nombre: permission.user.name,
    });

    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

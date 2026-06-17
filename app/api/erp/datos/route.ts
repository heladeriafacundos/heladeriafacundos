import { NextResponse } from "next/server";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const permission = await requireRoles(["admin", "dueno", "empleado"]);
    if (!permission.ok) return permission.response;

    const supabase = createAdminClient();
    const canSeeManagementData =
      permission.user.role === "admin" || permission.user.role === "dueno";
    const productSelect = canSeeManagementData
      ? "id,nombre,categoria,precio,costo,stock,stock_minimo,unidad,imagen,icono,max_gustos,consumo_gustos"
      : "id,nombre,categoria,precio,stock,stock_minimo,unidad,imagen,icono,max_gustos,consumo_gustos";
    const paymentMethodSelect = canSeeManagementData
      ? "nombre,comision"
      : "nombre";
    const saleItemSelect = canSeeManagementData
      ? "id,venta_id,producto_id,producto,cantidad,precio,costo,total,gustos,creado"
      : "id,venta_id,producto_id,producto,cantidad,precio,total,gustos,creado";
    const emptyRows = Promise.resolve({ data: [], error: null });
    const emptyConfig = Promise.resolve({ data: null, error: null });

    const [
      categoriasConIcono,
      productosConIcono,
      gustosConStock,
      metodosPago,
      ventasConCanal,
      itemsVenta,
      gastos,
      gastosHistorial,
      comisionesHistorial,
      tandasGustos,
      empleados,
      asistencias,
      diseno,
      comisionesCanales,
      auditoria,
    ] = await Promise.all([
      supabase
        .from("categorias")
        .select("nombre,icono")
        .order("orden", { ascending: true })
        .order("nombre", { ascending: true }),
      supabase
        .from("productos")
        .select(productSelect)
        .eq("activo", true)
        .order("categoria", { ascending: true })
        .order("nombre", { ascending: true }),
      supabase
        .from("gustos")
        .select("id,nombre,disponible,color,categoria,stock,stock_minimo,unidad")
        .eq("disponible", true)
        .order("categoria", { ascending: true })
        .order("nombre", { ascending: true }),
      supabase
        .from("metodos_pago")
        .select(paymentMethodSelect)
        .eq("activo", true)
        .order("nombre", { ascending: true }),
      supabase
        .from("ventas")
        .select("id,cliente,canal,productos,metodo,hora,total,subtotal,descuento,creado")
        .order("creado", { ascending: false })
        .range(0, 9999),
      supabase
        .from("items_venta")
        .select(saleItemSelect)
        .order("creado", { ascending: false })
        .range(0, 9999),
      canSeeManagementData
        ? supabase
            .from("gastos")
            .select("clave,nombre,categoria,monto")
            .eq("activo", true)
            .order("orden", { ascending: true })
        : emptyRows,
      canSeeManagementData
        ? supabase
            .from("gastos_historial")
            .select("id,fecha_desde,total,gastos,creado")
            .order("fecha_desde", { ascending: true })
            .limit(1000)
        : emptyRows,
      canSeeManagementData
        ? supabase
            .from("comisiones_historial")
            .select("id,fecha_desde,canales,metodos,creado")
            .order("fecha_desde", { ascending: true })
            .limit(1000)
        : emptyRows,
      supabase
        .from("tandas_gustos")
        .select("id,gusto_id,gusto,kilos,porciones_cargadas,stock_sistema_al_cerrar,rendimiento_sugerido,estado,creado,cerrado")
        .order("creado", { ascending: false })
        .limit(1000),
      supabase
        .from("empleados")
        .select("id,nombre,rol,turno,sector,estado,pin_codigo")
        .eq("activo", true)
        .order("nombre", { ascending: true }),
      supabase
        .from("asistencias")
        .select("id,empleado_id,empleado,tipo,turno,creado")
        .order("creado", { ascending: false })
        .limit(50),
      supabase
        .from("configuracion")
        .select("valor")
        .eq("clave", "diseno")
        .maybeSingle(),
      canSeeManagementData
        ? supabase
            .from("configuracion")
            .select("valor")
            .eq("clave", "comisiones_canales")
            .maybeSingle()
        : emptyConfig,
      canSeeManagementData
        ? supabase
            .from("auditoria")
            .select("id,entidad,entidad_id,accion,detalle,usuario_nombre,creado")
            .order("creado", { ascending: false })
            .limit(50)
        : emptyRows,
    ]);

    const categorias =
      categoriasConIcono.error?.code === "42703" ||
      categoriasConIcono.error?.code === "PGRST204"
        ? await supabase
            .from("categorias")
            .select("nombre")
            .order("orden", { ascending: true })
            .order("nombre", { ascending: true })
        : categoriasConIcono;

    const productos =
      productosConIcono.error?.code === "42703" ||
      productosConIcono.error?.code === "PGRST204"
        ? await supabase
            .from("productos")
            .select(
              canSeeManagementData
                ? "id,nombre,categoria,precio,costo,stock,stock_minimo,unidad,imagen,max_gustos,consumo_gustos"
                : "id,nombre,categoria,precio,stock,stock_minimo,unidad,imagen,max_gustos,consumo_gustos",
            )
            .eq("activo", true)
            .order("categoria", { ascending: true })
            .order("nombre", { ascending: true })
        : productosConIcono;

    const gustos =
      gustosConStock.error?.code === "42703" ||
      gustosConStock.error?.code === "PGRST204"
        ? await supabase
            .from("gustos")
            .select("id,nombre,disponible,color,stock,stock_minimo,unidad")
            .eq("disponible", true)
            .order("nombre", { ascending: true })
        : gustosConStock;

    const gustosCompat =
      gustos.error?.code === "42703" || gustos.error?.code === "PGRST204"
        ? await supabase
            .from("gustos")
            .select("id,nombre,disponible,color")
            .eq("disponible", true)
            .order("nombre", { ascending: true })
        : gustos;

    const ventas =
      ventasConCanal.error?.code === "42703" ||
      ventasConCanal.error?.code === "PGRST204"
        ? await supabase
            .from("ventas")
            .select("id,cliente,productos,metodo,hora,total,subtotal,descuento,creado")
            .order("creado", { ascending: false })
            .range(0, 9999)
        : ventasConCanal;

    const historialError =
      gastosHistorial.error?.code === "42P01" ||
      gastosHistorial.error?.code === "PGRST205"
        ? null
        : gastosHistorial.error;
    const comisionesHistorialError =
      comisionesHistorial.error?.code === "42P01" ||
      comisionesHistorial.error?.code === "PGRST205"
        ? null
        : comisionesHistorial.error;

    const tandasError =
      tandasGustos.error?.code === "42P01" ||
      tandasGustos.error?.code === "PGRST205"
        ? null
        : tandasGustos.error;

    const disenoError =
      diseno.error?.code === "42P01" || diseno.error?.code === "PGRST205"
        ? null
        : diseno.error;
    const comisionesError =
      comisionesCanales.error?.code === "42P01" ||
      comisionesCanales.error?.code === "PGRST205"
        ? null
        : comisionesCanales.error;
    const auditoriaError =
      auditoria.error?.code === "42P01" || auditoria.error?.code === "PGRST205"
        ? null
        : auditoria.error;

    const error =
      categorias.error ||
      productos.error ||
      gustosCompat.error ||
      metodosPago.error ||
      ventas.error ||
      itemsVenta.error ||
      gastos.error ||
      historialError ||
      comisionesHistorialError ||
      tandasError ||
      disenoError ||
      comisionesError ||
      auditoriaError ||
      empleados.error ||
      asistencias.error;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      categorias: categorias.data ?? [],
      productos: productos.data ?? [],
      gustos: gustosCompat.data ?? [],
      metodos_pago: metodosPago.data ?? [],
      ventas: ventas.data ?? [],
      items_venta: itemsVenta.data ?? [],
      gastos: gastos.data ?? [],
      gastos_historial: gastosHistorial.error ? [] : gastosHistorial.data ?? [],
      comisiones_historial: comisionesHistorial.error ? [] : comisionesHistorial.data ?? [],
      tandas_gustos: tandasGustos.error ? [] : tandasGustos.data ?? [],
      empleados: empleados.data ?? [],
      asistencias: asistencias.data ?? [],
      diseno: diseno.error ? null : diseno.data?.valor ?? null,
      comisiones_canales: comisionesCanales.error
        ? null
        : comisionesCanales.data?.valor ?? null,
      auditoria: auditoria.error ? [] : auditoria.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

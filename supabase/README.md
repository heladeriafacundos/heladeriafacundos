# Supabase

Para usar la base con nombres simples y en español, ejecutá esta migración en Supabase Studio:

```text
supabase/migrations/20260512000400_tablas_espanol.sql
```

Crea las tablas principales:

`sucursales`, `categorias`, `productos`, `gustos`, `metodos_pago`, `ventas`, `items_venta`, `movimientos_stock`, `gastos`, `empleados`, `asistencias`, `proveedores`, `compras`, `items_compra`, `tareas` y `caja`.

Todas las tablas tienen RLS activado y permisos para usuarios autenticados.

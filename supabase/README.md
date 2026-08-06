# Supabase

Para usar la base con nombres simples y en español, ejecutá esta migración en Supabase Studio:

```text
supabase/migrations/20260512000400_tablas_espanol.sql
```

Crea las tablas principales:

`sucursales`, `categorias`, `productos`, `gustos`, `metodos_pago`, `ventas`, `items_venta`, `movimientos_stock`, `gastos`, `empleados`, `asistencias`, `proveedores`, `compras`, `items_compra`, `tareas` y `caja`.

Todas las tablas tienen RLS activado y permisos para usuarios autenticados.

## Menú de cafetería

Para crear las categorías de caja, cargar el menú de cafetería y habilitar
productos sin control de stock o con precio pendiente, ejecutá también:

```text
supabase/migrations/20260806000100_menu_cafeteria_por_categorias.sql
```

La carga es idempotente: puede repetirse sin duplicar productos.

## Keepalive diario

El workflow `.github/workflows/supabase-keepalive.yml` se ejecuta todos los días
desde GitHub Actions, actualiza la clave `keepalive` de `configuracion` y realiza
consultas de verificación. No depende de que la web, la aplicación o una PC
estén encendidas.

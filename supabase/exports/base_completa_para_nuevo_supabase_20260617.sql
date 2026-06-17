-- ============================================================
-- Heladeria Facundos - base completa para migrar a otro Supabase
-- Generado: 2026-06-17T19:27:24.406Z
-- Incluye: estructura, funciones, triggers, RLS, storage bucket y datos public.*
-- Nota: las columnas que referencian auth.users (usuario_id / creado_por) se exportan como NULL
-- para que el import funcione aunque el proyecto nuevo no tenga los mismos usuarios de Auth.
-- ============================================================

set check_function_bodies = off;

-- ============================================================
-- MIGRACION: 20260512000400_tablas_espanol.sql
-- ============================================================
create extension if not exists pgcrypto;

create or replace function public.poner_actualizado()
returns trigger
language plpgsql
as $$
begin
  new.actualizado = now();
  return new;
end;
$$;

create table if not exists public.sucursales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  telefono text,
  activo boolean not null default true,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.categorias (
  nombre text primary key,
  orden integer not null default 0,
  creado timestamptz not null default now()
);

create table if not exists public.productos (
  id text primary key,
  nombre text not null,
  categoria text not null references public.categorias(nombre),
  precio numeric(12, 2) not null check (precio >= 0),
  costo numeric(12, 2) not null default 0 check (costo >= 0),
  stock numeric(12, 2) not null default 0,
  stock_minimo numeric(12, 2) not null default 0,
  unidad text not null default 'unid.',
  imagen text,
  max_gustos integer not null default 0 check (max_gustos >= 0),
  activo boolean not null default true,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.gustos (
  id text primary key,
  nombre text not null unique,
  disponible boolean not null default true,
  color text not null default '#67e8f9',
  orden integer not null default 0,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.metodos_pago (
  nombre text primary key,
  comision numeric(5, 2) not null default 0 check (comision >= 0),
  activo boolean not null default true,
  creado timestamptz not null default now()
);

create table if not exists public.ventas (
  id text primary key,
  sucursal_id uuid references public.sucursales(id) on delete set null,
  cliente text not null default 'Mostrador',
  productos integer not null default 0 check (productos >= 0),
  metodo text references public.metodos_pago(nombre) on delete set null,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  descuento numeric(12, 2) not null default 0 check (descuento >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  hora time not null default localtime,
  estado text not null default 'pagada' check (estado in ('abierta', 'pagada', 'anulada')),
  usuario_id uuid references auth.users(id) on delete set null,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.items_venta (
  id uuid primary key default gen_random_uuid(),
  venta_id text not null references public.ventas(id) on delete cascade,
  producto_id text references public.productos(id) on delete set null,
  producto text not null,
  cantidad numeric(12, 2) not null check (cantidad > 0),
  precio numeric(12, 2) not null check (precio >= 0),
  costo numeric(12, 2) not null default 0 check (costo >= 0),
  total numeric(12, 2) not null check (total >= 0),
  gustos text[] not null default '{}',
  creado timestamptz not null default now()
);

create table if not exists public.movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  sucursal_id uuid references public.sucursales(id) on delete set null,
  producto_id text not null references public.productos(id) on delete cascade,
  tipo text not null check (tipo in ('venta', 'reposicion', 'ajuste', 'produccion', 'compra', 'merma')),
  cantidad numeric(12, 2) not null,
  nota text,
  usuario_id uuid references auth.users(id) on delete set null,
  creado timestamptz not null default now()
);

create table if not exists public.gastos (
  clave text primary key,
  nombre text not null,
  categoria text not null,
  monto numeric(12, 2) not null default 0 check (monto >= 0),
  orden integer not null default 0,
  activo boolean not null default true,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.empleados (
  id uuid primary key default gen_random_uuid(),
  sucursal_id uuid references public.sucursales(id) on delete set null,
  nombre text not null,
  rol text not null,
  turno text not null,
  sector text not null,
  estado text not null default 'Activo' check (estado in ('Activo', 'Pausa', 'Ausente', 'Franco')),
  activo boolean not null default true,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.asistencias (
  id uuid primary key default gen_random_uuid(),
  sucursal_id uuid references public.sucursales(id) on delete set null,
  empleado_id uuid references public.empleados(id) on delete set null,
  empleado text not null,
  tipo text not null check (tipo in ('entrada', 'salida')),
  turno text not null check (turno in ('manana', 'tarde')),
  usuario_id uuid references auth.users(id) on delete set null,
  creado timestamptz not null default now()
);

create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  contacto text,
  telefono text,
  email text,
  direccion text,
  activo boolean not null default true,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.compras (
  id text primary key,
  sucursal_id uuid references public.sucursales(id) on delete set null,
  proveedor_id uuid references public.proveedores(id) on delete set null,
  proveedor text not null,
  descripcion text not null,
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'En camino', 'Recibido', 'Cancelado')),
  entrega text,
  total numeric(12, 2) not null default 0 check (total >= 0),
  usuario_id uuid references auth.users(id) on delete set null,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.items_compra (
  id uuid primary key default gen_random_uuid(),
  compra_id text not null references public.compras(id) on delete cascade,
  producto_id text references public.productos(id) on delete set null,
  item text not null,
  cantidad numeric(12, 2) not null check (cantidad > 0),
  unidad text not null default 'unid.',
  costo numeric(12, 2) not null default 0 check (costo >= 0),
  total numeric(12, 2) generated always as (cantidad * costo) stored,
  creado timestamptz not null default now()
);

create table if not exists public.tareas (
  id text primary key,
  sucursal_id uuid references public.sucursales(id) on delete set null,
  titulo text not null,
  sector text not null,
  cantidad text not null,
  responsable text not null,
  vencimiento text not null,
  lista boolean not null default false,
  usuario_id uuid references auth.users(id) on delete set null,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.caja (
  id uuid primary key default gen_random_uuid(),
  sucursal_id uuid references public.sucursales(id) on delete set null,
  tipo text not null check (tipo in ('ingreso', 'egreso', 'retiro', 'apertura', 'cierre')),
  concepto text not null,
  monto numeric(12, 2) not null check (monto >= 0),
  metodo text references public.metodos_pago(nombre) on delete set null,
  venta_id text references public.ventas(id) on delete set null,
  usuario_id uuid references auth.users(id) on delete set null,
  creado timestamptz not null default now()
);

create index if not exists productos_categoria_idx on public.productos(categoria);
create index if not exists productos_activo_idx on public.productos(activo);
create index if not exists gustos_disponible_idx on public.gustos(disponible, orden);
create index if not exists ventas_creado_idx on public.ventas(creado desc);
create index if not exists items_venta_venta_idx on public.items_venta(venta_id);
create index if not exists items_venta_producto_idx on public.items_venta(producto_id);
create index if not exists movimientos_stock_producto_idx on public.movimientos_stock(producto_id);
create index if not exists gastos_activo_idx on public.gastos(activo, orden);
create unique index if not exists empleados_sucursal_nombre_uidx on public.empleados(sucursal_id, nombre);
create index if not exists asistencias_creado_idx on public.asistencias(creado desc);
create index if not exists asistencias_empleado_idx on public.asistencias(empleado_id);
create index if not exists compras_estado_idx on public.compras(estado);
create index if not exists tareas_lista_idx on public.tareas(lista);

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'sucursales',
    'productos',
    'gustos',
    'ventas',
    'gastos',
    'empleados',
    'proveedores',
    'compras',
    'tareas'
  ]
  loop
    execute format('drop trigger if exists poner_actualizado on public.%I', tabla);
    execute format(
      'create trigger poner_actualizado before update on public.%I for each row execute function public.poner_actualizado()',
      tabla
    );
  end loop;
end;
$$;

alter table public.sucursales enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.gustos enable row level security;
alter table public.metodos_pago enable row level security;
alter table public.ventas enable row level security;
alter table public.items_venta enable row level security;
alter table public.movimientos_stock enable row level security;
alter table public.gastos enable row level security;
alter table public.empleados enable row level security;
alter table public.asistencias enable row level security;
alter table public.proveedores enable row level security;
alter table public.compras enable row level security;
alter table public.items_compra enable row level security;
alter table public.tareas enable row level security;
alter table public.caja enable row level security;

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'sucursales',
    'categorias',
    'productos',
    'gustos',
    'metodos_pago',
    'ventas',
    'items_venta',
    'movimientos_stock',
    'gastos',
    'empleados',
    'asistencias',
    'proveedores',
    'compras',
    'items_compra',
    'tareas',
    'caja'
  ]
  loop
    execute format('drop policy if exists "usuarios autenticados administran todo" on public.%I', tabla);
    execute format(
      'create policy "usuarios autenticados administran todo" on public.%I for all to authenticated using (true) with check (true)',
      tabla
    );
  end loop;
end;
$$;

grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

insert into public.sucursales (id, nombre, direccion, telefono)
values ('00000000-0000-0000-0000-000000000001', 'Sucursal Centro', 'Centro', null)
on conflict (id) do update set
  nombre = excluded.nombre,
  direccion = excluded.direccion,
  telefono = excluded.telefono;

insert into public.categorias (nombre, orden)
values
  ('Helado', 1),
  ('Cafe', 2),
  ('Pasteleria', 3),
  ('Bebida', 4)
on conflict (nombre) do update set orden = excluded.orden;

insert into public.metodos_pago (nombre, comision)
values
  ('Efectivo', 0),
  ('Tarjeta', 3.5),
  ('Mercado Pago', 4.2),
  ('Transferencia', 0)
on conflict (nombre) do update set comision = excluded.comision;

insert into public.productos (
  id,
  nombre,
  categoria,
  precio,
  costo,
  stock,
  stock_minimo,
  unidad,
  imagen,
  max_gustos
)
values
  ('hel-025', '1/4 kg helado artesanal', 'Helado', 4200, 1780, 28, 12, 'potes', null, 2),
  ('hel-050', '1/2 kg helado artesanal', 'Helado', 7600, 3220, 18, 8, 'potes', null, 3),
  ('hel-100', '1 kg helado artesanal', 'Helado', 13900, 5980, 11, 6, 'potes', null, 4),
  ('cuc-simple', 'Cucurucho simple', 'Helado', 2400, 880, 46, 20, 'unid.', null, 1),
  ('cuc-doble', 'Cucurucho doble', 'Helado', 3400, 1260, 40, 18, 'unid.', null, 2),
  ('affogato', 'Affogato', 'Cafe', 3600, 1390, 22, 10, 'serv.', null, 1),
  ('latte', 'Cafe latte', 'Cafe', 2500, 820, 70, 25, 'serv.', null, 0),
  ('capuccino', 'Cappuccino', 'Cafe', 2700, 880, 62, 25, 'serv.', null, 0),
  ('medialuna', 'Medialuna manteca', 'Pasteleria', 1200, 430, 34, 16, 'unid.', null, 0),
  ('tostado', 'Tostado jamon y queso', 'Pasteleria', 5200, 2100, 12, 8, 'unid.', null, 0),
  ('limonada', 'Limonada', 'Bebida', 2600, 760, 24, 10, 'vasos', null, 0)
on conflict (id) do update set
  nombre = excluded.nombre,
  categoria = excluded.categoria,
  precio = excluded.precio,
  costo = excluded.costo,
  stock_minimo = excluded.stock_minimo,
  unidad = excluded.unidad,
  imagen = excluded.imagen,
  max_gustos = excluded.max_gustos,
  activo = true;

insert into public.gustos (id, nombre, disponible, color, orden)
values
  ('dulce-de-leche', 'Dulce de leche', true, '#c98d4f', 1),
  ('chocolate', 'Chocolate', true, '#7b4a35', 2),
  ('frutilla', 'Frutilla', true, '#f472b6', 3),
  ('vainilla', 'Vainilla', true, '#fde68a', 4),
  ('menta-granizada', 'Menta granizada', true, '#6ee7b7', 5),
  ('tramontana', 'Tramontana', true, '#e5e7eb', 6),
  ('limon', 'Limon', true, '#bef264', 7),
  ('maracuya', 'Maracuya', true, '#facc15', 8),
  ('crema-americana', 'Crema americana', true, '#fff7ed', 9),
  ('sambayon', 'Sambayon', true, '#fbbf24', 10)
on conflict (id) do update set
  nombre = excluded.nombre,
  disponible = excluded.disponible,
  color = excluded.color,
  orden = excluded.orden;

insert into public.gastos (clave, nombre, categoria, monto, orden)
values
  ('sueldos', 'Sueldos empleados', 'Personal', 480000, 1),
  ('luz', 'Luz', 'Servicios', 90000, 2),
  ('agua', 'Agua', 'Servicios', 28000, 3),
  ('gas', 'Gas', 'Servicios', 42000, 4),
  ('alquiler', 'Alquiler', 'Local', 320000, 5),
  ('otros', 'Otros gastos', 'General', 45000, 6)
on conflict (clave) do update set
  nombre = excluded.nombre,
  categoria = excluded.categoria,
  orden = excluded.orden,
  activo = true;

insert into public.empleados (sucursal_id, nombre, rol, turno, sector, estado)
values
  ('00000000-0000-0000-0000-000000000001', 'Mica Alvarez', 'Encargada', '08:00 - 16:00', 'Caja', 'Activo'),
  ('00000000-0000-0000-0000-000000000001', 'Tomi Rios', 'Barista', '10:00 - 18:00', 'Cafe', 'Activo'),
  ('00000000-0000-0000-0000-000000000001', 'Sofi Duarte', 'Atencion', '12:00 - 20:00', 'Salon', 'Activo'),
  ('00000000-0000-0000-0000-000000000001', 'Nico Perez', 'Produccion', '07:00 - 15:00', 'Obrador', 'Pausa')
on conflict (sucursal_id, nombre) do update set
  rol = excluded.rol,
  turno = excluded.turno,
  sector = excluded.sector,
  estado = excluded.estado,
  activo = true;

insert into public.ventas (id, sucursal_id, cliente, productos, metodo, subtotal, descuento, total, hora)
values
  ('HF-1041', '00000000-0000-0000-0000-000000000001', 'Mostrador', 6, 'Mercado Pago', 28400, 0, 28400, '11:42'),
  ('HF-1040', '00000000-0000-0000-0000-000000000001', 'Mesa 4', 4, 'Tarjeta', 15300, 0, 15300, '15:08'),
  ('HF-1039', '00000000-0000-0000-0000-000000000001', 'Delivery', 5, 'Efectivo', 22100, 0, 22100, '17:31'),
  ('HF-1038', '00000000-0000-0000-0000-000000000001', 'Mostrador', 2, 'Mercado Pago', 7900, 0, 7900, '09:54')
on conflict (id) do nothing;

insert into public.proveedores (nombre)
values
  ('Lacteos San Martin'),
  ('Cafe Puerto'),
  ('Distribuidora Norte')
on conflict (nombre) do nothing;

insert into public.tareas (id, sucursal_id, titulo, sector, cantidad, responsable, vencimiento, lista)
values
  ('tarea-1', '00000000-0000-0000-0000-000000000001', 'Base crema americana', 'Obrador', '18 L', 'Mica', '13:00', false),
  ('tarea-2', '00000000-0000-0000-0000-000000000001', 'Reposicion de cucuruchos', 'Salon', '2 cajas', 'Tomi', '12:30', false),
  ('tarea-3', '00000000-0000-0000-0000-000000000001', 'Etiquetar potes para delivery', 'Mostrador', '40 unid.', 'Sofi', '15:30', true),
  ('tarea-4', '00000000-0000-0000-0000-000000000001', 'Molienda y calibracion espresso', 'Cafe', '2 ajustes', 'Nico', 'Cada 2 h', false)
on conflict (id) do update set
  titulo = excluded.titulo,
  sector = excluded.sector,
  cantidad = excluded.cantidad,
  responsable = excluded.responsable,
  vencimiento = excluded.vencimiento;

-- ============================================================
-- MIGRACION: 20260513000100_gastos_historial.sql
-- ============================================================
create table if not exists public.gastos_historial (
  id uuid primary key default gen_random_uuid(),
  fecha_desde timestamptz not null default now(),
  total numeric(12, 2) not null default 0 check (total >= 0),
  gastos jsonb not null default '[]'::jsonb,
  creado timestamptz not null default now()
);

create index if not exists gastos_historial_fecha_idx
  on public.gastos_historial(fecha_desde desc);

alter table public.gastos_historial enable row level security;

drop policy if exists "usuarios autenticados administran todo" on public.gastos_historial;
create policy "usuarios autenticados administran todo"
  on public.gastos_historial
  for all
  to authenticated
  using (true)
  with check (true);

grant all on public.gastos_historial to authenticated;

insert into public.gastos_historial (fecha_desde, total, gastos)
select
  now(),
  coalesce(sum(monto), 0),
  coalesce(jsonb_agg(to_jsonb(gastos) order by orden), '[]'::jsonb)
from public.gastos
where activo = true
having count(*) > 0
on conflict do nothing;

-- ============================================================
-- MIGRACION: 20260513000200_stock_gustos.sql
-- ============================================================
alter table public.gustos
  add column if not exists stock numeric(12, 2) not null default 0,
  add column if not exists stock_minimo numeric(12, 2) not null default 0,
  add column if not exists unidad text not null default 'porciones';

-- ============================================================
-- MIGRACION: 20260513000300_consumo_gustos_productos.sql
-- ============================================================
alter table public.productos
  add column if not exists consumo_gustos numeric(12, 2) not null default 0;

update public.productos
set consumo_gustos = case
  when id = 'cuc-simple' then 1
  when id = 'cuc-doble' then 2
  when id = 'hel-025' then 3
  when id = 'hel-050' then 6
  when id = 'hel-100' then 12
  when id = 'affogato' then 1
  when max_gustos > 0 then max_gustos
  else 0
end
where consumo_gustos = 0;

-- ============================================================
-- MIGRACION: 20260513000400_tandas_gustos.sql
-- ============================================================
create table if not exists public.tandas_gustos (
  id uuid primary key default gen_random_uuid(),
  gusto_id text not null references public.gustos(id) on delete cascade,
  gusto text not null,
  kilos numeric(12, 2) not null default 0 check (kilos >= 0),
  porciones_cargadas numeric(12, 2) not null default 0 check (porciones_cargadas >= 0),
  stock_sistema_al_cerrar numeric(12, 2),
  rendimiento_sugerido numeric(12, 2),
  estado text not null default 'activa' check (estado in ('activa', 'cerrada')),
  creado timestamptz not null default now(),
  cerrado timestamptz
);

create index if not exists tandas_gustos_gusto_idx
  on public.tandas_gustos(gusto_id, creado desc);

alter table public.tandas_gustos enable row level security;

drop policy if exists "usuarios autenticados administran todo" on public.tandas_gustos;
create policy "usuarios autenticados administran todo"
  on public.tandas_gustos
  for all
  to authenticated
  using (true)
  with check (true);

grant all on public.tandas_gustos to authenticated;

-- ============================================================
-- MIGRACION: 20260513000500_categoria_gustos.sql
-- ============================================================
alter table public.gustos
add column if not exists categoria text not null default 'Sin categoria';

update public.gustos
set categoria = case
  when lower(id) in ('limon', 'maracuya', 'frutilla')
    then 'Al agua'
  when lower(nombre) in ('limon', 'limón', 'maracuya', 'maracuyá', 'frutilla')
    then 'Al agua'
  else 'Crema'
end
where categoria = 'Sin categoria';

update public.gustos
set categoria = case
  when lower(id) in ('limon', 'maracuya', 'frutilla') then 'Al agua'
  when lower(id) in (
    'dulce-de-leche',
    'chocolate',
    'vainilla',
    'menta-granizada',
    'tramontana',
    'crema-americana',
    'sambayon'
  ) then 'Crema'
  else categoria
end
where lower(id) in (
  'dulce-de-leche',
  'chocolate',
  'frutilla',
  'vainilla',
  'menta-granizada',
  'tramontana',
  'limon',
  'maracuya',
  'crema-americana',
  'sambayon'
);

create index if not exists gustos_categoria_idx
on public.gustos(categoria, orden);

-- ============================================================
-- MIGRACION: 20260514000100_configuracion_diseno.sql
-- ============================================================
create table if not exists public.configuracion (
  clave text primary key,
  valor jsonb not null default '{}'::jsonb,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

drop trigger if exists poner_actualizado on public.configuracion;
create trigger poner_actualizado
before update on public.configuracion
for each row execute function public.poner_actualizado();

alter table public.configuracion enable row level security;

drop policy if exists "usuarios autenticados administran configuracion" on public.configuracion;
create policy "usuarios autenticados administran configuracion"
on public.configuracion
for all
to authenticated
using (true)
with check (true);

grant all on table public.configuracion to authenticated;

insert into public.configuracion (clave, valor)
values (
  'diseno',
  '{
    "background": "#070809",
    "sidebar": "#0d0f10",
    "header": "#090b0d",
    "panel": "#0f1213",
    "panelAlt": "#111417",
    "primary": "#67e8f9",
    "primaryText": "#06242a",
    "text": "#f4f4f5",
    "muted": "#a1a1aa",
    "border": "#263033",
    "success": "#34d399",
    "warning": "#facc15",
    "danger": "#fb7185",
    "fontFamily": "var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif",
    "brandName": "Nombre del local",
    "brandSubtitle": "Gestión del local",
    "brandFontFamily": "''Great Vibes'', ''Dancing Script'', cursive",
    "brandLogoMode": "icon",
    "brandIcon": "snowflake",
    "brandImageUrl": "",
    "faviconUrl": ""
  }'::jsonb
)
on conflict (clave) do nothing;

-- ============================================================
-- MIGRACION: 20260521000100_canal_ventas.sql
-- ============================================================
alter table public.ventas
  add column if not exists canal text not null default 'local';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ventas_canal_valido'
  ) then
    alter table public.ventas
      add constraint ventas_canal_valido
      check (canal in ('local', 'pedidos_ya'));
  end if;
end;
$$;

create index if not exists ventas_canal_idx on public.ventas(canal);

update public.ventas
set canal = 'pedidos_ya'
where lower(coalesce(cliente, '')) like '%pedidos ya%'
   or lower(coalesce(cliente, '')) like '%pedidosya%';

-- ============================================================
-- MIGRACION: 20260521000200_tipografia_diseno.sql
-- ============================================================
update public.configuracion
set
  valor = valor || '{
    "fontFamily": "var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif"
  }'::jsonb,
  actualizado = now()
where clave = 'diseno'
  and not (valor ? 'fontFamily');

-- ============================================================
-- MIGRACION: 20260521000300_marca_diseno.sql
-- ============================================================
update public.configuracion
set
  valor = valor || '{
    "brandName": "Nombre del local",
    "brandSubtitle": "Gestión del local",
    "brandFontFamily": "''Great Vibes'', ''Dancing Script'', cursive",
    "brandLogoMode": "icon",
    "brandIcon": "snowflake",
    "brandImageUrl": "",
    "faviconUrl": ""
  }'::jsonb,
  actualizado = now()
where clave = 'diseno';

-- ============================================================
-- MIGRACION: 20260521000400_storage_imagenes.sql
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'erp-imagenes',
  'erp-imagenes',
  true,
  8388608,
  array['image/webp', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "imagenes erp lectura publica" on storage.objects;
create policy "imagenes erp lectura publica"
on storage.objects
for select
to public
using (bucket_id = 'erp-imagenes');

drop policy if exists "imagenes erp autenticados administran" on storage.objects;
create policy "imagenes erp autenticados administran"
on storage.objects
for all
to authenticated
using (bucket_id = 'erp-imagenes')
with check (bucket_id = 'erp-imagenes');

-- ============================================================
-- MIGRACION: 20260522000100_marca_global.sql
-- ============================================================
update public.configuracion
set
  valor = jsonb_set(
    jsonb_set(
      valor,
      '{brandName}',
      to_jsonb('Nombre del local'::text),
      true
    ),
    '{brandSubtitle}',
    to_jsonb('Gestión del local'::text),
    true
  ),
  actualizado = now()
where clave = 'diseno'
  and (
    valor->>'brandName' = convert_from(decode('48656c61646572c3ad6120466163756e646f2773', 'hex'), 'UTF8')
    or valor->>'brandSubtitle' = convert_from(decode('48656c61646572c3ad61202f2043616665746572c3ad61', 'hex'), 'UTF8')
  );

-- ============================================================
-- MIGRACION: 20260522000200_guardar_venta_transaccional.sql
-- ============================================================
create or replace function public.guardar_venta_transaccional(pedido jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  venta jsonb := pedido->'venta';
  item jsonb;
  movimiento jsonb;
  stock_item jsonb;
  gusto_item jsonb;
  venta_id text := venta->>'id';
  item_gustos text[];
  cantidad numeric(12, 2);
begin
  if venta_id is null or length(trim(venta_id)) = 0 then
    raise exception 'La venta no tiene id';
  end if;

  if jsonb_typeof(coalesce(pedido->'items', '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(pedido->'items', '[]'::jsonb)) = 0 then
    raise exception 'La venta no tiene items';
  end if;

  if exists (select 1 from public.ventas where id = venta_id) then
    return jsonb_build_object('ok', true, 'venta_id', venta_id, 'repetida', true);
  end if;

  insert into public.ventas (
    id,
    sucursal_id,
    cliente,
    canal,
    productos,
    metodo,
    subtotal,
    descuento,
    total,
    hora,
    estado,
    usuario_id
  )
  values (
    venta_id,
    nullif(venta->>'sucursal_id', '')::uuid,
    coalesce(nullif(venta->>'cliente', ''), 'Mostrador'),
    coalesce(nullif(venta->>'canal', ''), 'local'),
    coalesce((venta->>'productos')::integer, 0),
    nullif(venta->>'metodo', ''),
    coalesce((venta->>'subtotal')::numeric, 0),
    coalesce((venta->>'descuento')::numeric, 0),
    coalesce((venta->>'total')::numeric, 0),
    coalesce(nullif(venta->>'hora', '')::time, localtime),
    coalesce(nullif(venta->>'estado', ''), 'pagada'),
    nullif(venta->>'usuario_id', '')::uuid
  );

  for item in
    select value from jsonb_array_elements(coalesce(pedido->'items', '[]'::jsonb))
  loop
    item_gustos := case
      when jsonb_typeof(item->'gustos') = 'array' then
        array(select jsonb_array_elements_text(item->'gustos'))
      else
        '{}'::text[]
    end;

    insert into public.items_venta (
      venta_id,
      producto_id,
      producto,
      cantidad,
      precio,
      costo,
      total,
      gustos
    )
    values (
      venta_id,
      nullif(item->>'producto_id', ''),
      coalesce(nullif(item->>'producto', ''), 'Producto'),
      coalesce((item->>'cantidad')::numeric, 0),
      coalesce((item->>'precio')::numeric, 0),
      coalesce((item->>'costo')::numeric, 0),
      coalesce((item->>'total')::numeric, 0),
      item_gustos
    );
  end loop;

  for movimiento in
    select value from jsonb_array_elements(coalesce(pedido->'movimientos', '[]'::jsonb))
  loop
    insert into public.movimientos_stock (
      sucursal_id,
      producto_id,
      tipo,
      cantidad,
      nota,
      usuario_id
    )
    values (
      nullif(movimiento->>'sucursal_id', '')::uuid,
      movimiento->>'producto_id',
      coalesce(nullif(movimiento->>'tipo', ''), 'venta'),
      coalesce((movimiento->>'cantidad')::numeric, 0),
      nullif(movimiento->>'nota', ''),
      nullif(movimiento->>'usuario_id', '')::uuid
    );
  end loop;

  for stock_item in
    select value from jsonb_array_elements(coalesce(pedido->'stock', '[]'::jsonb))
  loop
    if stock_item ? 'cantidad' then
      cantidad := coalesce((stock_item->>'cantidad')::numeric, 0);

      update public.productos
      set stock = greatest(0, stock - cantidad)
      where id = stock_item->>'id';
    else
      update public.productos
      set stock = coalesce((stock_item->>'stock')::numeric, stock)
      where id = stock_item->>'id';
    end if;

    if not found then
      raise exception 'No existe el producto %', stock_item->>'id';
    end if;
  end loop;

  for gusto_item in
    select value from jsonb_array_elements(coalesce(pedido->'stock_gustos', '[]'::jsonb))
  loop
    if gusto_item ? 'cantidad' then
      cantidad := coalesce((gusto_item->>'cantidad')::numeric, 0);

      update public.gustos
      set stock = stock - cantidad
      where id = gusto_item->>'id';
    else
      update public.gustos
      set stock = coalesce((gusto_item->>'stock')::numeric, stock)
      where id = gusto_item->>'id';
    end if;

    if not found then
      raise exception 'No existe el gusto %', gusto_item->>'id';
    end if;
  end loop;

  insert into public.caja (
    sucursal_id,
    tipo,
    concepto,
    monto,
    metodo,
    venta_id,
    usuario_id
  )
  values (
    nullif(venta->>'sucursal_id', '')::uuid,
    'ingreso',
    'Venta ' || venta_id,
    coalesce((venta->>'total')::numeric, 0),
    nullif(venta->>'metodo', ''),
    venta_id,
    nullif(venta->>'usuario_id', '')::uuid
  );

  return jsonb_build_object('ok', true, 'venta_id', venta_id);
end;
$$;

grant execute on function public.guardar_venta_transaccional(jsonb) to authenticated;

-- ============================================================
-- MIGRACION: 20260525000100_limpiar_imagenes_predefinidas_productos.sql
-- ============================================================
update public.productos
set imagen = null
where imagen like 'https://images.unsplash.com/%';

-- ============================================================
-- MIGRACION: 20260525000200_operacion_heladeria.sql
-- ============================================================
alter table public.empleados
add column if not exists pin_codigo text;

create table if not exists public.auditoria (
  id uuid primary key default gen_random_uuid(),
  entidad text not null,
  entidad_id text,
  accion text not null,
  detalle jsonb not null default '{}'::jsonb,
  usuario_id uuid references auth.users(id) on delete set null,
  usuario_nombre text,
  creado timestamptz not null default now()
);

create index if not exists auditoria_creado_idx on public.auditoria(creado desc);
alter table public.auditoria enable row level security;

drop policy if exists "usuarios autenticados leen auditoria" on public.auditoria;
create policy "usuarios autenticados leen auditoria"
on public.auditoria
for select
to authenticated
using (true);

drop policy if exists "usuarios autenticados insertan auditoria" on public.auditoria;
create policy "usuarios autenticados insertan auditoria"
on public.auditoria
for insert
to authenticated
with check (true);

grant all on table public.auditoria to authenticated;

create table if not exists public.cierres_caja (
  id uuid primary key default gen_random_uuid(),
  sucursal_id uuid not null default '00000000-0000-0000-0000-000000000001',
  fecha_operativa date not null default current_date,
  turno text not null check (turno in ('manana', 'tarde')),
  total_sistema numeric not null default 0,
  efectivo_sistema numeric not null default 0,
  efectivo_contado numeric not null default 0,
  diferencia numeric not null default 0,
  ventas integer not null default 0,
  observacion text,
  creado_por uuid references auth.users(id) on delete set null,
  creado timestamptz not null default now()
);

create index if not exists cierres_caja_fecha_turno_idx
on public.cierres_caja(fecha_operativa desc, turno);

alter table public.cierres_caja enable row level security;

drop policy if exists "usuarios autenticados leen cierres caja" on public.cierres_caja;
create policy "usuarios autenticados leen cierres caja"
on public.cierres_caja
for select
to authenticated
using (true);

drop policy if exists "usuarios autenticados insertan cierres caja" on public.cierres_caja;
create policy "usuarios autenticados insertan cierres caja"
on public.cierres_caja
for insert
to authenticated
with check (true);

grant all on table public.cierres_caja to authenticated;

insert into public.configuracion (clave, valor)
values ('comisiones_canales', '{"local": 0, "pedidos_ya": 0}'::jsonb)
on conflict (clave) do nothing;

-- ============================================================
-- MIGRACION: 20260526000100_comisiones_historial.sql
-- ============================================================
create table if not exists public.comisiones_historial (
  id uuid primary key default gen_random_uuid(),
  fecha_desde timestamptz not null default now(),
  canales jsonb not null default '{}'::jsonb,
  metodos jsonb not null default '[]'::jsonb,
  creado timestamptz not null default now()
);

create index if not exists comisiones_historial_fecha_idx
  on public.comisiones_historial(fecha_desde desc);

alter table public.comisiones_historial enable row level security;

drop policy if exists "usuarios autenticados administran todo" on public.comisiones_historial;
create policy "usuarios autenticados administran todo"
  on public.comisiones_historial
  for all
  to authenticated
  using (true)
  with check (true);

grant all on public.comisiones_historial to authenticated;

insert into public.comisiones_historial (fecha_desde, canales, metodos)
select
  now(),
  coalesce(
    (select valor from public.configuracion where clave = 'comisiones_canales'),
    '{"local": 0, "pedidos_ya": 0}'::jsonb
  ),
  coalesce(
    (select jsonb_agg(jsonb_build_object('nombre', nombre, 'comision', comision) order by nombre)
     from public.metodos_pago
     where activo = true),
    '[]'::jsonb
  )
where not exists (select 1 from public.comisiones_historial);

-- ============================================================
-- MIGRACION: 20260617000100_icono_categorias_productos.sql
-- ============================================================
alter table public.categorias
add column if not exists icono text not null default 'package';

alter table public.productos
add column if not exists icono text not null default 'package';

update public.categorias
set icono = case
  when lower(nombre) = 'helado' then 'snowflake'
  when lower(nombre) in ('cafe', 'café') then 'coffee'
  when lower(nombre) = 'salado' then 'store'
  when lower(nombre) = 'dulce' then 'receipt'
  when lower(nombre) = 'bebida' then 'card'
  when lower(nombre) = 'aperitivo' then 'wallet'
  when lower(nombre) = 'desayuno' then 'sun'
  when lower(nombre) = 'promo' then 'money'
  else icono
end
where icono = 'package';

-- ============================================================
-- DATOS ACTUALES EXPORTADOS DESDE LA SUPABASE ORIGEN
-- Este bloque limpia las tablas public.* de la app y carga los datos reales.
-- ============================================================

truncate table
  public."sucursales",
  public."categorias",
  public."metodos_pago",
  public."configuracion",
  public."productos",
  public."gustos",
  public."gastos",
  public."empleados",
  public."proveedores",
  public."ventas",
  public."items_venta",
  public."movimientos_stock",
  public."asistencias",
  public."gastos_historial",
  public."comisiones_historial",
  public."cierres_caja",
  public."caja",
  public."tandas_gustos",
  public."compras",
  public."items_compra",
  public."tareas",
  public."auditoria"
restart identity cascade;

-- public.sucursales: 1 fila
insert into public."sucursales" ("id", "nombre", "direccion", "telefono", "activo", "creado", "actualizado")
values
  ('00000000-0000-0000-0000-000000000001', 'Sucursal principal', null, null, true, '2026-06-01T06:44:07.643265+00:00', '2026-06-01T06:44:07.643265+00:00')
;

-- public.categorias: 2 filas
insert into public."categorias" ("nombre", "orden", "creado", "icono")
values
  ('Cafeteria', 0, '2026-06-09T19:53:51.978551+00:00', 'package'),
  ('helados', 0, '2026-06-01T01:03:00.671128+00:00', 'snowflake')
;

-- public.metodos_pago: 4 filas
insert into public."metodos_pago" ("nombre", "comision", "activo", "creado")
values
  ('Efectivo', 0, true, '2026-06-01T06:32:49.475554+00:00'),
  ('Tarjeta', 3, true, '2026-06-01T06:32:49.475554+00:00'),
  ('Mercado Pago', 6, true, '2026-06-01T06:32:49.475554+00:00'),
  ('Transferencia', 0, true, '2026-06-01T06:32:49.475554+00:00')
;

-- public.configuracion: 2 filas
insert into public."configuracion" ("clave", "valor", "creado", "actualizado")
values
  ('comisiones_canales', '{"local":0,"pedidos_ya":30}'::jsonb, '2026-06-01T06:32:49.454152+00:00', '2026-06-01T06:32:49.454152+00:00'),
  ('diseno', '{"text":"#f4f4f5","muted":"#a1a1aa","panel":"#0f1213","border":"#263033","danger":"#fb7185","header":"#090b0d","primary":"#67e8f9","sidebar":"#0d0f10","success":"#34d399","warning":"#facc15","panelAlt":"#111417","brandIcon":"snowflake","brandName":"Heladeria Facundo''s","background":"#070809","faviconUrl":"https://cuhyfjvibscwlnfzpeug.supabase.co/storage/v1/object/public/erp-imagenes/marca/1780431755121-a3420cf7-43bd-43de-af3f-c425db32df03.png","fontFamily":"var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif","primaryText":"#06242a","brandImageUrl":"https://cuhyfjvibscwlnfzpeug.supabase.co/storage/v1/object/public/erp-imagenes/marca/1780431761054-dde3eb5b-faf4-4047-919b-78df3a073d68.webp","brandLogoMode":"image","brandSubtitle":"Heladería / Cafetería","brandFontFamily":"''Great Vibes'', ''Dancing Script'', cursive"}'::jsonb, '2026-06-02T20:24:16.68599+00:00', '2026-06-02T20:24:21.268222+00:00')
;

-- public.productos: 4 filas
insert into public."productos" ("id", "nombre", "categoria", "precio", "costo", "stock", "stock_minimo", "unidad", "imagen", "max_gustos", "activo", "creado", "actualizado", "consumo_gustos")
values
  ('cafe-chico', 'Cafe chico', 'Cafeteria', 0, 0, 0, 0, 'unid.', null, 0, true, '2026-06-09T19:53:52.208932+00:00', '2026-06-09T19:53:52.208932+00:00', 0),
  ('1-2-kilo', '1/2 kilo', 'helados', 11000, 0, 9, 5, 'unid.', null, 0, true, '2026-06-09T19:39:07.140388+00:00', '2026-06-10T00:11:23.994116+00:00', 0),
  ('1-4-helado', '1/4 Helado', 'helados', 6500, 0, 29, 7, 'unid.', null, 0, true, '2026-06-09T20:40:23.10985+00:00', '2026-06-12T02:57:22.591632+00:00', 0),
  ('1k-helado', '1k helado', 'helados', 1000, 100, 3, 5, 'unid.', 'https://cuhyfjvibscwlnfzpeug.supabase.co/storage/v1/object/public/erp-imagenes/productos/1780275776225-c64fa5cb-4b82-4846-b5f6-791e926a0002.webp', 4, true, '2026-06-01T01:03:00.933058+00:00', '2026-06-17T19:00:41.305057+00:00', 12)
;

-- public.gustos: 6 filas
insert into public."gustos" ("id", "nombre", "disponible", "color", "orden", "creado", "actualizado", "stock", "stock_minimo", "unidad", "categoria")
values
  ('chocolate', 'chocolate', true, '#4f240c', 0, '2026-06-01T07:58:58.929946+00:00', '2026-06-02T00:08:52.508797+00:00', 0, 20, 'porciones', 'Crema'),
  ('frutilla', 'frutilla', true, '#ff00d0', 0, '2026-06-01T01:05:05.237027+00:00', '2026-06-02T00:11:53.602428+00:00', 1, 20, 'porciones', 'Al agua'),
  ('chocolate-blanco', 'chocolate blanco', false, '#ffffff', 0, '2026-06-01T01:03:52.459246+00:00', '2026-06-01T07:42:40.421401+00:00', 10, 3, 'porciones', 'Crema'),
  ('dulce-de-leche', 'dulce de leche', false, '#7b3a0e', 0, '2026-06-01T01:05:39.219853+00:00', '2026-06-01T07:54:24.406316+00:00', 10, 3, 'porciones', 'Crema'),
  ('menta', 'menta', false, '#5cf575', 0, '2026-06-01T01:07:34.766656+00:00', '2026-06-01T07:54:27.458277+00:00', 14, 6, 'porciones', 'Crema'),
  ('hola', 'hola', true, '#00e1ff', 0, '2026-06-09T19:32:08.158116+00:00', '2026-06-09T20:41:52.96865+00:00', 0, 0, 'porciones', 'Crema')
;

-- public.gastos: 7 filas
insert into public."gastos" ("clave", "nombre", "categoria", "monto", "orden", "activo", "creado", "actualizado")
values
  ('sueldos', 'Sueldos empleados', 'Personal', 10, 1, true, '2026-06-01T01:20:14.672192+00:00', '2026-06-01T01:20:14.672192+00:00'),
  ('alquiler', 'Alquiler', 'Local', 10, 2, true, '2026-06-01T01:20:14.672192+00:00', '2026-06-01T01:20:14.672192+00:00'),
  ('luz', 'Luz', 'Servicios', 10, 3, true, '2026-06-01T01:20:14.672192+00:00', '2026-06-01T01:20:14.672192+00:00'),
  ('agua', 'Agua', 'Servicios', 10, 4, true, '2026-06-01T01:20:14.672192+00:00', '2026-06-01T01:20:14.672192+00:00'),
  ('gas', 'Gas', 'Servicios', 20, 5, true, '2026-06-01T01:20:14.672192+00:00', '2026-06-01T01:20:14.672192+00:00'),
  ('internet', 'Internet', 'Servicios', 20, 6, true, '2026-06-01T01:20:14.672192+00:00', '2026-06-01T01:20:14.672192+00:00'),
  ('otros', 'Otros gastos', 'General', 20, 7, true, '2026-06-01T01:20:14.672192+00:00', '2026-06-01T01:20:14.672192+00:00')
;

-- public.empleados: 1 fila
insert into public."empleados" ("id", "sucursal_id", "nombre", "rol", "turno", "sector", "estado", "activo", "creado", "actualizado", "pin_codigo")
values
  ('2505be74-b87b-489c-8b5c-a2da6ea8562b', '00000000-0000-0000-0000-000000000001', 'CARLOS', 'Encargado/a', 'Completo', 'General', 'Activo', true, '2026-06-01T18:46:42.845227+00:00', '2026-06-01T18:46:42.845227+00:00', null)
;

-- public.proveedores: 0 filas

-- public.ventas: 16 filas
insert into public."ventas" ("id", "sucursal_id", "cliente", "productos", "metodo", "subtotal", "descuento", "total", "hora", "estado", "usuario_id", "creado", "actualizado", "canal")
values
  ('V-1780382707633', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Transferencia', 1000, 0, 1000, '03:45:07', 'pagada', null, '2026-06-02T06:45:10.253812+00:00', '2026-06-02T06:45:10.253812+00:00', 'local'),
  ('V-1780424377345', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Efectivo', 1000, 0, 1000, '15:19:37', 'pagada', null, '2026-06-02T18:19:42.830886+00:00', '2026-06-02T18:19:42.830886+00:00', 'local'),
  ('V-1780427566287', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Efectivo', 1000, 0, 1000, '16:12:46', 'pagada', null, '2026-06-02T19:12:51.787727+00:00', '2026-06-02T19:12:51.787727+00:00', 'local'),
  ('V-1780599550500', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Transferencia', 1000, 0, 1000, '15:59:10', 'pagada', null, '2026-06-04T19:00:43.8044+00:00', '2026-06-04T19:00:43.8044+00:00', 'local'),
  ('V-1780599578388', '00000000-0000-0000-0000-000000000001', 'Mostrador', 2, 'Transferencia', 2000, 0, 2000, '15:59:38', 'pagada', null, '2026-06-04T19:00:44.149828+00:00', '2026-06-04T19:00:44.149828+00:00', 'local'),
  ('V-1780606055625', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Efectivo', 1000, 0, 1000, '17:47:35', 'pagada', null, '2026-06-04T21:04:26.377868+00:00', '2026-06-04T21:04:26.377868+00:00', 'local'),
  ('V-1780607158561', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Transferencia', 1000, 0, 1000, '18:05:58', 'pagada', null, '2026-06-04T21:17:16.562475+00:00', '2026-06-04T21:17:16.562475+00:00', 'local'),
  ('V-1780607953315', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Efectivo', 1000, 0, 1000, '18:19:13', 'pagada', null, '2026-06-04T21:19:14.84637+00:00', '2026-06-04T21:19:14.84637+00:00', 'local'),
  ('V-1780608025730', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Efectivo', 1000, 0, 1000, '18:20:25', 'pagada', null, '2026-06-04T21:23:11.578845+00:00', '2026-06-04T21:23:11.578845+00:00', 'local'),
  ('V-1780608073308', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Transferencia', 1000, 0, 1000, '18:21:13', 'pagada', null, '2026-06-04T21:23:11.999454+00:00', '2026-06-04T21:23:11.999454+00:00', 'local'),
  ('V-1780609261916', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Efectivo', 1000, 0, 1000, '18:41:01', 'pagada', null, '2026-06-04T21:42:09.556216+00:00', '2026-06-04T21:42:09.556216+00:00', 'local'),
  ('V-1780609292162', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Efectivo', 1000, 0, 1000, '18:41:32', 'pagada', null, '2026-06-04T21:42:09.986871+00:00', '2026-06-04T21:42:09.986871+00:00', 'local'),
  ('V-1781033723608', '00000000-0000-0000-0000-000000000001', 'Pedidos Ya', 21, 'Mercado Pago', 21000, 0, 21000, '16:35:23', 'pagada', null, '2026-06-09T19:35:10.824294+00:00', '2026-06-09T19:35:10.824294+00:00', 'pedidos_ya'),
  ('V-1781033993588', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Efectivo', 11000, 0, 11000, '16:39:53', 'pagada', null, '2026-06-09T19:39:53.661169+00:00', '2026-06-09T19:39:53.661169+00:00', 'local'),
  ('V-1781050261849', '00000000-0000-0000-0000-000000000001', 'Pedidos Ya', 2, 'Tarjeta', 12000, 0, 12000, '21:11:01', 'pagada', null, '2026-06-10T00:11:23.994116+00:00', '2026-06-10T00:11:23.994116+00:00', 'pedidos_ya'),
  ('V-1781233042208', '00000000-0000-0000-0000-000000000001', 'Mostrador', 1, 'Efectivo', 6500, 0, 6500, '23:57:22', 'pagada', null, '2026-06-12T02:57:22.591632+00:00', '2026-06-12T02:57:22.591632+00:00', 'local')
;

-- public.items_venta: 17 filas
insert into public."items_venta" ("id", "venta_id", "producto_id", "producto", "cantidad", "precio", "costo", "total", "gustos", "creado")
values
  ('d1be474d-d1eb-4d52-b94b-483c776dd8ae', 'V-1780382707633', '1k-helado', '1k helado', 1, 1000, 100, 1000, '{}'::text[], '2026-06-02T06:45:10.253812+00:00'),
  ('f3ade6d2-6b83-4007-b280-d23863861895', 'V-1780424377345', '1k-helado', '1k helado', 1, 1000, 100, 1000, '{}'::text[], '2026-06-02T18:19:42.830886+00:00'),
  ('bc7f5eb9-a42b-45de-b1cb-7f569fe7ce48', 'V-1780427566287', '1k-helado', '1k helado', 1, 1000, 100, 1000, '{}'::text[], '2026-06-02T19:12:51.787727+00:00'),
  ('b8474ff9-8f36-4191-80f4-7a06c4697816', 'V-1780599550500', '1k-helado', '1k helado', 1, 1000, 100, 1000, '{}'::text[], '2026-06-04T19:00:43.8044+00:00'),
  ('e975d7c7-d1db-40da-a5c5-58e92dfaf4c8', 'V-1780599578388', '1k-helado', '1k helado', 2, 1000, 100, 2000, '{}'::text[], '2026-06-04T19:00:44.149828+00:00'),
  ('c880d4f7-8f4b-4916-95d1-3b30e7757133', 'V-1780606055625', '1k-helado', '1k helado', 1, 1000, 100, 1000, '{}'::text[], '2026-06-04T21:04:26.377868+00:00'),
  ('b98236b7-0bb9-4f38-8e44-9f099360b0ed', 'V-1780607158561', '1k-helado', '1k helado', 1, 1000, 100, 1000, '{}'::text[], '2026-06-04T21:17:16.562475+00:00'),
  ('ce401e70-31c9-4e41-bf50-92b098d2b8d3', 'V-1780607953315', '1k-helado', '1k helado', 1, 1000, 100, 1000, '{}'::text[], '2026-06-04T21:19:14.84637+00:00'),
  ('cdc5d6ef-514d-47d7-9bce-3433c4d3572e', 'V-1780608025730', '1k-helado', '1k helado', 1, 1000, 100, 1000, '{}'::text[], '2026-06-04T21:23:11.578845+00:00'),
  ('126da778-87aa-4a0d-aabe-00be0140047f', 'V-1780608073308', '1k-helado', '1k helado', 1, 1000, 100, 1000, '{}'::text[], '2026-06-04T21:23:11.999454+00:00'),
  ('89d074d3-ce03-4646-a59b-115f752b1088', 'V-1780609261916', '1k-helado', '1k helado', 1, 1000, 100, 1000, '{}'::text[], '2026-06-04T21:42:09.556216+00:00'),
  ('ceb66f24-fb90-489c-af95-e748ff286b82', 'V-1780609292162', '1k-helado', '1k helado', 1, 1000, 100, 1000, '{}'::text[], '2026-06-04T21:42:09.986871+00:00'),
  ('ca19ca01-3515-4fe7-885f-b724459ad2d0', 'V-1781033723608', '1k-helado', '1k helado', 21, 1000, 100, 21000, '{}'::text[], '2026-06-09T19:35:10.824294+00:00'),
  ('f0fabb6f-7717-4d06-85c6-141bfd3d5a19', 'V-1781033993588', '1-2-kilo', '1/2 kilo', 1, 11000, 0, 11000, '{}'::text[], '2026-06-09T19:39:53.661169+00:00'),
  ('59975389-7cc2-4192-a720-4cbb93859352', 'V-1781050261849', '1-2-kilo', '1/2 kilo', 1, 11000, 0, 11000, '{}'::text[], '2026-06-10T00:11:23.994116+00:00'),
  ('251a6948-17a9-4736-ab69-772ca416ab25', 'V-1781050261849', '1k-helado', '1k helado', 1, 1000, 100, 1000, '{}'::text[], '2026-06-10T00:11:23.994116+00:00'),
  ('b2d448c7-eac3-4100-8490-6161a9133bd5', 'V-1781233042208', '1-4-helado', '1/4 Helado', 1, 6500, 0, 6500, '{}'::text[], '2026-06-12T02:57:22.591632+00:00')
;

-- public.movimientos_stock: 29 filas
insert into public."movimientos_stock" ("id", "sucursal_id", "producto_id", "tipo", "cantidad", "nota", "usuario_id", "creado")
values
  ('566891e6-36a5-44bc-b1e8-dc55e95c6d55', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780278046767', null, '2026-06-01T06:44:07.841326+00:00'),
  ('280f009d-e364-4de0-ac2b-ad0530f220c7', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780295114135', null, '2026-06-01T06:44:08.13491+00:00'),
  ('16ed5ccc-9b04-489e-9649-198b58106de0', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780295746929', null, '2026-06-01T06:44:08.404796+00:00'),
  ('b6731525-3966-42fb-8252-0d436fb6c485', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780298419713', null, '2026-06-01T07:20:20.223734+00:00'),
  ('012a985d-7d0e-4146-8406-b7a636dfc203', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -6, 'Pedido V-1780298656129', null, '2026-06-01T07:24:16.649785+00:00'),
  ('8f4798f9-d16d-413c-865a-8939f8ae8eb5', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780298697805', null, '2026-06-01T07:24:58.264252+00:00'),
  ('21af7026-4d36-4eaa-b626-c8f912af2589', null, '1k-helado', 'ajuste', 8, 'Ajuste manual desde módulo stock', null, '2026-06-01T07:30:50.297119+00:00'),
  ('4086372b-063c-4ae5-83b5-8e36f9d486d2', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780300490122', null, '2026-06-01T07:54:50.601395+00:00'),
  ('6bfa6a9b-cb89-4092-9df8-3ac7bc0887c6', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780300788781', null, '2026-06-01T07:59:49.213409+00:00'),
  ('3e1c7756-7601-499e-aa6d-ad88cbf39357', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780336298007', null, '2026-06-01T17:51:40.178921+00:00'),
  ('81cc953d-649f-4add-b717-4f18d453a5b3', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780382707633', null, '2026-06-02T06:45:10.253812+00:00'),
  ('a2ca2710-af69-4cf6-a6d3-4b5cfee45f73', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780424377345', null, '2026-06-02T18:19:42.830886+00:00'),
  ('d9d86f9c-f269-40b6-a678-fc1e3cdaf994', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780427566287', null, '2026-06-02T19:12:51.787727+00:00'),
  ('6487da8b-2fea-4746-b1bd-ae77d8f81c2d', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780599550500', null, '2026-06-04T19:00:43.8044+00:00'),
  ('1a4a953b-5e29-48e5-87f0-15ff1e8d8301', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -2, 'Pedido V-1780599578388', null, '2026-06-04T19:00:44.149828+00:00'),
  ('e516ede2-c7d9-4ee0-a275-8a03497308ac', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780606055625', null, '2026-06-04T21:04:26.377868+00:00'),
  ('f4114393-eb52-48e4-8e1e-4f48ddb72068', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780607158561', null, '2026-06-04T21:17:16.562475+00:00'),
  ('99bc12c4-7bf0-446c-aef2-b372106be6bc', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780607953315', null, '2026-06-04T21:19:14.84637+00:00'),
  ('0ca675c6-3555-478c-ada3-4be3972d9074', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780608025730', null, '2026-06-04T21:23:11.578845+00:00'),
  ('bb598ca3-6103-49fe-afd9-9e8304262d11', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780608073308', null, '2026-06-04T21:23:11.999454+00:00'),
  ('734daa36-1d7a-400e-9a90-c172ceea9fa6', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780609261916', null, '2026-06-04T21:42:09.556216+00:00'),
  ('669adda4-4667-40b9-83dc-01eea9506b66', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1780609292162', null, '2026-06-04T21:42:09.986871+00:00'),
  ('c7cb4061-c2d0-4cc3-83d9-93fdb2cfefae', null, '1k-helado', 'ajuste', 20, 'Ajuste manual desde módulo stock', null, '2026-06-09T19:31:27.292349+00:00'),
  ('544ebe1c-d567-4e8e-ba3e-170c0126d7c5', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -21, 'Pedido V-1781033723608', null, '2026-06-09T19:35:10.824294+00:00'),
  ('75709680-7c7e-477f-9ed7-3741a72de32d', '00000000-0000-0000-0000-000000000001', '1-2-kilo', 'venta', -1, 'Pedido V-1781033993588', null, '2026-06-09T19:39:53.661169+00:00'),
  ('b5b680f4-30ef-44a8-a9b4-990cd265d3df', null, '1-4-helado', 'ajuste', 10, 'Ajuste manual desde módulo stock', null, '2026-06-09T20:40:49.6638+00:00'),
  ('7201ce5c-ebb1-4cfa-8222-f8fc085d46b4', '00000000-0000-0000-0000-000000000001', '1-2-kilo', 'venta', -1, 'Pedido V-1781050261849', null, '2026-06-10T00:11:23.994116+00:00'),
  ('6276ac14-8217-464a-b745-64e46d1a0fbb', '00000000-0000-0000-0000-000000000001', '1k-helado', 'venta', -1, 'Pedido V-1781050261849', null, '2026-06-10T00:11:23.994116+00:00'),
  ('d037794e-5863-405e-9a44-47686da3c943', '00000000-0000-0000-0000-000000000001', '1-4-helado', 'venta', -1, 'Pedido V-1781233042208', null, '2026-06-12T02:57:22.591632+00:00')
;

-- public.asistencias: 2 filas
insert into public."asistencias" ("id", "sucursal_id", "empleado_id", "empleado", "tipo", "turno", "usuario_id", "creado")
values
  ('c8e80f70-d98d-4529-bdc1-bd720053b3e9', '00000000-0000-0000-0000-000000000001', '2505be74-b87b-489c-8b5c-a2da6ea8562b', 'CARLOS', 'entrada', 'manana', null, '2026-06-01T18:47:31.036128+00:00'),
  ('ca317ab6-dbaa-4fbf-bbd1-7c9ece185a0f', '00000000-0000-0000-0000-000000000001', '2505be74-b87b-489c-8b5c-a2da6ea8562b', 'CARLOS', 'salida', 'manana', null, '2026-06-09T19:17:25.563289+00:00')
;

-- public.gastos_historial: 1 fila
insert into public."gastos_historial" ("id", "fecha_desde", "total", "gastos", "creado")
values
  ('b7ed55d4-1bf4-493b-aaab-1b8519516845', '2026-06-01T01:20:12.792+00:00', 100, '[{"clave":"sueldos","monto":10,"orden":1,"activo":true,"nombre":"Sueldos empleados","categoria":"Personal"},{"clave":"alquiler","monto":10,"orden":2,"activo":true,"nombre":"Alquiler","categoria":"Local"},{"clave":"luz","monto":10,"orden":3,"activo":true,"nombre":"Luz","categoria":"Servicios"},{"clave":"agua","monto":10,"orden":4,"activo":true,"nombre":"Agua","categoria":"Servicios"},{"clave":"gas","monto":20,"orden":5,"activo":true,"nombre":"Gas","categoria":"Servicios"},{"clave":"internet","monto":20,"orden":6,"activo":true,"nombre":"Internet","categoria":"Servicios"},{"clave":"otros","monto":20,"orden":7,"activo":true,"nombre":"Otros gastos","categoria":"General"}]'::jsonb, '2026-06-01T01:20:14.807617+00:00')
;

-- public.comisiones_historial: 1 fila
insert into public."comisiones_historial" ("id", "fecha_desde", "canales", "metodos", "creado")
values
  ('223506f6-abbc-4c12-9d55-d366f304b36a', '2026-06-01T06:32:49.448+00:00', '{"local":0,"pedidos_ya":30}'::jsonb, '[{"nombre":"Efectivo","comision":0},{"nombre":"Tarjeta","comision":3},{"nombre":"Mercado Pago","comision":6},{"nombre":"Transferencia","comision":0}]'::jsonb, '2026-06-01T06:32:49.536428+00:00')
;

-- public.cierres_caja: 3 filas
insert into public."cierres_caja" ("id", "sucursal_id", "fecha_operativa", "turno", "total_sistema", "efectivo_sistema", "efectivo_contado", "diferencia", "ventas", "observacion", "creado_por", "creado")
values
  ('5c0e1d43-189f-4126-9154-1433c61a6b48', '00000000-0000-0000-0000-000000000001', '2026-06-01', 'manana', 1000, 0, 100, 100, 1, null, null, '2026-06-01T17:52:26.190699+00:00'),
  ('ee9c144e-3080-4a6f-ad82-6604a9598cf1', '00000000-0000-0000-0000-000000000001', '2026-06-02', 'manana', 1000, 1000, 900, -100, 1, null, null, '2026-06-02T18:39:05.576746+00:00'),
  ('d008ba81-016f-4d20-b6fd-fcb5c6700c23', '00000000-0000-0000-0000-000000000001', '2026-06-09', 'tarde', 32000, 11000, 9000, -2000, 2, null, null, '2026-06-09T19:48:29.527407+00:00')
;

-- public.caja: 16 filas
insert into public."caja" ("id", "sucursal_id", "tipo", "concepto", "monto", "metodo", "venta_id", "usuario_id", "creado")
values
  ('7cde8910-19a4-4d2a-a566-ff35439923e7', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1780382707633', 1000, 'Transferencia', 'V-1780382707633', null, '2026-06-02T06:45:10.253812+00:00'),
  ('0b871d83-6126-46d0-8087-fd0b48601f3c', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1780424377345', 1000, 'Efectivo', 'V-1780424377345', null, '2026-06-02T18:19:42.830886+00:00'),
  ('0d483da0-8f35-42e8-8f3f-d37ac3c7293b', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1780427566287', 1000, 'Efectivo', 'V-1780427566287', null, '2026-06-02T19:12:51.787727+00:00'),
  ('392a8074-8ead-4b3c-8587-c7974b28cd88', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1780599550500', 1000, 'Transferencia', 'V-1780599550500', null, '2026-06-04T19:00:43.8044+00:00'),
  ('4b5e880b-7bc6-434b-9b17-cd7861e087ee', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1780599578388', 2000, 'Transferencia', 'V-1780599578388', null, '2026-06-04T19:00:44.149828+00:00'),
  ('5ea99dcd-32ee-4efd-bed0-f29622af9eca', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1780606055625', 1000, 'Efectivo', 'V-1780606055625', null, '2026-06-04T21:04:26.377868+00:00'),
  ('af90f909-27f3-4ddf-971c-60549c56257c', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1780607158561', 1000, 'Transferencia', 'V-1780607158561', null, '2026-06-04T21:17:16.562475+00:00'),
  ('42e82c37-988a-4604-8d86-99b466da68cd', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1780607953315', 1000, 'Efectivo', 'V-1780607953315', null, '2026-06-04T21:19:14.84637+00:00'),
  ('8268e427-cc2b-4f61-973b-c353e970c24f', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1780608025730', 1000, 'Efectivo', 'V-1780608025730', null, '2026-06-04T21:23:11.578845+00:00'),
  ('7b9d5ab9-ce22-4c5f-8003-dd58946b5845', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1780608073308', 1000, 'Transferencia', 'V-1780608073308', null, '2026-06-04T21:23:11.999454+00:00'),
  ('63872748-e8f9-4812-825b-6de762c7d572', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1780609261916', 1000, 'Efectivo', 'V-1780609261916', null, '2026-06-04T21:42:09.556216+00:00'),
  ('d815fb7e-23d8-4e5b-bda3-4f899a9de7d0', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1780609292162', 1000, 'Efectivo', 'V-1780609292162', null, '2026-06-04T21:42:09.986871+00:00'),
  ('6dacca9e-7612-49b2-ac0b-e40a13c22c55', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1781033723608', 21000, 'Mercado Pago', 'V-1781033723608', null, '2026-06-09T19:35:10.824294+00:00'),
  ('bd489ae9-1e41-4859-a117-1720a3cf2c9e', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1781033993588', 11000, 'Efectivo', 'V-1781033993588', null, '2026-06-09T19:39:53.661169+00:00'),
  ('5a7c2ae5-b30c-4c8a-be52-44b5b5f2461d', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1781050261849', 12000, 'Tarjeta', 'V-1781050261849', null, '2026-06-10T00:11:23.994116+00:00'),
  ('87c78d38-cb4e-4fb1-9b43-1db1f43aae61', '00000000-0000-0000-0000-000000000001', 'ingreso', 'Venta V-1781233042208', 6500, 'Efectivo', 'V-1781233042208', null, '2026-06-12T02:57:22.591632+00:00')
;

-- public.tandas_gustos: 10 filas
insert into public."tandas_gustos" ("id", "gusto_id", "gusto", "kilos", "porciones_cargadas", "stock_sistema_al_cerrar", "rendimiento_sugerido", "estado", "creado", "cerrado")
values
  ('27101e63-efdb-44f2-b400-4dfde66646b2', 'frutilla', 'frutilla', 20, 1, 0, 1, 'cerrada', '2026-06-02T00:08:24.650694+00:00', '2026-06-02T00:08:49.918+00:00'),
  ('294ef189-9464-455e-a9de-75c2c23a8cea', 'chocolate', 'chocolate', 20, 1, 0, 1, 'cerrada', '2026-06-02T00:08:26.387761+00:00', '2026-06-02T00:08:50.533+00:00'),
  ('0fbf83c2-0077-4dc9-b84c-ec25d6630124', 'frutilla', 'frutilla', 20, 1, null, null, 'activa', '2026-06-02T00:11:53.610657+00:00', null),
  ('5702aff2-ec02-4141-979c-6a3f77f52839', 'hola', 'hola', 20, 1, 0, 1, 'cerrada', '2026-06-09T19:32:28.891404+00:00', '2026-06-09T20:41:48.525+00:00'),
  ('8e4ead54-02f0-408c-9bc4-a71e8d21480d', 'hola', 'hola', 20, 1, 0, 1, 'cerrada', '2026-06-09T19:32:30.504841+00:00', '2026-06-09T20:41:52.638+00:00'),
  ('5ad0e8d4-51ad-4386-94e9-22f6d66d6c42', 'frutilla', 'frutilla', 20, 160, 160, 0, 'cerrada', '2026-06-01T07:43:18.393904+00:00', '2026-06-01T07:53:24.366+00:00'),
  ('343d8bbf-c743-4dd8-81fd-a51c1db94da7', 'chocolate', 'chocolate', 20, 160, null, null, 'activa', '2026-06-01T07:58:59.375797+00:00', null),
  ('a63b4bfa-5487-4d5b-bec7-f3b176afaca0', 'frutilla', 'frutilla', 20, 160, 0, 160, 'cerrada', '2026-06-01T07:53:31.099907+00:00', '2026-06-01T22:50:52.236+00:00'),
  ('039c8865-ebdc-4029-84b4-7e166a1f1b1b', 'frutilla', 'frutilla', 20, 1, 0, 1, 'cerrada', '2026-06-02T00:08:13.478305+00:00', '2026-06-02T00:08:16.422+00:00'),
  ('fa42b59a-378a-4c14-812d-37e721105804', 'chocolate', 'chocolate', 20, 1, 0, 1, 'cerrada', '2026-06-02T00:08:11.605437+00:00', '2026-06-02T00:08:17.106+00:00')
;

-- public.compras: 0 filas

-- public.items_compra: 0 filas

-- public.tareas: 0 filas

-- public.auditoria: 28 filas
insert into public."auditoria" ("id", "entidad", "entidad_id", "accion", "detalle", "usuario_id", "usuario_nombre", "creado")
values
  ('1c1d0664-73c8-42b7-8496-c11a46577572', 'producto', '1k-helado', 'guardar', '{"costo":100,"stock":10,"nombre":"1k helado","precio":1000,"categoria":"helados"}'::jsonb, null, 'Matias Barbeito', '2026-06-01T01:03:01.035113+00:00'),
  ('ef90bac4-3236-4c98-960c-07205fe8174c', 'gastos', null, 'actualizar', '{"total":0,"gastos":[]}'::jsonb, null, 'Matias Barbeito', '2026-06-01T01:08:21.808304+00:00'),
  ('61efeeac-74e3-49b3-96b7-6b2225b790fb', 'gastos_historial', '725ecc53-c243-4605-867d-46539f74d358', 'eliminar', '{"id":"725ecc53-c243-4605-867d-46539f74d358"}'::jsonb, null, 'Matias Barbeito', '2026-06-01T01:08:26.56334+00:00'),
  ('1f7acc46-9a54-499f-9934-615228dc0e59', 'gastos', null, 'actualizar', '{"total":100,"gastos":[{"clave":"sueldos","monto":10,"orden":1,"activo":true,"nombre":"Sueldos empleados","categoria":"Personal"},{"clave":"alquiler","monto":10,"orden":2,"activo":true,"nombre":"Alquiler","categoria":"Local"},{"clave":"luz","monto":10,"orden":3,"activo":true,"nombre":"Luz","categoria":"Servicios"},{"clave":"agua","monto":10,"orden":4,"activo":true,"nombre":"Agua","categoria":"Servicios"},{"clave":"gas","monto":20,"orden":5,"activo":true,"nombre":"Gas","categoria":"Servicios"},{"clave":"internet","monto":20,"orden":6,"activo":true,"nombre":"Internet","categoria":"Servicios"},{"clave":"otros","monto":20,"orden":7,"activo":true,"nombre":"Otros gastos","categoria":"General"}]}'::jsonb, null, 'Matias Barbeito', '2026-06-01T01:20:14.885114+00:00'),
  ('1f951c73-e0d4-455e-944a-2a9dd4eb6057', 'comisiones', null, 'actualizar', '{"canales":{"local":0,"pedidos_ya":30},"metodos":[{"nombre":"Efectivo","comision":0},{"nombre":"Tarjeta","comision":3},{"nombre":"Mercado Pago","comision":6},{"nombre":"Transferencia","comision":0}]}'::jsonb, null, 'Matias Barbeito', '2026-06-01T06:32:49.596849+00:00'),
  ('f1f5b564-79d1-4e0d-85f7-312ca3949482', 'venta', 'V-1780295746929', 'eliminar', '{"id":"V-1780295746929","total":1000,"metodo":"Transferencia","stock_restaurado":{"1k-helado":1},"gustos_restaurados":{"menta":0.75,"frutilla":0.75,"dulce de leche":0.75,"chocolate blanco":0.75}}'::jsonb, null, 'Matias Barbeito', '2026-06-01T06:52:17.644302+00:00'),
  ('ad01e616-3904-41f1-8ba2-5cc46608177b', 'venta', 'V-1780295114135', 'eliminar', '{"id":"V-1780295114135","total":1000,"metodo":"Efectivo","stock_restaurado":{"1k-helado":1},"gustos_restaurados":{"menta":0.75,"frutilla":0.75,"dulce de leche":0.75,"chocolate blanco":0.75}}'::jsonb, null, 'Matias Barbeito', '2026-06-01T06:55:56.758944+00:00'),
  ('85b0cba3-0b08-4994-9568-8205e9d6254a', 'venta', 'V-1780278046767', 'eliminar', '{"id":"V-1780278046767","total":1000,"metodo":"Efectivo","stock_restaurado":{"1k-helado":1},"gustos_restaurados":{"menta":0.75,"frutilla":0.75,"dulce de leche":0.75,"chocolate blanco":0.75}}'::jsonb, null, 'Matias Barbeito', '2026-06-01T06:56:02.463099+00:00'),
  ('fe1a114c-d3fc-4af0-af63-2cea4cf1ba49', 'producto', '1k-helado', 'guardar', '{"costo":100,"stock":10,"nombre":"1k helado","precio":1000,"categoria":"helados"}'::jsonb, null, 'Matias Barbeito', '2026-06-01T07:30:50.232588+00:00'),
  ('48fdaeaa-cdf6-48c8-8e3f-af3dc9a7bd79', 'venta', 'V-1780298697805', 'eliminar', '{"id":"V-1780298697805","total":1000,"metodo":"Transferencia","stock_restaurado":{"1k-helado":1},"gustos_restaurados":{"menta":0.75,"frutilla":0.75,"dulce de leche":0.75,"chocolate blanco":0.75}}'::jsonb, null, 'Matias Barbeito', '2026-06-01T07:42:17.21002+00:00'),
  ('368e9006-6d3f-4ac2-b9e7-b086185829c6', 'venta', 'V-1780298656129', 'eliminar', '{"id":"V-1780298656129","total":6000,"metodo":"Transferencia","stock_restaurado":{"1k-helado":6},"gustos_restaurados":{"menta":4.5,"frutilla":4.5,"dulce de leche":4.5,"chocolate blanco":4.5}}'::jsonb, null, 'Matias Barbeito', '2026-06-01T07:42:20.855923+00:00'),
  ('7acbc458-79ab-44bd-ac73-b6e1eb61b189', 'venta', 'V-1780298419713', 'eliminar', '{"id":"V-1780298419713","total":1000,"metodo":"Transferencia","stock_restaurado":{"1k-helado":1},"gustos_restaurados":{"menta":0.75,"frutilla":0.75,"dulce de leche":0.75,"chocolate blanco":0.75}}'::jsonb, null, 'Matias Barbeito', '2026-06-01T07:42:23.66768+00:00'),
  ('343f9241-6f73-4962-8ff3-edcac9723aad', 'producto', '1k-helado', 'guardar', '{"costo":100,"stock":17,"nombre":"1k helado","precio":1000,"categoria":"helados"}'::jsonb, null, 'Matias Barbeito', '2026-06-01T07:58:27.760881+00:00'),
  ('f74fe6be-ede7-477b-ba28-5290b19af7c8', 'venta', 'V-1780300490122', 'eliminar', '{"id":"V-1780300490122","total":1000,"metodo":"Efectivo","stock_restaurado":{"1k-helado":1},"gustos_restaurados":{"frutilla":12}}'::jsonb, null, 'Matias Barbeito', '2026-06-01T07:58:37.461593+00:00'),
  ('38977e81-5fc2-4d7a-8961-69c79edd5f1e', 'cierres_caja', '2026-06-01-manana', 'crear', '{"id":"5c0e1d43-189f-4126-9154-1433c61a6b48","turno":"manana","ventas":1,"creado_por":"81e71e20-0b2c-4f8f-bddf-dc04383ccc2d","diferencia":100,"observacion":null,"total_sistema":1000,"fecha_operativa":"2026-06-01","efectivo_contado":100,"efectivo_sistema":0}'::jsonb, null, 'Matias Barbeito', '2026-06-01T17:52:26.296133+00:00'),
  ('5b502a60-8e4c-47b5-9883-f8839f9d53cc', 'empleado', '2505be74-b87b-489c-8b5c-a2da6ea8562b', 'editar', '{"rol":"Encargado/a","nombre":"CARLOS","sector":"General"}'::jsonb, null, 'Matias Barbeito', '2026-06-01T18:46:43.098911+00:00'),
  ('13ade093-899e-4a4f-9de7-3b389dd42adf', 'venta', 'V-1780336298007', 'eliminar', '{"id":"V-1780336298007","total":1000,"metodo":"Transferencia","stock_restaurado":{"1k-helado":1},"gustos_restaurados":{"frutilla":6,"chocolate":6}}'::jsonb, null, 'Matias Barbeito', '2026-06-01T22:50:34.063789+00:00'),
  ('30bfa866-454a-4de6-975c-1eab27299a48', 'venta', 'V-1780300788781', 'eliminar', '{"id":"V-1780300788781","total":1000,"metodo":"Efectivo","stock_restaurado":{"1k-helado":1},"gustos_restaurados":{"frutilla":6,"chocolate":6}}'::jsonb, null, 'Matias Barbeito', '2026-06-01T22:50:36.335017+00:00'),
  ('d5e4bb42-3a93-4b4b-b193-73b46fd19eb5', 'cierres_caja', '2026-06-02-manana', 'crear', '{"id":"ee9c144e-3080-4a6f-ad82-6604a9598cf1","turno":"manana","ventas":1,"creado_por":"81e71e20-0b2c-4f8f-bddf-dc04383ccc2d","diferencia":-100,"observacion":null,"total_sistema":1000,"fecha_operativa":"2026-06-02","efectivo_contado":900,"efectivo_sistema":1000}'::jsonb, null, 'Matias Barbeito', '2026-06-02T18:39:05.671891+00:00'),
  ('cb45d670-7da3-4914-9e0a-ba553d68e841', 'producto', '1k-helado', 'guardar', '{"costo":100,"stock":15,"nombre":"1k helado","precio":1000,"categoria":"helados"}'::jsonb, null, 'Facundo', '2026-06-03T19:08:30.279164+00:00'),
  ('b94b693b-aa82-4bd8-95e0-b28f67e7aa7b', 'producto', '1k-helado', 'guardar', '{"costo":100,"stock":25,"nombre":"1k helado","precio":1000,"categoria":"helados"}'::jsonb, null, 'Facundo', '2026-06-09T19:31:26.851575+00:00'),
  ('bf84d420-9656-4216-88ba-03bea21b72a5', 'producto', '1-2-kilo', 'guardar', '{"costo":0,"stock":11,"nombre":"1/2 kilo","precio":11000,"categoria":"helados"}'::jsonb, null, 'Facundo', '2026-06-09T19:39:07.318527+00:00'),
  ('1c674682-c5e0-43ef-a742-6dbc36036f95', 'cierres_caja', '2026-06-09-tarde', 'crear', '{"id":"d008ba81-016f-4d20-b6fd-fcb5c6700c23","turno":"tarde","ventas":2,"creado_por":"81e71e20-0b2c-4f8f-bddf-dc04383ccc2d","diferencia":-2000,"observacion":null,"total_sistema":32000,"fecha_operativa":"2026-06-09","efectivo_contado":9000,"efectivo_sistema":11000}'::jsonb, null, 'Matias Barbeito', '2026-06-09T19:48:29.705411+00:00'),
  ('2da42fe4-f4bc-4e6e-819e-187a883fc192', 'producto', 'cafe-chico', 'guardar', '{"costo":0,"stock":0,"nombre":"Cafe chico","precio":0,"categoria":"Cafeteria"}'::jsonb, null, 'Facundo', '2026-06-09T19:53:52.372472+00:00'),
  ('8706c38a-8c72-4657-8a5e-20673c5958ef', 'producto', '1-4-helado', 'guardar', '{"costo":0,"stock":20,"nombre":"1/4 Helado","precio":6500,"categoria":"helados"}'::jsonb, null, 'Facundo', '2026-06-09T20:40:23.529388+00:00'),
  ('732a2b33-9e87-476a-ab17-67e38e7edbb9', 'producto', '1-4-helado', 'guardar', '{"costo":0,"stock":30,"nombre":"1/4 Helado","precio":6500,"categoria":"helados"}'::jsonb, null, 'Facundo', '2026-06-09T20:40:49.508531+00:00'),
  ('380dde58-91d5-420b-a82e-b2a722490334', 'producto', '1k-helado', 'guardar', '{"costo":100,"stock":3,"nombre":"1k helado","precio":1000,"categoria":"helados"}'::jsonb, null, 'Facundo', '2026-06-17T18:38:26.28206+00:00'),
  ('2bc10aa4-b70f-429a-973a-17ef3cf6588d', 'producto', '1k-helado', 'guardar', '{"costo":100,"stock":3,"nombre":"1k helado","precio":1000,"categoria":"helados"}'::jsonb, null, 'Facundo', '2026-06-17T19:00:41.382626+00:00')
;


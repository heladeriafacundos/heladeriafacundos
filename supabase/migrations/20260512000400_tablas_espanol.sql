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

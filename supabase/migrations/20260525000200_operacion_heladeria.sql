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

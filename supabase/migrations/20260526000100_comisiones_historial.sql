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

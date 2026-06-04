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

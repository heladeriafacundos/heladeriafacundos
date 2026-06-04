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

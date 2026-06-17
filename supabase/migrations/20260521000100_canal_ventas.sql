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

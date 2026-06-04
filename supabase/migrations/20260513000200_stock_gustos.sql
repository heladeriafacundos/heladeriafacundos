alter table public.gustos
  add column if not exists stock numeric(12, 2) not null default 0,
  add column if not exists stock_minimo numeric(12, 2) not null default 0,
  add column if not exists unidad text not null default 'porciones';

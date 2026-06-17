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

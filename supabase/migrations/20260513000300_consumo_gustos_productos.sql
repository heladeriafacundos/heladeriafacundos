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

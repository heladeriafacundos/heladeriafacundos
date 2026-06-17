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

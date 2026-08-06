alter table public.productos
add column if not exists descripcion text not null default '';

alter table public.productos
add column if not exists precio_pendiente boolean not null default false;

alter table public.productos
add column if not exists controla_stock boolean not null default true;

alter table public.categorias
add column if not exists categoria_padre text;

create index if not exists categorias_padre_idx
on public.categorias(categoria_padre, orden);

insert into public.categorias (nombre, orden, icono, categoria_padre)
values
  ('Cafetería', 10, 'coffee', null),
  ('Heladería', 20, 'snowflake', null)
on conflict (nombre) do update set
  orden = excluded.orden,
  icono = excluded.icono,
  categoria_padre = excluded.categoria_padre;

insert into public.categorias (nombre, orden, icono, categoria_padre)
values
  ('Cafés', 11, 'coffee', 'Cafetería'),
  ('Meriendas / Desayunos', 12, 'sun', 'Cafetería'),
  ('Promo', 13, 'money', 'Cafetería'),
  ('Salados', 14, 'store', 'Cafetería'),
  ('Dulces', 15, 'receipt', 'Cafetería'),
  ('Aperitivos', 16, 'wallet', 'Cafetería'),
  ('Extras', 17, 'package', 'Cafetería'),
  ('Potes', 21, 'snowflake', 'Heladería'),
  ('Cucuruchos', 22, 'snowflake', 'Heladería'),
  ('Vasos', 23, 'snowflake', 'Heladería')
on conflict (nombre) do update set
  orden = excluded.orden,
  icono = excluded.icono,
  categoria_padre = excluded.categoria_padre;

insert into public.configuracion (clave, valor)
values (
  'categorias_jerarquia',
  '{
    "Cafés": "Cafetería",
    "Meriendas / Desayunos": "Cafetería",
    "Promo": "Cafetería",
    "Salados": "Cafetería",
    "Dulces": "Cafetería",
    "Aperitivos": "Cafetería",
    "Extras": "Cafetería",
    "Potes": "Heladería",
    "Cucuruchos": "Heladería",
    "Vasos": "Heladería"
  }'::jsonb
)
on conflict (clave) do update set
  valor = public.configuracion.valor || excluded.valor,
  actualizado = now();

with menu (
  id,
  nombre,
  categoria,
  precio,
  precio_pendiente,
  descripcion,
  icono
) as (
  values
    ('cafe-expreso', 'Expreso', 'Cafés', 2800::numeric, false, '', 'coffee'),
    ('cafe-expreso-cortado', 'Expreso cortado', 'Cafés', 2800::numeric, false, '', 'coffee'),
    ('cafe-lagrima', 'Lágrima', 'Cafés', 3300::numeric, false, '', 'coffee'),
    ('cafe-lagrima-doble', 'Lágrima doble', 'Cafés', 4000::numeric, false, '', 'coffee'),
    ('cafe-cortado-jarrito', 'Cortado en jarrito', 'Cafés', 3200::numeric, false, '', 'coffee'),
    ('cafe-doble', 'Café doble', 'Cafés', 4000::numeric, false, '', 'coffee'),
    ('cafe-americano', 'Americano', 'Cafés', 3300::numeric, false, '', 'coffee'),
    ('cafe-con-leche', 'Café con leche', 'Cafés', 4000::numeric, false, '', 'coffee'),
    ('cafe-te-o-matecocido', 'Té o matecocido', 'Cafés', 4000::numeric, false, '', 'coffee'),
    ('cafe-mokaccino', 'Mokaccino', 'Cafés', 0::numeric, true, '', 'coffee'),
    ('cafe-capucchino', 'Capucchino', 'Cafés', 4700::numeric, false, '', 'coffee'),
    ('cafe-facundos', 'Café Facundos', 'Cafés', 5000::numeric, false, 'Salsa de chocolate + salsa de frutilla, café, leche, crema y chocolate rallado.', 'coffee'),
    ('cafe-submarino', 'Submarino', 'Cafés', 5600::numeric, false, '', 'coffee'),
    ('cafe-frio', 'Café frío', 'Cafés', 6000::numeric, false, 'Incluye una bocha de helado de chocolate o americana.', 'coffee'),
    ('cafe-helado', 'Café helado', 'Cafés', 0::numeric, true, 'Café con hielo; leche opcional.', 'coffee'),
    ('cafe-te-helado', 'Té helado', 'Cafés', 0::numeric, true, 'Té con hielo; leche opcional.', 'coffee'),
    ('cafe-licuados-frutales', 'Licuados frutales', 'Cafés', 5600::numeric, false, '', 'card'),
    ('cafe-licuado-banana', 'Licuados banana', 'Cafés', 4900::numeric, false, '', 'card'),
    ('cafe-exprimido-naranjas', 'Exprimido naranjas', 'Cafés', 4100::numeric, false, '', 'card'),
    ('cafe-exprimido-chico', 'Exprimido chico', 'Cafés', 0::numeric, true, '', 'card'),
    ('cafe-limonada', 'Limonada', 'Cafés', 4100::numeric, false, '', 'card'),
    ('cafe-gaseosa', 'Gaseosa', 'Cafés', 3000::numeric, false, '', 'card'),
    ('cafe-gaseosa-grande', 'Gaseosa grande', 'Cafés', 0::numeric, true, '', 'card'),
    ('cafe-agua-saborizada', 'Agua saborizada', 'Cafés', 3000::numeric, false, '', 'card'),
    ('cafe-baggio', 'Baggio', 'Cafés', 1300::numeric, false, '', 'card'),

    ('merienda-medialunas', 'Café con leche + 2 medialunas + jugo exprimido de naranja', 'Meriendas / Desayunos', 7000::numeric, false, 'Opcional té.', 'sun'),
    ('merienda-tostadas', 'Café con leche + tostadas con queso y mermelada + jugo exprimido de naranja', 'Meriendas / Desayunos', 8000::numeric, false, 'Opcional té.', 'sun'),
    ('merienda-yogur', 'Yogur con frutas y granola + jugo exprimido de naranja + café con leche', 'Meriendas / Desayunos', 9000::numeric, false, '', 'sun'),
    ('merienda-proteico', 'Proteico', 'Meriendas / Desayunos', 10500::numeric, false, 'Café con leche o té + exprimido de naranja, tostadas + jamón + huevos revueltos + tomates cherry.', 'sun'),
    ('merienda-torta', 'Café con leche o té + exprimido de naranja + porción de torta', 'Meriendas / Desayunos', 12000::numeric, false, '', 'sun'),

    ('promo-pancho-gaseosa', 'Pancho + gaseosa', 'Promo', 4300::numeric, false, '', 'money'),
    ('promo-baggio-pebete', 'Baggio + pebete', 'Promo', 4500::numeric, false, '', 'money'),
    ('promo-empanadas-gaseosa', '2 empanadas + gaseosa', 'Promo', 7800::numeric, false, '', 'money'),
    ('promo-picada-cervezas', 'Picada p/2 + 2 cervezas', 'Promo', 24000::numeric, false, '', 'money'),

    ('salado-tostado', 'Tostado', 'Salados', 4400::numeric, false, '', 'store'),
    ('salado-medialuna', 'Medialuna', 'Salados', 1600::numeric, false, '', 'store'),
    ('salado-pebete', 'Pebete', 'Salados', 3700::numeric, false, '', 'store'),
    ('salado-medialuna-jamon-queso', 'Medialuna c/jamón y queso', 'Salados', 2800::numeric, false, '', 'store'),
    ('salado-empanada', 'Empanada', 'Salados', 1900::numeric, false, '', 'store'),
    ('salado-pancho', 'Pancho', 'Salados', 1600::numeric, false, '', 'store'),
    ('salado-picada-2', 'Picada para 2', 'Salados', 22000::numeric, false, '', 'store'),
    ('salado-picada-4', 'Picada para 4', 'Salados', 35000::numeric, false, '', 'store'),
    ('salado-tostado-arabe', 'Tostado árabe', 'Salados', 4700::numeric, false, '', 'store'),
    ('salado-arabe-napolitano', 'Árabe napolitano', 'Salados', 0::numeric, true, '', 'store'),
    ('salado-arabe-muzzarella', 'Árabe muzzarella', 'Salados', 0::numeric, true, '', 'store'),
    ('salado-huevos-revueltos', 'Huevos revueltos', 'Salados', 0::numeric, true, '', 'store'),

    ('dulce-tortas', 'Tortas', 'Dulces', 7700::numeric, false, '', 'receipt'),
    ('dulce-milkshake', 'Milkshake', 'Dulces', 6000::numeric, false, '', 'receipt'),
    ('dulce-milkshake-especial', 'Milkshake especial', 'Dulces', 7000::numeric, false, '', 'receipt'),
    ('dulce-copas-helados', 'Copas helados', 'Dulces', 8000::numeric, false, '', 'receipt'),
    ('dulce-postres', 'Postres', 'Dulces', 0::numeric, true, '', 'receipt'),
    ('dulce-banana-split', 'Banana split', 'Dulces', 8900::numeric, false, '', 'receipt'),
    ('dulce-tostadas-queso-mermelada', 'Tostadas c/queso y merm.', 'Dulces', 0::numeric, true, '', 'receipt'),
    ('dulce-tiramisu', 'Tiramisú', 'Dulces', 0::numeric, true, '', 'receipt'),
    ('dulce-toffi', 'Toffi', 'Dulces', 0::numeric, true, '', 'receipt'),
    ('dulce-brocheta-panqueques', 'Brocheta de panqueques', 'Dulces', 0::numeric, true, 'Con dulce de leche, Nutella o crema y frutas de estación.', 'receipt'),
    ('dulce-tortilla-avena', 'Tortilla de avena', 'Dulces', 0::numeric, true, 'Con fruta de estación y mix de semillas.', 'receipt'),

    ('aperitivo-cerveza', 'Cerveza', 'Aperitivos', 3700::numeric, false, '', 'wallet'),
    ('aperitivo-fernet', 'Fernet', 'Aperitivos', 5500::numeric, false, '', 'wallet'),
    ('aperitivo-destornillador', 'Destornillador', 'Aperitivos', 5800::numeric, false, '', 'wallet'),
    ('aperitivo-gancia', 'Gancia', 'Aperitivos', 5800::numeric, false, '', 'wallet'),
    ('aperitivo-cuba-libre', 'Cuba Libre', 'Aperitivos', 6100::numeric, false, '', 'wallet'),
    ('aperitivo-wisky', 'Wisky', 'Aperitivos', 6700::numeric, false, '', 'wallet'),
    ('aperitivo-gancia-batido', 'Gancia batido', 'Aperitivos', 7200::numeric, false, '', 'wallet'),
    ('aperitivo-daikiri', 'Daikiri', 'Aperitivos', 7200::numeric, false, '', 'wallet'),
    ('aperitivo-baylis-black', 'Baylis Black', 'Aperitivos', 0::numeric, true, '', 'wallet'),
    ('aperitivo-baylis-white', 'Baylis White', 'Aperitivos', 0::numeric, true, '', 'wallet'),

    ('extra-limon', 'Extra limón', 'Extras', 0::numeric, true, '', 'package'),
    ('extra-naranja', 'Extra naranja', 'Extras', 0::numeric, true, '', 'package'),
    ('extra-crema', 'Extra crema', 'Extras', 0::numeric, true, '', 'package'),
    ('extra-palta', 'Extra palta', 'Extras', 0::numeric, true, '', 'package')
)
insert into public.productos (
  id,
  nombre,
  categoria,
  descripcion,
  precio,
  precio_pendiente,
  costo,
  stock,
  stock_minimo,
  controla_stock,
  unidad,
  imagen,
  icono,
  max_gustos,
  consumo_gustos,
  activo
)
select
  id,
  nombre,
  categoria,
  descripcion,
  precio,
  precio_pendiente,
  0,
  0,
  0,
  false,
  case when precio_pendiente then 'venta-pendiente' else 'venta' end,
  null,
  icono,
  0,
  0,
  true
from menu
on conflict (id) do update set
  nombre = excluded.nombre,
  categoria = excluded.categoria,
  descripcion = excluded.descripcion,
  precio = excluded.precio,
  precio_pendiente = excluded.precio_pendiente,
  controla_stock = excluded.controla_stock,
  unidad = excluded.unidad,
  icono = excluded.icono,
  activo = true,
  actualizado = now();

update public.productos
set categoria = 'Potes', actualizado = now()
where id in ('1-4-kg', 'helado-1kg');

update public.productos
set categoria = 'Cucuruchos', actualizado = now()
where id = 'cucurucho';

update public.productos
set categoria = 'Vasos', actualizado = now()
where id in ('vacito', 'vaso');

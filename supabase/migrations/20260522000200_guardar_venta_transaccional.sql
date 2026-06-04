create or replace function public.guardar_venta_transaccional(pedido jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  venta jsonb := pedido->'venta';
  item jsonb;
  movimiento jsonb;
  stock_item jsonb;
  gusto_item jsonb;
  venta_id text := venta->>'id';
  item_gustos text[];
  cantidad numeric(12, 2);
begin
  if venta_id is null or length(trim(venta_id)) = 0 then
    raise exception 'La venta no tiene id';
  end if;

  if jsonb_typeof(coalesce(pedido->'items', '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(pedido->'items', '[]'::jsonb)) = 0 then
    raise exception 'La venta no tiene items';
  end if;

  if exists (select 1 from public.ventas where id = venta_id) then
    return jsonb_build_object('ok', true, 'venta_id', venta_id, 'repetida', true);
  end if;

  insert into public.ventas (
    id,
    sucursal_id,
    cliente,
    canal,
    productos,
    metodo,
    subtotal,
    descuento,
    total,
    hora,
    estado,
    usuario_id
  )
  values (
    venta_id,
    nullif(venta->>'sucursal_id', '')::uuid,
    coalesce(nullif(venta->>'cliente', ''), 'Mostrador'),
    coalesce(nullif(venta->>'canal', ''), 'local'),
    coalesce((venta->>'productos')::integer, 0),
    nullif(venta->>'metodo', ''),
    coalesce((venta->>'subtotal')::numeric, 0),
    coalesce((venta->>'descuento')::numeric, 0),
    coalesce((venta->>'total')::numeric, 0),
    coalesce(nullif(venta->>'hora', '')::time, localtime),
    coalesce(nullif(venta->>'estado', ''), 'pagada'),
    nullif(venta->>'usuario_id', '')::uuid
  );

  for item in
    select value from jsonb_array_elements(coalesce(pedido->'items', '[]'::jsonb))
  loop
    item_gustos := case
      when jsonb_typeof(item->'gustos') = 'array' then
        array(select jsonb_array_elements_text(item->'gustos'))
      else
        '{}'::text[]
    end;

    insert into public.items_venta (
      venta_id,
      producto_id,
      producto,
      cantidad,
      precio,
      costo,
      total,
      gustos
    )
    values (
      venta_id,
      nullif(item->>'producto_id', ''),
      coalesce(nullif(item->>'producto', ''), 'Producto'),
      coalesce((item->>'cantidad')::numeric, 0),
      coalesce((item->>'precio')::numeric, 0),
      coalesce((item->>'costo')::numeric, 0),
      coalesce((item->>'total')::numeric, 0),
      item_gustos
    );
  end loop;

  for movimiento in
    select value from jsonb_array_elements(coalesce(pedido->'movimientos', '[]'::jsonb))
  loop
    insert into public.movimientos_stock (
      sucursal_id,
      producto_id,
      tipo,
      cantidad,
      nota,
      usuario_id
    )
    values (
      nullif(movimiento->>'sucursal_id', '')::uuid,
      movimiento->>'producto_id',
      coalesce(nullif(movimiento->>'tipo', ''), 'venta'),
      coalesce((movimiento->>'cantidad')::numeric, 0),
      nullif(movimiento->>'nota', ''),
      nullif(movimiento->>'usuario_id', '')::uuid
    );
  end loop;

  for stock_item in
    select value from jsonb_array_elements(coalesce(pedido->'stock', '[]'::jsonb))
  loop
    if stock_item ? 'cantidad' then
      cantidad := coalesce((stock_item->>'cantidad')::numeric, 0);

      update public.productos
      set stock = greatest(0, stock - cantidad)
      where id = stock_item->>'id';
    else
      update public.productos
      set stock = coalesce((stock_item->>'stock')::numeric, stock)
      where id = stock_item->>'id';
    end if;

    if not found then
      raise exception 'No existe el producto %', stock_item->>'id';
    end if;
  end loop;

  for gusto_item in
    select value from jsonb_array_elements(coalesce(pedido->'stock_gustos', '[]'::jsonb))
  loop
    if gusto_item ? 'cantidad' then
      cantidad := coalesce((gusto_item->>'cantidad')::numeric, 0);

      update public.gustos
      set stock = stock - cantidad
      where id = gusto_item->>'id';
    else
      update public.gustos
      set stock = coalesce((gusto_item->>'stock')::numeric, stock)
      where id = gusto_item->>'id';
    end if;

    if not found then
      raise exception 'No existe el gusto %', gusto_item->>'id';
    end if;
  end loop;

  insert into public.caja (
    sucursal_id,
    tipo,
    concepto,
    monto,
    metodo,
    venta_id,
    usuario_id
  )
  values (
    nullif(venta->>'sucursal_id', '')::uuid,
    'ingreso',
    'Venta ' || venta_id,
    coalesce((venta->>'total')::numeric, 0),
    nullif(venta->>'metodo', ''),
    venta_id,
    nullif(venta->>'usuario_id', '')::uuid
  );

  return jsonb_build_object('ok', true, 'venta_id', venta_id);
end;
$$;

grant execute on function public.guardar_venta_transaccional(jsonb) to authenticated;

update public.configuracion
set
  valor = jsonb_set(
    jsonb_set(
      valor,
      '{brandName}',
      to_jsonb('Nombre del local'::text),
      true
    ),
    '{brandSubtitle}',
    to_jsonb('Gestión del local'::text),
    true
  ),
  actualizado = now()
where clave = 'diseno'
  and (
    valor->>'brandName' = convert_from(decode('48656c61646572c3ad6120466163756e646f2773', 'hex'), 'UTF8')
    or valor->>'brandSubtitle' = convert_from(decode('48656c61646572c3ad61202f2043616665746572c3ad61', 'hex'), 'UTF8')
  );

update public.configuracion
set
  valor = valor || '{
    "brandName": "Nombre del local",
    "brandSubtitle": "Gestión del local",
    "brandFontFamily": "''Great Vibes'', ''Dancing Script'', cursive",
    "brandLogoMode": "icon",
    "brandIcon": "snowflake",
    "brandImageUrl": "",
    "faviconUrl": ""
  }'::jsonb,
  actualizado = now()
where clave = 'diseno';

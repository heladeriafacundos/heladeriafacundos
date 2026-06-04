update public.configuracion
set
  valor = valor || '{
    "fontFamily": "var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif"
  }'::jsonb,
  actualizado = now()
where clave = 'diseno'
  and not (valor ? 'fontFamily');

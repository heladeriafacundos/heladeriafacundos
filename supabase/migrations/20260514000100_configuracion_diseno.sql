create table if not exists public.configuracion (
  clave text primary key,
  valor jsonb not null default '{}'::jsonb,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

drop trigger if exists poner_actualizado on public.configuracion;
create trigger poner_actualizado
before update on public.configuracion
for each row execute function public.poner_actualizado();

alter table public.configuracion enable row level security;

drop policy if exists "usuarios autenticados administran configuracion" on public.configuracion;
create policy "usuarios autenticados administran configuracion"
on public.configuracion
for all
to authenticated
using (true)
with check (true);

grant all on table public.configuracion to authenticated;

insert into public.configuracion (clave, valor)
values (
  'diseno',
  '{
    "background": "#070809",
    "sidebar": "#0d0f10",
    "header": "#090b0d",
    "panel": "#0f1213",
    "panelAlt": "#111417",
    "primary": "#67e8f9",
    "primaryText": "#06242a",
    "text": "#f4f4f5",
    "muted": "#a1a1aa",
    "border": "#263033",
    "success": "#34d399",
    "warning": "#facc15",
    "danger": "#fb7185",
    "fontFamily": "var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif",
    "brandName": "Nombre del local",
    "brandSubtitle": "Gestión del local",
    "brandFontFamily": "''Great Vibes'', ''Dancing Script'', cursive",
    "brandLogoMode": "icon",
    "brandIcon": "snowflake",
    "brandImageUrl": "",
    "faviconUrl": ""
  }'::jsonb
)
on conflict (clave) do nothing;

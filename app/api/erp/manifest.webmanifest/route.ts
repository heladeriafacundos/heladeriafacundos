import { createAdminClient } from "@/lib/supabase/admin";

const DESIGN_KEY = "diseno";

type StoredTheme = {
  brandName?: string;
  primary?: string;
  background?: string;
};

const DEFAULT_APP_NAME = "Heladería Facundo's";
const DEFAULT_THEME_COLOR = "#00c7b7";
const DEFAULT_BACKGROUND_COLOR = "#070809";

const getStoredTheme = async (): Promise<StoredTheme | null> => {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", DESIGN_KEY)
      .maybeSingle();

    if (error) return null;

    return data?.valor && typeof data.valor === "object"
      ? (data.valor as StoredTheme)
      : null;
  } catch {
    return null;
  }
};

export async function GET() {
  const theme = await getStoredTheme();
  const appName = theme?.brandName?.trim() || DEFAULT_APP_NAME;
  const iconVersion = encodeURIComponent(
    `${appName}-${theme?.primary ?? ""}-${Date.now()}`,
  );
  const manifest = {
    name: appName,
    short_name: appName.slice(0, 24),
    description: "Caja y gestión para heladería con modo offline",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: theme?.background || DEFAULT_BACKGROUND_COLOR,
    theme_color: theme?.primary || DEFAULT_THEME_COLOR,
    icons: [
      {
        src: `/api/erp/app-icon?size=192&v=${iconVersion}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: `/api/erp/app-icon?size=512&v=${iconVersion}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
      "Content-Type": "application/manifest+json; charset=utf-8",
    },
  });
}

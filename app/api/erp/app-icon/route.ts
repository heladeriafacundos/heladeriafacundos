import sharp from "sharp";

import { createAdminClient } from "@/lib/supabase/admin";

const DESIGN_KEY = "diseno";

type StoredTheme = {
  background?: string;
  brandImageUrl?: string;
  brandLogoMode?: string;
  brandName?: string;
  faviconUrl?: string;
  primary?: string;
  primaryText?: string;
};

const DEFAULT_APP_NAME = "Heladería Facundo's";
const DEFAULT_PRIMARY = "#00c7b7";
const DEFAULT_PRIMARY_TEXT = "#06242a";

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

const getIconUrl = (theme: StoredTheme | null) =>
  theme?.faviconUrl?.trim() ||
  (theme?.brandLogoMode === "image" ? theme.brandImageUrl?.trim() : "") ||
  "";

const getIconSize = (request: Request) => {
  const size = Number(new URL(request.url).searchParams.get("size") ?? 192);
  return size === 512 ? 512 : 192;
};

const isSafeIconUrl = (value: string) =>
  value.startsWith("https://") ||
  value.startsWith("/") ||
  value.startsWith("data:image/");

const parseDataImage = (value: string) => {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);(base64,)?(.+)$/);
  if (!match) return null;

  const [, contentType, isBase64, data] = match;
  const buffer = isBase64
    ? Buffer.from(data, "base64")
    : Buffer.from(decodeURIComponent(data));

  return { buffer, contentType };
};

const createFallbackSvg = (theme: StoredTheme | null, size: number) => {
  const label = (theme?.brandName?.trim() || DEFAULT_APP_NAME)
    .slice(0, 1)
    .toUpperCase();
  const primary = theme?.primary || DEFAULT_PRIMARY;
  const primaryText = theme?.primaryText || DEFAULT_PRIMARY_TEXT;

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="${primary}"/><text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(size * 0.48)}" font-weight="700" fill="${primaryText}">${label}</text></svg>`,
  );
};

const renderPngIcon = async (input: Buffer, size: number) =>
  sharp(input)
    .resize(size, size, {
      fit: "cover",
      position: "center",
    })
    .png({ compressionLevel: 9, quality: 92 })
    .toBuffer();

export async function GET(request: Request) {
  const size = getIconSize(request);
  const theme = await getStoredTheme();
  const iconUrl = getIconUrl(theme);
  let source = createFallbackSvg(theme, size);

  if (iconUrl && isSafeIconUrl(iconUrl)) {
    try {
      if (iconUrl.startsWith("data:image/")) {
        source = parseDataImage(iconUrl)?.buffer ?? source;
      } else {
        const absoluteUrl = iconUrl.startsWith("/")
          ? new URL(iconUrl, request.url).toString()
          : iconUrl;
        const response = await fetch(absoluteUrl, { cache: "no-store" });

        if (response.ok) {
          source = Buffer.from(await response.arrayBuffer());
        }
      }
    } catch {
      source = createFallbackSvg(theme, size);
    }
  }

  const icon = await renderPngIcon(source, size);

  const body = icon.buffer.slice(
    icon.byteOffset,
    icon.byteOffset + icon.byteLength,
  ) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
      "Content-Type": "image/png",
    },
  });
}

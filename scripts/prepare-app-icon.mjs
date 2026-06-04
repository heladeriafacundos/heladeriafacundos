import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const buildDir = path.join(root, "build");
const iconPath = path.join(buildDir, "icon.ico");
const DESIGN_KEY = "diseno";
const DEFAULT_APP_NAME = "Heladería Facundo's";
const DEFAULT_PRIMARY = "#00c7b7";
const DEFAULT_PRIMARY_TEXT = "#06242a";
const ICON_SIZES = [16, 24, 32, 48, 64, 128, 256];

const parseEnvFile = async () => {
  if (!existsSync(envPath)) return {};

  const env = {};
  const envContent = await fs.readFile(envPath, "utf8");

  for (const rawLine of envContent.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
};

const getStoredTheme = async () => {
  const env = await parseEnvFile();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data, error } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", DESIGN_KEY)
    .maybeSingle();

  if (error || !data?.valor || typeof data.valor !== "object") return null;

  return data.valor;
};

const getIconUrl = (theme) =>
  theme?.faviconUrl?.trim() ||
  (theme?.brandLogoMode === "image" ? theme.brandImageUrl?.trim() : "") ||
  "";

const parseDataImage = (value) => {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);(base64,)?(.+)$/);
  if (!match) return null;

  const [, , isBase64, data] = match;

  return isBase64
    ? Buffer.from(data, "base64")
    : Buffer.from(decodeURIComponent(data));
};

const createFallbackSvg = (theme) => {
  const label = (theme?.brandName?.trim() || DEFAULT_APP_NAME)
    .slice(0, 1)
    .toUpperCase();
  const primary = theme?.primary || DEFAULT_PRIMARY;
  const primaryText = theme?.primaryText || DEFAULT_PRIMARY_TEXT;

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${primary}"/><text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="246" font-weight="700" fill="${primaryText}">${label}</text></svg>`,
  );
};

const getSourceImage = async (theme) => {
  const iconUrl = getIconUrl(theme);

  if (!iconUrl) return createFallbackSvg(theme);

  try {
    if (iconUrl.startsWith("data:image/")) {
      return parseDataImage(iconUrl) ?? createFallbackSvg(theme);
    }

    if (!iconUrl.startsWith("https://")) {
      return createFallbackSvg(theme);
    }

    const response = await fetch(iconUrl, { cache: "no-store" });

    if (!response.ok) return createFallbackSvg(theme);

    return Buffer.from(await response.arrayBuffer());
  } catch {
    return createFallbackSvg(theme);
  }
};

const createIco = (images) => {
  const headerSize = 6;
  const directorySize = images.length * 16;
  let offset = headerSize + directorySize;
  const header = Buffer.alloc(headerSize);
  const directories = [];

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  for (const image of images) {
    const directory = Buffer.alloc(16);
    directory.writeUInt8(image.size === 256 ? 0 : image.size, 0);
    directory.writeUInt8(image.size === 256 ? 0 : image.size, 1);
    directory.writeUInt8(0, 2);
    directory.writeUInt8(0, 3);
    directory.writeUInt16LE(1, 4);
    directory.writeUInt16LE(32, 6);
    directory.writeUInt32LE(image.buffer.length, 8);
    directory.writeUInt32LE(offset, 12);
    directories.push(directory);
    offset += image.buffer.length;
  }

  return Buffer.concat([
    header,
    ...directories,
    ...images.map((image) => image.buffer),
  ]);
};

const theme = await getStoredTheme();
const source = await getSourceImage(theme);
const images = await Promise.all(
  ICON_SIZES.map(async (size) => ({
    size,
    buffer: await sharp(source)
      .resize(size, size, { fit: "cover", position: "center" })
      .png({ compressionLevel: 9, quality: 92 })
      .toBuffer(),
  })),
);

await fs.mkdir(buildDir, { recursive: true });
await fs.writeFile(iconPath, createIco(images));

console.log(`Icono de instalador preparado: ${path.relative(root, iconPath)}`);

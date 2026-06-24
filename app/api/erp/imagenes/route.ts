import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { requireRoles } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "erp-imagenes";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const normalizeFolder = (value: FormDataEntryValue | null) => {
  const folder = typeof value === "string" ? value : "general";
  const clean = folder
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return clean || "general";
};

const getImageProfile = (value: FormDataEntryValue | null) => {
  const type = typeof value === "string" ? value : "producto";

  if (type === "favicon") {
    return {
      contentType: "image/png",
      extension: "png",
      fit: "cover" as const,
      height: 192,
      quality: 92,
      width: 192,
    };
  }

  if (type === "logo") {
    return {
      contentType: "image/webp",
      extension: "webp",
      fit: "cover" as const,
      height: 512,
      quality: 86,
      width: 512,
    };
  }

  return {
    contentType: "image/webp",
    extension: "webp",
    fit: "inside" as const,
    height: 900,
    quality: 84,
    width: 1200,
  };
};

const ensureBucket = async (supabase: ReturnType<typeof createAdminClient>) => {
  const { error } = await supabase.storage.getBucket(BUCKET_NAME);

  if (!error) return;

  const created = await supabase.storage.createBucket(BUCKET_NAME, {
    allowedMimeTypes: ["image/webp", "image/png"],
    fileSizeLimit: MAX_FILE_SIZE,
    public: true,
  });

  if (created.error && !created.error.message.toLowerCase().includes("already")) {
    throw created.error;
  }
};

export async function POST(request: Request) {
  try {
    const permission = await requireRoles(["admin", "dueno", "empleado"]);
    if (!permission.ok) return permission.response;

    const formData = await request.formData();
    const file = formData.get("archivo");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Tenés que seleccionar una imagen" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "La imagen tiene que ser JPG, PNG, WebP o AVIF" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "La imagen no puede pesar más de 8 MB" },
        { status: 400 },
      );
    }

    const profile = getImageProfile(formData.get("tipo"));
    const folder = normalizeFolder(formData.get("carpeta"));
    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(originalBuffer).rotate().resize({
      fit: profile.fit,
      height: profile.height,
      withoutEnlargement: true,
      width: profile.width,
    });
    const optimizedBuffer =
      profile.extension === "png"
        ? await image.png({ compressionLevel: 9, quality: profile.quality }).toBuffer()
        : await image.webp({ effort: 5, quality: profile.quality }).toBuffer();
    const metadata = await sharp(optimizedBuffer).metadata();
    const supabase = createAdminClient();

    await ensureBucket(supabase);

    const path = `${folder}/${Date.now()}-${randomUUID()}.${profile.extension}`;
    const upload = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, optimizedBuffer, {
        cacheControl: "31536000",
        contentType: profile.contentType,
        upsert: true,
      });

    if (upload.error) {
      return NextResponse.json({ error: upload.error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

    return NextResponse.json({
      alto: metadata.height ?? profile.height,
      bytes: optimizedBuffer.byteLength,
      formato: profile.extension,
      ok: true,
      path,
      url: data.publicUrl,
      ancho: metadata.width ?? profile.width,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

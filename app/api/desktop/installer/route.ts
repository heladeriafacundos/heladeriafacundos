import { NextResponse } from "next/server";

import packageJson from "@/package.json";
import { getSessionUser } from "@/lib/auth/user";

const installerFileName = `Caja.Heladeria.Setup.${packageJson.version}.exe`;
const defaultInstallerBaseUrl =
  "https://github.com/testeoparaweb/testeoparaweb/releases/latest/download";
const installerBaseUrl =
  process.env.DESKTOP_INSTALLER_BASE_URL ||
  process.env.NEXT_PUBLIC_DESKTOP_INSTALLER_BASE_URL ||
  process.env.ELECTRON_UPDATE_URL ||
  process.env.NEXT_PUBLIC_ELECTRON_UPDATE_URL ||
  defaultInstallerBaseUrl;
const remoteInstallerUrl = `${installerBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(
  installerFileName,
)}`;

const attachmentHeaders = (fileSize?: number | string | null) => {
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "Content-Disposition": `attachment; filename="${installerFileName}"`,
    "Content-Type": "application/vnd.microsoft.portable-executable",
  });

  if (fileSize) {
    headers.set("Content-Length", String(fileSize));
  }

  return headers;
};

const streamRemoteInstaller = async () => {
  if (!remoteInstallerUrl) return null;

  const response = await fetch(remoteInstallerUrl, { cache: "no-store" }).catch(
    () => null,
  );

  if (!response?.ok || !response.body) {
    return null;
  }

  return new Response(response.body, {
    headers: attachmentHeaders(response.headers.get("content-length")),
  });
};

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const remoteInstaller = await streamRemoteInstaller();

  if (remoteInstaller) {
    return remoteInstaller;
  }

  return NextResponse.json(
    {
      error:
        "El instalador no esta publicado. Subi el .exe, el .blockmap y latest.yml al ultimo release de GitHub.",
    },
    { status: 404 },
  );
}

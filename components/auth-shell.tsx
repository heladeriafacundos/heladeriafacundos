"use client";

import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  Coffee,
  Flame,
  Package,
  ReceiptText,
  ShoppingCart,
  Snowflake,
  Store,
  WalletCards,
} from "lucide-react";

const THEME_STORAGE_KEY = "gestion-local.diseno";
const DEFAULT_BRAND_NAME = "Nombre del local";
const DEFAULT_BRAND_FONT =
  "'Great Vibes', 'Dancing Script', cursive";

type PublicBrandSettings = {
  brandName?: string;
  brandFontFamily?: string;
  brandLogoMode?: "icon" | "image";
  brandIcon?: string;
  brandImageUrl?: string;
  faviconUrl?: string;
  primary?: string;
  primaryText?: string;
};

const defaultBrand: Required<PublicBrandSettings> = {
  brandName: DEFAULT_BRAND_NAME,
  brandFontFamily: DEFAULT_BRAND_FONT,
  brandLogoMode: "icon",
  brandIcon: "snowflake",
  brandImageUrl: "",
  faviconUrl: "",
  primary: "#67e8f9",
  primaryText: "#06242a",
};

const iconMap = {
  coffee: Coffee,
  cart: ShoppingCart,
  flame: Flame,
  money: BadgeDollarSign,
  package: Package,
  receipt: ReceiptText,
  snowflake: Snowflake,
  store: Store,
  wallet: WalletCards,
};

const normalizeBrand = (value?: PublicBrandSettings | null) => ({
  ...defaultBrand,
  ...(value && typeof value === "object" ? value : {}),
});

const createBrandFavicon = (brand: Required<PublicBrandSettings>) => {
  const label = brand.brandName.trim().slice(0, 1).toUpperCase() || "L";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${brand.primary}"/><text x="32" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="${brand.primaryText}">${label}</text></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const applyBrowserBrand = (brand: Required<PublicBrandSettings>) => {
  document.title = brand.brandName.trim() || "Sistema de gestión";
  const faviconHref =
    brand.faviconUrl ||
    (brand.brandLogoMode === "image" ? brand.brandImageUrl : "") ||
    createBrandFavicon(brand);
  let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  favicon.href = faviconHref;
};

export function AuthShell({
  children,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const [brand, setBrand] = useState(defaultBrand);
  const [isBrandLoading, setIsBrandLoading] = useState(true);
  const Icon = iconMap[brand.brandIcon as keyof typeof iconMap] ?? Snowflake;
  const imageUrl =
    brand.brandLogoMode === "image" && brand.brandImageUrl.trim()
      ? brand.brandImageUrl.trim()
      : "";

  useEffect(() => {
    let isMounted = true;

    const applyBrand = (nextBrand: Required<PublicBrandSettings>) => {
      setBrand(nextBrand);
      applyBrowserBrand(nextBrand);
    };

    const loadBrand = async () => {
      let nextBrand = defaultBrand;

      try {
        const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (saved) {
          nextBrand = normalizeBrand(JSON.parse(saved) as PublicBrandSettings);
        }
      } catch {
        nextBrand = defaultBrand;
      }

      try {
        const response = await fetch("/api/erp/diseno", { cache: "no-store" });
        const data = response.ok
          ? ((await response.json()) as { diseno?: PublicBrandSettings } | null)
          : null;

        if (data?.diseno) {
          nextBrand = normalizeBrand(data.diseno);
        }
      } catch {
        // Si no se puede leer la base, se usa la marca guardada en este navegador.
      }

      if (isMounted) {
        applyBrand(nextBrand);
        setIsBrandLoading(false);
      }
    };

    void loadBrand();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isBrandLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#070809] text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] items-center justify-center px-4 py-8 md:px-8">
        <main className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0d0f10] px-4 py-3">
              <div
                className="flex size-10 items-center justify-center overflow-hidden rounded-lg text-zinc-950"
                style={{
                  backgroundColor: brand.primary,
                  color: brand.primaryText,
                }}
              >
                {imageUrl ? (
                  <div
                    aria-label="Logo"
                    className="size-full bg-cover bg-center"
                    role="img"
                    style={{ backgroundImage: `url("${imageUrl}")` }}
                  />
                ) : (
                  <Icon className="size-5" />
                )}
              </div>
              <p
                className="text-3xl leading-none text-zinc-100"
                style={{ fontFamily: brand.brandFontFamily }}
              >
                {brand.brandName}
              </p>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070809] text-zinc-100">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300" />
        <div className="text-center">
          <p className="font-semibold">Cargando sistema</p>
          <p className="mt-1 text-sm text-zinc-500">
            Preparando acceso
          </p>
        </div>
      </div>
    </div>
  );
}

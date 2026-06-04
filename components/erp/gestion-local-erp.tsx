"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeDollarSign,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  Coffee,
  CreditCard,
  DollarSign,
  Flame,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Minus,
  MoreHorizontal,
  Package,
  Palette,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingCart,
  Snowflake,
  Store,
  SunMedium,
  TimerReset,
  TriangleAlert,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAdminModal } from "@/components/user-admin-modal";
import {
  clearCurrentOfflineSession,
  getCurrentOfflineSession,
  getCurrentOfflineSyncToken,
  rememberOfflineSession,
} from "@/lib/auth/offline-session";
import type { SessionUser, UserRole } from "@/lib/auth/user";
import {
  countOfflineCashCloses,
  countOfflineJsonMutations,
  countOfflineSales,
  enqueueOfflineCashClose,
  enqueueOfflineJsonMutation,
  enqueueOfflineSale,
  getOfflineCashCloses,
  getOfflineJsonMutations,
  getOfflineSales,
  removeOfflineCashClose,
  removeOfflineJsonMutation,
  removeOfflineSale,
  type OfflineCashClosePayload,
  type OfflineCashCloseRecord,
  type OfflineJsonMutationRecord,
  type OfflineSalePayload,
  type OfflineSaleRecord,
} from "@/lib/offline-sales";
import { cn } from "@/lib/utils";

type DesktopUpdaterStatus =
  | "unsupported"
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "updated"
  | "error";

type DesktopUpdaterState = {
  currentVersion?: string;
  message?: string;
  previousVersion?: string;
  progress?: number;
  status: DesktopUpdaterStatus;
  updatedAt?: string;
  version?: string;
};

declare global {
  interface Window {
    cajaUpdater?: {
      check: () => Promise<DesktopUpdaterState>;
      download: () => Promise<DesktopUpdaterState>;
      getStatus: () => Promise<DesktopUpdaterState>;
      install: () => Promise<void>;
      onStatus: (callback: (status: DesktopUpdaterState) => void) => () => void;
    };
  }
}

type ViewId =
  | "cierre-caja"
  | "caja"
  | "ventas"
  | "analisis"
  | "historial"
  | "finanzas"
  | "empleados"
  | "historial-empleados"
  | "auditoria"
  | "stock"
  | "diseno";
type AttendanceEvent = "entrada" | "salida";
type ShiftName = "manana" | "tarde";
type DiscountMode = "amount" | "percent";
type ShiftFilter = "todo" | "manana" | "tarde";
type SaleChannel = "local" | "pedidos_ya";
type ChannelFilter = "todo" | SaleChannel;
type AnalysisPeriod = "dia" | "semana" | "mes" | "ano" | "total";
type HelpSection = {
  title: string;
  description: string;
  details: string[];
};
type ViewHelpContent = {
  title: string;
  summary: string;
  sections: HelpSection[];
};
type HelpGuideGroup = {
  label: string;
  items: Array<{
    help: ViewHelpContent;
    item: NavItem;
  }>;
};

type ThemeSettings = {
  background: string;
  sidebar: string;
  header: string;
  panel: string;
  panelAlt: string;
  primary: string;
  primaryText: string;
  text: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  fontFamily: string;
  brandName: string;
  brandSubtitle: string;
  brandFontFamily: string;
  brandLogoMode: "icon" | "image";
  brandIcon: string;
  brandImageUrl: string;
  faviconUrl: string;
};

type ThemeColorKey = Exclude<
  keyof ThemeSettings,
  | "fontFamily"
  | "brandName"
  | "brandSubtitle"
  | "brandFontFamily"
  | "brandLogoMode"
  | "brandIcon"
  | "brandImageUrl"
  | "faviconUrl"
>;
type ThemeColorPreset = {
  id: string;
  name: string;
  description: string;
  colors: Pick<ThemeSettings, ThemeColorKey>;
  typography: ThemeTypographyPreset;
};
type ThemeTypographyPreset = Pick<ThemeSettings, "fontFamily" | "brandFontFamily">;
type ThemeColorPresetDraft = Omit<ThemeColorPreset, "typography">;
type ApplyThemePresetOptions = {
  includeTypography: boolean;
};

type DeleteConfirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<boolean>;
};

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl: string;
  maxFlavors: number;
  flavorUsage: number;
};

type ProductForm = Product;

type IceCreamFlavor = {
  id: string;
  name: string;
  category: string;
  available: boolean;
  color: string;
  stock: number;
  minStock: number;
  unit: string;
};

type FlavorForm = IceCreamFlavor;
type QuickStockTarget =
  | { item: Product; type: "product" }
  | { item: IceCreamFlavor; type: "flavor" };

type CartLine = {
  lineId: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  unit: string;
  imageUrl: string;
  flavors: string[];
  flavorUsage: number;
};

type Sale = {
  id: string;
  customer: string;
  channel: SaleChannel;
  items: number;
  method: string;
  time: string;
  total: number;
  subtotal: number;
  discount: number;
  createdAt: string;
};

type SaleItem = {
  id: string;
  saleId: string;
  productId: string | null;
  product: string;
  quantity: number;
  price: number;
  cost: number;
  total: number;
  flavors: string[];
  createdAt: string;
};

type Expense = {
  key: string;
  label: string;
  category: string;
  amount: number;
};

type ExpenseHistory = {
  id: string;
  startsAt: string;
  total: number;
  expenses: Expense[];
};

type CommissionMethod = {
  name: string;
  rate: number;
};

type CommissionHistory = {
  id: string;
  startsAt: string;
  channels: Record<SaleChannel, number>;
  methods: CommissionMethod[];
};

type FlavorBatch = {
  id: string;
  flavorId: string;
  flavorName: string;
  kilos: number;
  portionsLoaded: number;
  systemStockAtClose: number | null;
  suggestedYield: number | null;
  status: "activa" | "cerrada";
  createdAt: string;
  closedAt: string | null;
};

type AnalysisRankingDetail = "flavors" | "products" | "margin";

type MonthlyFlavorSummary = {
  activeBatches: number;
  batches: number;
  closedBatches: number;
  firstLoadedAt: string;
  flavor: string;
  id: string;
  kilos: number;
  lastLoadedAt: string;
};

type MonthlyFlavorRow = {
  end: Date;
  flavors: MonthlyFlavorSummary[];
  key: string;
  label: string;
  month: number;
  start: Date;
  topFlavor: MonthlyFlavorSummary | null;
  totalBatches: number;
  uniqueFlavors: number;
  year: number;
};

type MonthlyProductSummary = {
  cost: number;
  margin: number;
  marginRate: number;
  product: string;
  quantity: number;
  revenue: number;
};

type MonthlyProductRow = {
  end: Date;
  key: string;
  label: string;
  month: number;
  products: MonthlyProductSummary[];
  salesCount: number;
  start: Date;
  topProduct: MonthlyProductSummary | null;
  totalProducts: number;
  totalRevenue: number;
  totalUnits: number;
  year: number;
};

type StaffMember = {
  id?: string;
  name: string;
  role: string;
  shift: string;
  area: string;
  status: "Activo" | "Pausa" | "Ausente" | "Franco";
  pin?: string;
};

type StaffForm = StaffMember;

type Attendance = {
  id: string;
  staffId?: string | null;
  employeeName: string;
  eventType: AttendanceEvent;
  shift: ShiftName;
  recordedAt: string;
};

type AttendanceForm = {
  id?: string;
  staffId?: string | null;
  employeeName: string;
  eventType: AttendanceEvent;
  shift: ShiftName;
  recordedAt: string;
};

type AttendanceStatus = {
  key: string;
  staffId?: string | null;
  employeeName: string;
  shift: ShiftName;
  isWorking: boolean;
  startedAt: string | null;
  lastRecordedAt: string | null;
  workedMinutes: number;
  alert: "none" | "soon" | "over";
};

type CashCloseRow = {
  id: string;
  fecha_operativa: string;
  turno: ShiftName;
  total_sistema: NumericValue;
  efectivo_sistema: NumericValue;
  efectivo_contado: NumericValue;
  diferencia: NumericValue;
  ventas: number;
  observacion: string | null;
  creado: string;
};

type NavItem = {
  id: ViewId;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
};

type NumericValue = number | string | null;

type ProductRow = {
  id: string;
  nombre: string;
  categoria: string;
  precio: NumericValue;
  costo?: NumericValue;
  stock: NumericValue;
  stock_minimo: NumericValue;
  unidad: string;
  imagen: string | null;
  max_gustos: number | null;
  consumo_gustos?: NumericValue;
};

type FlavorRow = {
  id: string;
  nombre: string;
  categoria?: string | null;
  disponible: boolean | null;
  color: string | null;
  stock?: NumericValue;
  stock_minimo?: NumericValue;
  unidad?: string | null;
};

type PaymentMethodRow = {
  nombre: string;
  comision?: NumericValue;
};

type SaleRow = {
  id: string;
  cliente: string | null;
  canal?: string | null;
  productos: number | null;
  metodo: string | null;
  hora: string | null;
  total: NumericValue;
  subtotal: NumericValue;
  descuento: NumericValue;
  creado: string | null;
};

type SaleItemRow = {
  id: string;
  venta_id: string;
  producto_id?: string | null;
  producto: string;
  cantidad: NumericValue;
  precio?: NumericValue;
  costo?: NumericValue;
  total?: NumericValue;
  gustos: string[] | null;
  creado: string | null;
};

type ExpenseRow = {
  clave: string;
  nombre: string;
  categoria: string;
  monto: NumericValue;
};

type ExpenseHistoryRow = {
  id: string;
  fecha_desde: string;
  total: NumericValue;
  gastos: Array<{
    clave?: string;
    nombre?: string;
    categoria?: string;
    monto?: NumericValue;
  }> | null;
};

type CommissionHistoryRow = {
  id: string;
  fecha_desde: string;
  canales: Record<string, NumericValue> | null;
  metodos: Array<{
    comision?: NumericValue;
    nombre?: string;
  }> | null;
};

type FlavorBatchRow = {
  id: string;
  gusto_id: string;
  gusto: string;
  kilos: NumericValue;
  porciones_cargadas: NumericValue;
  stock_sistema_al_cerrar: NumericValue;
  rendimiento_sugerido: NumericValue;
  estado: "activa" | "cerrada";
  creado: string;
  cerrado: string | null;
};

type StaffRow = {
  id: string;
  nombre: string;
  rol: string;
  turno: string;
  sector: string;
  estado: string;
  pin_codigo?: string | null;
};

type AuditLogRow = {
  id: string;
  entidad: string;
  entidad_id: string | null;
  accion: string;
  detalle: Record<string, unknown> | null;
  usuario_nombre: string | null;
  creado: string;
};

type AuditLog = {
  id: string;
  entity: string;
  entityId: string | null;
  action: string;
  detail: Record<string, unknown>;
  userName: string | null;
  createdAt: string;
};

type AttendanceRow = {
  id: string;
  empleado_id: string | null;
  empleado: string;
  tipo: string;
  turno: string;
  creado: string;
};

type ErpDataResponse = {
  productos: ProductRow[];
  gustos: FlavorRow[];
  metodos_pago: PaymentMethodRow[];
  ventas: SaleRow[];
  items_venta: SaleItemRow[];
  gastos: ExpenseRow[];
  gastos_historial: ExpenseHistoryRow[];
  comisiones_historial?: CommissionHistoryRow[];
  tandas_gustos: FlavorBatchRow[];
  empleados: StaffRow[];
  asistencias: AttendanceRow[];
  auditoria: AuditLogRow[];
  comisiones_canales?: Record<string, number> | null;
  diseno?: Partial<ThemeSettings> | null;
};

type OfflineUiSnapshot = {
  attendance: Attendance[];
  auditLogs: AuditLog[];
  channelCommissions: Record<SaleChannel, number>;
  commissionHistory: CommissionHistory[];
  expenseHistory: ExpenseHistory[];
  expenses: Expense[];
  flavorBatches: FlavorBatch[];
  iceCreamFlavors: IceCreamFlavor[];
  paymentMethod: string;
  paymentMethodCommissions: Record<string, number>;
  paymentMethods: string[];
  products: Product[];
  saleItems: SaleItem[];
  sales: Sale[];
  staff: StaffMember[];
  themeSettings: ThemeSettings;
  updatedAt: string;
};

const DEFAULT_BRANCH_ID = "00000000-0000-0000-0000-000000000001";
const PAGE_SIZE = 6;
const SHIFT_DAY_START_HOUR = 6;
const SHIFT_CHANGE_HOUR = 16;
const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires";
const ARGENTINA_OFFSET = "-03:00";
const THEME_STORAGE_KEY = "gestion-local.diseno";
const OFFLINE_DATA_STORAGE_KEY_PREFIX = "gestion-local.ultimo-dato";
const OFFLINE_UI_SNAPSHOT_KEY_PREFIX = "gestion-local.estado-local";
const OFFLINE_SESSION_HEADER = "x-erp-offline-session";
const getOfflineDataStorageKey = (user: SessionUser) =>
  `${OFFLINE_DATA_STORAGE_KEY_PREFIX}.${user.id}.${user.role}`;
const getOfflineUiSnapshotKey = (user: SessionUser) =>
  `${OFFLINE_UI_SNAPSHOT_KEY_PREFIX}.${user.id}.${user.role}`;
const getOfflineAuthHeaders = (): Record<string, string> => {
  const token = getCurrentOfflineSyncToken();
  return token ? { [OFFLINE_SESSION_HEADER]: token } : {};
};
const getJsonAuthHeaders = () => ({
  "Content-Type": "application/json",
  ...getOfflineAuthHeaders(),
});
const DEFAULT_FONT_FAMILY =
  "var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const BRAND_FONT_FAMILY = "'Great Vibes', 'Dancing Script', cursive";
const FONT_INTER = "'Inter', var(--font-geist-sans), system-ui, sans-serif";
const FONT_DM_SANS = "'DM Sans', Arial, sans-serif";
const FONT_MANROPE = "'Manrope', Arial, sans-serif";
const FONT_MONTSERRAT = "'Montserrat', Arial, sans-serif";
const FONT_POPPINS = "'Poppins', Arial, sans-serif";
const FONT_NUNITO = "'Nunito', Arial, sans-serif";
const FONT_RALEWAY = "'Raleway', Arial, sans-serif";
const FONT_RUBIK = "'Rubik', Arial, sans-serif";
const FONT_LEXEND = "'Lexend', Arial, sans-serif";
const FONT_QUICKSAND = "'Quicksand', Arial, sans-serif";
const FONT_OSWALD = "'Oswald', Arial, sans-serif";
const FONT_BEBAS_NEUE = "'Bebas Neue', Arial, sans-serif";
const FONT_LATO = "'Lato', Arial, sans-serif";
const FONT_LORA = "'Lora', Georgia, serif";
const FONT_PLAYFAIR = "'Playfair Display', Georgia, serif";
const FONT_CORMORANT = "'Cormorant Garamond', Georgia, serif";
const FONT_MERRIWEATHER = "'Merriweather', Georgia, serif";
const FONT_COURGETTE = "'Courgette', cursive";
const FONT_CAVEAT = "'Caveat', cursive";
const FONT_PACIFICO = "'Pacifico', cursive";
const FONT_LOBSTER = "'Lobster', cursive";
const FONT_SATISFY = "'Satisfy', cursive";
const FONT_TREBUCHET = "'Trebuchet MS', Arial, sans-serif";
const DEFAULT_BRAND_NAME = "Nombre del local";
const DEFAULT_BRAND_SUBTITLE = "Gestión del local";

const navItems: NavItem[] = [
  { id: "caja", label: "Caja", icon: ShoppingCart },
  { id: "cierre-caja", label: "Cierre de caja", mobileLabel: "Cierre", icon: DollarSign },
  { id: "stock", label: "Stock", icon: Package },
  { id: "ventas", label: "Ventas", icon: ReceiptText },
  { id: "historial", label: "Ventas por período", mobileLabel: "Hist. ventas", icon: CalendarClock },
  { id: "analisis", label: "Análisis ventas", mobileLabel: "Análisis", icon: BarChart3 },
  { id: "finanzas", label: "Gastos y comisiones", mobileLabel: "Gastos", icon: WalletCards },
  { id: "empleados", label: "Empleados", icon: Users },
  { id: "historial-empleados", label: "Historial empleados", mobileLabel: "Hist. empleados", icon: CalendarClock },
  { id: "auditoria", label: "Auditoría", icon: ReceiptText },
  { id: "diseno", label: "Diseño", icon: Palette },
];

const navGroups: Array<{ label: string; items: ViewId[] }> = [
  { label: "Operación", items: ["caja", "cierre-caja", "stock"] },
  { label: "Ventas", items: ["ventas", "historial", "analisis", "finanzas"] },
  { label: "Equipo", items: ["empleados", "historial-empleados"] },
  { label: "Sistema", items: ["auditoria", "diseno"] },
];

const allowedViewsByRole: Record<UserRole, ViewId[]> = {
  admin: ["caja", "cierre-caja", "stock", "ventas", "historial", "analisis", "finanzas", "empleados", "historial-empleados", "auditoria", "diseno"],
  dueno: ["caja", "stock", "ventas", "historial", "analisis", "finanzas", "empleados", "historial-empleados", "auditoria"],
  empleado: ["caja", "cierre-caja", "stock", "ventas", "empleados"],
};

const saleChannelOptions: Array<{ id: SaleChannel; label: string }> = [
  { id: "local", label: "Local" },
  { id: "pedidos_ya", label: "Pedidos Ya" },
];

const channelFilterOptions: Array<{ id: ChannelFilter; label: string }> = [
  { id: "todo", label: "Todo" },
  ...saleChannelOptions,
];
const analysisPeriodOptions: Array<{ id: AnalysisPeriod; label: string }> = [
  { id: "dia", label: "Día" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "ano", label: "Año" },
  { id: "total", label: "Total" },
];

const defaultExpenseItems: Expense[] = [
  { key: "sueldos", label: "Sueldos empleados", category: "Personal", amount: 0 },
  { key: "alquiler", label: "Alquiler", category: "Local", amount: 0 },
  { key: "luz", label: "Luz", category: "Servicios", amount: 0 },
  { key: "agua", label: "Agua", category: "Servicios", amount: 0 },
  { key: "gas", label: "Gas", category: "Servicios", amount: 0 },
  { key: "internet", label: "Internet", category: "Servicios", amount: 0 },
  { key: "otros", label: "Otros gastos", category: "General", amount: 0 },
];

const defaultPaymentMethods = [
  "Efectivo",
  "Tarjeta",
  "Mercado Pago",
  "Transferencia",
];

const defaultPaymentMethodCommissions: Record<string, number> = {
  Efectivo: 0,
  Tarjeta: 3,
  "Mercado Pago": 6,
  Transferencia: 0,
};

const defaultChannelCommissions: Record<SaleChannel, number> = {
  local: 0,
  pedidos_ya: 30,
};

const defaultFlavorCategories = ["Crema", "Chocolate", "Frutal", "Al agua", "Especial"];

const employeeRoleOptions = [
  "Encargado/a",
  "Cajero/a",
  "Atención",
  "Producción",
  "Barista",
  "Repartidor/a",
  "Limpieza",
];

const employeeShiftOptions = ["Mañana", "Tarde", "Completo"];

const shiftFilterOptions: Array<{ id: ShiftFilter; label: string }> = [
  { id: "todo", label: "Todo" },
  { id: "manana", label: "Mañana" },
  { id: "tarde", label: "Tarde" },
];

const defaultThemeSettings: ThemeSettings = {
  background: "#070809",
  sidebar: "#0d0f10",
  header: "#090b0d",
  panel: "#0f1213",
  panelAlt: "#111417",
  primary: "#67e8f9",
  primaryText: "#06242a",
  text: "#f4f4f5",
  muted: "#a1a1aa",
  border: "#263033",
  success: "#34d399",
  warning: "#facc15",
  danger: "#fb7185",
  fontFamily: DEFAULT_FONT_FAMILY,
  brandName: DEFAULT_BRAND_NAME,
  brandSubtitle: DEFAULT_BRAND_SUBTITLE,
  brandFontFamily: BRAND_FONT_FAMILY,
  brandLogoMode: "icon",
  brandIcon: "snowflake",
  brandImageUrl: "",
  faviconUrl: "",
};

const themeFields: Array<{
  key: ThemeColorKey;
  label: string;
  description: string;
}> = [
  { key: "background", label: "Fondo", description: "Color general de la página" },
  { key: "sidebar", label: "Menú", description: "Barra lateral de navegación" },
  { key: "header", label: "Encabezado", description: "Barra superior fija" },
  { key: "panel", label: "Paneles", description: "Tarjetas y bloques principales" },
  { key: "panelAlt", label: "Panel secundario", description: "Fondos internos y estados suaves" },
  { key: "primary", label: "Principal", description: "Botones activos y selección" },
  { key: "primaryText", label: "Texto principal", description: "Texto sobre el color principal" },
  { key: "text", label: "Texto", description: "Texto claro de la interfaz" },
  { key: "muted", label: "Texto suave", description: "Subtítulos y descripciones" },
  { key: "border", label: "Bordes", description: "Líneas y contornos" },
  { key: "success", label: "Correcto", description: "Estados positivos" },
  { key: "warning", label: "Alerta", description: "Avisos y bajo stock" },
  { key: "danger", label: "Peligro", description: "Eliminar o errores" },
];

const defaultPresetTypography: ThemeTypographyPreset = {
  fontFamily: DEFAULT_FONT_FAMILY,
  brandFontFamily: BRAND_FONT_FAMILY,
};

const presetTypographyById: Record<string, ThemeTypographyPreset> = {
  original: defaultPresetTypography,
  "glaciar-premium": {
    fontFamily: FONT_MANROPE,
    brandFontFamily: FONT_PLAYFAIR,
  },
  "pistacho-nocturno": {
    fontFamily: FONT_QUICKSAND,
    brandFontFamily: FONT_CAVEAT,
  },
  "frutilla-dark": {
    fontFamily: FONT_POPPINS,
    brandFontFamily: FONT_PACIFICO,
  },
  "cafe-tostado": {
    fontFamily: FONT_LORA,
    brandFontFamily: FONT_COURGETTE,
  },
  "menta-boutique": {
    fontFamily: FONT_DM_SANS,
    brandFontFamily: FONT_CORMORANT,
  },
  "dulce-de-leche": {
    fontFamily: FONT_NUNITO,
    brandFontFamily: BRAND_FONT_FAMILY,
  },
  "mora-neon": {
    fontFamily: FONT_RUBIK,
    brandFontFamily: FONT_BEBAS_NEUE,
  },
  "vainilla-clean": {
    fontFamily: FONT_INTER,
    brandFontFamily: FONT_PLAYFAIR,
  },
  "limon-fresco": {
    fontFamily: FONT_QUICKSAND,
    brandFontFamily: FONT_CAVEAT,
  },
  "mar-profundo": {
    fontFamily: FONT_LEXEND,
    brandFontFamily: FONT_OSWALD,
  },
  "chocolate-premium": {
    fontFamily: FONT_MERRIWEATHER,
    brandFontFamily: FONT_CORMORANT,
  },
  "cereza-vintage": {
    fontFamily: FONT_LATO,
    brandFontFamily: FONT_PLAYFAIR,
  },
  "nube-minimal": {
    fontFamily: FONT_MANROPE,
    brandFontFamily: FONT_INTER,
  },
  "carbon-menta": {
    fontFamily: FONT_DM_SANS,
    brandFontFamily: FONT_TREBUCHET,
  },
  "sandia-pop": {
    fontFamily: FONT_NUNITO,
    brandFontFamily: FONT_PACIFICO,
  },
  "lavanda-soft": {
    fontFamily: FONT_RALEWAY,
    brandFontFamily: FONT_CORMORANT,
  },
  "azul-local": {
    fontFamily: FONT_MONTSERRAT,
    brandFontFamily: FONT_PLAYFAIR,
  },
  "grafito-rojo": {
    fontFamily: FONT_OSWALD,
    brandFontFamily: FONT_BEBAS_NEUE,
  },
  "crema-clasica": {
    fontFamily: FONT_TREBUCHET,
    brandFontFamily: FONT_LORA,
  },
  "facundos-artesanal": {
    fontFamily: FONT_MONTSERRAT,
    brandFontFamily: FONT_LOBSTER,
  },
  "facundos-letrero": {
    fontFamily: FONT_RALEWAY,
    brandFontFamily: FONT_SATISFY,
  },
  "facundos-crema-turquesa": {
    fontFamily: FONT_QUICKSAND,
    brandFontFamily: FONT_LOBSTER,
  },
};

const themeColorPresets = ([
  {
    id: "original",
    name: "Original claro",
    description: "Oscuro limpio con celeste moderno.",
    colors: {
      background: "#070809",
      sidebar: "#0d0f10",
      header: "#090b0d",
      panel: "#0f1213",
      panelAlt: "#111417",
      primary: "#67e8f9",
      primaryText: "#06242a",
      text: "#f4f4f5",
      muted: "#a1a1aa",
      border: "#263033",
      success: "#34d399",
      warning: "#facc15",
      danger: "#fb7185",
    },
  },
  {
    id: "glaciar-premium",
    name: "Glaciar premium",
    description: "Azul hielo, blanco suave y contraste elegante.",
    colors: {
      background: "#05080d",
      sidebar: "#08111a",
      header: "#06101a",
      panel: "#0b1520",
      panelAlt: "#102233",
      primary: "#7dd3fc",
      primaryText: "#031923",
      text: "#f8fafc",
      muted: "#9fb6c8",
      border: "#203446",
      success: "#5eead4",
      warning: "#fde68a",
      danger: "#fda4af",
    },
  },
  {
    id: "pistacho-nocturno",
    name: "Pistacho nocturno",
    description: "Verde pistacho con fondo profundo.",
    colors: {
      background: "#070a07",
      sidebar: "#0d130d",
      header: "#0a100a",
      panel: "#111711",
      panelAlt: "#182118",
      primary: "#bef264",
      primaryText: "#172407",
      text: "#f7fee7",
      muted: "#a8b89a",
      border: "#293623",
      success: "#86efac",
      warning: "#facc15",
      danger: "#fb7185",
    },
  },
  {
    id: "frutilla-dark",
    name: "Frutilla dark",
    description: "Rosa frutilla con paneles sobrios.",
    colors: {
      background: "#0c070a",
      sidebar: "#130b10",
      header: "#11080d",
      panel: "#171015",
      panelAlt: "#21141c",
      primary: "#f472b6",
      primaryText: "#2b071b",
      text: "#fff7fb",
      muted: "#c4a6b6",
      border: "#3a2230",
      success: "#6ee7b7",
      warning: "#fde047",
      danger: "#fb7185",
    },
  },
  {
    id: "cafe-tostado",
    name: "Café tostado",
    description: "Cálido, moderno y prolijo.",
    colors: {
      background: "#090706",
      sidebar: "#100c09",
      header: "#0d0907",
      panel: "#15100c",
      panelAlt: "#21170f",
      primary: "#f59e0b",
      primaryText: "#281500",
      text: "#fff7ed",
      muted: "#c7aa8c",
      border: "#3a2a1c",
      success: "#84cc16",
      warning: "#facc15",
      danger: "#fb7185",
    },
  },
  {
    id: "menta-boutique",
    name: "Menta boutique",
    description: "Menta fresca con detalles finos.",
    colors: {
      background: "#06100e",
      sidebar: "#091713",
      header: "#071310",
      panel: "#0d1d19",
      panelAlt: "#122823",
      primary: "#5eead4",
      primaryText: "#042420",
      text: "#ecfffb",
      muted: "#92b8b1",
      border: "#24443d",
      success: "#34d399",
      warning: "#fcd34d",
      danger: "#fb7185",
    },
  },
  {
    id: "dulce-de-leche",
    name: "Dulce de leche",
    description: "Dorado suave, rico y comercial.",
    colors: {
      background: "#0b0805",
      sidebar: "#130f09",
      header: "#110c07",
      panel: "#18130d",
      panelAlt: "#23190f",
      primary: "#d6a354",
      primaryText: "#261804",
      text: "#fff9ef",
      muted: "#bda88b",
      border: "#3b2b1b",
      success: "#86efac",
      warning: "#fde047",
      danger: "#f87171",
    },
  },
  {
    id: "mora-neon",
    name: "Mora neón",
    description: "Violeta y cian para un estilo más llamativo.",
    colors: {
      background: "#070611",
      sidebar: "#0d0a18",
      header: "#0a0814",
      panel: "#120f1f",
      panelAlt: "#1a1430",
      primary: "#a78bfa",
      primaryText: "#180b38",
      text: "#f7f3ff",
      muted: "#aaa0c2",
      border: "#30264b",
      success: "#5eead4",
      warning: "#fde047",
      danger: "#fb7185",
    },
  },
  {
    id: "vainilla-clean",
    name: "Vainilla clean",
    description: "Claro, limpio y fácil de leer.",
    colors: {
      background: "#f8fafc",
      sidebar: "#eef2f7",
      header: "#ffffff",
      panel: "#ffffff",
      panelAlt: "#edf2f7",
      primary: "#2563eb",
      primaryText: "#ffffff",
      text: "#111827",
      muted: "#64748b",
      border: "#d7dee8",
      success: "#059669",
      warning: "#d97706",
      danger: "#dc2626",
    },
  },
  {
    id: "limon-fresco",
    name: "Limón fresco",
    description: "Verde lima, alegre y bien comercial.",
    colors: {
      background: "#f7fee7",
      sidebar: "#ecfccb",
      header: "#faffed",
      panel: "#ffffff",
      panelAlt: "#eaf7c8",
      primary: "#65a30d",
      primaryText: "#ffffff",
      text: "#1f2a12",
      muted: "#617044",
      border: "#c9dea2",
      success: "#16a34a",
      warning: "#ca8a04",
      danger: "#e11d48",
    },
  },
  {
    id: "mar-profundo",
    name: "Mar profundo",
    description: "Azul marino con acento turquesa.",
    colors: {
      background: "#03151f",
      sidebar: "#062031",
      header: "#041b29",
      panel: "#082437",
      panelAlt: "#0d3148",
      primary: "#22d3ee",
      primaryText: "#06212b",
      text: "#ecfeff",
      muted: "#91b7c4",
      border: "#1b465d",
      success: "#34d399",
      warning: "#fbbf24",
      danger: "#fb7185",
    },
  },
  {
    id: "chocolate-premium",
    name: "Chocolate premium",
    description: "Oscuro, elegante y cálido.",
    colors: {
      background: "#0b0706",
      sidebar: "#140d0b",
      header: "#100a08",
      panel: "#1a110e",
      panelAlt: "#261711",
      primary: "#c08457",
      primaryText: "#231207",
      text: "#fff7ed",
      muted: "#c6a99a",
      border: "#3b261d",
      success: "#86efac",
      warning: "#fbbf24",
      danger: "#f87171",
    },
  },
  {
    id: "cereza-vintage",
    name: "Cereza vintage",
    description: "Bordó, crema y presencia clásica.",
    colors: {
      background: "#120609",
      sidebar: "#1c0a0f",
      header: "#17070b",
      panel: "#231015",
      panelAlt: "#31171d",
      primary: "#fb7185",
      primaryText: "#3a0710",
      text: "#fff1f2",
      muted: "#d1a6ad",
      border: "#4b222b",
      success: "#86efac",
      warning: "#fde047",
      danger: "#f43f5e",
    },
  },
  {
    id: "nube-minimal",
    name: "Nube minimal",
    description: "Blanco suave con acentos oscuros.",
    colors: {
      background: "#f4f7fb",
      sidebar: "#e8edf5",
      header: "#fbfdff",
      panel: "#ffffff",
      panelAlt: "#edf1f7",
      primary: "#111827",
      primaryText: "#ffffff",
      text: "#172033",
      muted: "#667085",
      border: "#d7dfea",
      success: "#047857",
      warning: "#b45309",
      danger: "#be123c",
    },
  },
  {
    id: "carbon-menta",
    name: "Carbón menta",
    description: "Grafito profundo con menta brillante.",
    colors: {
      background: "#050707",
      sidebar: "#0b1110",
      header: "#080d0c",
      panel: "#101716",
      panelAlt: "#16211f",
      primary: "#6ee7b7",
      primaryText: "#052018",
      text: "#f0fdf9",
      muted: "#9ab8af",
      border: "#273b36",
      success: "#34d399",
      warning: "#facc15",
      danger: "#fb7185",
    },
  },
  {
    id: "sandia-pop",
    name: "Sandía pop",
    description: "Rosa coral y verde para un local con onda.",
    colors: {
      background: "#fff7f7",
      sidebar: "#ffe7ea",
      header: "#ffffff",
      panel: "#ffffff",
      panelAlt: "#ffeef1",
      primary: "#f43f5e",
      primaryText: "#ffffff",
      text: "#321015",
      muted: "#87636a",
      border: "#f7cbd3",
      success: "#16a34a",
      warning: "#d97706",
      danger: "#be123c",
    },
  },
  {
    id: "lavanda-soft",
    name: "Lavanda soft",
    description: "Lavanda clara, delicada y moderna.",
    colors: {
      background: "#faf7ff",
      sidebar: "#f1e9ff",
      header: "#ffffff",
      panel: "#ffffff",
      panelAlt: "#f2eaff",
      primary: "#7c3aed",
      primaryText: "#ffffff",
      text: "#24143f",
      muted: "#74658c",
      border: "#ddd0f4",
      success: "#059669",
      warning: "#b45309",
      danger: "#e11d48",
    },
  },
  {
    id: "azul-local",
    name: "Azul local",
    description: "Profesional, prolijo y muy legible.",
    colors: {
      background: "#eff6ff",
      sidebar: "#dbeafe",
      header: "#ffffff",
      panel: "#ffffff",
      panelAlt: "#e2efff",
      primary: "#1d4ed8",
      primaryText: "#ffffff",
      text: "#10213f",
      muted: "#5d7191",
      border: "#bfd3ef",
      success: "#047857",
      warning: "#b45309",
      danger: "#dc2626",
    },
  },
  {
    id: "grafito-rojo",
    name: "Grafito rojo",
    description: "Serio, fuerte y con acento rojo.",
    colors: {
      background: "#08090b",
      sidebar: "#111217",
      header: "#0d0e12",
      panel: "#15161c",
      panelAlt: "#1f2129",
      primary: "#ef4444",
      primaryText: "#ffffff",
      text: "#f4f4f5",
      muted: "#a1a1aa",
      border: "#30323b",
      success: "#22c55e",
      warning: "#f59e0b",
      danger: "#fb7185",
    },
  },
  {
    id: "crema-clasica",
    name: "Crema clásica",
    description: "Clara, cremosa y tranquila.",
    colors: {
      background: "#fffaf0",
      sidebar: "#f8ecd8",
      header: "#fffdf7",
      panel: "#ffffff",
      panelAlt: "#f6ead6",
      primary: "#b45309",
      primaryText: "#ffffff",
      text: "#302013",
      muted: "#7f6754",
      border: "#e6d3bc",
      success: "#15803d",
      warning: "#ca8a04",
      danger: "#dc2626",
    },
  },
  {
    id: "facundos-artesanal",
    name: "Facundo's artesanal",
    description: "Madera cálida, crema y turquesa de marca.",
    colors: {
      background: "#170b04",
      sidebar: "#231107",
      header: "#1c0d05",
      panel: "#2d170b",
      panelAlt: "#3a1f10",
      primary: "#12c7c9",
      primaryText: "#031d1e",
      text: "#f7f0e8",
      muted: "#b9a492",
      border: "#5a341d",
      success: "#6ee7b7",
      warning: "#d6a354",
      danger: "#fb7185",
    },
  },
  {
    id: "facundos-letrero",
    name: "Facundo's letrero",
    description: "Crema, madera clara y turquesa tipo cartel.",
    colors: {
      background: "#2b1408",
      sidebar: "#3a1d0d",
      header: "#32170a",
      panel: "#4a2816",
      panelAlt: "#5c341e",
      primary: "#21c9c5",
      primaryText: "#062322",
      text: "#fff8f0",
      muted: "#d5bdab",
      border: "#765034",
      success: "#8fd8a8",
      warning: "#e0b35f",
      danger: "#ff8a9a",
    },
  },
  {
    id: "facundos-crema-turquesa",
    name: "Facundo's crema",
    description: "Blanco crema y turquesa, madera solo en detalles.",
    colors: {
      background: "#f8f3ed",
      sidebar: "#ffffff",
      header: "#fffdf9",
      panel: "#ffffff",
      panelAlt: "#edfafa",
      primary: "#04bfc3",
      primaryText: "#042224",
      text: "#23170f",
      muted: "#7c6b60",
      border: "#d5b89f",
      success: "#22a06b",
      warning: "#b87934",
      danger: "#d94f6a",
    },
  },
] satisfies ThemeColorPresetDraft[]).map((preset) => ({
  ...preset,
  typography: presetTypographyById[preset.id] ?? defaultPresetTypography,
})) satisfies ThemeColorPreset[];

const presetSwatchKeys: ThemeColorKey[] = [
  "background",
  "panel",
  "primary",
  "success",
  "warning",
  "danger",
];

const fontOptions = [
  {
    label: "Moderna",
    value:
      "var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    label: "Inter",
    value: "'Inter', var(--font-geist-sans), system-ui, sans-serif",
  },
  {
    label: "Roboto",
    value: "'Roboto', Arial, sans-serif",
  },
  {
    label: "Open Sans",
    value: "'Open Sans', Arial, sans-serif",
  },
  {
    label: "Lato",
    value: "'Lato', Arial, sans-serif",
  },
  {
    label: "Montserrat",
    value: "'Montserrat', Arial, sans-serif",
  },
  {
    label: "Poppins",
    value: "'Poppins', Arial, sans-serif",
  },
  {
    label: "Nunito",
    value: "'Nunito', Arial, sans-serif",
  },
  {
    label: "Raleway",
    value: "'Raleway', Arial, sans-serif",
  },
  {
    label: "DM Sans",
    value: "'DM Sans', Arial, sans-serif",
  },
  {
    label: "Manrope",
    value: "'Manrope', Arial, sans-serif",
  },
  {
    label: "Work Sans",
    value: "'Work Sans', Arial, sans-serif",
  },
  {
    label: "Source Sans 3",
    value: "'Source Sans 3', Arial, sans-serif",
  },
  {
    label: "Fira Sans",
    value: "'Fira Sans', Arial, sans-serif",
  },
  {
    label: "Mulish",
    value: "'Mulish', Arial, sans-serif",
  },
  {
    label: "Rubik",
    value: "'Rubik', Arial, sans-serif",
  },
  {
    label: "Lexend",
    value: "'Lexend', Arial, sans-serif",
  },
  {
    label: "Quicksand",
    value: "'Quicksand', Arial, sans-serif",
  },
  {
    label: "Oswald",
    value: "'Oswald', Arial, sans-serif",
  },
  {
    label: "Bebas Neue",
    value: "'Bebas Neue', Arial, sans-serif",
  },
  {
    label: "Anton",
    value: "'Anton', Arial, sans-serif",
  },
  {
    label: "Roboto Slab",
    value: "'Roboto Slab', Georgia, serif",
  },
  {
    label: "Merriweather",
    value: "'Merriweather', Georgia, serif",
  },
  {
    label: "Lora",
    value: "'Lora', Georgia, serif",
  },
  {
    label: "Playfair Display",
    value: "'Playfair Display', Georgia, serif",
  },
  {
    label: "Cormorant Garamond",
    value: "'Cormorant Garamond', Georgia, serif",
  },
  {
    label: "Cinzel",
    value: "'Cinzel', Georgia, serif",
  },
  {
    label: "Abril Fatface",
    value: "'Abril Fatface', Georgia, serif",
  },
  {
    label: "Café manuscrita",
    value: "'Dancing Script', cursive",
  },
  {
    label: "Pacifico",
    value: "'Pacifico', cursive",
  },
  {
    label: "Lobster",
    value: "'Lobster', cursive",
  },
  {
    label: "Satisfy",
    value: "'Satisfy', cursive",
  },
  {
    label: "Courgette",
    value: "'Courgette', cursive",
  },
  {
    label: "Caveat",
    value: "'Caveat', cursive",
  },
  {
    label: "Patrick Hand",
    value: "'Patrick Hand', cursive",
  },
  {
    label: "Kalam",
    value: "'Kalam', cursive",
  },
  {
    label: "Indie Flower",
    value: "'Indie Flower', cursive",
  },
  {
    label: "Architects Daughter",
    value: "'Architects Daughter', cursive",
  },
  {
    label: "Menú vintage",
    value: "'Fredericka the Great', 'Rye', serif",
  },
  {
    label: "Rye",
    value: "'Rye', Georgia, serif",
  },
  {
    label: "Special Elite",
    value: "'Special Elite', monospace",
  },
  {
    label: "Permanent Marker",
    value: "'Permanent Marker', cursive",
  },
  {
    label: "Amatic SC",
    value: "'Amatic SC', cursive",
  },
  {
    label: "Sistema",
    value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    label: "Arial",
    value: "Arial, Helvetica, sans-serif",
  },
  {
    label: "Verdana",
    value: "Verdana, Geneva, sans-serif",
  },
  {
    label: "Tahoma",
    value: "Tahoma, Geneva, sans-serif",
  },
  {
    label: "Georgia",
    value: "Georgia, 'Times New Roman', serif",
  },
  {
    label: "Trebuchet",
    value: "'Trebuchet MS', Arial, sans-serif",
  },
  {
    label: "Monoespaciada",
    value: "'Courier New', Courier, monospace",
  },
];

const brandIconOptions: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: "snowflake", label: "Helado", icon: Snowflake },
  { id: "coffee", label: "Café", icon: Coffee },
  { id: "store", label: "Local", icon: Store },
  { id: "package", label: "Producto", icon: Package },
  { id: "cart", label: "Caja", icon: ShoppingCart },
  { id: "flame", label: "Caliente", icon: Flame },
  { id: "money", label: "Venta", icon: BadgeDollarSign },
  { id: "receipt", label: "Recibo", icon: ReceiptText },
  { id: "wallet", label: "Ganancia", icon: WalletCards },
];

const getBrandIconOption = (iconId: string) =>
  brandIconOptions.find((option) => option.id === iconId) ?? brandIconOptions[0];

const getBrandLogoUrl = (theme: ThemeSettings) =>
  theme.brandLogoMode === "image" && theme.brandImageUrl.trim()
    ? theme.brandImageUrl.trim()
    : "";

const isThemeColorPresetActive = (
  theme: ThemeSettings,
  preset: ThemeColorPreset,
) =>
  themeFields.every(
    ({ key }) => theme[key].toLowerCase() === preset.colors[key].toLowerCase(),
  );

const helpContentByView: Record<
  ViewId,
  ViewHelpContent
> = {
  "cierre-caja": {
    title: "Ayuda de cierre de caja",
    summary: "Para que el empleado cargue el cierre del turno.",
    sections: [
      {
        title: "Cierre",
        description:
          "Carga el efectivo contado al terminar el turno.",
        details: [
          "El turno se detecta por horario.",
          "El empleado carga el efectivo contado y una nota si hace falta.",
          "El sistema guarda el último cierre cargado y lo sincroniza cuando hay internet.",
        ],
      },
    ],
  },
  caja: {
    title: "Ayuda de caja",
    summary: "Para tomar pedidos rápido y cobrar sin perder ventas ni stock.",
    sections: [
      {
        title: "Categorías",
        description:
          "Primero elegí una categoría y después un producto. Así el empleado encuentra todo más rápido.",
        details: [
          "Cuando entrás a Caja, primero ves las categorías grandes para no mezclar todo el catálogo.",
          "Si tocás una categoría, entrás a esa vista y aparecen solo los productos de esa categoría.",
          "Con Volver regresás al inicio, y el buscador filtra dentro de la categoría abierta.",
        ],
      },
      {
        title: "Gustos",
        description:
          "Los gustos se controlan desde Stock con baldes y reposiciones.",
        details: [
          "Caja cobra el producto de helado sin pedir sabores.",
          "Cuando se carga un balde, queda guardado el gusto, la cantidad y la fecha.",
          "Análisis usa esas recargas para detectar qué gustos se consumen más.",
        ],
      },
      {
        title: "Pedido",
        description:
          "A la derecha se arma el pedido antes de cobrar.",
        details: [
          "Podés sumar, restar, borrar líneas, aplicar descuento, elegir método de pago y marcar si entra por Local o Pedidos Ya.",
          "Cuando tocás Cobrar pedido, se guarda la venta y se descuenta stock.",
          "Después aparece en análisis, historial de ventas y stock.",
        ],
      },
      {
        title: "Empleado de caja",
        description:
          "Al entrar en caja se elige quién está usando la compu.",
        details: [
          "La caja queda asociada al empleado elegido para saber quién atendía.",
          "Si no tenía entrada abierta, se marca automáticamente.",
          "Salir de caja permite cerrar solo la sesión o marcar también que terminó el turno.",
        ],
      },
      {
        title: "Bajo stock",
        description:
          "El botón de bajo stock muestra rápido productos o gustos para reponer.",
        details: [
          "Esta vista es informativa para trabajar más rápido.",
          "La reposición real se hace desde Stock.",
          "Podés ver faltantes de productos o de gustos de helado.",
        ],
      },
    ],
  },
  ventas: {
    title: "Ayuda de historial de ventas",
    summary: "Para revisar ventas recientes sin cargar de más la pantalla.",
    sections: [
      {
        title: "Lista",
        description:
          "Muestra las ventas de la más reciente a la más antigua, de a 10.",
        details: [
          "Cada tarjeta muestra fecha, hora, cliente, método de pago y total.",
          "El empleado puede ver esta sección para consultar ventas cobradas.",
          "La lista muestra lo necesario sin llenar la pantalla de datos técnicos.",
        ],
      },
      {
        title: "Detalle",
        description:
          "Al tocar una venta, se despliega toda la información.",
        details: [
          "Ves subtotal, descuento, total final y productos vendidos.",
          "Las ventas nuevas de helado muestran el producto cobrado sin pedir sabores.",
          "Sirve para revisar un pedido sin entrar a la base de datos.",
        ],
      },
    ],
  },
  analisis: {
    title: "Ayuda de análisis",
    summary: "Para ver ventas, costos, rankings y ganancia real del mes.",
    sections: [
      {
        title: "Resumen",
        description:
          "Muestra total vendido, productos vendidos, costo vendido, gastos y ganancia real.",
        details: [
          "Ventas brutas muestra todo lo cobrado sin restar nada.",
          "Costo vendido usa el costo de cada producto que realmente se vendió.",
          "Ganancia real resta costo vendido y gastos fijos.",
        ],
      },
      {
        title: "Turnos",
        description:
          "Podés filtrar por todo, mañana o tarde.",
        details: [
          "Mañana toma ventas antes de las 16:00.",
          "Tarde toma ventas desde las 16:00.",
          "Los gastos se estiman proporcionalmente cuando mirás un turno.",
        ],
      },
      {
        title: "Rankings",
        description:
          "Muestra gustos y productos más vendidos.",
        details: [
          "Sirve para saber qué conviene producir más.",
          "También ayuda a ver qué productos conviene destacar.",
          "Los datos salen de ventas reales guardadas.",
        ],
      },
    ],
  },
  historial: {
    title: "Ayuda de historial",
    summary: "Para comparar cómo viene el negocio por día, semana, mes o año.",
    sections: [
      {
        title: "Períodos",
        description:
          "Usá Diario, Semanal, Mensual y Anual para cambiar la tabla.",
        details: [
          "Cada botón cambia solo la información visible.",
          "Diario muestra la última semana.",
          "Semanal, mensual y anual sirven para comparar períodos más grandes.",
        ],
      },
      {
        title: "Neto",
        description:
          "El valor neto descuenta costo vendido y gastos fijos del período.",
        details: [
          "No es solo ventas menos gastos.",
          "También resta el costo de lo que realmente se vendió.",
          "Sirve para leer margen real, no solo caja bruta.",
        ],
      },
      {
        title: "Productos",
        description:
          "La última columna muestra cuántas unidades se vendieron.",
        details: [
          "Ayuda a entender si el ingreso vino por volumen o por tickets más altos.",
          "Comparar productos vendidos con neto sirve para medir volumen contra margen.",
          "También detecta días con mucho movimiento aunque no hayan dejado tanto importe.",
        ],
      },
    ],
  },
  finanzas: {
    title: "Ayuda de gastos y comisiones",
    summary: "Para configurar gastos fijos, comisiones e historial de correcciones.",
    sections: [
      {
        title: "Gastos fijos",
        description:
          "Acá editás sueldos, luz, agua, gas, alquiler y otros gastos.",
        details: [
          "Estos gastos se cargan como importes mensuales.",
          "El sistema los reparte en los análisis según el período elegido.",
          "Cuando guardás un cambio, aplica hacia adelante y conserva historial.",
        ],
      },
      {
        title: "Comisiones",
        description:
          "Configura porcentajes por método de pago y canal de venta.",
        details: [
          "Cada método de pago puede tener una comisión propia.",
          "Local y Pedidos Ya también pueden tener porcentajes separados.",
          "Las comisiones se descuentan en Análisis ventas y Ventas por período.",
        ],
      },
      {
        title: "Correcciones",
        description:
          "El historial permite revisar y corregir configuraciones anteriores.",
        details: [
          "Podés ver correcciones guardadas de gastos y comisiones.",
          "Modificar un registro histórico ayuda a mantener coherentes períodos anteriores.",
          "Sirve cuando cambió una tarifa o se cargó mal un importe.",
        ],
      },
    ],
  },
  empleados: {
    title: "Ayuda de empleados",
    summary: "Para ver rápido quién está trabajando y marcar entradas o salidas.",
    sections: [
      {
        title: "Equipo activo",
        description:
          "Esta vista muestra quién está en jornada, quién está en caja y quién necesita salida.",
        details: [
          "Las tarjetas muestran solo lo importante del momento.",
          "Si alguien usa la caja, queda marcado.",
          "Los filtros ayudan a ver jornada, avisos o todo el equipo.",
        ],
      },
      {
        title: "Entrada y salida",
        description:
          "Los botones registran cuándo cada empleado entra o sale.",
        details: [
          "Entrada guarda el comienzo de la jornada.",
          "Salida marca cuando termina o se retira.",
          "Cada registro queda con fecha completa y turno.",
        ],
      },
      {
        title: "Avisos",
        description:
          "La pantalla avisa cuando alguien está por cumplir 8 horas o ya se pasó.",
        details: [
          "Sirve para que el encargado lo vea rápido.",
          "Funciona aunque se superpongan empleados de mañana y tarde.",
          "Los errores se corrigen desde Historial empleados.",
        ],
      },
    ],
  },
  "historial-empleados": {
    title: "Ayuda de historial de empleados",
    summary: "Para administrar empleados y corregir fichajes.",
    sections: [
      {
        title: "Personal",
        description:
          "Acá se crean empleados nuevos y se editan los existentes.",
        details: [
          "Agregar empleado carga nombre, rol, turno, sector y estado.",
          "Editar sirve para corregir datos del personal.",
          "Esta vista queda para dueño y admin.",
        ],
      },
      {
        title: "Fichajes",
        description:
          "Acá ves y corregís entradas y salidas.",
        details: [
          "Podés agregar fichajes manuales si alguien se olvidó.",
          "También podés editar registros ya cargados.",
          "La vista operativa de Empleados queda más simple.",
        ],
      },
    ],
  },
  stock: {
    title: "Ayuda de stock",
    summary: "Para controlar productos, gustos y alertas de reposición.",
    sections: [
      {
        title: "Productos",
        description:
          "Acá editás nombre, precio, costo, stock, mínimo, unidad, imagen y gustos.",
        details: [
          "Cada producto alimenta caja, stock y ganancia real.",
          "El mínimo dispara alertas de reposición.",
          "Si es helado, Caja lo cobra directo y los gustos se controlan por baldes.",
        ],
      },
      {
        title: "Gustos",
        description:
          "Acá controlás stock de sabores, categoría, color, baldes y reposición.",
        details: [
          "Los gustos se organizan por nombre, categoría, color y baldes.",
          "Cuando ponés un balde nuevo, lo cargás para guardar la fecha de reposición.",
          "Cuando el balde físico se termina, lo marcás vacío desde la tarjeta del gusto.",
        ],
      },
      {
        title: "Alertas",
        description:
          "Los filtros de bajo stock muestran rápido qué productos hay que reponer.",
        details: [
          "Los productos siguen usando stock mínimo.",
          "Los gustos se controlan manualmente cargando y cerrando baldes.",
          "Conviene revisarlo antes de los horarios fuertes.",
        ],
      },
      {
        title: "Costo",
        description:
          "El costo de cada producto se usa para calcular ganancia real.",
        details: [
          "Si el costo está mal, la ganancia real queda mal.",
          "El sistema usa el costo solo cuando el producto se vende.",
          "Revisalo cuando cambien insumos o recetas.",
        ],
      },
    ],
  },
  diseno: {
    title: "Ayuda de diseño",
    summary: "Para cambiar los colores principales de la página.",
    sections: [
      {
        title: "Colores",
        description:
          "Elegí los colores y la tipografía que querés usar en la página.",
        details: [
          "Los cambios se aplican en el momento para que puedas probarlos.",
          "Guardar diseño deja esos cambios persistidos.",
          "Restablecer vuelve al diseño oscuro original.",
        ],
      },
    ],
  },
  auditoria: {
    title: "Ayuda de auditoría",
    summary: "Para revisar cambios importantes hechos en el sistema.",
    sections: [
      {
        title: "Cambios",
        description:
          "Muestra ediciones de productos, stock, gastos, comisiones, empleados y cierres.",
        details: [
          "Cada registro guarda acción, usuario y fecha.",
          "Sirve para saber quién cambió algo y cuándo.",
          "Es una trazabilidad rápida de la operación.",
        ],
      },
    ],
  },
};

const detailedHelpContentByView: Record<ViewId, ViewHelpContent> = {
  ...helpContentByView,
  caja: {
    title: "Caja",
    summary: "Pantalla principal para tomar pedidos, elegir productos, aplicar descuentos y cobrar.",
    sections: [
      {
        title: "Categorías",
        description:
          "Organizan el catálogo para que el empleado encuentre rápido lo que vende.",
        details: [
          "Al entrar se muestran las categorías disponibles, por ejemplo helado, café, bebidas o promos.",
          "Al tocar una categoría aparecen solo los productos de esa categoría.",
          "El botón Volver regresa a la lista de categorías.",
          "El buscador permite encontrar productos por nombre dentro del catálogo.",
          "Las categorías y productos se crean o modifican desde Stock.",
        ],
      },
      {
        title: "Productos y gustos",
        description:
          "Caja cobra productos; mostrador sirve los gustos después.",
        details: [
          "Al tocar un helado, se agrega al pedido sin abrir selector de sabores.",
          "La venta guarda el producto cobrado, el método de pago y el canal.",
          "Los sabores se controlan aparte desde Stock, cargando y cerrando baldes.",
        ],
      },
      {
        title: "Pedido",
        description:
          "Es el resumen de todo lo que se va a cobrar antes de finalizar la venta.",
        details: [
          "Podés sumar o restar cantidad, borrar líneas y cancelar el pedido completo.",
          "El subtotal suma todos los productos antes de descuentos.",
          "El descuento se aplica antes del total final.",
          "Antes de cobrar, elegí método de pago y canal de venta.",
          "El total a cobrar es lo que finalmente paga el cliente.",
        ],
      },
      {
        title: "Cobro y stock",
        description:
          "Al cobrar, la venta queda guardada y afecta otras partes del sistema.",
        details: [
          "Cobrar pedido guarda la venta con fecha, hora, cliente, canal y método de pago.",
          "El stock del producto baja según la cantidad vendida.",
          "El stock de gustos no baja desde Caja; se controla por baldes en Stock.",
          "La venta aparece en Ventas, Ventas por período y Análisis ventas.",
          "Si no hay internet, la venta queda pendiente y se sincroniza cuando vuelva la conexión.",
        ],
      },
    ],
  },
  "cierre-caja": {
    title: "Cierre de caja",
    summary: "Pantalla para cerrar el turno comparando el efectivo real con lo vendido en el sistema.",
    sections: [
      {
        title: "Para qué sirve",
        description:
          "Registra cuánto efectivo quedó en la caja al final del turno.",
        details: [
          "El sistema detecta el turno según el horario: mañana antes de las 16:00 y tarde desde las 16:00.",
          "Muestra ventas del turno y efectivo que el sistema espera encontrar.",
          "El empleado cuenta la plata física, carga el importe y puede dejar una observación.",
          "La diferencia indica si sobró o faltó efectivo contra lo vendido.",
        ],
      },
      {
        title: "Cómo usarlo",
        description:
          "Se usa al terminar el turno o cuando cambia el responsable de caja.",
        details: [
          "Primero revisá que todas las ventas del turno estén cargadas en Caja.",
          "Contá solo el efectivo que corresponde al turno.",
          "Escribí el efectivo contado en el campo correspondiente.",
          "Si hubo una situación especial, agregá una nota clara: vuelto prestado, retiro, error o diferencia explicada.",
          "Guardá el cierre para dejar constancia del total del sistema, efectivo esperado, efectivo contado y diferencia.",
        ],
      },
      {
        title: "Sin internet",
        description:
          "El cierre puede quedar pendiente si la conexión falla.",
        details: [
          "Cuando no hay internet, el sistema guarda el cierre localmente.",
          "El indicador Online o Sin internet muestra si hay operaciones pendientes.",
          "Cuando vuelve la conexión, el sistema intenta enviar los cierres pendientes.",
        ],
      },
      {
        title: "Si no coincide",
        description:
          "Una diferencia no siempre significa pérdida; puede venir de una venta mal cargada.",
        details: [
          "Revisá Ventas para confirmar los cobros del turno.",
          "Confirmá que las ventas en efectivo estén cargadas con método Efectivo.",
          "Si se cobró por transferencia, tarjeta o Pedidos Ya, no debería sumarse al efectivo físico.",
          "Usá la observación para explicar cualquier diferencia antes de cerrar.",
        ],
      },
    ],
  },
  stock: {
    title: "Stock",
    summary: "Administración de productos, gustos, precios, costos, imágenes y alertas de reposición.",
    sections: [
      {
        title: "Productos",
        description:
          "Son los artículos que se venden desde Caja.",
        details: [
          "Podés agregar productos nuevos y modificar productos existentes.",
          "Cada producto puede tener nombre, categoría, precio, costo, stock, mínimo, unidad e imagen.",
          "El precio define cuánto se cobra en Caja.",
          "El costo se usa para calcular ganancia real.",
          "El stock baja cuando se cobra una venta.",
          "El mínimo dispara alertas para saber qué hay que reponer.",
        ],
      },
      {
        title: "Productos con gustos",
        description:
          "Los productos de helado se cobran directo desde Caja.",
        details: [
          "Caja ya no pide sabores al vender un helado.",
          "El control de sabores vive en Gustos y Tandas o baldes.",
          "El ranking de gustos sale de las recargas guardadas por fecha.",
        ],
      },
      {
        title: "Gustos",
        description:
          "Son sabores o variantes que se controlan por baldes.",
        details: [
          "Podés agregar o modificar nombre, categoría y color.",
          "El color ayuda a reconocer sabores visualmente.",
          "Cuando cargás un balde, queda registrada la fecha de reposición.",
          "Cuando el balde físico se termina, lo marcás vacío.",
        ],
      },
      {
        title: "Tandas o baldes",
        description:
          "Sirven para guardar cuándo se carga y cuándo se vacía cada balde.",
        details: [
          "Una tanda representa una carga de producción o un balde de un gusto.",
          "Se usa cuando entra un balde nuevo o se prepara una tanda nueva.",
          "Para cargarla, elegís el gusto, indicás los kilos del balde y guardás.",
          "Cerrar una tanda sirve para marcar que ese balde ya se terminó.",
          "Este control ayuda a ver qué sabores se reponen más seguido.",
          "No reemplaza a la venta: las ventas se cargan en Caja; las tandas solo ordenan la producción y el stock de sabores.",
        ],
      },
      {
        title: "Alertas",
        description:
          "Ayudan a revisar rápido qué productos necesitan reposición.",
        details: [
          "Las alertas muestran productos por debajo del mínimo.",
          "Conviene revisar bajo stock antes de horarios fuertes.",
          "Los gustos se revisan desde su tarjeta: balde en uso o sin balde.",
          "Si precio, costo o stock de producto están mal, Caja y Análisis ventas también van a mostrar datos incorrectos.",
        ],
      },
    ],
  },
  ventas: {
    title: "Ventas",
    summary: "Listado de ventas cobradas, ordenadas de la más reciente a la más antigua.",
    sections: [
      {
        title: "Lista",
        description:
          "Permite revisar qué se vendió sin entrar a reportes grandes.",
        details: [
          "Cada venta muestra fecha, hora, cliente, canal, método de pago, cantidad de productos y total.",
          "Las ventas se ordenan de la más nueva a la más vieja.",
          "La pantalla pagina las ventas para que no se vuelva pesada.",
          "Sirve para confirmar si un pedido se cobró correctamente.",
        ],
      },
      {
        title: "Filtros y detalle",
        description:
          "Ayuda a encontrar una venta puntual y revisar su composición.",
        details: [
          "Podés filtrar por turno y por canal cuando esos controles estén visibles.",
          "Al tocar una venta, se despliega el detalle completo.",
          "El detalle muestra subtotal, descuento, total final y productos vendidos.",
          "Las ventas nuevas de helado muestran el producto cobrado sin detalle de gustos.",
          "Esta pantalla es de consulta: para cargar una venta nueva se usa Caja.",
        ],
      },
      {
        title: "Cuándo usarla",
        description:
          "Es útil para resolver dudas del momento.",
        details: [
          "Usala si un cliente pregunta si ya se cobró algo.",
          "Usala si el cierre de caja no coincide y necesitás revisar ventas del turno.",
          "Usala para confirmar método de pago o canal de una venta reciente.",
        ],
      },
    ],
  },
  historial: {
    title: "Ventas por período",
    summary: "Tabla comparativa para ver ventas y ganancia por día, semana, mes, año o total.",
    sections: [
      {
        title: "Períodos",
        description:
          "Cambia la forma en que se agrupan las ventas.",
        details: [
          "Diario muestra los últimos días.",
          "Semanal agrupa las ventas por semanas.",
          "Mensual agrupa por mes.",
          "Anual agrupa por año.",
          "Total resume todo lo cargado en el sistema.",
          "Cada botón cambia solo la información visible; no modifica ventas.",
        ],
      },
      {
        title: "Columnas",
        description:
          "La tabla muestra importes y volumen para comparar mejor.",
        details: [
          "Bruto muestra ventas cobradas antes de restar costos.",
          "Neto estima lo que queda después de costo vendido, gastos y comisiones.",
          "Productos indica cuántas unidades se vendieron.",
          "Comparar bruto y neto ayuda a ver si se vendió mucho pero con poco margen.",
        ],
      },
      {
        title: "Filtros",
        description:
          "Permiten comparar turnos y canales.",
        details: [
          "Turno mañana y turno tarde ayudan a ver qué horario rinde más.",
          "Canal local y Pedidos Ya ayudan a separar ventas presenciales de delivery.",
          "Los filtros sirven para analizar sin borrar ni modificar datos.",
        ],
      },
    ],
  },
  analisis: {
    title: "Análisis ventas",
    summary: "Reporte para entender qué se vende, cuánto deja y cómo se comportan los períodos.",
    sections: [
      {
        title: "Resumen",
        description:
          "Muestra ventas, productos, costos, gastos, comisiones y ganancia para el período elegido.",
        details: [
          "Ventas brutas es todo lo cobrado antes de restar costos.",
          "Productos vendidos cuenta unidades vendidas.",
          "Costo vendido usa el costo configurado en Stock de cada producto vendido.",
          "Comisiones descuenta porcentajes por método de pago y canal.",
          "Ganancia real resta costo vendido, gastos y comisiones.",
        ],
      },
      {
        title: "Filtros",
        description:
          "Permiten mirar el negocio desde distintos ángulos.",
        details: [
          "El período puede ser día, semana, mes, año o total.",
          "El turno puede ser todo, mañana o tarde.",
          "Mañana toma ventas antes de las 16:00 y tarde desde las 16:00.",
          "El canal separa Local y Pedidos Ya si corresponde.",
          "Cuando filtrás una parte del período, los gastos se asignan proporcionalmente.",
        ],
      },
      {
        title: "Rankings y ventas",
        description:
          "Ayudan a detectar productos fuertes y gustos más pedidos.",
        details: [
          "El ranking de productos muestra qué artículos salen más.",
          "El ranking de gustos muestra los sabores con más recargas de baldes.",
          "La lista de ventas del análisis permite revisar operaciones dentro del período filtrado.",
          "Sirve para decidir producción, compras, promociones y cambios de menú.",
        ],
      },
      {
        title: "Histórico y gastos",
        description:
          "Compara resultados y explica el impacto de gastos.",
        details: [
          "El histórico permite comparar períodos anteriores.",
          "La lectura de gastos ayuda a entender por qué la ganancia baja aunque las ventas suban.",
          "Para modificar gastos o comisiones, entrá a Gastos y comisiones.",
        ],
      },
    ],
  },
  finanzas: {
    title: "Gastos y comisiones",
    summary: "Pantalla para configurar gastos fijos, comisiones e historial de correcciones.",
    sections: [
      {
        title: "Gastos fijos",
        description:
          "Desde acá se agregan o modifican gastos que afectan los análisis.",
        details: [
          "Podés editar importes de gastos fijos existentes.",
          "Cuando guardás cambios, el sistema conserva historial para no romper períodos anteriores.",
          "Si se corrige un gasto histórico, el sistema puede recalcular según el historial guardado.",
          "Conviene mantener gastos actualizados para que Análisis ventas y Ventas por período sean confiables.",
        ],
      },
      {
        title: "Comisiones",
        description:
          "Configura descuentos por método de pago y canal de venta.",
        details: [
          "Cada método de pago puede tener porcentaje de comisión.",
          "Los canales como Local o Pedidos Ya también pueden tener comisión propia.",
          "Las comisiones se restan de la ganancia, no del total vendido.",
          "El historial permite que ventas viejas mantengan la comisión que correspondía en ese momento.",
        ],
      },
      {
        title: "Correcciones guardadas",
        description:
          "Muestra los cambios históricos de gastos y comisiones.",
        details: [
          "Sirve para revisar cuándo se guardó una configuración.",
          "También permite corregir registros anteriores si hubo un error.",
          "Así los cálculos de ventas históricas quedan consistentes.",
        ],
      },
    ],
  },
  empleados: {
    title: "Empleados",
    summary: "Vista operativa para ver quién está trabajando y registrar entradas o salidas.",
    sections: [
      {
        title: "Estado del equipo",
        description:
          "Muestra empleados activos, jornadas abiertas y avisos importantes.",
        details: [
          "Las tarjetas indican quién está en jornada.",
          "Si alguien está usando la caja, queda marcado como empleado de caja.",
          "Los filtros permiten ver todo el equipo, solo jornadas activas o avisos.",
          "Sirve para el uso diario sin cargar de información administrativa la pantalla.",
        ],
      },
      {
        title: "Entrada y salida",
        description:
          "Registra el horario real de trabajo.",
        details: [
          "Entrada marca el comienzo de la jornada del empleado.",
          "Salida marca el fin de la jornada.",
          "Cada fichaje guarda empleado, tipo de evento, turno y fecha completa.",
          "Si alguien se olvida de fichar, se puede corregir desde Historial empleados.",
        ],
      },
      {
        title: "Avisos de jornada",
        description:
          "Ayudan a controlar horarios sin revisar empleado por empleado.",
        details: [
          "El sistema avisa cuando una jornada está cerca de cumplir 8 horas.",
          "También avisa si una jornada se pasó y todavía no tiene salida.",
          "Estos avisos ayudan a evitar olvidos al cerrar turnos.",
        ],
      },
    ],
  },
  "historial-empleados": {
    title: "Historial empleados",
    summary: "Administración del personal y corrección de fichajes.",
    sections: [
      {
        title: "Agregar o modificar empleados",
        description:
          "Acá se mantiene la información del personal.",
        details: [
          "Agregar empleado permite cargar nombre, rol, turno, sector, estado y datos necesarios.",
          "Editar empleado sirve para cambiar nombre, turno, sector, estado o datos cargados.",
          "El estado permite ordenar si alguien está activo, ausente, en pausa o de franco.",
          "Los cambios afectan cómo aparece el empleado en Caja y Empleados.",
        ],
      },
      {
        title: "Fichajes",
        description:
          "Permite revisar y corregir entradas o salidas.",
        details: [
          "Podés agregar un fichaje manual si alguien olvidó marcar entrada o salida.",
          "Podés editar un registro existente si se cargó mal la hora o el tipo.",
          "Las correcciones ayudan a que Empleados muestre bien las jornadas abiertas.",
          "También dejan ordenado el historial para controles internos.",
        ],
      },
      {
        title: "Cuándo usarlo",
        description:
          "Es una vista más administrativa que operativa.",
        details: [
          "Usala para altas, cambios de datos y correcciones.",
          "Para marcar el día a día, conviene usar Empleados.",
          "Para cambiar quién está en caja, usá la sesión de Caja o Salir de caja.",
        ],
      },
    ],
  },
  auditoria: {
    title: "Auditoría",
    summary: "Registro de cambios importantes para saber qué se modificó, cuándo y por quién.",
    sections: [
      {
        title: "Qué registra",
        description:
          "Guarda trazabilidad de acciones sensibles del sistema.",
        details: [
          "Puede registrar cambios en productos, stock, gastos, comisiones, empleados y cierres.",
          "Cada registro muestra acción, usuario, fecha y detalle del cambio.",
          "Sirve para revisar modificaciones sin entrar a la base de datos.",
        ],
      },
      {
        title: "Cómo leerlo",
        description:
          "La lista muestra eventos recientes con información resumida.",
        details: [
          "Buscá por fecha aproximada o por tipo de cambio.",
          "El detalle muestra los campos más importantes modificados.",
          "Si algo en Gastos y comisiones o Stock no coincide, Auditoría ayuda a detectar el último cambio.",
        ],
      },
      {
        title: "Qué no se modifica acá",
        description:
          "Auditoría es solo de consulta.",
        details: [
          "No se editan ventas, productos ni empleados desde esta pantalla.",
          "Para corregir datos hay que ir a la sección correspondiente.",
          "La idea es mantener un historial confiable de lo que pasó.",
        ],
      },
    ],
  },
  diseno: {
    title: "Diseño",
    summary: "Personalización visual del sistema: nombre, logo, icono, colores y tipografías.",
    sections: [
      {
        title: "Identidad",
        description:
          "Permite adaptar el sistema al local.",
        details: [
          "Podés cambiar el nombre que aparece en el encabezado y el menú.",
          "Podés usar un logo cargado como imagen o un icono del sistema.",
          "Podés cambiar el icono de pestaña o de la aplicación.",
          "La tipografía del nombre define cómo se ve la marca dentro del sistema.",
        ],
      },
      {
        title: "Colores y presets",
        description:
          "Cambia el aspecto general sin tocar código.",
        details: [
          "Los presets aplican combinaciones de colores listas.",
          "También podés editar colores individuales del fondo, paneles, menú, texto y botones.",
          "Los cambios se previsualizan en pantalla para probar antes de guardar.",
          "Guardar diseño deja los cambios persistidos.",
          "Restablecer vuelve a la configuración base.",
        ],
      },
      {
        title: "Imágenes",
        description:
          "El sistema optimiza imágenes cargadas para marca y productos.",
        details: [
          "Elegir imagen permite subir logo o icono.",
          "La imagen queda guardada y se usa en el sistema.",
          "Si la imagen no se ve bien, conviene subir una versión cuadrada y nítida.",
        ],
      },
    ],
  },
};
const argentinaDateTimePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ARGENTINA_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const argentinaWeekdayFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: ARGENTINA_TIMEZONE,
  weekday: "long",
});

const capitalizeLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const getArgentinaDateParts = (value: Date | string | number) => {
  const date = value instanceof Date ? value : new Date(value);
  const parts = argentinaDateTimePartsFormatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    year: Number(getPart("year")),
    month: Number(getPart("month")),
    day: Number(getPart("day")),
    hour: Number(getPart("hour")),
    minute: Number(getPart("minute")),
    second: Number(getPart("second")),
  };
};

const createArgentinaDate = ({
  day,
  hour = 0,
  millisecond = 0,
  minute = 0,
  month,
  second = 0,
  year,
}: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}) =>
  new Date(
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}.${String(millisecond).padStart(3, "0")}${ARGENTINA_OFFSET}`,
  );

const parseArgentinaDateTimeInput = (value: string) => {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) {
    return new Date(value);
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  return createArgentinaDate({
    year,
    month,
    day,
    hour: hour || 0,
    minute: minute || 0,
  });
};

const addArgentinaDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const getArgentinaWeekdayLabel = (value: Date | string | number) =>
  capitalizeLabel(argentinaWeekdayFormatter.format(value instanceof Date ? value : new Date(value)));

const getArgentinaYear = (value: Date | string | number) =>
  getArgentinaDateParts(value).year;

const getDaysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0, 12, 0, 0)).getUTCDate();

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

const formatSignedCurrency = (value: number) =>
  value > 0 ? `+${formatCurrency(value)}` : formatCurrency(value);

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(value)}%`;

const formatFullDateTime = (value: string) =>
  new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));

const formatDateTimeInputValue = (value: string) => {
  const parts = getArgentinaDateParts(value);
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
};

const formatWorkedDuration = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;

  if (hours && remainder) {
    return `${hours} h ${remainder} min`;
  }

  if (hours) {
    return `${hours} h`;
  }

  return `${remainder} min`;
};

const getCurrentTime = () => {
  const now = getArgentinaDateParts(new Date());
  const hour = String(now.hour).padStart(2, "0");
  const minute = String(now.minute).padStart(2, "0");
  const second = String(now.second).padStart(2, "0");
  return `${hour}:${minute}:${second}`;
};

const createLocalUuid = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  const randomHex = (length: number) =>
    Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  return `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-8${randomHex(3)}-${randomHex(12)}`;
};

const toNumber = (value: NumericValue) => Number(value ?? 0);

const isColorValue = (value: unknown): value is string =>
  typeof value === "string" &&
  (/^#[0-9a-f]{6}$/i.test(value.trim()) ||
    /^rgba?\(/i.test(value.trim()));

const isFontFamilyValue = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= 180 &&
  !/[;{}<>]/.test(value);

const isSafeTextValue = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= 80 &&
  !/[<>]/.test(value);

const isSafeOptionalUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return (
    trimmed.length === 0 ||
    ((trimmed.startsWith("https://") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("/") ||
      trimmed.startsWith("data:image/")) &&
      trimmed.length <= 600)
  );
};

const getFontOptionLabel = (fontFamily: string) =>
  fontOptions.find((option) => option.value === fontFamily)?.label ?? "Personalizada";

const createBrandFavicon = (theme: ThemeSettings) => {
  const label = (theme.brandName.trim() || DEFAULT_BRAND_NAME).slice(0, 1).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${theme.primary}"/><text x="32" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="${theme.primaryText}">${label}</text></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const getFaviconType = (href: string) => {
  const normalized = href.toLowerCase().split(/[?#]/)[0];

  if (normalized.startsWith("data:image/svg+xml") || normalized.endsWith(".svg")) {
    return "image/svg+xml";
  }
  if (normalized.startsWith("data:image/png") || normalized.endsWith(".png")) {
    return "image/png";
  }
  if (
    normalized.startsWith("data:image/jpeg") ||
    normalized.endsWith(".jpg") ||
    normalized.endsWith(".jpeg")
  ) {
    return "image/jpeg";
  }
  if (normalized.startsWith("data:image/webp") || normalized.endsWith(".webp")) {
    return "image/webp";
  }
  if (normalized.endsWith(".ico")) {
    return "image/x-icon";
  }

  return "";
};

const applyBrowserBrandSettings = (theme: ThemeSettings) => {
  if (typeof document === "undefined") return;

  const brandName = theme.brandName.trim() || DEFAULT_BRAND_NAME;
  document.title = brandName;

  const faviconHref =
    theme.faviconUrl.trim() ||
    (theme.brandLogoMode === "image" ? theme.brandImageUrl.trim() : "") ||
    createBrandFavicon(theme);
  const faviconType = getFaviconType(faviconHref);
  const oldFavicons = document.querySelectorAll<HTMLLinkElement>(
    'link[rel~="icon"], link[rel="apple-touch-icon"]',
  );

  oldFavicons.forEach((favicon) => favicon.remove());

  [
    { rel: "icon", sizes: "192x192" },
    { rel: "shortcut icon", sizes: "" },
    { rel: "apple-touch-icon", sizes: "180x180" },
  ].forEach(({ rel, sizes }) => {
    const favicon = document.createElement("link");
    favicon.rel = rel;
    favicon.href = faviconHref;
    if (faviconType) {
      favicon.type = faviconType;
    }
    if (sizes) {
      favicon.setAttribute("sizes", sizes);
    }
    document.head.appendChild(favicon);
  });

  const manifestVersion = encodeURIComponent(
    `${brandName}-${faviconHref}-${theme.primary}`,
  );
  let manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');

  if (!manifest) {
    manifest = document.createElement("link");
    manifest.rel = "manifest";
    document.head.appendChild(manifest);
  }

  manifest.href = `/api/erp/manifest.webmanifest?v=${manifestVersion}`;
};

const normalizeThemeSettings = (
  value?: Partial<ThemeSettings> | null,
): ThemeSettings => {
  const normalized = { ...defaultThemeSettings };

  if (!value || typeof value !== "object") {
    return normalized;
  }

  themeFields.forEach((field) => {
    const nextValue = value[field.key];
    if (isColorValue(nextValue)) {
      normalized[field.key] = nextValue.trim();
    }
  });

  if (value.fontFamily?.trim() === BRAND_FONT_FAMILY) {
    normalized.fontFamily = defaultThemeSettings.fontFamily;
  } else if (isFontFamilyValue(value.fontFamily)) {
    normalized.fontFamily = value.fontFamily.trim();
  }

  if (isSafeTextValue(value.brandName)) {
    normalized.brandName = value.brandName.trim();
  }

  if (isSafeTextValue(value.brandSubtitle)) {
    normalized.brandSubtitle = value.brandSubtitle.trim();
  }

  if (isFontFamilyValue(value.brandFontFamily)) {
    normalized.brandFontFamily = value.brandFontFamily.trim();
  }

  if (value.brandLogoMode === "icon" || value.brandLogoMode === "image") {
    normalized.brandLogoMode = value.brandLogoMode;
  }

  if (
    typeof value.brandIcon === "string" &&
    brandIconOptions.some((option) => option.id === value.brandIcon)
  ) {
    normalized.brandIcon = value.brandIcon;
  }

  if (isSafeOptionalUrl(value.brandImageUrl)) {
    normalized.brandImageUrl = value.brandImageUrl.trim();
  }

  if (isSafeOptionalUrl(value.faviconUrl)) {
    normalized.faviconUrl = value.faviconUrl.trim();
  }

  return normalized;
};

const buildThemeStyle = (theme: ThemeSettings) =>
  ({
    "--erp-bg": theme.background,
    "--erp-sidebar": theme.sidebar,
    "--erp-header": theme.header,
    "--erp-panel": theme.panel,
    "--erp-panel-alt": theme.panelAlt,
    "--erp-primary": theme.primary,
    "--erp-primary-text": theme.primaryText,
    "--erp-text": theme.text,
    "--erp-muted": theme.muted,
    "--erp-border": theme.border,
    "--erp-success": theme.success,
    "--erp-warning": theme.warning,
    "--erp-danger": theme.danger,
    "--erp-primary-soft": `color-mix(in srgb, ${theme.primary} 12%, transparent)`,
    "--erp-primary-softer": `color-mix(in srgb, ${theme.primary} 6%, transparent)`,
    "--erp-primary-hover": `color-mix(in srgb, ${theme.primary} 22%, transparent)`,
    "--erp-primary-border": `color-mix(in srgb, ${theme.primary} 42%, transparent)`,
    "--erp-success-soft": `color-mix(in srgb, ${theme.success} 12%, transparent)`,
    "--erp-success-hover": `color-mix(in srgb, ${theme.success} 22%, transparent)`,
    "--erp-success-border": `color-mix(in srgb, ${theme.success} 38%, transparent)`,
    "--erp-warning-soft": `color-mix(in srgb, ${theme.warning} 12%, transparent)`,
    "--erp-warning-hover": `color-mix(in srgb, ${theme.warning} 22%, transparent)`,
    "--erp-warning-border": `color-mix(in srgb, ${theme.warning} 38%, transparent)`,
    "--erp-danger-soft": `color-mix(in srgb, ${theme.danger} 12%, transparent)`,
    "--erp-danger-hover": `color-mix(in srgb, ${theme.danger} 22%, transparent)`,
    "--erp-danger-border": `color-mix(in srgb, ${theme.danger} 38%, transparent)`,
    "--erp-panel-soft": `color-mix(in srgb, ${theme.panelAlt} 72%, transparent)`,
    "--erp-panel-softer": `color-mix(in srgb, ${theme.panelAlt} 42%, transparent)`,
    "--erp-panel-hover": `color-mix(in srgb, ${theme.text} 8%, ${theme.panelAlt})`,
    "--erp-font": theme.fontFamily,
    "--erp-brand-font": theme.brandFontFamily,
    fontFamily: "var(--erp-font)",
  }) as CSSProperties & Record<`--${string}`, string>;

const createIdFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const createAutomaticId = (
  name: string,
  existingIds: string[],
  currentId?: string,
) => {
  if (currentId?.trim()) {
    return currentId.trim();
  }

  const baseId = createIdFromName(name) || `item-${Date.now()}`;
  const usedIds = new Set(existingIds.filter((id) => id !== currentId));

  if (!usedIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  let candidate = `${baseId}-${suffix}`;

  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${baseId}-${suffix}`;
  }

  return candidate;
};

const getFlavorCategoryName = (category?: string | null) =>
  category?.trim() || "Sin categoría";

const formatCategoryLabel = (category: string) => {
  const label = category.trim();
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const replacements: Record<string, string> = {
    cafe: "Café",
    limon: "Limón",
    maracuya: "Maracuyá",
    sandia: "Sandía",
  };

  return replacements[normalized] ?? label;
};

const getProductCategoryIcon = (category: string): LucideIcon => {
  const normalized = formatCategoryLabel(category)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized === "helado") return Snowflake;
  if (normalized === "cafe") return Coffee;
  if (normalized === "salado") return Store;
  if (normalized === "dulce") return ReceiptText;
  if (normalized === "bebida") return CreditCard;
  if (normalized === "aperitivo") return WalletCards;
  if (normalized === "desayuno") return SunMedium;
  if (normalized === "promo") return BadgeDollarSign;

  return Package;
};

const groupFlavorsByCategory = (flavors: IceCreamFlavor[]) => {
  const groups = flavors.reduce<Map<string, IceCreamFlavor[]>>((map, flavor) => {
    const category = getFlavorCategoryName(flavor.category);
    const current = map.get(category) ?? [];
    current.push(flavor);
    map.set(category, current);
    return map;
  }, new Map<string, IceCreamFlavor[]>());

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right, "es-AR"))
    .map(([category, items]) => ({
      category,
      items: items.sort((left, right) => left.name.localeCompare(right.name, "es-AR")),
    }));
};

const getSaleHour = (sale: Sale) => {
  const [hour] = sale.time.split(":");
  const parsedHour = Number(hour);
  if (Number.isFinite(parsedHour)) {
    return parsedHour;
  }

  return getArgentinaDateParts(sale.createdAt).hour;
};

const getCurrentShift = (): ShiftName => {
  const hour = getArgentinaDateParts(new Date()).hour;
  return hour >= SHIFT_DAY_START_HOUR && hour < SHIFT_CHANGE_HOUR
    ? "manana"
    : "tarde";
};

const saleMatchesShiftFilter = (sale: Sale, shiftFilter: ShiftFilter) => {
  if (shiftFilter === "todo") {
    return true;
  }

  const saleHour = getSaleHour(sale);
  return shiftFilter === "manana"
    ? saleHour >= SHIFT_DAY_START_HOUR && saleHour < SHIFT_CHANGE_HOUR
    : saleHour < SHIFT_DAY_START_HOUR || saleHour >= SHIFT_CHANGE_HOUR;
};

const saleIsMorning = (sale: Sale) =>
  saleMatchesShiftFilter(sale, "manana");

const saleMatchesChannelFilter = (sale: Sale, channelFilter: ChannelFilter) =>
  channelFilter === "todo" || sale.channel === channelFilter;

const isProductLowStock = (product: Pick<Product, "minStock" | "stock">) =>
  product.minStock > 0 && product.stock <= product.minStock;

const isManualFlavorBatch = (batch: Pick<FlavorBatch, "portionsLoaded">) =>
  batch.portionsLoaded <= 1;

const allocateExpenseByRevenueShare = (
  totalExpense: number,
  filteredGross: number,
  periodGross: number,
) => {
  if (periodGross <= 0 || filteredGross <= 0) {
    return 0;
  }

  return totalExpense * (filteredGross / periodGross);
};

const calculateCommissionCost = (
  sales: Sale[],
  methodCommissions: Record<string, number>,
  channelCommissions: Record<SaleChannel, number>,
  commissionHistory: CommissionHistory[] = [],
) =>
  sales.reduce((total, sale) => {
    const saleDate = new Date(sale.createdAt);
    const activeSnapshot = [...commissionHistory]
      .sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      )
      .filter((snapshot) => new Date(snapshot.startsAt) <= saleDate)
      .at(-1);
    const methodRates =
      activeSnapshot?.methods.reduce<Record<string, number>>((acc, method) => {
        acc[method.name] = method.rate;
        return acc;
      }, {}) ?? methodCommissions;
    const channelRates = activeSnapshot?.channels ?? channelCommissions;
    const methodRate = methodRates[sale.method] ?? 0;
    const channelRate = channelRates[sale.channel] ?? 0;
    return total + sale.total * ((methodRate + channelRate) / 100);
  }, 0);

const getStaffKey = (person: Pick<StaffMember, "id" | "name">) =>
  person.id?.trim() || person.name.trim().toLowerCase();

const getAttendanceKey = (record: Pick<Attendance, "staffId" | "employeeName">) =>
  record.staffId?.trim() || record.employeeName.trim().toLowerCase();

const getAttendanceDisplayName = (
  record: Pick<Attendance, "staffId" | "employeeName">,
  staff: StaffMember[],
) => {
  const savedName = record.employeeName.trim();
  if (savedName) return savedName;

  const match = record.staffId
    ? staff.find((person) => person.id === record.staffId)
    : null;

  return match?.name ?? "Empleado sin nombre";
};

const inferShiftFromSchedule = (shift: string): ShiftName | null => {
  const normalized = shift.trim().toLowerCase();

  if (!normalized) return null;
  if (normalized.includes("tarde")) return "tarde";
  if (normalized.includes("mañ") || normalized.includes("man")) return "manana";

  const match = normalized.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (!match) return null;

  const hour = Number(match[1]);
  if (!Number.isFinite(hour)) return null;

  return hour >= 16 ? "tarde" : "manana";
};

const getShiftForStaff = (person: StaffMember) =>
  inferShiftFromSchedule(person.shift) ?? getCurrentShift();

const buildAttendanceStatusMap = (
  staff: StaffMember[],
  attendance: Attendance[],
  now: Date,
) => {
  const statusMap = new Map<string, AttendanceStatus>();

  staff.forEach((person) => {
    const key = getStaffKey(person);
    const records = attendance
      .filter((record) => getAttendanceKey(record) === key)
      .sort(
        (left, right) =>
          new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime(),
      );

    let openEntry: Attendance | null = null;
    for (const record of records) {
      if (record.eventType === "entrada") {
        openEntry = record;
      } else {
        openEntry = null;
      }
    }

    const workedMinutes = openEntry
      ? Math.max(
          0,
          Math.floor(
            (now.getTime() - new Date(openEntry.recordedAt).getTime()) / 60000,
          ),
        )
      : 0;

    statusMap.set(key, {
      key,
      staffId: person.id,
      employeeName: person.name,
      shift: openEntry?.shift ?? getShiftForStaff(person),
      isWorking: Boolean(openEntry),
      startedAt: openEntry?.recordedAt ?? null,
      lastRecordedAt: records.at(-1)?.recordedAt ?? null,
      workedMinutes,
      alert: workedMinutes >= 480 ? "over" : workedMinutes >= 450 ? "soon" : "none",
    });
  });

  return statusMap;
};

const isAttendanceEvent = (value: string): value is AttendanceEvent =>
  ["entrada", "salida"].includes(value);

const isShiftName = (value: string): value is ShiftName =>
  ["manana", "tarde"].includes(value);

const isSaleChannel = (value: string): value is SaleChannel =>
  ["local", "pedidos_ya"].includes(value);

const getSaleChannelLabel = (channel: SaleChannel) =>
  saleChannelOptions.find((option) => option.id === channel)?.label ?? "Local";

const inferSaleChannel = (sale: Pick<SaleRow, "canal" | "cliente">): SaleChannel => {
  const channel = sale.canal ?? "";
  if (isSaleChannel(channel)) {
    return channel;
  }

  const customer = (sale.cliente ?? "").trim().toLowerCase();
  return customer.includes("pedidos ya") || customer.includes("pedidosya")
    ? "pedidos_ya"
    : "local";
};

const normalizeProductImageUrl = (value: string | null) => {
  const url = value?.trim() ?? "";

  if (!url || url.includes("images.unsplash.com")) {
    return "";
  }

  return url;
};

const mapProduct = (product: ProductRow): Product => ({
  id: product.id,
  name: product.nombre,
  category: product.categoria,
  price: toNumber(product.precio),
  cost: toNumber(product.costo ?? 0),
  stock: toNumber(product.stock),
  minStock: toNumber(product.stock_minimo),
  unit: product.unidad,
  imageUrl: normalizeProductImageUrl(product.imagen),
  maxFlavors: product.max_gustos ?? 0,
  flavorUsage: toNumber(product.consumo_gustos ?? 0),
});

const mapFlavor = (flavor: FlavorRow): IceCreamFlavor => ({
  id: flavor.id,
  name: flavor.nombre,
  category: getFlavorCategoryName(flavor.categoria),
  available: flavor.disponible ?? true,
  color: flavor.color ?? "#67e8f9",
  stock: toNumber(flavor.stock ?? 0),
  minStock: toNumber(flavor.stock_minimo ?? 0),
  unit: flavor.unidad ?? "porciones",
});

const mapSale = (sale: SaleRow): Sale => ({
  id: sale.id,
  customer: sale.cliente ?? "Mostrador",
  channel: inferSaleChannel(sale),
  items: sale.productos ?? 0,
  method: sale.metodo ?? "Sin método",
  time: sale.hora?.slice(0, 5) ?? "--:--",
  total: toNumber(sale.total),
  subtotal: toNumber(sale.subtotal) || toNumber(sale.total),
  discount: toNumber(sale.descuento),
  createdAt: sale.creado ?? new Date().toISOString(),
});

const mapSaleItem = (item: SaleItemRow): SaleItem => ({
  id: item.id,
  saleId: item.venta_id,
  productId: item.producto_id ?? null,
  product: item.producto,
  quantity: toNumber(item.cantidad),
  price: toNumber(item.precio ?? null),
  cost: toNumber(item.costo ?? 0),
  total: toNumber(item.total ?? null),
  flavors: item.gustos ?? [],
  createdAt: item.creado ?? new Date().toISOString(),
});

const normalizeSoldProductName = (product: string) =>
  product.replace(/\s*\([^)]*\)\s*$/, "").trim();

const buildProductRankingRows = (items: SaleItem[]): MonthlyProductSummary[] =>
  Object.values(
    items.reduce<Record<string, Omit<MonthlyProductSummary, "margin" | "marginRate">>>(
      (acc, item) => {
        const normalizedName = normalizeSoldProductName(item.product);
        const current = acc[normalizedName] ?? {
          cost: 0,
          product: normalizedName,
          quantity: 0,
          revenue: 0,
        };
        current.cost += item.cost * item.quantity;
        current.quantity += item.quantity;
        current.revenue += item.total || item.price * item.quantity;
        acc[normalizedName] = current;
        return acc;
      },
      {},
    ),
  )
    .map((row) => ({
      ...row,
      margin: row.revenue - row.cost,
      marginRate: row.revenue > 0 ? ((row.revenue - row.cost) / row.revenue) * 100 : 0,
    }))
    .sort(
      (left, right) =>
        right.quantity - left.quantity ||
        right.revenue - left.revenue ||
        left.product.localeCompare(right.product, "es-AR"),
    );

const mapExpense = (expense: ExpenseRow): Expense => ({
  key: expense.clave,
  label: expense.nombre,
  category: expense.categoria,
  amount: toNumber(expense.monto),
});

const mapExpenseHistory = (history: ExpenseHistoryRow): ExpenseHistory => ({
  id: history.id,
  startsAt: history.fecha_desde,
  total: toNumber(history.total),
  expenses: (history.gastos ?? []).map((expense) => ({
    key: expense.clave ?? "gasto",
    label: expense.nombre ?? "Gasto",
    category: expense.categoria ?? "General",
    amount: toNumber(expense.monto ?? 0),
  })),
});

const mapCommissionHistory = (history: CommissionHistoryRow): CommissionHistory => ({
  id: history.id,
  startsAt: history.fecha_desde,
  channels: {
    local: toNumber(history.canales?.local ?? 0),
    pedidos_ya: toNumber(history.canales?.pedidos_ya ?? 0),
  },
  methods: (history.metodos ?? []).map((method) => ({
    name: method.nombre ?? "Método",
    rate: toNumber(method.comision ?? 0),
  })),
});

const mapFlavorBatch = (batch: FlavorBatchRow): FlavorBatch => ({
  id: batch.id,
  flavorId: batch.gusto_id,
  flavorName: batch.gusto,
  kilos: toNumber(batch.kilos),
  portionsLoaded: toNumber(batch.porciones_cargadas),
  systemStockAtClose:
    batch.stock_sistema_al_cerrar === null
      ? null
      : toNumber(batch.stock_sistema_al_cerrar),
  suggestedYield:
    batch.rendimiento_sugerido === null
      ? null
      : toNumber(batch.rendimiento_sugerido),
  status: batch.estado,
  createdAt: batch.creado,
  closedAt: batch.cerrado,
});

const mapStaffMember = (person: StaffRow): StaffMember => ({
  id: person.id,
  name: person.nombre,
  role: person.rol,
  shift: person.turno,
  area: person.sector,
  status:
    person.estado === "Activo" ||
    person.estado === "Pausa" ||
    person.estado === "Ausente" ||
    person.estado === "Franco"
      ? person.estado
      : "Activo",
  pin: person.pin_codigo ?? "",
});

const mapAuditLog = (log: AuditLogRow): AuditLog => ({
  id: log.id,
  entity: log.entidad,
  entityId: log.entidad_id,
  action: log.accion,
  detail: log.detalle ?? {},
  userName: log.usuario_nombre,
  createdAt: log.creado,
});

const mapAttendance = (attendance: AttendanceRow): Attendance => ({
  id: attendance.id,
  staffId: attendance.empleado_id,
  employeeName: attendance.empleado,
  eventType: isAttendanceEvent(attendance.tipo)
    ? attendance.tipo
    : "entrada",
  shift: isShiftName(attendance.turno) ? attendance.turno : "manana",
  recordedAt: attendance.creado,
});

export function GestionLocalErp() {
  const [activeView, setActiveView] = useState<ViewId>("caja");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [iceCreamFlavors, setIceCreamFlavors] = useState<IceCreamFlavor[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [paymentMethodCommissions, setPaymentMethodCommissions] =
    useState<Record<string, number>>(defaultPaymentMethodCommissions);
  const [channelCommissions, setChannelCommissions] =
    useState<Record<SaleChannel, number>>(defaultChannelCommissions);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseHistory, setExpenseHistory] = useState<ExpenseHistory[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<CommissionHistory[]>([]);
  const [flavorBatches, setFlavorBatches] = useState<FlavorBatch[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [saleChannel, setSaleChannel] = useState<SaleChannel>("local");
  const [customer, setCustomer] = useState("Mostrador");
  const [discountMode, setDiscountMode] = useState<DiscountMode>("amount");
  const [discountValue, setDiscountValue] = useState("");
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [, setNotice] = useState("Conectando con la base de datos");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [isEndingCashierSession, setIsEndingCashierSession] = useState(false);
  const [isCashierActionLoading, setIsCashierActionLoading] = useState(false);
  const [timeTick, setTimeTick] = useState(0);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(
    defaultThemeSettings,
  );
  const [themeDraft, setThemeDraft] = useState<ThemeSettings>(
    defaultThemeSettings,
  );
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [, setIsSupabaseReady] = useState(false);
  const [, setIsLoadingData] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [dismissedDesktopUpdateNoticeKey, setDismissedDesktopUpdateNoticeKey] =
    useState<string | null>(null);
  const [pendingOfflineSales, setPendingOfflineSales] = useState(0);
  const [isOfflineQueueReady, setIsOfflineQueueReady] = useState(false);
  const [isSyncingOfflineSales, setIsSyncingOfflineSales] = useState(false);
  const offlineSyncInProgressRef = useRef(false);
  const desktopUpdateActionInProgressRef = useRef(false);
  const appliedOfflineSaleIdsRef = useRef<Set<string>>(new Set());
  const [desktopUpdate, setDesktopUpdate] = useState<DesktopUpdaterState>({
    status: "unsupported",
  });
  const allowedViews = sessionUser
    ? allowedViewsByRole[sessionUser.role]
    : allowedViewsByRole.empleado;
  const safeActiveView = allowedViews.includes(activeView)
    ? activeView
    : allowedViews[0] ?? "caja";
  const canManageBusiness =
    sessionUser?.role === "admin" || sessionUser?.role === "dueno";
  const visibleNavItems = navItems.filter((item) => allowedViews.includes(item.id));
  const helpGuideGroups = navGroups
    .map((group) => ({
      label: group.label,
      items: group.items
        .map((id) => visibleNavItems.find((item) => item.id === id))
        .filter((item): item is NavItem => Boolean(item))
        .map((item) => ({
          help: detailedHelpContentByView[item.id],
          item,
        })),
    }))
    .filter((group) => group.items.length > 0);
  const themeStyle = buildThemeStyle(themeSettings);
  const desktopUpdateNoticeKey =
    desktopUpdate.status === "updated"
      ? `${desktopUpdate.currentVersion ?? desktopUpdate.version ?? ""}.${
          desktopUpdate.updatedAt ?? ""
        }`
      : "";
  const shouldShowDesktopUpdateNotice =
    desktopUpdate.status === "updated" &&
    desktopUpdateNoticeKey !== dismissedDesktopUpdateNoticeKey;
  const closeDesktopUpdateNotice = () => {
    setDismissedDesktopUpdateNoticeKey(desktopUpdateNoticeKey);
    setDesktopUpdate((current) => ({
      currentVersion: current.currentVersion,
      status: "idle",
    }));
  };

  const applyThemeSettings = (settings: Partial<ThemeSettings> | null | undefined) => {
    const normalized = normalizeThemeSettings(settings);
    setThemeSettings(normalized);
    setThemeDraft(normalized);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // El diseño igual queda aplicado en la sesión actual.
    }

    applyBrowserBrandSettings(normalized);
  };

  const applyErpData = (data: ErpDataResponse) => {
    const methods = (data.metodos_pago ?? []).map((item) => item.nombre);
    const activePaymentMethods =
      methods.length > 0 ? methods : defaultPaymentMethods;
    const savedMethodCommissions = Object.fromEntries(
      (data.metodos_pago ?? []).map((item) => [
        item.nombre,
        toNumber(item.comision ?? 0),
      ]),
    );
    const methodCommissions = Object.fromEntries(
      activePaymentMethods.map((method) => [
        method,
        savedMethodCommissions[method] ??
          defaultPaymentMethodCommissions[method] ??
          0,
      ]),
    );
    const hasSavedChannelCommissions = Boolean(data.comisiones_canales);

    appliedOfflineSaleIdsRef.current = new Set(
      (data.ventas ?? []).map((sale) => sale.id),
    );
    setProducts((data.productos ?? []).map(mapProduct));
    setIceCreamFlavors((data.gustos ?? []).map(mapFlavor));
    setPaymentMethods(activePaymentMethods);
    setPaymentMethodCommissions(methodCommissions);
    setChannelCommissions({
      local: hasSavedChannelCommissions
        ? toNumber(data.comisiones_canales?.local ?? defaultChannelCommissions.local)
        : defaultChannelCommissions.local,
      pedidos_ya: hasSavedChannelCommissions
        ? toNumber(
            data.comisiones_canales?.pedidos_ya ??
              defaultChannelCommissions.pedidos_ya,
          )
        : defaultChannelCommissions.pedidos_ya,
    });
    setSales((data.ventas ?? []).map(mapSale));
    setSaleItems((data.items_venta ?? []).map(mapSaleItem));
    setExpenses((data.gastos ?? []).map(mapExpense));
    setExpenseHistory((data.gastos_historial ?? []).map(mapExpenseHistory));
    setCommissionHistory((data.comisiones_historial ?? []).map(mapCommissionHistory));
    setFlavorBatches((data.tandas_gustos ?? []).map(mapFlavorBatch));
    setStaff((data.empleados ?? []).map(mapStaffMember));
    setAttendance((data.asistencias ?? []).map(mapAttendance));
    setAuditLogs((data.auditoria ?? []).map(mapAuditLog));
    if (data.diseno) {
      applyThemeSettings(data.diseno);
    }
    setPaymentMethod((current) =>
      current && activePaymentMethods.includes(current)
        ? current
        : activePaymentMethods[0] ?? "",
    );
  };

  const applyOfflineUiSnapshot = (snapshot: OfflineUiSnapshot) => {
    appliedOfflineSaleIdsRef.current = new Set(
      (snapshot.sales ?? []).map((sale) => sale.id),
    );
    setProducts(snapshot.products ?? []);
    setIceCreamFlavors(snapshot.iceCreamFlavors ?? []);
    setPaymentMethods(snapshot.paymentMethods ?? defaultPaymentMethods);
    setPaymentMethodCommissions(
      snapshot.paymentMethodCommissions ?? defaultPaymentMethodCommissions,
    );
    setChannelCommissions(
      snapshot.channelCommissions ?? defaultChannelCommissions,
    );
    setSales(snapshot.sales ?? []);
    setSaleItems(snapshot.saleItems ?? []);
    setExpenses(snapshot.expenses ?? []);
    setExpenseHistory(snapshot.expenseHistory ?? []);
    setCommissionHistory(snapshot.commissionHistory ?? []);
    setFlavorBatches(snapshot.flavorBatches ?? []);
    setStaff(snapshot.staff ?? []);
    setAttendance(snapshot.attendance ?? []);
    setAuditLogs(snapshot.auditLogs ?? []);
    applyThemeSettings(snapshot.themeSettings ?? defaultThemeSettings);
    setPaymentMethod((current) =>
      current && (snapshot.paymentMethods ?? []).includes(current)
        ? current
        : snapshot.paymentMethod ||
          snapshot.paymentMethods?.[0] ||
          defaultPaymentMethods[0] ||
          "",
    );
  };

  const loadOfflineUiSnapshot = (user: SessionUser) => {
    try {
      const cached = window.localStorage.getItem(getOfflineUiSnapshotKey(user));
      return cached ? (JSON.parse(cached) as OfflineUiSnapshot) : null;
    } catch {
      window.localStorage.removeItem(getOfflineUiSnapshotKey(user));
      return null;
    }
  };

  const loadData = async (
    successNotice = "Datos conectados con Supabase",
    user = sessionUser,
  ) => {
    setIsLoadingData(true);
    const offlineDataStorageKey = user ? getOfflineDataStorageKey(user) : null;

    const response = await fetch("/api/erp/datos", {
      cache: "no-store",
      headers: getOfflineAuthHeaders(),
    }).catch(() => null);

    if (!response?.ok) {
      setIsSupabaseReady(false);
      setIsLoadingData(false);
      if (user) {
        const snapshot = loadOfflineUiSnapshot(user);
        if (snapshot) {
          applyOfflineUiSnapshot(snapshot);
          await applyPendingOfflineSalesLocally();
          setNotice("Sin internet: usando los datos locales guardados en esta PC");
          return true;
        }
      }

      const cached = offlineDataStorageKey
        ? window.localStorage.getItem(offlineDataStorageKey)
        : null;
      if (cached) {
        try {
          applyErpData(JSON.parse(cached) as ErpDataResponse);
          await applyPendingOfflineSalesLocally();
          setNotice("Sin internet: usando los últimos datos guardados en esta PC");
          return true;
        } catch {
          if (offlineDataStorageKey) {
            window.localStorage.removeItem(offlineDataStorageKey);
          }
        }
      }
      setNotice("No se pudo cargar la base de datos");
      return false;
    }

    const data = (await response.json()) as ErpDataResponse;
    applyErpData(data);
    if (offlineDataStorageKey) {
      window.localStorage.setItem(offlineDataStorageKey, JSON.stringify(data));
    }
    await applyPendingOfflineSalesLocally();
    window.localStorage.removeItem(OFFLINE_DATA_STORAGE_KEY_PREFIX);
    setIsSupabaseReady(true);
    setIsLoadingData(false);
    setNotice(successNotice);
    return true;
  };

  const loadSessionUser = async () => {
    const response = await fetch("/api/auth/me", {
      cache: "no-store",
      headers: getOfflineAuthHeaders(),
    }).catch(() => null);

    if (!response?.ok) {
      const offlineUser = getCurrentOfflineSession();
      setSessionUser(offlineUser);
      return offlineUser;
    }

    const data = (await response.json()) as SessionUser & {
      offlineToken?: string;
    };
    await rememberOfflineSession(data, undefined, data.offlineToken);
    setSessionUser(data);
    return data;
  };

  const updateThemeDraft = (key: keyof ThemeSettings, value: string) => {
    const nextTheme = normalizeThemeSettings({
      ...themeDraft,
      [key]: value,
    });
    setThemeDraft(nextTheme);
    setThemeSettings(nextTheme);
    applyBrowserBrandSettings(nextTheme);
  };

  const applyThemePreset = (
    preset: ThemeColorPreset,
    options: ApplyThemePresetOptions,
  ) => {
    const nextTheme = normalizeThemeSettings({
      ...themeDraft,
      ...preset.colors,
      ...(options.includeTypography ? preset.typography : {}),
    });
    setThemeDraft(nextTheme);
    setThemeSettings(nextTheme);
    applyBrowserBrandSettings(nextTheme);
  };

  const saveTheme = async (settings = themeDraft) => {
    const nextTheme = normalizeThemeSettings(settings);
    setIsSavingTheme(true);
    applyThemeSettings(nextTheme);

    try {
      const result = await submitJsonMutation("diseño", {
        url: "/api/erp/diseno",
        method: "PATCH",
        body: { diseno: nextTheme },
      });

      setIsSavingTheme(false);
      if (!result.queued) {
        setNotice("Diseño guardado");
      }
      return true;
    } catch {
      setIsSavingTheme(false);
      setNotice("No se pudo guardar el diseño en la base");
      return false;
    }
  };

  const resetTheme = () => {
    void saveTheme(defaultThemeSettings);
  };

  const checkDesktopUpdate = async () => {
    if (!window.cajaUpdater) return;

    const status = await window.cajaUpdater.check().catch(() => ({
      message: "No se pudo buscar actualización",
      status: "error" as const,
    }));
    setDesktopUpdate(status);
  };

  const downloadDesktopUpdate = async () => {
    if (!window.cajaUpdater) return;

    const status = await window.cajaUpdater.download().catch(() => ({
      message: "No se pudo descargar la actualización",
      status: "error" as const,
    }));
    setDesktopUpdate(status);
  };

  const installDesktopUpdate = () => {
    void window.cajaUpdater?.install();
  };

  const isDesktopUpdateWaitingForSync =
    (desktopUpdate.status === "available" || desktopUpdate.status === "downloaded") &&
    (!isOfflineQueueReady || !isOnline || pendingOfflineSales > 0 || isSyncingOfflineSales);

  useEffect(() => {
    let isMounted = true;

    const boot = async () => {
      try {
        const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          applyThemeSettings(JSON.parse(savedTheme) as Partial<ThemeSettings>);
        }
      } catch {
        applyThemeSettings(defaultThemeSettings);
      }

      try {
        const user = await loadSessionUser();
        if (user) {
          await loadData("Datos conectados con Supabase", user);
        } else {
          setIsLoadingData(false);
        }
      } finally {
        if (isMounted) {
          setIsBooting(false);
        }
      }
    };

    void boot();

    return () => {
      isMounted = false;
    };
    // La carga inicial corre una sola vez; loadData también se usa después de guardar cambios.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!window.cajaUpdater) return;

    let isMounted = true;
    window.cajaUpdater.getStatus().then((status) => {
      if (isMounted) {
        setDesktopUpdate(status);
      }
    }).catch(() => undefined);
    const unsubscribe = window.cajaUpdater.onStatus((status) => {
      setDesktopUpdate(status);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (
      !window.cajaUpdater ||
      !sessionUser ||
      !isOnline ||
      desktopUpdate.status !== "error"
    ) {
      return;
    }

    void checkDesktopUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, sessionUser?.id]);

  useEffect(() => {
    setTimeTick(Date.now());
    const intervalId = window.setInterval(() => setTimeTick(Date.now()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const refreshOfflineSaleCount = async () => {
    const [salesCount, closesCount, mutationsCount] = await Promise.all([
      countOfflineSales(),
      countOfflineCashCloses(),
      countOfflineJsonMutations(),
    ]);
    setPendingOfflineSales(salesCount + closesCount + mutationsCount);
  };

  const shouldQueueOfflineError = (error: unknown) =>
    !window.navigator.onLine ||
    error instanceof TypeError ||
    Boolean((error as { retryable?: boolean }).retryable);

  const submitJsonMutation = async (
    label: string,
    request: OfflineJsonMutationRecord["request"],
  ) => {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(request.body),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const error = new Error(data?.error ?? `No se pudo guardar ${label}`) as Error & {
          retryable?: boolean;
        };
        error.retryable = response.status >= 500;
        throw error;
      }

      return { queued: false, response };
    } catch (error) {
      if (!shouldQueueOfflineError(error)) {
        throw error;
      }

      await enqueueOfflineJsonMutation({
        id: createLocalUuid(),
        createdAt: new Date().toISOString(),
        label,
        request,
      });
      await refreshOfflineSaleCount();
      setNotice(`Sin internet: ${label} guardado en esta PC para sincronizar`);
      return { queued: true, response: null };
    }
  };

  const submitSalePayload = async (payload: OfflineSalePayload) => {
    const response = await fetch("/api/erp/ventas", {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      const error = new Error(
        data?.error ?? "No se pudo guardar el pedido en la base",
      ) as Error & { retryable?: boolean };
      error.retryable = response.status >= 500;
      throw error;
    }
  };

  const submitCashClosePayload = async (payload: OfflineCashClosePayload) => {
    const response = await fetch("/api/erp/cierres-caja", {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      const error = new Error(
        data?.error ?? "No se pudo guardar el cierre en la base",
      ) as Error & { retryable?: boolean };
      error.retryable = response.status >= 500;
      throw error;
    }
  };

  const updateCachedErpData = (
    updater: (data: ErpDataResponse) => ErpDataResponse,
  ) => {
    const user = sessionUser ?? getCurrentOfflineSession();
    if (!user) return;

    const offlineDataStorageKey = getOfflineDataStorageKey(user);
    const cached = window.localStorage.getItem(offlineDataStorageKey);
    if (!cached) return;

    try {
      const data = JSON.parse(cached) as ErpDataResponse;
      window.localStorage.setItem(
        offlineDataStorageKey,
        JSON.stringify(updater(data)),
      );
    } catch {
      window.localStorage.removeItem(offlineDataStorageKey);
    }
  };

  const persistOfflineSaleInCache = (record: OfflineSaleRecord) => {
    updateCachedErpData((data) => {
      if ((data.ventas ?? []).some((sale) => sale.id === record.sale.id)) {
        return data;
      }

      const productAdjustments = new Map(
        record.productAdjustments.map((item) => [item.id, item.quantity]),
      );
      const flavorAdjustments = new Map(
        record.flavorAdjustments.map((item) => [item.id, item.quantity]),
      );
      const saleRow: SaleRow = {
        id: record.sale.id,
        cliente: record.sale.customer,
        canal: record.sale.channel,
        productos: record.sale.items,
        metodo: record.sale.method,
        hora: record.sale.time,
        total: record.sale.total,
        subtotal: record.sale.subtotal,
        descuento: record.sale.discount,
        creado: record.sale.createdAt,
      };
      const saleItemRows: SaleItemRow[] = record.saleItems.map((item) => ({
        id: item.id,
        venta_id: item.saleId,
        producto_id: item.productId,
        producto: item.product,
        cantidad: item.quantity,
        precio: item.price,
        costo: item.cost,
        total: item.total,
        gustos: item.flavors,
        creado: item.createdAt,
      }));

      return {
        ...data,
        productos: (data.productos ?? []).map((product) => {
          const quantity = productAdjustments.get(product.id) ?? 0;
          return quantity > 0
            ? { ...product, stock: Math.max(0, toNumber(product.stock) - quantity) }
            : product;
        }),
        gustos: (data.gustos ?? []).map((flavor) => {
          const quantity = flavorAdjustments.get(flavor.id) ?? 0;
          return quantity > 0
            ? { ...flavor, stock: toNumber(flavor.stock ?? 0) - quantity }
            : flavor;
        }),
        ventas: [saleRow, ...(data.ventas ?? [])],
        items_venta: [...saleItemRows, ...(data.items_venta ?? [])],
      };
    });
  };

  const persistProductInCache = (product: Product) => {
    const productRow: ProductRow = {
      id: product.id,
      nombre: product.name,
      categoria: product.category,
      precio: product.price,
      costo: product.cost,
      stock: product.stock,
      stock_minimo: product.minStock,
      unidad: product.unit,
      imagen: product.imageUrl.trim() || null,
      max_gustos: product.maxFlavors,
      consumo_gustos: product.flavorUsage,
    };

    updateCachedErpData((data) => ({
      ...data,
      productos: (data.productos ?? []).some((item) => item.id === product.id)
        ? (data.productos ?? []).map((item) =>
            item.id === product.id ? productRow : item,
          )
        : [productRow, ...(data.productos ?? [])],
    }));
  };

  const removeProductFromCache = (productId: string) => {
    updateCachedErpData((data) => ({
      ...data,
      productos: (data.productos ?? []).filter((item) => item.id !== productId),
    }));
  };

  const persistFlavorInCache = (flavor: IceCreamFlavor) => {
    const flavorRow: FlavorRow = {
      id: flavor.id,
      nombre: flavor.name,
      categoria: flavor.category,
      disponible: flavor.available,
      color: flavor.color,
      stock: flavor.stock,
      stock_minimo: flavor.minStock,
      unidad: flavor.unit,
    };

    updateCachedErpData((data) => ({
      ...data,
      gustos: (data.gustos ?? []).some((item) => item.id === flavor.id)
        ? (data.gustos ?? []).map((item) =>
            item.id === flavor.id ? flavorRow : item,
          )
        : [flavorRow, ...(data.gustos ?? [])],
    }));
  };

  const removeFlavorFromCache = (flavorId: string) => {
    updateCachedErpData((data) => ({
      ...data,
      gustos: (data.gustos ?? []).filter((item) => item.id !== flavorId),
    }));
  };

  const persistDeletedSaleInCache = (saleId: string) => {
    updateCachedErpData((data) => {
      const deletedItems = (data.items_venta ?? []).filter(
        (item) => item.venta_id === saleId,
      );
      const productQuantities = deletedItems.reduce<Map<string, number>>(
        (acc, item) => {
          if (!item.producto_id) return acc;
          acc.set(
            item.producto_id,
            (acc.get(item.producto_id) ?? 0) + toNumber(item.cantidad),
          );
          return acc;
        },
        new Map(),
      );

      return {
        ...data,
        ventas: (data.ventas ?? []).filter((sale) => sale.id !== saleId),
        items_venta: (data.items_venta ?? []).filter(
          (item) => item.venta_id !== saleId,
        ),
        productos: (data.productos ?? []).map((product) => {
          const quantity = productQuantities.get(product.id) ?? 0;
          return quantity > 0
            ? { ...product, stock: toNumber(product.stock) + quantity }
            : product;
        }),
      };
    });
  };

  const applyOfflineSaleLocally = (record: OfflineSaleRecord) => {
    if (appliedOfflineSaleIdsRef.current.has(record.sale.id)) {
      return;
    }

    appliedOfflineSaleIdsRef.current.add(record.sale.id);
    setSales((current) =>
      current.some((sale) => sale.id === record.sale.id)
        ? current
        : [record.sale, ...current],
    );
    setSaleItems((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      return [
        ...record.saleItems.filter((item) => !existingIds.has(item.id)),
        ...current,
      ];
    });
    setProducts((current) =>
      current.map((product) => {
        const adjustment = record.productAdjustments.find(
          (item) => item.id === product.id,
        );
        return adjustment
          ? { ...product, stock: Math.max(0, product.stock - adjustment.quantity) }
          : product;
      }),
    );
    setIceCreamFlavors((current) =>
      current.map((flavor) => {
        const adjustment = record.flavorAdjustments.find(
          (item) => item.id === flavor.id,
        );
        return adjustment
          ? { ...flavor, stock: flavor.stock - adjustment.quantity }
          : flavor;
      }),
    );
    persistOfflineSaleInCache(record);
  };

  const applyPendingOfflineSalesLocally = async () => {
    const records = await getOfflineSales();
    records.forEach(applyOfflineSaleLocally);
  };

  const syncPendingOfflineSales = async () => {
    if (
      offlineSyncInProgressRef.current ||
      !sessionUser ||
      !window.navigator.onLine
    ) {
      return;
    }

    offlineSyncInProgressRef.current = true;
    setIsSyncingOfflineSales(true);

    try {
      const pendingSales = await getOfflineSales();
      const pendingCashCloses = await getOfflineCashCloses();
      const pendingMutations = await getOfflineJsonMutations();
      const pendingOperations = [
        ...pendingSales.map((record) => ({
          createdAt: record.createdAt,
          record,
          type: "sale" as const,
        })),
        ...pendingCashCloses.map((record) => ({
          createdAt: record.createdAt,
          record,
          type: "cash-close" as const,
        })),
        ...pendingMutations.map((record) => ({
          createdAt: record.createdAt,
          record,
          type: "mutation" as const,
        })),
      ].sort(
        (left, right) =>
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );
      let synced = 0;
      let syncError = "";

      for (const operation of pendingOperations) {
        try {
          if (operation.type === "mutation") {
            const response = await fetch(operation.record.request.url, {
              method: operation.record.request.method,
              headers: getJsonAuthHeaders(),
              body: JSON.stringify(operation.record.request.body),
            });
            if (!response.ok) {
              const data = (await response.json().catch(() => null)) as {
                error?: string;
              } | null;
              throw new Error(data?.error ?? "No se pudo sincronizar un cambio");
            }
            await removeOfflineJsonMutation(operation.record.id);
          } else if (operation.type === "sale") {
            await submitSalePayload(operation.record.payload);
            await removeOfflineSale(operation.record.id);
          } else {
            await submitCashClosePayload(operation.record.payload);
            await removeOfflineCashClose(operation.record.id);
          }
          synced += 1;
        } catch (error) {
          syncError =
            error instanceof Error ? error.message : "No se pudo sincronizar un pendiente";
          break;
        }
      }

      await refreshOfflineSaleCount();

      if (synced > 0) {
        await loadData(`${synced} dato${synced === 1 ? "" : "s"} offline sincronizado${synced === 1 ? "" : "s"}`);
        if (syncError) {
          setNotice(`Quedaron pendientes sin sincronizar: ${syncError}`);
        }
      } else if (syncError) {
        setNotice(`No se pudo sincronizar pendiente: ${syncError}`);
      }
    } finally {
      offlineSyncInProgressRef.current = false;
      setIsSyncingOfflineSales(false);
    }
  };

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(window.navigator.onLine);
    };

    setIsOnline(window.navigator.onLine);
    void refreshOfflineSaleCount().finally(() => setIsOfflineQueueReady(true));
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!sessionUser || isBooting) return;

    const snapshot: OfflineUiSnapshot = {
      attendance,
      auditLogs,
      channelCommissions,
      commissionHistory,
      expenseHistory,
      expenses,
      flavorBatches,
      iceCreamFlavors,
      paymentMethod,
      paymentMethodCommissions,
      paymentMethods,
      products,
      saleItems,
      sales,
      staff,
      themeSettings,
      updatedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(
        getOfflineUiSnapshotKey(sessionUser),
        JSON.stringify(snapshot),
      );
    } catch {
      // Si el almacenamiento local se llena, la cola offline sigue siendo la fuente segura.
    }
  }, [
    attendance,
    auditLogs,
    channelCommissions,
    commissionHistory,
    expenseHistory,
    expenses,
    flavorBatches,
    iceCreamFlavors,
    isBooting,
    paymentMethod,
    paymentMethodCommissions,
    paymentMethods,
    products,
    saleItems,
    sales,
    sessionUser,
    staff,
    themeSettings,
  ]);

  useEffect(() => {
    if (sessionUser && isOnline && pendingOfflineSales > 0) {
      void syncPendingOfflineSales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, pendingOfflineSales, sessionUser?.id]);

  useEffect(() => {
    if (!window.cajaUpdater || !sessionUser || isBooting) return;

    const canUpdateNow =
      isOnline &&
      isOfflineQueueReady &&
      pendingOfflineSales === 0 &&
      !isSyncingOfflineSales &&
      !offlineSyncInProgressRef.current;

    if (!canUpdateNow) {
      if (isOnline && pendingOfflineSales > 0) {
        void syncPendingOfflineSales();
      }
      return;
    }

    if (desktopUpdateActionInProgressRef.current) return;

    if (desktopUpdate.status === "available") {
      desktopUpdateActionInProgressRef.current = true;
      window.cajaUpdater
        .download()
        .then(setDesktopUpdate)
        .catch(() =>
          setDesktopUpdate((current) => ({
            ...current,
            message: "No se pudo descargar la actualizacion",
            status: "error",
          })),
        )
        .finally(() => {
          desktopUpdateActionInProgressRef.current = false;
        });
      return;
    }

    if (desktopUpdate.status === "downloaded") {
      setNotice("Actualizacion lista: reiniciando para instalar");
      window.setTimeout(() => {
        void window.cajaUpdater?.install();
      }, 1200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    desktopUpdate.status,
    isBooting,
    isOfflineQueueReady,
    isOnline,
    isSyncingOfflineSales,
    pendingOfflineSales,
    sessionUser?.id,
  ]);

  useEffect(() => {
    if (!isBooting && !sessionUser) {
      window.location.replace("/auth/login");
    }
  }, [isBooting, sessionUser]);

  useEffect(() => {
    if (!allowedViews.includes(activeView)) {
      setActiveView(allowedViews[0] ?? "caja");
    }
  }, [activeView, allowedViews]);

  const cartItems = cart;
  const categories = ["Todos", ...new Set(products.map((product) => product.category))];

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "Todos" || product.category === category;
      const matchesQuery = product.name.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  const saleSubtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const parsedDiscountValue = Math.max(0, Number(discountValue || 0));
  const saleDiscount = Math.min(
    saleSubtotal,
    discountMode === "percent"
      ? saleSubtotal * (parsedDiscountValue / 100)
      : parsedDiscountValue,
  );
  const saleTotal = saleSubtotal - saleDiscount;
  const commissionCost = calculateCommissionCost(
    sales,
    paymentMethodCommissions,
    channelCommissions,
    commissionHistory,
  );
  const lowStock = products.filter(isProductLowStock);
  const unitsInStock = products.reduce((total, product) => total + product.stock, 0);
  const attendanceStatusMap = useMemo(
    () => buildAttendanceStatusMap(staff, attendance, new Date(timeTick)),
    [attendance, staff, timeTick],
  );
  const getCartQuantity = (productId: string) =>
    cart
      .filter((item) => item.productId === productId)
      .reduce((total, item) => total + item.quantity, 0);

  const addLineToCart = (product: Product, flavors: string[]) => {
    const currentQuantity = getCartQuantity(product.id);
    if (currentQuantity >= product.stock) {
      setNotice(`${product.name} no tiene stock disponible`);
      return;
    }

    const flavorKey = flavors.join("|");
    setCart((current) => {
      const existingLine = current.find(
        (item) =>
          item.productId === product.id && item.flavors.join("|") === flavorKey,
      );

      if (existingLine) {
        return current.map((item) =>
          item.lineId === existingLine.lineId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...current,
        {
          lineId: `${product.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          productId: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          cost: product.cost,
          quantity: 1,
          unit: product.unit,
          imageUrl: product.imageUrl,
          flavors,
          flavorUsage: product.flavorUsage,
        },
      ];
    });
  };

  const handleProductClick = (product: Product) => {
    addLineToCart(product, []);
  };

  const confirmFlavorSelection = () => {
    if (!selectedProduct) return;
    if (selectedFlavors.length !== selectedProduct.maxFlavors) {
      setNotice(
        `${selectedProduct.name} necesita ${selectedProduct.maxFlavors} gusto${
          selectedProduct.maxFlavors > 1 ? "s" : ""
        }`,
      );
      return;
    }

    addLineToCart(selectedProduct, selectedFlavors);
    setSelectedProduct(null);
    setSelectedFlavors([]);
  };

  const toggleFlavor = (flavorName: string) => {
    if (!selectedProduct) return;

    setSelectedFlavors((current) => {
      if (current.length >= selectedProduct.maxFlavors) {
        return current;
      }

      return [...current, flavorName];
    });
  };

  const removeSelectedFlavor = (index: number) => {
    setSelectedFlavors((current) =>
      current.filter((_flavor, flavorIndex) => flavorIndex !== index),
    );
  };

  const removeFromCart = (lineId: string) => {
    setCart((current) => {
      const line = current.find((item) => item.lineId === lineId);
      if (!line) return current;

      if (line.quantity <= 1) {
        return current.filter((item) => item.lineId !== lineId);
      }

      return current.map((item) =>
        item.lineId === lineId ? { ...item, quantity: item.quantity - 1 } : item,
      );
    });
  };

  const addQuantityToLine = (lineId: string) => {
    setCart((current) => {
      const line = current.find((item) => item.lineId === lineId);
      if (!line) return current;

      const product = products.find((item) => item.id === line.productId);
      const currentQuantity = current
        .filter((item) => item.productId === line.productId)
        .reduce((total, item) => total + item.quantity, 0);

      if (product && currentQuantity >= product.stock) {
        setNotice(`${line.name} no tiene stock disponible`);
        return current;
      }

      return current.map((item) =>
        item.lineId === lineId ? { ...item, quantity: item.quantity + 1 } : item,
      );
    });
  };

  const clearFromCart = (lineId: string) => {
    setCart((current) => current.filter((item) => item.lineId !== lineId));
  };

  const cancelCart = () => {
    setCart([]);
    setSelectedProduct(null);
    setSelectedFlavors([]);
    setDiscountValue("");
    setDiscountMode("amount");
    setIsDiscountOpen(false);
    setSaleChannel("local");
    setNotice("Pedido cancelado");
  };

  const completeSale = async () => {
    if (!cartItems.length || isCharging) return;
    if (!paymentMethod) {
      setNotice("No hay métodos de pago cargados en la base");
      return;
    }

    setIsCharging(true);

    const saleTime = getCurrentTime();
    const saleCustomer =
      saleChannel === "pedidos_ya" ? "Pedidos Ya" : customer.trim() || "Mostrador";
    const cartSnapshot = cartItems;
    const productsSnapshot = products;
    const newSale: Sale = {
      id: `V-${Date.now()}`,
      customer: saleCustomer,
      channel: saleChannel,
      items: cartSnapshot.reduce((total, item) => total + item.quantity, 0),
      method: paymentMethod,
      time: saleTime,
      total: saleTotal,
      subtotal: saleSubtotal,
      discount: saleDiscount,
      createdAt: new Date().toISOString(),
    };

    const soldQuantities = cartSnapshot.reduce<Record<string, number>>((acc, item) => {
      acc[item.productId] = (acc[item.productId] ?? 0) + item.quantity;
      return acc;
    }, {});
    const soldEntries = Object.entries(soldQuantities);
    const saleItems = cartSnapshot.map((item) => ({
      venta_id: newSale.id,
      producto_id: item.productId,
      producto: item.name,
      cantidad: item.quantity,
      precio: item.price,
      costo: item.cost,
      total: item.price * item.quantity,
      gustos: [],
    }));
    const localSaleItems: SaleItem[] = saleItems.map((item, index) => ({
      id: `${newSale.id}-${index}`,
      saleId: newSale.id,
      productId: item.producto_id,
      product: item.producto,
      quantity: item.cantidad,
      price: item.precio,
      cost: item.costo,
      total: item.total,
      flavors: item.gustos,
      createdAt: newSale.createdAt,
    }));

    const inventoryMovements = soldEntries.map(([productId, quantity]) => ({
      sucursal_id: DEFAULT_BRANCH_ID,
      producto_id: productId,
      tipo: "venta",
      cantidad: -quantity,
      nota: `Pedido ${newSale.id}`,
      usuario_id: sessionUser?.id ?? null,
    }));
    const salePayload: OfflineSalePayload = {
      venta: {
        id: newSale.id,
        sucursal_id: DEFAULT_BRANCH_ID,
        cliente: newSale.customer,
        canal: newSale.channel,
        productos: newSale.items,
        metodo: newSale.method,
        subtotal: newSale.subtotal,
        descuento: newSale.discount,
        total: newSale.total,
        hora: saleTime,
        estado: "pagada",
        usuario_id: sessionUser?.id ?? null,
      },
      items: saleItems,
      movimientos: inventoryMovements,
      stock: soldEntries.map(([productId, quantity]) => {
        const product = productsSnapshot.find((item) => item.id === productId);
        return {
          cantidad: quantity,
          id: productId,
          stock: Math.max(0, (product?.stock ?? 0) - quantity),
        };
      }),
      stock_gustos: [],
    };
    const offlineRecord: OfflineSaleRecord = {
      id: newSale.id,
      createdAt: newSale.createdAt,
      payload: salePayload,
      sale: newSale,
      saleItems: localSaleItems,
      productAdjustments: soldEntries.map(([id, quantity]) => ({ id, quantity })),
      flavorAdjustments: [],
    };

    try {
      await submitSalePayload(salePayload);

      setCart([]);
      setCustomer("Mostrador");
      setDiscountValue("");
      setDiscountMode("amount");
      setIsDiscountOpen(false);
      setSaleChannel("local");
      await loadData(`Pedido ${newSale.id} cobrado por ${formatCurrency(saleTotal)}`);
      setIsSupabaseReady(true);
    } catch (error) {
      setIsSupabaseReady(false);
      const canQueue =
        !window.navigator.onLine ||
        error instanceof TypeError ||
        Boolean((error as { retryable?: boolean }).retryable);

      if (!canQueue) {
        setNotice(
          error instanceof Error
            ? `No se pudo guardar el pedido: ${error.message}`
            : "No se pudo guardar el pedido en la base",
        );
        return;
      }

      await enqueueOfflineSale(offlineRecord);
      applyOfflineSaleLocally(offlineRecord);
      await refreshOfflineSaleCount();
      setCart([]);
      setCustomer("Mostrador");
      setDiscountValue("");
      setDiscountMode("amount");
      setIsDiscountOpen(false);
      setSaleChannel("local");
      setNotice(
        `Sin internet: pedido ${newSale.id} guardado en esta PC para sincronizar`,
      );
    } finally {
      setIsCharging(false);
    }
  };

  const saveProduct = async (product: ProductForm, previousStock?: number) => {
    const id = createAutomaticId(
      product.name,
      products.map((item) => item.id),
      product.id,
    );
    if (!id || !product.name.trim() || !product.category.trim()) {
      setNotice("Completá nombre y categoría del producto");
      return false;
    }

    const productPayload = {
        id,
        nombre: product.name.trim(),
        categoria: product.category.trim(),
        precio: product.price,
        costo: product.cost,
        stock: product.stock,
        stock_minimo: product.minStock,
        unidad: product.unit.trim() || "unid.",
        imagen: product.imageUrl.trim() || null,
        max_gustos: product.maxFlavors,
        consumo_gustos: product.flavorUsage,
        stock_anterior: previousStock,
      };

    try {
      const result = await submitJsonMutation("producto", {
        url: "/api/erp/productos",
        method: "POST",
        body: productPayload,
      });

      if (result.queued) {
        const localProduct: Product = { ...product, id };
        setProducts((current) =>
          current.some((item) => item.id === id)
            ? current.map((item) => (item.id === id ? localProduct : item))
            : [localProduct, ...current],
        );
        persistProductInCache(localProduct);
        return true;
      }

      await loadData("Producto guardado en stock");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo guardar el producto");
      return false;
    }
  };

  const performDeleteProduct = async (product: Product) => {
    try {
      const result = await submitJsonMutation("eliminación de producto", {
        url: "/api/erp/productos",
        method: "DELETE",
        body: { id: product.id },
      });

      if (result.queued) {
        setProducts((current) => current.filter((item) => item.id !== product.id));
        removeProductFromCache(product.id);
        return true;
      }

      await loadData("Producto eliminado");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo eliminar el producto");
      return false;
    }
  };

  const deleteProduct = (product: Product) => {
    setDeleteConfirmation({
      title: "Eliminar producto",
      description: `Vas a ocultar ${product.name} del catálogo activo. Las ventas viejas siguen guardadas.`,
      confirmLabel: "Eliminar producto",
      onConfirm: () => performDeleteProduct(product),
    });
  };

  const updateExpense = (key: string, value: number) => {
    setExpenses((current) =>
      current.some((expense) => expense.key === key)
        ? current.map((expense) =>
            expense.key === key ? { ...expense, amount: Math.max(0, value) } : expense,
          )
        : [
            ...current,
            {
              ...(defaultExpenseItems.find((expense) => expense.key === key) ?? {
                category: "General",
                key,
                label: key,
              }),
              amount: Math.max(0, value),
            },
          ],
    );
  };

  const saveExpenses = async (expensesToSave = expenses) => {
    try {
      const result = await submitJsonMutation("gastos", {
        url: "/api/erp/gastos",
        method: "POST",
        body: {
        gastos: expensesToSave.map((expense, index) => ({
          clave: expense.key,
          nombre: expense.label,
          categoria: expense.category,
          monto: expense.amount,
          orden: index + 1,
          activo: true,
        })),
        },
      });

      if (result.queued) {
        setExpenses(expensesToSave);
      } else {
        await loadData("Gastos guardados y ganancia recalculada");
      }
    } catch {
      setNotice("No se pudieron guardar los gastos en la base");
    }
  };

  const saveEmployee = async (person: StaffForm) => {
    if (!person.name.trim() || !person.role.trim()) {
      setNotice("Completá nombre y rol del empleado");
      return false;
    }

    const employeeId = person.id || createLocalUuid();
    const employeePayload = {
        id: employeeId,
        sucursal_id: DEFAULT_BRANCH_ID,
        nombre: person.name.trim(),
        rol: person.role.trim(),
        turno: person.shift.trim() || "Sin turno",
        sector: person.area.trim() || "General",
        estado: person.status,
        pin_codigo: person.pin?.trim() || null,
      };

    try {
      const result = await submitJsonMutation("empleado", {
        url: "/api/erp/empleados",
        method: "POST",
        body: employeePayload,
      });

      if (result.queued) {
        const localEmployee: StaffMember = {
          id: employeeId,
          name: person.name.trim(),
          role: person.role.trim(),
          shift: person.shift.trim() || "Sin turno",
          area: person.area.trim() || "General",
          status: person.status,
          pin: person.pin?.trim() || undefined,
        };
        setStaff((current) =>
          current.some((item) => item.id === person.id)
            ? current.map((item) => (item.id === person.id ? localEmployee : item))
            : [localEmployee, ...current],
        );
        return true;
      }

      await loadData("Empleado guardado");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo guardar el empleado");
      return false;
    }
  };

  const saveFlavor = async (flavor: FlavorForm) => {
    if (!flavor.name.trim()) {
      setNotice("Completá el nombre del gusto");
      return false;
    }

    const id = createAutomaticId(
      flavor.name,
      iceCreamFlavors.map((item) => item.id),
      flavor.id,
    );

    const flavorPayload = {
        id,
        nombre: flavor.name.trim(),
        categoria: getFlavorCategoryName(flavor.category),
        disponible: flavor.available,
        color: flavor.color,
        stock: flavor.stock,
        stock_minimo: flavor.minStock,
        unidad: flavor.unit.trim() || "porciones",
      };

    try {
      const result = await submitJsonMutation("gusto", {
        url: "/api/erp/gustos",
        method: "POST",
        body: flavorPayload,
      });

      if (result.queued) {
        const localFlavor: IceCreamFlavor = {
          ...flavor,
          id,
          name: flavor.name.trim(),
          category: getFlavorCategoryName(flavor.category),
          unit: flavor.unit.trim() || "porciones",
        };
        setIceCreamFlavors((current) =>
          current.some((item) => item.id === id)
            ? current.map((item) => (item.id === id ? localFlavor : item))
            : [localFlavor, ...current],
        );
        persistFlavorInCache(localFlavor);
        return true;
      }

      await loadData("Gusto actualizado");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo guardar el gusto");
      return false;
    }
  };

  const performDeleteFlavor = async (flavor: IceCreamFlavor) => {
    try {
      const result = await submitJsonMutation("eliminación de gusto", {
        url: "/api/erp/gustos",
        method: "DELETE",
        body: { id: flavor.id },
      });

      if (result.queued) {
        setIceCreamFlavors((current) =>
          current.filter((item) => item.id !== flavor.id),
        );
        removeFlavorFromCache(flavor.id);
        return true;
      }

      await loadData("Gusto eliminado");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo eliminar el gusto");
      return false;
    }
  };

  const deleteFlavor = (flavor: IceCreamFlavor) => {
    setDeleteConfirmation({
      title: "Eliminar gusto",
      description: `Vas a ocultar ${flavor.name} de gustos y baldes. El historial viejo sigue guardado.`,
      confirmLabel: "Eliminar gusto",
      onConfirm: () => performDeleteFlavor(flavor),
    });
  };

  const restoreDeletedSaleLocally = (sale: Sale) => {
    const deletedItems = saleItems.filter((item) => item.saleId === sale.id);

    setSales((current) => current.filter((item) => item.id !== sale.id));
    setSaleItems((current) => current.filter((item) => item.saleId !== sale.id));
    setProducts((current) =>
      current.map((product) => {
        const restoredQuantity = deletedItems
          .filter((item) => item.productId === product.id)
          .reduce((total, item) => total + item.quantity, 0);

        return restoredQuantity > 0
          ? { ...product, stock: product.stock + restoredQuantity }
          : product;
      }),
    );
    setIceCreamFlavors((current) =>
      current.map((flavor) => {
        const restoredQuantity = deletedItems.reduce((total, item) => {
          if (!item.flavors.includes(flavor.name)) return total;

          const product = products.find((entry) => entry.id === item.productId);
          const usagePerFlavor =
            item.flavors.length > 0 ? (product?.flavorUsage ?? 0) / item.flavors.length : 0;
          return total + item.quantity * usagePerFlavor;
        }, 0);

        return restoredQuantity > 0
          ? { ...flavor, stock: flavor.stock + restoredQuantity }
        : flavor;
      }),
    );
    persistDeletedSaleInCache(sale.id);
  };

  const performDeleteSale = async (sale: Sale) => {
    try {
      await removeOfflineSale(sale.id).catch(() => undefined);
      const result = await submitJsonMutation("eliminación de venta", {
        url: "/api/erp/ventas",
        method: "DELETE",
        body: { id: sale.id },
      });

      if (result.queued) {
        restoreDeletedSaleLocally(sale);
        await refreshOfflineSaleCount();
        return true;
      }

      await loadData("Venta eliminada y stock restaurado");
      await refreshOfflineSaleCount();
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo eliminar la venta");
      return false;
    }
  };

  const deleteSale = (sale: Sale) => {
    const deletedItems = saleItems.filter((item) => item.saleId === sale.id);
    const firstItem = deletedItems[0];
    const extraItems = Math.max(deletedItems.length - 1, 0);
    const saleSummary = firstItem
      ? `${firstItem.quantity}x ${firstItem.product}${
          extraItems > 0 ? ` y ${extraItems} producto${extraItems === 1 ? "" : "s"} más` : ""
        }`
      : `${sale.items} producto${sale.items === 1 ? "" : "s"}`;

    setDeleteConfirmation({
      title: "Eliminar venta",
      description: `Vas a eliminar: ${saleSummary}. Total: ${formatCurrency(sale.total)}. Método: ${sale.method}. Fecha: ${formatFullDateTime(sale.createdAt)}. El sistema va a restaurar el stock.`,
      confirmLabel: "Eliminar venta",
      onConfirm: () => performDeleteSale(sale),
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    setIsDeleting(true);
    const deleted = await deleteConfirmation.onConfirm();
    setIsDeleting(false);

    if (deleted) {
      setDeleteConfirmation(null);
    }
  };

  const loadFlavorBatch = async (
    flavor: IceCreamFlavor,
    kilos: number,
    portionsLoaded: number,
  ) => {
    if (kilos <= 0 || portionsLoaded <= 0) {
      setNotice("Completá los kilos del balde");
      return false;
    }

    const batchId = createLocalUuid();
    const batchPayload = {
        accion: "cargar",
        id: batchId,
        gusto_id: flavor.id,
        gusto: flavor.name,
        kilos,
        porciones_cargadas: portionsLoaded,
        stock_actual: flavor.stock,
        unidad: flavor.unit,
      };

    try {
      const result = await submitJsonMutation("balde", {
        url: "/api/erp/tandas-gustos",
        method: "POST",
        body: batchPayload,
      });

      if (result.queued) {
        setIceCreamFlavors((current) =>
          current.map((item) =>
            item.id === flavor.id
              ? { ...item, stock: item.stock + portionsLoaded }
              : item,
          ),
        );
        setFlavorBatches((current) => [
          {
            id: batchId,
            flavorId: flavor.id,
            flavorName: flavor.name,
            kilos,
            portionsLoaded,
            systemStockAtClose: null,
            suggestedYield: null,
            status: "activa",
            createdAt: new Date().toISOString(),
            closedAt: null,
          },
          ...current,
        ]);
        return true;
      }

      await loadData(`Balde cargado para ${flavor.name}`);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo cargar el balde");
      return false;
    }
  };

  const closeFlavorBatch = async (batch: FlavorBatch, currentStock: number) => {
    const closePayload = {
        accion: "cerrar",
        tanda_id: batch.id,
        gusto_id: batch.flavorId,
        stock_actual: currentStock,
      };

    try {
      const result = await submitJsonMutation("cierre de balde", {
        url: "/api/erp/tandas-gustos",
        method: "POST",
        body: closePayload,
      });

      if (result.queued) {
        setIceCreamFlavors((current) =>
          current.map((item) =>
            item.id === batch.flavorId ? { ...item, stock: 0 } : item,
          ),
        );
        setFlavorBatches((current) =>
          current.map((item) =>
            item.id === batch.id
              ? {
                  ...item,
                  status: "cerrada",
                  closedAt: new Date().toISOString(),
                  systemStockAtClose: currentStock,
                }
              : item,
          ),
        );
        return true;
      }

      await result.response?.json().catch(() => null);
      await loadData("Balde marcado como vacío");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo cerrar la tanda");
      return false;
    }
  };

  const performDeleteFlavorBatch = async (batch: FlavorBatch) => {
    try {
      const result = await submitJsonMutation("eliminación de balde", {
        url: "/api/erp/tandas-gustos",
        method: "POST",
        body: {
          accion: "eliminar",
          tanda_id: batch.id,
          gusto_id: batch.flavorId,
        },
      });

      if (result.queued) {
        setFlavorBatches((current) =>
          current.filter((item) => item.id !== batch.id),
        );
        if (batch.status === "activa") {
          setIceCreamFlavors((current) =>
            current.map((item) =>
              item.id === batch.flavorId ? { ...item, stock: 0 } : item,
            ),
          );
        }
        return true;
      }

      await loadData("Balde eliminado del historial");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo eliminar el balde");
      return false;
    }
  };

  const deleteFlavorBatch = (batch: FlavorBatch) => {
    setDeleteConfirmation({
      title: "Eliminar carga de balde",
      description: `Vas a eliminar la carga de ${batch.flavorName} del ${formatFullDateTime(batch.createdAt)}. Si ese mismo balde también estaba marcado vacío, se elimina todo ese registro y deja de contar en rankings.`,
      confirmLabel: "Eliminar carga",
      onConfirm: () => performDeleteFlavorBatch(batch),
    });
  };

  const performReopenFlavorBatch = async (batch: FlavorBatch) => {
    const hasOtherActiveBatch = flavorBatches.some(
      (item) =>
        item.id !== batch.id &&
        item.flavorId === batch.flavorId &&
        item.status === "activa" &&
        isManualFlavorBatch(item),
    );

    if (hasOtherActiveBatch) {
      setNotice("Ese gusto ya tiene un balde en uso. Eliminá la carga equivocada si querés corregir el historial.");
      return false;
    }

    try {
      const result = await submitJsonMutation("deshacer balde vacío", {
        url: "/api/erp/tandas-gustos",
        method: "POST",
        body: {
          accion: "reabrir",
          tanda_id: batch.id,
          gusto_id: batch.flavorId,
        },
      });

      if (result.queued) {
        setFlavorBatches((current) =>
          current.map((item) =>
            item.id === batch.id
              ? {
                  ...item,
                  status: "activa",
                  closedAt: null,
                  systemStockAtClose: null,
                  suggestedYield: null,
                }
              : item,
          ),
        );
        setIceCreamFlavors((current) =>
          current.map((item) =>
            item.id === batch.flavorId ? { ...item, stock: 1 } : item,
          ),
        );
        return true;
      }

      await loadData("Marcado vacío deshecho");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo deshacer el balde vacío");
      return false;
    }
  };

  const reopenFlavorBatch = (batch: FlavorBatch) => {
    setDeleteConfirmation({
      title: "Deshacer balde vacío",
      description: `Vas a quitar el marcado vacío de ${batch.flavorName} del ${batch.closedAt ? formatFullDateTime(batch.closedAt) : "historial"}. La carga queda guardada y el balde vuelve a figurar en uso.`,
      confirmLabel: "Deshacer vacío",
      onConfirm: () => performReopenFlavorBatch(batch),
    });
  };

  const registerAttendance = async (
    person: StaffMember,
    eventType: AttendanceEvent,
  ) => {
    const status = attendanceStatusMap.get(getStaffKey(person));

    if (eventType === "entrada" && status?.isWorking) {
      setNotice(`${person.name} ya tiene una entrada abierta`);
      return false;
    }

    if (eventType === "salida" && !status?.isWorking) {
      setNotice(`${person.name} no tiene una entrada abierta`);
      return false;
    }

    const attendanceId = createLocalUuid();
    const attendancePayload = {
        id: attendanceId,
        sucursal_id: DEFAULT_BRANCH_ID,
        empleado_id: person.id ?? null,
        empleado: person.name,
        tipo: eventType,
        turno:
          eventType === "salida"
            ? status?.shift ?? getShiftForStaff(person)
            : getShiftForStaff(person),
      };

    try {
      const result = await submitJsonMutation(`fichaje de ${person.name}`, {
        url: "/api/erp/asistencias",
        method: "POST",
        body: attendancePayload,
      });

      if (result.queued) {
        setAttendance((current) => [
          {
            id: attendanceId,
            staffId: person.id ?? null,
            employeeName: person.name,
            eventType,
            shift: attendancePayload.turno,
            recordedAt: new Date().toISOString(),
          },
          ...current,
        ]);
        return true;
      }

      await loadData(`${person.name} registro ${eventType}`);
      return true;
    } catch {
      setNotice(`${person.name} registro ${eventType}; no se pudo guardar`);
      return false;
    }
  };

const saveAttendanceRecord = async (record: AttendanceForm) => {
    const argentinaDate = parseArgentinaDateTimeInput(record.recordedAt);
    const attendanceId = record.id || createLocalUuid();
    const payload = {
      id: attendanceId,
      sucursal_id: DEFAULT_BRANCH_ID,
      empleado_id: record.staffId ?? null,
      empleado: record.employeeName,
      tipo: record.eventType,
      turno: record.shift,
      creado: argentinaDate.toISOString(),
    };

    try {
      const result = await submitJsonMutation("fichaje", {
        url: "/api/erp/asistencias",
        method: record.id ? "PATCH" : "POST",
        body: payload,
      });

      if (result.queued) {
        const localAttendance: Attendance = {
          id: attendanceId,
          staffId: record.staffId ?? null,
          employeeName: record.employeeName,
          eventType: record.eventType,
          shift: record.shift,
          recordedAt: argentinaDate.toISOString(),
        };
        setAttendance((current) =>
          record.id
            ? current.map((item) => (item.id === record.id ? localAttendance : item))
            : [localAttendance, ...current],
        );
        return true;
      }

      await loadData("Fichaje guardado");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo guardar el fichaje");
      return false;
    }
  };

  const handleCashierLogout = async () => {
    if (!window.navigator.onLine) {
      window.location.replace("/auth/login");
      return;
    }

    setIsCashierActionLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        if (response.status >= 500) {
          window.location.replace("/auth/login");
          return;
        }
        throw new Error(data?.error ?? "No se pudo cerrar sesión");
      }

      clearCurrentOfflineSession();
      window.location.replace("/auth/login");
    } catch (error) {
      if (error instanceof TypeError) {
        window.location.replace("/auth/login");
        return;
      }

      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo cerrar sesión. Revisá la conexión e intentá de nuevo.",
      );
      setIsCashierActionLoading(false);
      setIsEndingCashierSession(false);
    }
  };

  const saveCommissions = async (
    methods: Record<string, number>,
    channels: Record<SaleChannel, number>,
  ) => {
    try {
      const result = await submitJsonMutation("comisiones", {
        url: "/api/erp/comisiones",
        method: "POST",
        body: {
        canales: channels,
        metodos: Object.entries(methods).map(([nombre, comision]) => ({
          nombre,
          comision,
        })),
        },
      });

      if (result.queued) {
        setPaymentMethodCommissions(methods);
        setChannelCommissions(channels);
        return true;
      }

      await loadData("Comisiones actualizadas");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudieron guardar las comisiones");
      return false;
    }
  };

  const expenseHistoryPayload = (snapshotExpenses: Expense[]) =>
    snapshotExpenses.map((expense, index) => ({
      activo: true,
      categoria: expense.category,
      clave: expense.key,
      monto: expense.amount,
      nombre: expense.label,
      orden: index + 1,
    }));

  const editExpenseHistory = async (snapshot: ExpenseHistory) => {
    try {
      const result = await submitJsonMutation("historial de gastos", {
        url: "/api/erp/gastos-historial",
        method: "PUT",
        body: {
          id: snapshot.id,
          gastos: expenseHistoryPayload(snapshot.expenses),
        },
      });

      if (result.queued) {
        setExpenseHistory((current) =>
          current.map((item) => (item.id === snapshot.id ? snapshot : item)),
        );
        return true;
      }

      await loadData("Historial de gastos actualizado");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo editar el historial de gastos");
      return false;
    }
  };

  const performDeleteExpenseHistory = async (snapshot: ExpenseHistory) => {
    try {
      const result = await submitJsonMutation("historial de gastos", {
        url: "/api/erp/gastos-historial",
        method: "DELETE",
        body: { id: snapshot.id },
      });

      if (result.queued) {
        setExpenseHistory((current) => current.filter((item) => item.id !== snapshot.id));
        return true;
      }

      await loadData("Historial de gastos eliminado");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo eliminar el historial de gastos");
      return false;
    }
  };

  const deleteExpenseHistory = (snapshot: ExpenseHistory) => {
    setDeleteConfirmation({
      title: "Eliminar historial de gastos",
      description:
        "Si eliminás el último guardado, los gastos actuales vuelven al historial anterior.",
      confirmLabel: "Eliminar historial",
      onConfirm: () => performDeleteExpenseHistory(snapshot),
    });
  };

  const editCommissionHistory = async (snapshot: CommissionHistory) => {
    try {
      const result = await submitJsonMutation("historial de comisiones", {
        url: "/api/erp/comisiones-historial",
        method: "PUT",
        body: {
          id: snapshot.id,
          canales: snapshot.channels,
          metodos: snapshot.methods.map((method) => ({
            nombre: method.name,
            comision: method.rate,
          })),
        },
      });

      if (result.queued) {
        setCommissionHistory((current) =>
          current.map((item) => (item.id === snapshot.id ? snapshot : item)),
        );
        return true;
      }

      await loadData("Historial de comisiones actualizado");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo editar el historial de comisiones");
      return false;
    }
  };

  const performDeleteCommissionHistory = async (snapshot: CommissionHistory) => {
    try {
      const result = await submitJsonMutation("historial de comisiones", {
        url: "/api/erp/comisiones-historial",
        method: "DELETE",
        body: { id: snapshot.id },
      });

      if (result.queued) {
        setCommissionHistory((current) => current.filter((item) => item.id !== snapshot.id));
        return true;
      }

      await loadData("Historial de comisiones eliminado");
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo eliminar el historial de comisiones");
      return false;
    }
  };

  const deleteCommissionHistory = (snapshot: CommissionHistory) => {
    setDeleteConfirmation({
      title: "Eliminar historial de comisiones",
      description:
        "Si eliminás el último guardado, las comisiones actuales vuelven al historial anterior.",
      confirmLabel: "Eliminar historial",
      onConfirm: () => performDeleteCommissionHistory(snapshot),
    });
  };

  if (isBooting) {
    return <InitialLoadingScreen />;
  }

  if (!sessionUser) {
    return <InitialLoadingScreen />;
  }

  return (
    <div
      className="erp-theme erp-app-shell bg-[var(--erp-bg)] text-[var(--erp-text)]"
      style={themeStyle}
    >
      <div className="erp-app-frame mx-auto flex w-full max-w-[1680px]">
        <aside className="erp-sidebar hidden shrink-0 border-r border-[var(--erp-border)] bg-[var(--erp-sidebar)] lg:flex lg:flex-col">
          <div className="erp-sidebar-header border-b border-[var(--erp-border)] p-5">
            <div className="flex items-center gap-3">
              <BrandLogo theme={themeSettings} />
              <div>
                <p
                  className="erp-sidebar-brand text-2xl leading-tight text-[var(--erp-text)]"
                  style={{ fontFamily: "var(--erp-brand-font)" }}
                >
                  {themeSettings.brandName}
                </p>
              </div>
            </div>
          </div>

          <nav className="erp-sidebar-nav flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
            {navGroups.map((group) => {
              const groupItems = group.items
                .map((id) => visibleNavItems.find((item) => item.id === id))
                .filter((item): item is NavItem => Boolean(item));

              if (!groupItems.length) return null;

              return (
                <div className="space-y-2" key={group.label}>
                  <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--erp-muted)]">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {groupItems.map((item) => (
                      <NavButton
                        key={item.id}
                        active={safeActiveView === item.id}
                        item={item}
                        onClick={() => setActiveView(item.id)}
                      />
                    ))}
                    {group.label === "Sistema" &&
                      canManageBusiness && (
                        <button
                          className="erp-nav-button flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-[var(--erp-muted)] transition hover:bg-white/5 hover:text-[var(--erp-text)]"
                          onClick={() => setIsUsersOpen(true)}
                          type="button"
                        >
                          <Users className="size-4" />
                          Usuarios
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="erp-sidebar-footer shrink-0 border-t border-[var(--erp-border)] p-4">
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <CheckCircle2 className="size-4" />
                Caja operativa
              </div>
            </div>
          </div>
        </aside>

        <main className="erp-main min-w-0 flex-1">
          <header className="erp-topbar z-20 shrink-0 border-b border-[var(--erp-border)] bg-[var(--erp-header)] px-4 py-4 backdrop-blur md:px-6">
            <div className="erp-topbar-inner flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="erp-header-brand min-w-0">
                <p className="erp-header-kicker text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                  {themeSettings.brandSubtitle}
                </p>
                <h1
                  className="erp-header-title mt-1 text-4xl leading-none tracking-normal text-[var(--erp-text)] md:text-5xl"
                  style={{ fontFamily: "var(--erp-brand-font)" }}
                >
                  {themeSettings.brandName}
                </h1>
              </div>

              <div className="erp-header-actions flex flex-wrap items-center justify-end gap-2">
                {sessionUser ? (
                  <>
                    <div
                      className={cn(
                        "erp-connection-status flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold",
                        isOnline
                          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                          : "border-amber-300/30 bg-amber-300/10 text-amber-100",
                      )}
                    >
                      {isOnline ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <TriangleAlert className="size-4" />
                      )}
                      {isOnline ? "Online" : "Sin internet"}
                      {pendingOfflineSales > 0 && (
                        <span className="rounded-md bg-black/25 px-2 py-0.5 text-xs">
                          {isSyncingOfflineSales
                            ? "Sincronizando..."
                            : `${pendingOfflineSales} pendientes`}
                        </span>
                      )}
                    </div>
                    <div className="erp-desktop-update-action">
                      <DesktopUpdateButton
                        isWaitingForOfflineSync={isDesktopUpdateWaitingForSync}
                        onCheck={checkDesktopUpdate}
                        onDownload={downloadDesktopUpdate}
                        onInstall={installDesktopUpdate}
                        update={desktopUpdate}
                      />
                    </div>
                    <Button
                      asChild
                      className="erp-desktop-download-action border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20"
                      size="sm"
                      variant="outline"
                    >
                      <a href="/api/desktop/installer">
                        <ArrowDownCircle className="size-4" />
                        Descargar
                      </a>
                    </Button>
                    <Button
                      className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                      onClick={() => setIsHelpOpen(true)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <CircleHelp className="size-4" />
                      Ayuda
                    </Button>

                    <Button
                      className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                      onClick={() => setIsEndingCashierSession(true)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <LogOut className="size-4" />
                      Salir de caja
                    </Button>
                  </>
                ) : (
                  <Button
                    asChild
                    className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                    size="sm"
                    variant="outline"
                  >
                    <Link href="/auth/login">Iniciar sesión</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="erp-mobile-top-nav mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {visibleNavItems.map((item) => (
                <NavButton
                  key={item.id}
                  active={safeActiveView === item.id}
                  compact
                  item={item}
                  onClick={() => setActiveView(item.id)}
                />
              ))}
              {canManageBusiness ? (
                <button
                  className="erp-nav-button flex shrink-0 items-center gap-3 rounded-lg border border-[var(--erp-border)] bg-[var(--erp-panel-alt)] px-3 py-3 text-sm font-semibold text-[var(--erp-muted)] transition hover:bg-white/5 hover:text-[var(--erp-text)]"
                  onClick={() => setIsUsersOpen(true)}
                  type="button"
                >
                  <Users className="size-4" />
                  Usuarios
                </button>
              ) : null}
            </div>
          </header>

          <section className="erp-content min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
            {safeActiveView === "caja" && (
              <CajaView
                cartItems={cartItems}
                category={category}
                categories={categories}
                canSeeFinancialDetails={canManageBusiness}
                channelCommissions={channelCommissions}
                clearFromCart={clearFromCart}
                completeSale={completeSale}
                confirmFlavorSelection={confirmFlavorSelection}
                filteredProducts={filteredProducts}
                flavors={iceCreamFlavors}
                addQuantityToLine={addQuantityToLine}
                cancelCart={cancelCart}
                handleProductClick={handleProductClick}
                isCharging={isCharging}
                lowStock={lowStock}
                paymentMethod={paymentMethod}
                paymentMethodCommissions={paymentMethodCommissions}
                paymentMethods={paymentMethods}
                query={query}
                removeFromCart={removeFromCart}
                removeSelectedFlavor={removeSelectedFlavor}
                saleChannel={saleChannel}
                discountMode={discountMode}
                discountValue={discountValue}
                isDiscountOpen={isDiscountOpen}
                saleDiscount={saleDiscount}
                saleSubtotal={saleSubtotal}
                saleTotal={saleTotal}
                selectedFlavors={selectedFlavors}
                selectedProduct={selectedProduct}
                setCategory={setCategory}
                setDiscountMode={setDiscountMode}
                setDiscountValue={setDiscountValue}
                setIsDiscountOpen={setIsDiscountOpen}
                setPaymentMethod={setPaymentMethod}
                setQuery={setQuery}
                setSaleChannel={setSaleChannel}
                setSelectedProduct={setSelectedProduct}
                toggleFlavor={toggleFlavor}
              />
            )}

            {safeActiveView === "cierre-caja" && (
              <CierreCajaView
                onOfflineQueueChange={refreshOfflineSaleCount}
                sales={sales}
              />
            )}

            {safeActiveView === "ventas" && (
              <HistorialVentasView
                canDeleteSales={canManageBusiness}
                deleteSale={deleteSale}
                saleItems={saleItems}
                sales={sales}
              />
            )}

            {safeActiveView === "analisis" && (
              <AnalisisView
                channelCommissions={channelCommissions}
                commissionHistory={commissionHistory}
                expenses={expenses}
                expenseHistory={expenseHistory}
                flavorBatches={flavorBatches}
                paymentMethodCommissions={paymentMethodCommissions}
                paymentMethods={paymentMethods}
                saleItems={saleItems}
                sales={sales}
              />
            )}

            {safeActiveView === "historial" && (
              <HistorialView
                channelCommissions={channelCommissions}
                commissionHistory={commissionHistory}
                expenses={expenses}
                expenseHistory={expenseHistory}
                paymentMethodCommissions={paymentMethodCommissions}
                saleItems={saleItems}
                sales={sales}
              />
            )}

            {safeActiveView === "finanzas" && (
              <FinanzasView
                expenses={expenses}
                expenseHistory={expenseHistory}
                commissionCost={commissionCost}
                channelCommissions={channelCommissions}
                commissionHistory={commissionHistory}
                deleteCommissionHistory={deleteCommissionHistory}
                deleteExpenseHistory={deleteExpenseHistory}
                editCommissionHistory={editCommissionHistory}
                editExpenseHistory={editExpenseHistory}
                paymentMethodCommissions={paymentMethodCommissions}
                paymentMethods={paymentMethods}
                saveCommissions={saveCommissions}
                saveExpenses={saveExpenses}
                updateExpense={updateExpense}
              />
            )}

            {safeActiveView === "empleados" && (
              <EmpleadosView
                attendance={attendance}
                attendanceStatusMap={attendanceStatusMap}
                currentCashierName={null}
                registerAttendance={registerAttendance}
                staff={staff}
              />
            )}

            {safeActiveView === "historial-empleados" && (
              <HistorialEmpleadosView
                attendance={attendance}
                saveAttendanceRecord={saveAttendanceRecord}
                saveEmployee={saveEmployee}
                staff={staff}
              />
            )}

            {safeActiveView === "stock" && (
              <StockView
                canManageStock={canManageBusiness}
                closeFlavorBatch={closeFlavorBatch}
                deleteFlavorBatch={deleteFlavorBatch}
                deleteFlavor={deleteFlavor}
                deleteProduct={deleteProduct}
                flavors={iceCreamFlavors}
                flavorBatches={flavorBatches}
                loadFlavorBatch={loadFlavorBatch}
                lowStock={lowStock}
                products={products}
                reopenFlavorBatch={reopenFlavorBatch}
                saveProduct={saveProduct}
                saveFlavor={saveFlavor}
                unitsInStock={unitsInStock}
              />
            )}

            {safeActiveView === "diseno" && sessionUser?.role === "admin" && (
              <DisenoView
                isSaving={isSavingTheme}
                onApplyPreset={applyThemePreset}
                onReset={resetTheme}
                onSave={() => saveTheme()}
                onUpdate={updateThemeDraft}
                theme={themeDraft}
              />
            )}

            {safeActiveView === "auditoria" && (
              <AuditoriaView auditLogs={auditLogs} />
            )}
          </section>

          <HelpModal
            activeView={safeActiveView}
            groups={helpGuideGroups}
            isOpen={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
          />
          <DeleteConfirmModal
            confirmLabel={deleteConfirmation?.confirmLabel ?? "Eliminar"}
            description={deleteConfirmation?.description ?? ""}
            isLoading={isDeleting}
            isOpen={Boolean(deleteConfirmation)}
            onCancel={() => {
              if (!isDeleting) {
                setDeleteConfirmation(null);
              }
            }}
            onConfirm={confirmDelete}
            title={deleteConfirmation?.title ?? "Confirmar eliminación"}
          />
          <UserAdminModal
            isOpen={isUsersOpen}
            onClose={() => setIsUsersOpen(false)}
          />
          <DesktopUpdateInstalledModal
            isOpen={shouldShowDesktopUpdateNotice}
            onClose={closeDesktopUpdateNotice}
            update={desktopUpdate}
          />
          <CashierExitModal
            isOnline={isOnline}
            isLoading={isCashierActionLoading}
            isOpen={isEndingCashierSession}
            onClose={() => {
              if (!isCashierActionLoading) {
                setIsEndingCashierSession(false);
              }
            }}
            onConfirm={handleCashierLogout}
          />
        </main>
      </div>
    </div>
  );
}

function InitialLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070809] text-zinc-100">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300" />
        <div className="text-center">
          <p className="font-semibold">Cargando sistema</p>
          <p className="mt-1 text-sm text-zinc-500">
            Preparando configuración y datos
          </p>
        </div>
      </div>
    </div>
  );
}

function NavButton({
  active,
  compact,
  item,
  onClick,
}: {
  active: boolean;
  compact?: boolean;
  item: NavItem;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : undefined}
      className={cn(
        "erp-nav-button flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition",
        compact && "shrink-0 border",
        active
          ? "border-[var(--erp-primary)] bg-[var(--erp-primary)] text-[var(--erp-primary-text)] shadow-[0_0_24px_var(--erp-primary-soft)]"
          : "border-[var(--erp-border)] text-[var(--erp-muted)] hover:bg-white/5 hover:text-[var(--erp-text)]",
        compact && !active && "bg-[var(--erp-panel-alt)]",
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-4" />
      {compact ? item.mobileLabel ?? item.label : item.label}
    </button>
  );
}

export function CashierSelectionModal({
  attendanceStatusMap,
  canSkip,
  currentCashierName,
  isLoading,
  isOpen,
  onClose,
  onConfirm,
  onSkip,
  staff,
}: {
  attendanceStatusMap: Map<string, AttendanceStatus>;
  canSkip: boolean;
  currentCashierName: string | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (person: StaffMember) => Promise<void>;
  onSkip: () => void;
  staff: StaffMember[];
}) {
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const preferred =
      staff.find((person) => person.name === currentCashierName) ?? staff[0] ?? null;
    setSelectedKey(preferred ? getStaffKey(preferred) : "");
    setSearch("");
  }, [currentCashierName, isOpen, staff]);

  const filteredStaff = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return staff;

    return staff.filter((person) =>
      [person.name, person.role, person.area, person.shift]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [search, staff]);

  const selectedStaff =
    filteredStaff.find((person) => getStaffKey(person) === selectedKey) ??
    staff.find((person) => getStaffKey(person) === selectedKey) ??
    null;

  if (!isOpen) return null;

  return (
    <div className="erp-modal-shell fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="erp-modal-panel w-full max-w-4xl overflow-hidden rounded-lg border border-white/10 bg-[#0d0f10] shadow-2xl">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-zinc-100">Quién está usando la caja
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Elegi el empleado que queda a cargo. Si no tenia entrada abierta,
                se marca automáticamente.
              </p>
            </div>
            {!isLoading && canSkip && (
              <Button
                className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                onClick={onClose}
                type="button"
                variant="outline"
              >
                Cerrar
              </Button>
            )}
          </div>
        </div>

        <div className="erp-modal-scroll-area max-h-[calc(100dvh-13rem)] space-y-4 overflow-y-auto p-5">
          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Buscar empleado
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#080a0c] px-3">
              <Search className="size-4 text-zinc-500" />
              <input
                className="h-11 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre, rol o sector"
                value={search}
              />
            </div>
          </label>

          <div className="grid max-h-[50vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
            {filteredStaff.map((person) => {
              const status = attendanceStatusMap.get(getStaffKey(person));
              const isSelected = getStaffKey(person) === selectedKey;

              return (
                <button
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    isSelected
                      ? "border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_0_1px_var(--erp-primary-border)]"
                      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5",
                  )}
                  key={person.id ?? person.name}
                  onClick={() => setSelectedKey(getStaffKey(person))}
                  type="button"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-zinc-100">{person.name}</p>
                    <Badge className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/5">
                      {person.role}
                    </Badge>
                    {status?.isWorking && (
                      <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/10">
                        En jornada
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
                      {person.area || "Sin sector"}
                    </span>
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
                      {person.shift || "Sin turno"}
                    </span>
                  </div>

                  {status?.isWorking && status.startedAt && (
                    <div
                      className={cn(
                        "mt-3 rounded-lg border px-3 py-2 text-sm",
                        status.alert === "over"
                          ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
                          : status.alert === "soon"
                            ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                            : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
                      )}
                    >
                      Trabajando hace {formatWorkedDuration(status.workedMinutes)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filteredStaff.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
              No encontramos empleados con esa búsqueda.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">
            {selectedStaff
              ? `La caja quedara asociada a ${selectedStaff.name}.`
              : "Elegi un empleado para seguir."}
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            {canSkip && (
              <Button
                className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                disabled={isLoading}
                onClick={onSkip}
                type="button"
                variant="outline"
              >
                Ahora no
              </Button>
            )}
            <Button
              className="bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
              disabled={!selectedStaff || isLoading}
              onClick={() => selectedStaff && onConfirm(selectedStaff)}
              type="button"
            >
              {isLoading ? "Guardando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CashierExitModal({
  isOnline,
  isLoading,
  isOpen,
  onClose,
  onConfirm,
}: {
  isOnline: boolean;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="erp-modal-shell fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="erp-modal-panel w-full max-w-xl overflow-hidden rounded-lg border border-white/10 bg-[#0d0f10] shadow-2xl">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-lg font-semibold text-zinc-100">
            {isOnline ? "Cerrar sesión" : "Cambiar usuario"}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {isOnline
              ? "Se va a cerrar la cuenta actual en esta computadora."
              : "Vas a volver al inicio de sesión offline de esta computadora."}
          </p>
        </div>

        <div className="erp-modal-scroll-area p-5">
          <div
            className={cn(
              "rounded-xl border p-4 text-sm",
              isOnline
                ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                : "border-amber-300/30 bg-amber-300/10 text-amber-100",
            )}
          >
            {isOnline
              ? "Las entradas y salidas de empleados se manejan desde la sección Empleados."
              : "Podés entrar con cualquier usuario que ya haya iniciado sesión online en esta PC. La contraseña se verifica localmente."}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
            disabled={isLoading}
            onClick={onClose}
            type="button"
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            className="bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isOnline ? "Cerrar sesión" : "Cambiar usuario"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DesktopUpdateInstalledModal({
  isOpen,
  onClose,
  update,
}: {
  isOpen: boolean;
  onClose: () => void;
  update: DesktopUpdaterState;
}) {
  if (!isOpen) return null;

  const version = update.currentVersion ?? update.version ?? "-";
  const updatedAt = update.updatedAt
    ? formatFullDateTime(update.updatedAt)
    : "Recien instalada";

  return (
    <div className="erp-modal-shell fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="erp-modal-panel w-full max-w-md overflow-hidden rounded-lg border border-emerald-300/25 bg-[#0d0f10] shadow-2xl shadow-emerald-950/30">
        <div className="flex items-start gap-4 border-b border-white/10 px-5 py-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-300 text-zinc-950 shadow-[0_0_24px_rgba(52,211,153,0.22)]">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-zinc-100">
              Actualizacion instalada
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              La caja quedo actualizada y lista para seguir trabajando.
            </p>
          </div>
          <Button
            className="size-9 shrink-0 border-white/10 bg-white/5 p-0 text-zinc-100 hover:bg-white/10"
            onClick={onClose}
            type="button"
            variant="outline"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-3 p-5">
          <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
              Version actual
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-100">v{version}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Fecha
              </p>
              <p className="mt-2 text-sm font-semibold text-zinc-100">{updatedAt}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Anterior
              </p>
              <p className="mt-2 text-sm font-semibold text-zinc-100">
                {update.previousVersion ? `v${update.previousVersion}` : "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-white/10 px-5 py-4">
          <Button
            className="bg-emerald-300 font-semibold text-zinc-950 hover:bg-emerald-200"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaginationControls({
  currentPage,
  label,
  onPageChange,
  pageSize = PAGE_SIZE,
  totalItems,
}: {
  currentPage: number;
  label: string;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems: number;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= pageSize) {
    return null;
  }

  return (
    <div className="erp-pagination flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-sm text-zinc-500">
        {label} • Página {currentPage} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          size="sm"
          type="button"
          variant="outline"
        >
          Anterior
        </Button>
        <Button
          className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          size="sm"
          type="button"
          variant="outline"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "cyan" | "amber" | "green" }) {
  const colors = {
    cyan: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    green: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  };

  return (
    <Badge className={cn("max-w-full truncate hover:bg-inherit", colors[tone])}>
      {label}
    </Badge>
  );
}

function CompactFilterGroup<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: Array<{ id: T; label: string }>;
  value: T;
}) {
  return (
    <div className="erp-compact-filter flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      {options.map((option) => (
        <button
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-semibold transition",
            value === option.id
              ? "border-cyan-300 bg-cyan-300 text-zinc-950"
              : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
          )}
          key={option.id}
          onClick={() => onChange(option.id)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function CajaView({
  cartItems,
  category,
  categories,
  canSeeFinancialDetails,
  channelCommissions,
  clearFromCart,
  completeSale,
  confirmFlavorSelection,
  discountMode,
  discountValue,
  filteredProducts,
  flavors,
  addQuantityToLine,
  cancelCart,
  handleProductClick,
  isCharging,
  isDiscountOpen,
  lowStock,
  paymentMethod,
  paymentMethodCommissions,
  paymentMethods,
  query,
  removeFromCart,
  removeSelectedFlavor,
  saleChannel,
  saleDiscount,
  saleSubtotal,
  saleTotal,
  selectedFlavors,
  selectedProduct,
  setCategory,
  setDiscountMode,
  setDiscountValue,
  setIsDiscountOpen,
  setPaymentMethod,
  setQuery,
  setSaleChannel,
  setSelectedProduct,
  toggleFlavor,
}: {
  cartItems: CartLine[];
  category: string;
  categories: string[];
  canSeeFinancialDetails: boolean;
  channelCommissions: Record<SaleChannel, number>;
  clearFromCart: (id: string) => void;
  completeSale: () => void;
  confirmFlavorSelection: () => void;
  discountMode: DiscountMode;
  discountValue: string;
  filteredProducts: Product[];
  flavors: IceCreamFlavor[];
  addQuantityToLine: (lineId: string) => void;
  cancelCart: () => void;
  handleProductClick: (product: Product) => void;
  isCharging: boolean;
  isDiscountOpen: boolean;
  lowStock: Product[];
  paymentMethod: string;
  paymentMethodCommissions: Record<string, number>;
  paymentMethods: string[];
  query: string;
  removeFromCart: (id: string) => void;
  removeSelectedFlavor: (index: number) => void;
  saleChannel: SaleChannel;
  saleDiscount: number;
  saleSubtotal: number;
  saleTotal: number;
  selectedFlavors: string[];
  selectedProduct: Product | null;
  setCategory: (category: string) => void;
  setDiscountMode: (mode: DiscountMode) => void;
  setDiscountValue: (value: string) => void;
  setIsDiscountOpen: (open: boolean) => void;
  setPaymentMethod: (method: string) => void;
  setQuery: (query: string) => void;
  setSaleChannel: (channel: SaleChannel) => void;
  setSelectedProduct: (product: Product | null) => void;
  toggleFlavor: (flavorName: string) => void;
}) {
  const realCategories = categories.filter((item) => item !== "Todos");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [lowStockView, setLowStockView] = useState<"productos" | "gustos">(
    "productos",
  );
  const [flavorSearch, setFlavorSearch] = useState("");
  const lowFlavorStock: IceCreamFlavor[] = [];
  const categorySelected = category !== "Todos";
  const cartQuantityByProduct = cartItems.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.productId] = (acc[item.productId] ?? 0) + item.quantity;
      return acc;
    },
    {},
  );
  const visibleFlavorGroups = groupFlavorsByCategory(
    flavors.filter((flavor) => {
      const normalizedQuery = flavorSearch.trim().toLowerCase();
      return (
        !normalizedQuery ||
        flavor.name.toLowerCase().includes(normalizedQuery) ||
        flavor.category.toLowerCase().includes(normalizedQuery)
      );
    }),
  );
  const displayedProducts = showLowStockOnly
    ? filteredProducts.filter(isProductLowStock)
    : filteredProducts;
  const displayedLowFlavors: IceCreamFlavor[] = [];
  const visibleCount = displayedProducts.length;
  const showCategoryBrowser = !categorySelected && !showLowStockOnly;
  const categoryCards = realCategories.map((item) => ({
      id: item,
      label: formatCategoryLabel(item),
      icon: getProductCategoryIcon(item),
    }));
  const channelCommissionRate = channelCommissions[saleChannel] ?? 0;
  const paymentCommissionRate = paymentMethodCommissions[paymentMethod] ?? 0;
  const totalCommissionRate = channelCommissionRate + paymentCommissionRate;
  const estimatedCommission = saleTotal * (totalCommissionRate / 100);

  useEffect(() => {
    setFlavorSearch("");
  }, [selectedProduct]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
      <DarkPanel className="overflow-hidden">
        <PanelHeader
          icon={ShoppingCart}
          title="Caja"
          right={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                className={cn(
                  "border-amber-300/30 font-semibold hover:bg-amber-300/20",
                  showLowStockOnly
                    ? "bg-amber-300 text-zinc-950"
                    : "bg-amber-300/10 text-amber-100",
                )}
                onClick={() => {
                  setShowLowStockOnly((current) => !current);
                  setLowStockView("productos");
                  setQuery("");
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <TimerReset className="size-4" />
                Bajo stock
              </Button>
              <StatusBadge
                tone={showLowStockOnly ? "amber" : "cyan"}
                label={`${visibleCount} visibles`}
              />
            </div>
          }
        />

        {showCategoryBrowser ? (
          <div className="space-y-4 p-4">
            <div>
              <p className="font-semibold text-zinc-100">Categorías</p>
            </div>

            {lowStock.length > 0 && (
              <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-amber-100">
                      Hay cosas para reponer
                    </p>
                    <p className="mt-1 text-sm text-amber-50/80">
                      {lowStock.length} producto{lowStock.length === 1 ? "" : "s"} en bajo stock.
                    </p>
                  </div>
                  <Button
                    className="w-full border-amber-300/30 bg-black/20 text-amber-100 hover:bg-black/30 sm:w-auto"
                    onClick={() => {
                      setShowLowStockOnly(true);
                      setQuery("");
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Ver faltantes
                  </Button>
                </div>
              </div>
            )}

            <div className="erp-category-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categoryCards.map((item) => {
              const Icon = item.icon;

              return (
              <button
                className={cn(
                  "erp-category-card flex min-h-28 items-center gap-4 rounded-lg border p-4 text-left transition",
                  "border-white/10 bg-white/5 text-zinc-300 hover:border-cyan-300/40 hover:bg-white/10",
                )}
                key={item.id}
                onClick={() => setCategory(item.id)}
                type="button"
              >
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-lg border",
                    "border-white/10 bg-black/20 text-cyan-200",
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <div>
                  <p className="text-base font-semibold">{item.label}</p>
                </div>
              </button>
            )})}
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <div className="border-b border-white/10 pb-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0">
                    <Button
                      className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                      onClick={() => {
                        if (showLowStockOnly) {
                          setShowLowStockOnly(false);
                        }
                        setCategory("Todos");
                        setQuery("");
                      }}
                      type="button"
                      variant="outline"
                    >
                      <ArrowLeft className="size-4" />
                      Volver
                    </Button>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-100">
                      {showLowStockOnly && !categorySelected ? "Bajo stock" : formatCategoryLabel(category)}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {showLowStockOnly && lowStockView === "gustos"
                        ? `${displayedLowFlavors.length} gusto${displayedLowFlavors.length === 1 ? "" : "s"}`
                        : `${displayedProducts.length} producto${displayedProducts.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </div>

                <div className="w-full lg:w-auto">
                  <div className="relative lg:w-[320px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      className="h-11 w-full rounded-lg border border-white/10 bg-black/30 pl-10 pr-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-cyan-300/60"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={
                        showLowStockOnly && !categorySelected
                          ? "Buscar faltantes"
                          : `Buscar en ${category.toLowerCase()}`
                      }
                      value={query}
                    />
                  </div>
                </div>
              </div>
            </div>

            {showLowStockOnly && (
              <div
                className={cn(
                  "rounded-lg border px-4 py-3",
                  showLowStockOnly
                    ? "border-amber-300/20 bg-amber-300/10"
                    : "border-white/10 bg-black/20",
                )}
              >
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-zinc-100">
                      Bajo stock
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {showLowStockOnly && lowStockView === "gustos"
                        ? `${lowFlavorStock.length} gusto${lowFlavorStock.length === 1 ? "" : "s"} están en o por debajo del mínimo.`
                        : `${lowStock.length} producto${lowStock.length === 1 ? "" : "s"} están en o por debajo del mínimo.`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className={cn(
                        "font-semibold hover:bg-amber-300/20",
                        lowStockView === "productos"
                          ? "border-amber-300 bg-amber-300 text-zinc-950"
                          : "border-amber-300/30 bg-white/5 text-zinc-100",
                      )}
                      onClick={() => setLowStockView("productos")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Productos
                    </Button>
                    <Button
                      className={cn(
                        "font-semibold hover:bg-amber-300/20",
                        lowStockView === "gustos"
                          ? "border-amber-300 bg-amber-300 text-zinc-950"
                          : "border-amber-300/30 bg-white/5 text-zinc-100",
                      )}
                      onClick={() => setLowStockView("gustos")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Gustos
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {(!showLowStockOnly || lowStockView === "productos") && (
              <div className="erp-product-grid grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {displayedProducts.map((product) => {
                const quantityInCart = cartQuantityByProduct[product.id] ?? 0;
                const reachedLimit = quantityInCart >= product.stock;
                const unavailable = product.stock <= 0 || reachedLimit;
                const isLow = isProductLowStock(product);

                return (
                  <button
                    className={cn(
                      "erp-product-card group overflow-hidden rounded-lg border text-left transition disabled:cursor-not-allowed",
                      unavailable
                        ? "border-white/5 bg-zinc-900/70 opacity-45 grayscale"
                        : isLow
                          ? "border-amber-300/40 bg-[#191512] hover:-translate-y-0.5 hover:border-amber-300/60"
                        : "border-white/10 bg-[#121516] hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-[#161b1c]",
                    )}
                    disabled={unavailable}
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    type="button"
                  >
                    <div className="relative aspect-[4/3] bg-black">
                      {product.imageUrl ? (
                        <div
                          aria-label={product.name}
                          className="size-full bg-cover bg-center transition duration-300 group-hover:scale-105"
                          role="img"
                          style={{ backgroundImage: `url("${product.imageUrl}")` }}
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-[#0f1213] text-zinc-500">
                          <Package className="size-9" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <Badge className="border-white/10 bg-black/50 text-zinc-100 hover:bg-black/50">
                          {reachedLimit
                            ? "Límite en carrito"
                            : isLow
                              ? "Bajo stock"
                              : product.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="min-h-10 font-semibold leading-snug text-zinc-100">
                        {product.name}
                      </p>
                      <div className="mt-3 flex items-end justify-between gap-3">
                        <p className="text-lg font-semibold text-cyan-100">
                          {formatCurrency(product.price)}
                        </p>
                        <p className={cn("text-xs", isLow ? "text-amber-200" : "text-zinc-500")}>
                          {quantityInCart}/{product.stock} {product.unit}
                        </p>
                      </div>
                    </div>
                  </button>
                );
                })}
              </div>
            )}

            {showLowStockOnly && lowStockView === "gustos" && (
              <div className="erp-product-grid grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {displayedLowFlavors.map((flavor) => (
                  <div
                    className="rounded-lg border border-amber-300/30 bg-[#191512] p-4"
                    key={flavor.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-3 rounded-full border border-black/10"
                            style={{ backgroundColor: flavor.color }}
                          />
                          <p className="truncate font-semibold text-zinc-100">
                            {flavor.name}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/5">
                            {formatCategoryLabel(flavor.category)}
                          </Badge>
                        </div>
                      </div>
                      <Badge className="shrink-0 border-amber-300/20 bg-amber-300/10 text-amber-100 hover:bg-amber-300/10">
                        Reponer
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-3">
                        <p className="text-xs uppercase text-zinc-500">Stock</p>
                        <p className="mt-2 text-2xl font-semibold leading-none text-amber-100">
                          {flavor.stock}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {flavor.unit}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-3">
                        <p className="text-xs uppercase text-zinc-500">Mínimo</p>
                        <p className="mt-2 text-2xl font-semibold leading-none text-zinc-100">
                          {flavor.minStock}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {flavor.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {((!showLowStockOnly || lowStockView === "productos") && !displayedProducts.length) && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
                No hay productos para mostrar con ese filtro.
              </div>
            )}

            {showLowStockOnly && lowStockView === "gustos" && !displayedLowFlavors.length && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
                No hay gustos para mostrar con ese filtro.
              </div>
            )}
          </div>
        )}

        {selectedProduct && (
          <div className="erp-flavor-modal fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="erp-flavor-card w-full max-w-3xl overflow-hidden rounded-lg border border-white/10 bg-[#101315] shadow-2xl">
              <div className="grid md:grid-cols-[260px_1fr]">
                <div className="erp-flavor-image relative min-h-56 bg-black">
                  {selectedProduct.imageUrl ? (
                    <div
                      aria-label={selectedProduct.name}
                      className="absolute inset-0 size-full bg-cover bg-center"
                      role="img"
                      style={{ backgroundImage: `url("${selectedProduct.imageUrl}")` }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0f1213] text-zinc-500">
                      <Package className="size-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <button
                    className="absolute right-3 top-3 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm font-semibold text-zinc-100"
                    onClick={() => setSelectedProduct(null)}
                    type="button"
                  >
                    Cerrar
                  </button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xl font-semibold">{selectedProduct.name}</p>
                    <p className="mt-1 text-sm text-zinc-300">
                      Elegí {selectedProduct.maxFlavors} gusto
                      {selectedProduct.maxFlavors > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="erp-flavor-body p-4">
                  {selectedProduct.maxFlavors > 0 && selectedProduct.flavorUsage > 0 && (
                    <div className="mb-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100">
                      Este producto descuenta {selectedProduct.flavorUsage} porciones estimadas en total.
                    </div>
                  )}
                  <div className="mb-3 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
                    Si el stock estimado de un gusto llega a cero, igual podés vender y el sistema lo deja en negativo para recalibrar la próxima tanda.
                  </div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-100">Gustos disponibles</p>
                      <p className="text-sm text-zinc-500">
                        {selectedFlavors.length}/{selectedProduct.maxFlavors} seleccionados
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-cyan-100">
                      {formatCurrency(selectedProduct.price)}
                    </p>
                  </div>

                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      className="h-11 w-full rounded-lg border border-white/10 bg-black/30 pl-10 pr-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-cyan-300/60"
                      onChange={(event) => setFlavorSearch(event.target.value)}
                      placeholder="Buscar sabor rápido"
                      value={flavorSearch}
                    />
                  </div>

                  <div className="mb-3 min-h-11 rounded-lg border border-white/10 bg-black/20 p-2">
                    {selectedFlavors.length ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedFlavors.map((flavor, index) => (
                          <button
                            className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
                            key={`${flavor}-${index}`}
                            onClick={() => removeSelectedFlavor(index)}
                            type="button"
                          >
                            {index + 1}. {flavor} x
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="px-1 py-1.5 text-xs text-zinc-500">
                        Tocá los gustos. Podés repetir el mismo sabor.
                      </p>
                    )}
                  </div>

                  <div className="erp-flavor-list max-h-[420px] space-y-4 overflow-y-auto pr-1">
                    {visibleFlavorGroups.map((group) => (
                      <div className="space-y-2" key={group.category}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-zinc-100">
                            {formatCategoryLabel(group.category)}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {group.items.length} gusto{group.items.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="erp-flavor-grid grid gap-2 sm:grid-cols-2">
                          {group.items.map((flavor) => {
                            const selectedCount = selectedFlavors.filter(
                              (item) => item === flavor.name,
                            ).length;
                            const selected = selectedCount > 0;
                            const usagePerSelection =
                              selectedProduct.maxFlavors > 0
                                ? selectedProduct.flavorUsage / selectedProduct.maxFlavors
                                : 0;
                            const projectedCount = selectedCount + 1;
                            const projectedUsage = projectedCount * usagePerSelection;
                            const noFlavorStockLeft = projectedUsage > flavor.stock;
                            const disabled =
                              selectedFlavors.length >= selectedProduct.maxFlavors;

                            return (
                              <button
                                className={cn(
                                  "flex items-center gap-3 rounded-lg border p-3 text-left transition",
                                  selected
                                    ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                                    : noFlavorStockLeft
                                      ? "border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20"
                                      : "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10",
                                  disabled && "cursor-not-allowed opacity-45",
                                )}
                                disabled={disabled}
                                key={`${group.category}-${flavor.id}`}
                                onClick={() => toggleFlavor(flavor.name)}
                                type="button"
                              >
                                <span
                                  className="size-5 rounded-full border border-black/10"
                                  style={{ backgroundColor: flavor.color }}
                                />
                                <div>
                                  <span className="font-semibold">{flavor.name}</span>
                                  <p className="text-xs opacity-75">
                                    {flavor.stock} {flavor.unit}
                                  </p>
                                </div>
                                {selectedCount > 0 && (
                                  <span className="ml-auto rounded-md bg-black/20 px-2 py-0.5 text-xs font-semibold">
                                    x{selectedCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {!visibleFlavorGroups.length && (
                      <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-center text-sm text-zinc-500">
                        No hay gustos que coincidan con esa búsqueda.
                      </div>
                    )}
                  </div>

                  <div className="erp-flavor-actions mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="h-11 flex-1 bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
                      disabled={selectedFlavors.length !== selectedProduct.maxFlavors}
                      onClick={confirmFlavorSelection}
                      type="button"
                    >
                      Agregar al pedido
                    </Button>
                    <Button
                      className="h-11 border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                      onClick={() => setSelectedProduct(null)}
                      type="button"
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DarkPanel>

      <div>
        <DarkPanel className="erp-order-panel xl:sticky xl:top-28">
          <PanelHeader
            icon={ReceiptText}
            title="Pedido"
            subtitle={`${cartItems.length} líneas`}
          />
          <div className="min-h-0 divide-y divide-white/10 md:min-h-72">
            {cartItems.length ? (
              cartItems.map((item) => (
                <div className="p-3" key={item.lineId}>
                  <div className="flex gap-3">
                    {item.imageUrl ? (
                      <div
                        aria-label={item.name}
                        className="size-14 shrink-0 rounded-lg bg-cover bg-center sm:size-16"
                        role="img"
                        style={{ backgroundImage: `url("${item.imageUrl}")` }}
                      />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-500 sm:size-16">
                        <Package className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold leading-snug text-zinc-100">
                            {item.name}
                          </p>
                          {item.flavors.length > 0 && (
                            <p className="mt-1 text-xs text-cyan-100">
                              {item.flavors.join(", ")}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-zinc-500">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <button
                          className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-100"
                          onClick={() => clearFromCart(item.lineId)}
                          type="button"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <IconButton onClick={() => removeFromCart(item.lineId)}>
                            <Minus className="size-4" />
                          </IconButton>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <IconButton onClick={() => addQuantityToLine(item.lineId)}>
                            <Plus className="size-4" />
                          </IconButton>
                        </div>
                        <p className="font-semibold text-zinc-100">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex min-h-36 flex-col items-center justify-center px-6 text-center md:min-h-72">
                <ShoppingCart className="mb-3 size-8 text-zinc-600" />
                <p className="font-semibold text-zinc-200">Pedido vacio</p>
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-white/10 p-4">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Canal de venta
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {saleChannelOptions.map((option) => (
                  <button
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-semibold transition",
                      saleChannel === option.id
                        ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                        : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                    )}
                    key={option.id}
                    onClick={() => setSaleChannel(option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Método de pago
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {paymentMethods.map((method) => (
                  <button
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-semibold transition",
                      paymentMethod === method
                        ? "border-[var(--erp-primary-border)] bg-[var(--erp-primary)] text-[var(--erp-primary-text)]"
                        : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                    )}
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    type="button"
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
            {canSeeFinancialDetails && (
              <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-zinc-500">
                      Comisión aplicada
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Canal + método de pago
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-cyan-100">
                    {formatPercent(totalCommissionRate)}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                    <p className="text-zinc-500">Canal</p>
                    <p className="mt-1 font-semibold text-zinc-100">
                      {formatPercent(channelCommissionRate)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                    <p className="text-zinc-500">Método</p>
                    <p className="mt-1 font-semibold text-zinc-100">
                      {formatPercent(paymentCommissionRate)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-sm">
                  <span className="text-zinc-400">Descuento estimado</span>
                  <span className="font-semibold text-rose-100">
                    {formatCurrency(estimatedCommission)}
                  </span>
                </div>
              </div>
            )}
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-zinc-100">Descuento</p>
                </div>
                <Button
                  className="w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"
                  onClick={() => setIsDiscountOpen(!isDiscountOpen)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {saleDiscount > 0 ? "Editar descuento" : "Agregar descuento"}
                </Button>
              </div>

              {isDiscountOpen && (
                <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className={cn(
                        discountMode === "amount"
                          ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                          : "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10",
                      )}
                      onClick={() => setDiscountMode("amount")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      $
                    </Button>
                    <Button
                      className={cn(
                        discountMode === "percent"
                          ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                          : "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10",
                      )}
                      onClick={() => setDiscountMode("percent")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      %
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <label className="text-xs font-semibold text-zinc-500">
                        {discountMode === "percent"
                          ? "Porcentaje de descuento"
                          : "Monto de descuento"}
                        <input
                          className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-[#080a0c] px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-cyan-300/60"
                          min={0}
                          onChange={(event) => setDiscountValue(event.target.value)}
                          placeholder={discountMode === "percent" ? "10" : "1500"}
                          type="number"
                          value={discountValue}
                        />
                      </label>
                    </div>
                    <Button
                      className="w-full self-end border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"
                      onClick={() => {
                        setDiscountValue("");
                        setDiscountMode("amount");
                        setIsDiscountOpen(false);
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <TotalRow label="Subtotal" value={formatCurrency(saleSubtotal)} />
            <TotalRow label="Descuento" value={`-${formatCurrency(saleDiscount)}`} />
            <TotalRow strong label="Total a cobrar" value={formatCurrency(saleTotal)} />

            <Button
              className="h-12 w-full bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
              disabled={!cartItems.length || isCharging}
              onClick={completeSale}
              type="button"
            >
              <CreditCard className="size-4" />
              {isCharging ? "Guardando venta" : "Cobrar pedido"}
            </Button>
            <Button
              className="h-11 w-full border-white/10 bg-white/5 font-semibold text-zinc-100 hover:bg-white/10"
              disabled={!cartItems.length}
              onClick={cancelCart}
              type="button"
              variant="outline"
            >
              <Trash2 className="size-4" />
              Cancelar pedido
            </Button>
          </div>
        </DarkPanel>
      </div>
    </div>
    </div>
  );
}

function HistorialVentasView({
  canDeleteSales,
  deleteSale,
  sales,
  saleItems,
}: {
  canDeleteSales: boolean;
  deleteSale: (sale: Sale) => void;
  sales: Sale[];
  saleItems: SaleItem[];
}) {
  const pageSize = 10;
  const [page, setPage] = useState(0);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("todo");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("todo");
  const salesByNewest = useMemo(
    () =>
      [...sales]
        .filter(
          (sale) =>
            saleMatchesShiftFilter(sale, shiftFilter) &&
            saleMatchesChannelFilter(sale, channelFilter),
        )
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        ),
    [channelFilter, sales, shiftFilter],
  );
  const saleItemsBySaleId = useMemo(() => {
    return saleItems.reduce<Record<string, SaleItem[]>>((acc, item) => {
      if (!acc[item.saleId]) {
        acc[item.saleId] = [];
      }
      acc[item.saleId].push(item);
      return acc;
    }, {});
  }, [saleItems]);
  const totalPages = Math.max(1, Math.ceil(salesByNewest.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedSales = salesByNewest.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  useEffect(() => {
    setExpandedSaleId(null);
  }, [safePage]);

  useEffect(() => {
    setPage(0);
    setExpandedSaleId(null);
  }, [channelFilter, shiftFilter]);

  return (
    <div className="space-y-5">
      <DarkPanel>
      <PanelHeader
        icon={ReceiptText}
        title="Historial de ventas"
        right={
          <div className="flex items-center gap-2">
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              disabled={safePage === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              size="sm"
              type="button"
              variant="outline"
            >
              Más recientes
            </Button>
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              disabled={safePage >= totalPages - 1}
              onClick={() =>
                setPage((current) => Math.min(totalPages - 1, current + 1))
              }
              size="sm"
              type="button"
              variant="outline"
            >
              Siguientes 10
            </Button>
          </div>
        }
      />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          <CompactFilterGroup
            label="Turno"
            onChange={setShiftFilter}
            options={shiftFilterOptions}
            value={shiftFilter}
          />
          <CompactFilterGroup
            label="Canal"
            onChange={setChannelFilter}
            options={channelFilterOptions}
            value={channelFilter}
          />
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Página {safePage + 1} de {totalPages}
        </div>

        {paginatedSales.length ? (
          <div className="space-y-3">
            {paginatedSales.map((sale) => {
              const items = saleItemsBySaleId[sale.id] ?? [];
              const firstItem = items[0];
              const extraItems = Math.max(items.length - 1, 0);
              const isExpanded = expandedSaleId === sale.id;

              return (
                <div
                  className={cn(
                    "rounded-lg border bg-black/20 p-4 transition",
                    isExpanded
                      ? "border-cyan-300/30 bg-cyan-300/[0.04]"
                      : "border-white/10",
                  )}
                  key={sale.id}
                >
                  <button
                    className="w-full text-left"
                    onClick={() =>
                      setExpandedSaleId((current) =>
                        current === sale.id ? null : sale.id,
                      )
                    }
                    type="button"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-100">
                          {firstItem
                            ? `${firstItem.quantity}x ${firstItem.product}`
                            : `${sale.items} producto${sale.items === 1 ? "" : "s"}`}
                        </p>
                        {extraItems > 0 && (
                          <p className="mt-1 text-xs text-zinc-500">
                            + {extraItems} producto{extraItems === 1 ? "" : "s"} más
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                          <StatusBadge
                            label={getSaleChannelLabel(sale.channel)}
                            tone={sale.channel === "pedidos_ya" ? "amber" : "cyan"}
                          />
                          <span>{formatFullDateTime(sale.createdAt)}</span>
                          <span>•</span>
                          <span>{sale.customer}</span>
                          <span>•</span>
                          <span>{sale.method}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-semibold text-emerald-200">
                          {formatCurrency(sale.total)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {sale.items} producto{sale.items === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  </button>
                  {canDeleteSales && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        className="border-rose-300/30 bg-rose-300/10 text-rose-100 hover:bg-rose-300/20"
                        onClick={() => deleteSale(sale)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Trash2 className="size-4" />
                        Eliminar
                      </Button>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-xs uppercase text-zinc-500">Cliente</p>
                          <p className="mt-2 font-semibold text-zinc-100">
                            {sale.customer}
                          </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-xs uppercase text-zinc-500">Canal</p>
                          <p className="mt-2 font-semibold text-zinc-100">
                            {getSaleChannelLabel(sale.channel)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-xs uppercase text-zinc-500">Método</p>
                          <p className="mt-2 font-semibold text-zinc-100">
                            {sale.method}
                          </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-xs uppercase text-zinc-500">Hora</p>
                          <p className="mt-2 font-semibold text-zinc-100">
                            {sale.time}
                          </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-xs uppercase text-zinc-500">Total</p>
                          <p className="mt-2 font-semibold text-emerald-200">
                            {formatCurrency(sale.total)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/[0.03]">
                        <div className="border-b border-white/10 px-4 py-3">
                          <p className="font-semibold text-zinc-100">
                            Productos de la venta
                          </p>
                        </div>
                        <div className="divide-y divide-white/10">
                          {items.map((item) => (
                            <div
                              className="flex items-start justify-between gap-4 px-4 py-3"
                              key={item.id}
                            >
                              <div>
                                <p className="font-semibold text-zinc-100">
                                  {item.quantity}x {item.product}
                                </p>
                                {!!item.flavors.length && (
                                  <p className="mt-1 text-xs text-zinc-500">
                                    Gustos: {item.flavors.join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-xs uppercase text-zinc-500">Subtotal</p>
                          <p className="mt-2 font-semibold text-zinc-100">
                            {formatCurrency(sale.subtotal)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-xs uppercase text-zinc-500">Descuento</p>
                          <p className="mt-2 font-semibold text-amber-200">
                            {formatCurrency(sale.discount)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-xs uppercase text-zinc-500">Total final</p>
                          <p className="mt-2 font-semibold text-emerald-200">
                            {formatCurrency(sale.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
                Todavía no hay ventas guardadas.
          </div>
        )}
      </div>
      </DarkPanel>
    </div>
  );
}

function CierreCajaView({
  onOfflineQueueChange,
  sales,
}: {
  onOfflineQueueChange: () => Promise<void>;
  sales: Sale[];
}) {
  const { start: todayStart, end: todayEnd } = getOperationalDayRange(new Date());
  const currentShift = getCurrentShift();
  const [cashCount, setCashCount] = useState("");
  const [cashNote, setCashNote] = useState("");
  const [isSavingClose, setIsSavingClose] = useState(false);
  const [closeMessage, setCloseMessage] = useState("");
  const [lastClose, setLastClose] = useState<CashCloseRow | null>(null);
  const todaySales = sales.filter((sale) => {
    const date = new Date(sale.createdAt);
    return date >= todayStart && date <= todayEnd;
  });
  const shiftSales = todaySales.filter((sale) =>
    saleMatchesShiftFilter(sale, currentShift),
  );
  const shiftRevenue = shiftSales.reduce((total, sale) => total + sale.total, 0);
  const shiftCash = shiftSales
    .filter((sale) => sale.method.toLowerCase() === "efectivo")
    .reduce((total, sale) => total + sale.total, 0);
  const countedCash = Math.max(0, Number(cashCount || 0));
  const hasCashCount = cashCount.trim().length > 0;
  const cashDifference = countedCash - shiftCash;
  const isCashBalanced = Math.abs(cashDifference) < 0.01;
  const cashDifferenceLabel = !hasCashCount
    ? "Cargá el efectivo contado para comparar"
    : isCashBalanced
      ? "La caja coincide"
      : cashDifference > 0
        ? "Sobra efectivo en caja"
        : "Falta efectivo en caja";
  const lastCloseDifference = lastClose ? toNumber(lastClose.diferencia) : 0;
  const isLastCloseBalanced = Math.abs(lastCloseDifference) < 0.01;

  const loadLastClose = async () => {
    const response = await fetch("/api/erp/cierres-caja", {
      headers: getOfflineAuthHeaders(),
    }).catch(() => null);
    const pendingCloses = await getOfflineCashCloses();
    const lastPendingClose = pendingCloses.at(-1);
    if (!response?.ok) {
      if (lastPendingClose) {
        setLastClose({
          id: lastPendingClose.payload.id,
          fecha_operativa: lastPendingClose.payload.fecha_operativa,
          turno: lastPendingClose.payload.turno,
          total_sistema: lastPendingClose.payload.total_sistema,
          efectivo_sistema: lastPendingClose.payload.efectivo_sistema,
          efectivo_contado: lastPendingClose.payload.efectivo_contado,
          diferencia:
            lastPendingClose.payload.efectivo_contado -
            lastPendingClose.payload.efectivo_sistema,
          ventas: lastPendingClose.payload.ventas,
          observacion: lastPendingClose.payload.observacion.trim() || null,
          creado: lastPendingClose.createdAt,
        });
      }
      return;
    }

    const data = (await response.json().catch(() => null)) as {
      cierre?: CashCloseRow | null;
    } | null;
    setLastClose(data?.cierre ?? null);
    if (lastPendingClose) {
      setLastClose({
        id: lastPendingClose.payload.id,
        fecha_operativa: lastPendingClose.payload.fecha_operativa,
        turno: lastPendingClose.payload.turno,
        total_sistema: lastPendingClose.payload.total_sistema,
        efectivo_sistema: lastPendingClose.payload.efectivo_sistema,
        efectivo_contado: lastPendingClose.payload.efectivo_contado,
        diferencia:
          lastPendingClose.payload.efectivo_contado -
          lastPendingClose.payload.efectivo_sistema,
        ventas: lastPendingClose.payload.ventas,
        observacion: lastPendingClose.payload.observacion.trim() || null,
        creado: lastPendingClose.createdAt,
      });
    }
  };

  useEffect(() => {
    void loadLastClose();
  }, []);

  const saveCashClose = async () => {
    setIsSavingClose(true);
    setCloseMessage("");

    const now = new Date();
    const operationalDay = getOperationalDayRange(now);
    const parts = getArgentinaDateParts(operationalDay.start);
    const payload: OfflineCashClosePayload = {
      id: createLocalUuid(),
      fecha_operativa: `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
      turno: currentShift,
      total_sistema: shiftRevenue,
      efectivo_sistema: shiftCash,
      efectivo_contado: countedCash,
      ventas: shiftSales.length,
      observacion: cashNote,
    };
    const createdAt = now.toISOString();
    const localClose: CashCloseRow = {
      id: payload.id,
      fecha_operativa: payload.fecha_operativa,
      turno: payload.turno,
      total_sistema: payload.total_sistema,
      efectivo_sistema: payload.efectivo_sistema,
      efectivo_contado: payload.efectivo_contado,
      diferencia: payload.efectivo_contado - payload.efectivo_sistema,
      ventas: payload.ventas,
      observacion: payload.observacion.trim() || null,
      creado: createdAt,
    };

    try {
      const response = await fetch("/api/erp/cierres-caja", {
        method: "POST",
        headers: getJsonAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const error = new Error(data?.error ?? "No se pudo guardar el cierre") as Error & {
          retryable?: boolean;
        };
        error.retryable = response.status >= 500;
        throw error;
      }

      const data = (await response.json().catch(() => null)) as {
        cierre?: CashCloseRow | null;
      } | null;
      setLastClose(data?.cierre ?? localClose);

      setCloseMessage("Cierre guardado");
      setCashCount("");
      setCashNote("");
    } catch (error) {
      const canQueue =
        !window.navigator.onLine ||
        error instanceof TypeError ||
        Boolean((error as { retryable?: boolean }).retryable);

      if (!canQueue) {
        setCloseMessage(
          error instanceof Error ? error.message : "No se pudo guardar el cierre",
        );
        setIsSavingClose(false);
        return;
      }

      const offlineRecord: OfflineCashCloseRecord = {
        id: payload.id,
        createdAt,
        payload,
      };
      await enqueueOfflineCashClose(offlineRecord);
      await onOfflineQueueChange();
      setLastClose(localClose);
      setCloseMessage("Sin internet: cierre guardado en esta PC para sincronizar");
      setCashCount("");
      setCashNote("");
    } finally {
      setIsSavingClose(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 xl:grid-cols-[1fr_0.9fr]">
        <DarkPanel>
          <PanelHeader icon={DollarSign} title="Cierre de caja" />
          <div className="space-y-4 p-4">
            <div className="grid gap-3">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase text-zinc-500">Turno</p>
                <p className="mt-1 font-semibold text-zinc-100">
                  {currentShift === "manana" ? "Mañana" : "Tarde"}
                </p>
              </div>
            </div>
            <InlineInput
              label="Efectivo contado"
              onChange={setCashCount}
              type="number"
              value={cashCount}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase text-zinc-500">
                  Efectivo esperado
                </p>
                <p className="mt-1 font-semibold text-zinc-100">
                  {formatCurrency(shiftCash)}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase text-zinc-500">
                  Efectivo contado
                </p>
                <p className="mt-1 font-semibold text-zinc-100">
                  {hasCashCount ? formatCurrency(countedCash) : "-"}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-lg border p-3",
                  !hasCashCount
                    ? "border-white/10 bg-white/[0.03]"
                    : isCashBalanced
                      ? "border-emerald-300/20 bg-emerald-300/10"
                      : cashDifference > 0
                        ? "border-amber-300/20 bg-amber-300/10"
                        : "border-rose-300/20 bg-rose-300/10",
                )}
              >
                <p className="text-xs uppercase text-zinc-500">Diferencia</p>
                <p
                  className={cn(
                    "mt-1 font-semibold",
                    !hasCashCount
                      ? "text-zinc-100"
                      : isCashBalanced
                        ? "text-emerald-100"
                        : cashDifference > 0
                          ? "text-amber-100"
                          : "text-rose-100",
                  )}
                >
                  {hasCashCount ? formatSignedCurrency(cashDifference) : "-"}
                </p>
              </div>
            </div>
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                !hasCashCount
                  ? "border-white/10 bg-black/20 text-zinc-400"
                  : isCashBalanced
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                    : cashDifference > 0
                      ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                      : "border-rose-300/20 bg-rose-300/10 text-rose-100",
              )}
            >
              {hasCashCount && isCashBalanced ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              ) : (
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold">{cashDifferenceLabel}</p>
                <p className="mt-1 text-xs opacity-80">
                  Sistema: {formatCurrency(shiftCash)} / Contado:{" "}
                  {hasCashCount ? formatCurrency(countedCash) : "-"}
                </p>
              </div>
            </div>
            <label className="text-xs font-semibold text-zinc-500">
              Nota
              <input
                className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#080a0c] px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
                onChange={(event) => setCashNote(event.target.value)}
                value={cashNote}
              />
            </label>
            <Button
              className="h-11 w-full bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
              disabled={isSavingClose}
              onClick={saveCashClose}
              type="button"
            >
              {isSavingClose ? "Guardando..." : "Guardar cierre"}
            </Button>
            {closeMessage && (
              <p className="text-sm font-semibold text-cyan-100">{closeMessage}</p>
            )}
          </div>
        </DarkPanel>

        <DarkPanel>
          <PanelHeader icon={ReceiptText} title="Último cierre cargado" />
          <div className="p-4">
            {lastClose ? (
              <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-zinc-500">Turno</p>
                    <p className="mt-1 font-semibold text-zinc-100">
                      {lastClose.turno === "manana" ? "Mañana" : "Tarde"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase text-zinc-500">Cargado</p>
                    <p className="mt-1 font-semibold text-zinc-100">
                      {formatFullDateTime(lastClose.creado)}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs uppercase text-zinc-500">
                      Efectivo esperado
                    </p>
                    <p className="mt-1 font-semibold text-zinc-100">
                      {formatCurrency(toNumber(lastClose.efectivo_sistema))}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs uppercase text-zinc-500">
                      Efectivo contado
                    </p>
                    <p className="mt-1 font-semibold text-zinc-100">
                      {formatCurrency(toNumber(lastClose.efectivo_contado))}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-lg border p-3",
                      isLastCloseBalanced
                        ? "border-emerald-300/20 bg-emerald-300/10"
                        : lastCloseDifference > 0
                          ? "border-amber-300/20 bg-amber-300/10"
                          : "border-rose-300/20 bg-rose-300/10",
                    )}
                  >
                    <p className="text-xs uppercase text-zinc-500">Diferencia</p>
                    <p
                      className={cn(
                        "mt-1 font-semibold",
                        isLastCloseBalanced
                          ? "text-emerald-100"
                          : lastCloseDifference > 0
                            ? "text-amber-100"
                            : "text-rose-100",
                      )}
                    >
                      {formatSignedCurrency(lastCloseDifference)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs uppercase text-zinc-500">Ventas del turno</p>
                    <p className="mt-1 font-semibold text-zinc-100">
                      {lastClose.ventas}
                    </p>
                  </div>
                </div>
                {lastClose.observacion && (
                  <p className="text-sm text-zinc-400">{lastClose.observacion}</p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center">
                <p className="text-sm text-zinc-500">
                  Todavía no cargaste un cierre.
                </p>
              </div>
            )}
          </div>
        </DarkPanel>
    </div>
  );
}

function AnalisisView({
  channelCommissions,
  commissionHistory,
  expenses,
  expenseHistory,
  flavorBatches,
  paymentMethodCommissions,
  paymentMethods,
  saleItems,
  sales,
}: {
  channelCommissions: Record<SaleChannel, number>;
  commissionHistory: CommissionHistory[];
  expenses: Expense[];
  expenseHistory: ExpenseHistory[];
  flavorBatches: FlavorBatch[];
  paymentMethodCommissions: Record<string, number>;
  paymentMethods: string[];
  saleItems: SaleItem[];
  sales: Sale[];
}) {
  const [activePanel, setActivePanel] = useState<
    "resumen" | "rankings" | "ventas" | "historico" | "gastos"
  >("resumen");
  const [periodFilter, setPeriodFilter] = useState<AnalysisPeriod>("mes");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("todo");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("todo");
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [analysisSalesPage, setAnalysisSalesPage] = useState(1);
  const [activeRankingDetail, setActiveRankingDetail] =
    useState<AnalysisRankingDetail | null>(null);
  const [selectedFlavorMonthKey, setSelectedFlavorMonthKey] = useState<string | null>(null);
  const [selectedProductMonthKey, setSelectedProductMonthKey] = useState<string | null>(null);
  const { start: periodStart, end: periodEnd } = getAnalysisPeriodRange(
    periodFilter,
    sales,
    expenseHistory,
    flavorBatches,
  );
  const periodSales = sales.filter((sale) => {
    const saleDate = new Date(sale.createdAt);
    return saleDate >= periodStart && saleDate <= periodEnd;
  });
  const periodGrossRevenue = periodSales.reduce((total, sale) => total + sale.total, 0);
  const periodSaleIds = new Set(periodSales.map((sale) => sale.id));
  const expenseBreakdown = calculateExpenseBreakdownBetween(
    periodStart,
    periodEnd,
    expenses,
    expenseHistory,
  );
  const fixedExpenses = expenseBreakdown.fixed;
  const periodSaleItems = saleItems.filter((item) => periodSaleIds.has(item.saleId));
  const filteredSales = periodSales.filter(
    (sale) =>
      saleMatchesShiftFilter(sale, shiftFilter) &&
      saleMatchesChannelFilter(sale, channelFilter),
  );
  const filteredSaleIds = new Set(filteredSales.map((sale) => sale.id));
  const filteredSaleItems = periodSaleItems.filter((item) =>
    filteredSaleIds.has(item.saleId),
  );
  const localRevenue = filteredSales
    .filter((sale) => sale.channel === "local")
    .reduce((total, sale) => total + sale.total, 0);
  const deliverySales = filteredSales.filter((sale) => sale.channel === "pedidos_ya");
  const deliveryRevenue = deliverySales.reduce((total, sale) => total + sale.total, 0);
  const deliveryMorningRevenue = deliverySales
    .filter((sale) => saleIsMorning(sale))
    .reduce((total, sale) => total + sale.total, 0);
  const deliveryAfternoonRevenue = deliverySales
    .filter((sale) => !saleIsMorning(sale))
    .reduce((total, sale) => total + sale.total, 0);
  const morningRevenue = filteredSales
    .filter((sale) => saleIsMorning(sale))
    .reduce((total, sale) => total + sale.total, 0);
  const afternoonRevenue = filteredSales
    .filter((sale) => !saleIsMorning(sale))
    .reduce((total, sale) => total + sale.total, 0);
  const grossRevenue = filteredSales.reduce((total, sale) => total + sale.total, 0);
  const soldProductCost = filteredSaleItems.reduce(
    (total, item) => total + item.cost * item.quantity,
    0,
  );
  const hasAnalysisFilters = shiftFilter !== "todo" || channelFilter !== "todo";
  const allocatedFixedExpenses =
    !hasAnalysisFilters
      ? fixedExpenses
      : allocateExpenseByRevenueShare(fixedExpenses, grossRevenue, periodGrossRevenue);
  const commissionCost = calculateCommissionCost(
    filteredSales,
    paymentMethodCommissions,
    channelCommissions,
    commissionHistory,
  );
  const netProfit =
    grossRevenue - soldProductCost - allocatedFixedExpenses - commissionCost;
  const soldProducts = filteredSales.reduce((total, sale) => total + sale.items, 0);
  const allMarginRows = Object.values(
    filteredSaleItems.reduce<
      Record<
        string,
        { product: string; quantity: number; revenue: number; cost: number }
      >
    >((acc, item) => {
      const normalizedName = normalizeSoldProductName(item.product);
      const current = acc[normalizedName] ?? {
        product: normalizedName,
        quantity: 0,
        revenue: 0,
        cost: 0,
      };
      current.quantity += item.quantity;
      current.revenue += item.total || item.price * item.quantity;
      current.cost += item.cost * item.quantity;
      acc[normalizedName] = current;
      return acc;
    }, {}),
  )
    .map((row) => ({
      ...row,
      margin: row.revenue - row.cost,
      marginRate: row.revenue > 0 ? ((row.revenue - row.cost) / row.revenue) * 100 : 0,
    }))
    .sort((left, right) => right.margin - left.margin);
  const marginRows = allMarginRows.slice(0, 8);
  const methodTotals = [
    ...new Set([
      ...paymentMethods,
      ...filteredSales.map((sale) => sale.method),
    ]),
  ].map((method) => ({
    method,
    total: filteredSales
      .filter((sale) => sale.method === method)
      .reduce((sum, sale) => sum + sale.total, 0),
  }));
  const maxMethodTotal = Math.max(...methodTotals.map((item) => item.total), 1);
  const yearlyTotals = periodSales
    .filter(
      (sale) =>
        saleMatchesShiftFilter(sale, shiftFilter) &&
        saleMatchesChannelFilter(sale, channelFilter),
    )
    .reduce<Record<string, number>>((acc, sale) => {
      const year = getArgentinaYear(sale.createdAt).toString();
      acc[year] = (acc[year] ?? 0) + sale.total;
      return acc;
    }, {});
  const yearlyRows = Object.entries(yearlyTotals)
    .sort(([left], [right]) => Number(right) - Number(left))
    .map(([year, total]) => ({ year, total }));
  const productRankingRows = buildProductRankingRows(filteredSaleItems);
  const topProducts = productRankingRows
    .map((row) => [row.product, row.quantity] as const)
    .slice(0, 6);
  const periodFlavorBatches = flavorBatches.filter((batch) => {
    const createdAt = new Date(batch.createdAt);
    return (
      isManualFlavorBatch(batch) &&
      createdAt >= periodStart &&
      createdAt <= periodEnd
    );
  });
  const allPeriodFlavors = Object.values(
    periodFlavorBatches.reduce<
      Record<
        string,
        {
          batches: number;
          flavor: string;
          id: string;
          kilos: number;
          lastLoadedAt: string;
          portions: number;
        }
      >
    >((acc, batch) => {
      const current = acc[batch.flavorId] ?? {
        batches: 0,
        flavor: batch.flavorName,
        id: batch.flavorId,
        kilos: 0,
        lastLoadedAt: batch.createdAt,
        portions: 0,
      };
      current.batches += 1;
      current.kilos += batch.kilos;
      current.portions += batch.portionsLoaded;
      if (new Date(batch.createdAt) > new Date(current.lastLoadedAt)) {
        current.lastLoadedAt = batch.createdAt;
      }
      acc[batch.flavorId] = current;
      return acc;
    }, {}),
  )
    .sort(
      (left, right) =>
        right.batches - left.batches ||
        right.kilos - left.kilos ||
        left.flavor.localeCompare(right.flavor, "es-AR"),
    );
  const topFlavors = allPeriodFlavors.slice(0, 6);
  const manualFlavorBatches = flavorBatches.filter(isManualFlavorBatch);
  const currentDateParts = getArgentinaDateParts(new Date());
  const currentYear = currentDateParts.year;
  const currentMonth = currentDateParts.month;
  const flavorMonthlyYears = Array.from(
    new Set([
      currentYear,
      ...manualFlavorBatches.map((batch) => getArgentinaDateParts(batch.createdAt).year),
      ...sales.map((sale) => getArgentinaDateParts(sale.createdAt).year),
    ]),
  ).sort((left, right) => right - left);
  const monthlyFlavorRows: MonthlyFlavorRow[] = flavorMonthlyYears.flatMap((year) =>
    Array.from({ length: year === currentYear ? currentMonth : 12 }).flatMap((_, index) => {
      const month = (year === currentYear ? currentMonth : 12) - index;
      const start = createArgentinaDate({ year, month, day: 1 });
      const end = endOfDay(
        createArgentinaDate({
          year,
          month,
          day: getDaysInMonth(year, month),
        }),
      );
      const segmentStart = new Date(Math.max(start.getTime(), periodStart.getTime()));
      const segmentEnd = new Date(Math.min(end.getTime(), periodEnd.getTime()));

      if (segmentEnd < segmentStart) {
        return [];
      }

      const monthBatches = manualFlavorBatches.filter((batch) => {
        const createdAt = new Date(batch.createdAt);
        return createdAt >= segmentStart && createdAt <= segmentEnd;
      });
      const flavors = Object.values(
        monthBatches.reduce<Record<string, MonthlyFlavorSummary>>((acc, batch) => {
          const current = acc[batch.flavorId] ?? {
            activeBatches: 0,
            batches: 0,
            closedBatches: 0,
            firstLoadedAt: batch.createdAt,
            flavor: batch.flavorName,
            id: batch.flavorId,
            kilos: 0,
            lastLoadedAt: batch.createdAt,
          };
          current.batches += 1;
          current.kilos += batch.kilos;
          current.activeBatches += batch.status === "activa" ? 1 : 0;
          current.closedBatches += batch.status === "cerrada" ? 1 : 0;
          if (new Date(batch.createdAt) < new Date(current.firstLoadedAt)) {
            current.firstLoadedAt = batch.createdAt;
          }
          if (new Date(batch.createdAt) > new Date(current.lastLoadedAt)) {
            current.lastLoadedAt = batch.createdAt;
          }
          acc[batch.flavorId] = current;
          return acc;
        }, {}),
      ).sort(
        (left, right) =>
          right.batches - left.batches ||
          right.kilos - left.kilos ||
          left.flavor.localeCompare(right.flavor, "es-AR"),
      );

      return [{
        end: segmentEnd,
        flavors,
        key: `${year}-${String(month).padStart(2, "0")}`,
        label: `${monthNames[month - 1]} ${year}`,
        month,
        start: segmentStart,
        topFlavor: flavors[0] ?? null,
        totalBatches: monthBatches.length,
        uniqueFlavors: flavors.length,
        year,
      }];
    }),
  );
  const monthlyProductRows: MonthlyProductRow[] = flavorMonthlyYears.flatMap((year) =>
    Array.from({ length: year === currentYear ? currentMonth : 12 }).flatMap((_, index) => {
      const month = (year === currentYear ? currentMonth : 12) - index;
      const start = createArgentinaDate({ year, month, day: 1 });
      const end = endOfDay(
        createArgentinaDate({
          year,
          month,
          day: getDaysInMonth(year, month),
        }),
      );
      const segmentStart = new Date(Math.max(start.getTime(), periodStart.getTime()));
      const segmentEnd = new Date(Math.min(end.getTime(), periodEnd.getTime()));

      if (segmentEnd < segmentStart) {
        return [];
      }

      const monthSales = sales.filter((sale) => {
        const createdAt = new Date(sale.createdAt);
        return (
          createdAt >= segmentStart &&
          createdAt <= segmentEnd &&
          saleMatchesShiftFilter(sale, shiftFilter) &&
          saleMatchesChannelFilter(sale, channelFilter)
        );
      });
      const monthSaleIds = new Set(monthSales.map((sale) => sale.id));
      const monthSaleItems = saleItems.filter((item) => monthSaleIds.has(item.saleId));
      const products = buildProductRankingRows(monthSaleItems);
      const totalUnits = products.reduce((total, product) => total + product.quantity, 0);

      return [{
        end: segmentEnd,
        key: `${year}-${String(month).padStart(2, "0")}`,
        label: `${monthNames[month - 1]} ${year}`,
        month,
        products,
        salesCount: monthSales.length,
        start: segmentStart,
        topProduct: products[0] ?? null,
        totalProducts: products.length,
        totalRevenue: monthSales.reduce((total, sale) => total + sale.total, 0),
        totalUnits,
        year,
      }];
    }),
  );
  const selectedFlavorMonth =
    monthlyFlavorRows.find((row) => row.key === selectedFlavorMonthKey) ?? null;
  const selectedProductMonth =
    monthlyProductRows.find((row) => row.key === selectedProductMonthKey) ?? null;
  const maxMonthlyFlavorBatches = Math.max(
    ...monthlyFlavorRows.map((row) => row.totalBatches),
    1,
  );
  const maxMonthlyProductUnits = Math.max(
    ...monthlyProductRows.map((row) => row.totalUnits),
    1,
  );
  const maxTopProduct = Math.max(...topProducts.map(([, total]) => total), 1);
  const maxTopFlavor = Math.max(...topFlavors.map((item) => item.batches), 1);
  const saleDetailsById = filteredSaleItems.reduce<Record<string, SaleItem[]>>(
    (acc, item) => {
      acc[item.saleId] = [...(acc[item.saleId] ?? []), item];
      return acc;
    },
    {},
  );
  const analysisSalesPageSize = 10;
  const analysisSalesTotalPages = Math.max(
    1,
    Math.ceil(filteredSales.length / analysisSalesPageSize),
  );
  const safeAnalysisSalesPage = Math.min(
    analysisSalesPage,
    analysisSalesTotalPages,
  );
  const paginatedAnalysisSales = filteredSales.slice(
    (safeAnalysisSalesPage - 1) * analysisSalesPageSize,
    safeAnalysisSalesPage * analysisSalesPageSize,
  );
  const periodRangeLabel = `${formatShortDate(periodStart)} ${getArgentinaYear(
    periodStart,
  )} - ${formatShortDate(periodEnd)} ${getArgentinaYear(periodEnd)}`;
  const periodName =
    analysisPeriodOptions.find((option) => option.id === periodFilter)?.label ??
    "Período";
  const shiftName =
    shiftFilterOptions.find((option) => option.id === shiftFilter)?.label ?? "Todo";
  const channelName =
    channelFilterOptions.find((option) => option.id === channelFilter)?.label ?? "Todo";

  useEffect(() => {
    if (analysisSalesPage !== safeAnalysisSalesPage) {
      setAnalysisSalesPage(safeAnalysisSalesPage);
    }
  }, [analysisSalesPage, safeAnalysisSalesPage]);

  useEffect(() => {
    setAnalysisSalesPage(1);
    setExpandedSaleId(null);
    setSelectedFlavorMonthKey(null);
    setSelectedProductMonthKey(null);
  }, [activePanel, channelFilter, periodFilter, shiftFilter]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          icon={ArrowUpCircle}
          label="Total vendido sin restar"
          tone="cyan"
          value={formatCurrency(grossRevenue)}
        />
        <MetricCard
          icon={ArrowDownCircle}
          label="Costo de productos vendidos"
          tone="amber"
          value={formatCurrency(soldProductCost)}
        />
        <MetricCard
          icon={WalletCards}
          label={!hasAnalysisFilters ? "Gastos fijos" : "Gastos fijos estimados"}
          tone={fixedExpenses > 0 ? "amber" : "neutral"}
          value={formatCurrency(allocatedFixedExpenses)}
        />
        <MetricCard
          icon={CreditCard}
          label="Comisiones"
          tone={commissionCost > 0 ? "amber" : "neutral"}
          value={formatCurrency(commissionCost)}
        />
        <MetricCard
          icon={ReceiptText}
          label="Productos vendidos"
          tone="neutral"
          value={String(soldProducts)}
        />
        <MetricCard
          icon={BadgeDollarSign}
          label="Ganancia real"
          tone={netProfit >= 0 ? "green" : "red"}
          value={formatCurrency(netProfit)}
        />
      </div>

      <DarkPanel>
        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "resumen", label: "Resumen" },
              { id: "rankings", label: "Rankings" },
              { id: "ventas", label: "Ventas" },
              { id: "historico", label: "Histórico" },
              { id: "gastos", label: "Gastos" },
            ].map((tab) => (
              <button
                className={cn(
                  "h-10 rounded-lg border px-3 text-sm font-semibold transition",
                  activePanel === tab.id
                    ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                )}
                key={tab.id}
                onClick={() =>
                  setActivePanel(
                    tab.id as "resumen" | "rankings" | "ventas" | "historico" | "gastos",
                  )
                }
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="grid gap-2 xl:grid-cols-3 2xl:min-w-[760px]">
            <CompactFilterGroup
              label="Período"
              onChange={setPeriodFilter}
              options={analysisPeriodOptions}
              value={periodFilter}
            />
            <CompactFilterGroup
              label="Turno"
              onChange={setShiftFilter}
              options={shiftFilterOptions}
              value={shiftFilter}
            />
            <CompactFilterGroup
              label="Canal"
              onChange={setChannelFilter}
              options={channelFilterOptions}
              value={channelFilter}
            />
          </div>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <CalendarClock className="size-4" />
              Datos usados en este análisis
            </div>
            <p className="text-cyan-50/85">
              {periodName}: {periodRangeLabel} / Turno: {shiftName} / Canal:{" "}
              {channelName}
            </p>
          </div>
        </div>
      </DarkPanel>

      {activePanel === "resumen" && (
      <div className="grid gap-5 xl:grid-cols-3">
        <DarkPanel>
          <PanelHeader
            icon={LayoutDashboard}
            title="Ventas por turno"
          />
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <ShiftCard label="Mañana" value={morningRevenue} icon={Coffee} />
            <ShiftCard label="Tarde" value={afternoonRevenue} icon={Flame} />
          </div>
        </DarkPanel>

        <DarkPanel>
          <PanelHeader
            icon={Store}
            title="Canales de venta"
          />
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {[
              { label: "Local", value: localRevenue, icon: Store },
              { label: "Pedidos Ya", value: deliveryRevenue, icon: ShoppingCart },
              { label: "Pedidos Ya mañana", value: deliveryMorningRevenue, icon: Coffee },
              { label: "Pedidos Ya tarde", value: deliveryAfternoonRevenue, icon: Flame },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="rounded-lg border border-white/10 bg-black/20 p-4"
                  key={item.label}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-zinc-500">{item.label}</p>
                      <p className="mt-2 text-xl font-semibold text-zinc-100">
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
                      <Icon className="size-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DarkPanel>

        <DarkPanel>
          <PanelHeader
            icon={BarChart3}
            title="Ventas por método de pago"
          />
          <div className="space-y-4 p-4">
            {methodTotals.map((item) => (
              <div key={item.method}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-zinc-200">{item.method}</span>
                  <span className="text-zinc-400">{formatCurrency(item.total)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-cyan-300"
                    style={{ width: `${(item.total / maxMethodTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DarkPanel>
      </div>
      )}

      {activePanel === "rankings" && (
      <div className="grid gap-5 xl:grid-cols-2">
        <DarkPanel>
          <PanelHeader
            icon={Snowflake}
            right={
              <Button
                className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                onClick={() => setActiveRankingDetail("flavors")}
                size="sm"
                type="button"
                variant="outline"
              >
                Ver detalle
              </Button>
            }
            subtitle="Calculado por baldes cargados en el período"
            title="Ranking de gustos"
          />
          <div
            className="space-y-4 p-4"
            onClick={() => setActiveRankingDetail("flavors")}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                setActiveRankingDetail("flavors");
              }
            }}
          >
            {topFlavors.length ? (
              topFlavors.map((flavor, index) => (
                <div key={flavor.id}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold text-zinc-300">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-zinc-200">
                          {flavor.flavor}
                        </span>
                        <p className="text-xs text-zinc-500">
                          {flavor.batches} balde{flavor.batches === 1 ? "" : "s"} cargado
                          {flavor.batches === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <span className="text-zinc-400">
                      {flavor.batches} recarga{flavor.batches === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-cyan-300"
                      style={{ width: `${(flavor.batches / maxTopFlavor) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">
                Todavía no hay baldes cargados en este período.
              </p>
            )}
          </div>
        </DarkPanel>

        <DarkPanel>
          <PanelHeader
            icon={Package}
            right={
              <Button
                className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                onClick={() => setActiveRankingDetail("products")}
                size="sm"
                type="button"
                variant="outline"
              >
                Ver detalle
              </Button>
            }
            title="Ranking de productos"
          />
          <div
            className="space-y-4 p-4"
            onClick={() => setActiveRankingDetail("products")}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                setActiveRankingDetail("products");
              }
            }}
          >
            {topProducts.length ? (
              topProducts.map(([product, total], index) => (
                <div key={product}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold text-zinc-300">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-zinc-200">{product}</span>
                    </div>
                    <span className="text-zinc-400">{total} vendidos</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-cyan-300"
                      style={{ width: `${(total / maxTopProduct) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">
                Todavía no hay productos vendidos en este período.
              </p>
            )}
          </div>
        </DarkPanel>

        <DarkPanel>
          <PanelHeader
            icon={BadgeDollarSign}
            right={
              <Button
                className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                onClick={() => setActiveRankingDetail("margin")}
                size="sm"
                type="button"
                variant="outline"
              >
                Ver detalle
              </Button>
            }
            title="Margen por producto"
          />
          <div
            className="space-y-3 p-4"
            onClick={() => setActiveRankingDetail("margin")}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                setActiveRankingDetail("margin");
              }
            }}
          >
            {marginRows.length ? (
              marginRows.map((row) => (
                <div
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                  key={row.product}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-100">{row.product}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {row.quantity} vendidos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-200">
                        {formatCurrency(row.margin)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {row.marginRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">
                Todavía no hay ventas para calcular margen.
              </p>
            )}
          </div>
        </DarkPanel>
      </div>
      )}

      {activePanel === "ventas" && (
      <DarkPanel>
        <PanelHeader
          icon={ReceiptText}
          title="Detalle de ventas"
        />
        <div className="erp-mobile-table-scroll overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Pedido</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Hora</th>
                <th className="px-4 py-3 font-semibold">Canal</th>
                <th className="px-4 py-3 font-semibold">Método</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginatedAnalysisSales.map((sale) => {
                const saleDetails = saleDetailsById[sale.id] ?? [];
                const firstItem = saleDetails[0];
                const hiddenCount = Math.max(saleDetails.length - 1, 0);
                const isExpanded = expandedSaleId === sale.id;

                return (
                  <Fragment key={sale.id}>
                    <tr
                      className="cursor-pointer transition hover:bg-white/[0.03]"
                      onClick={() =>
                        setExpandedSaleId((current) =>
                          current === sale.id ? null : sale.id,
                        )
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-zinc-200">
                            {firstItem
                              ? `${firstItem.quantity}x ${firstItem.product}`
                              : "Venta sin detalle"}
                          </p>
                          {hiddenCount > 0 && (
                            <p className="text-xs text-zinc-500">
                              + {hiddenCount} producto{hiddenCount > 1 ? "s" : ""} más
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{sale.customer}</td>
                      <td className="px-4 py-3 text-zinc-400">{sale.time}</td>
                      <td className="px-4 py-3 text-zinc-400">
                        {getSaleChannelLabel(sale.channel)}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{sale.method}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-200">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td className="bg-black/20 px-4 py-4" colSpan={6}>
                          <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs uppercase text-zinc-500">Cliente</p>
                                <p className="mt-2 font-semibold text-zinc-100">
                                  {sale.customer}
                                </p>
                              </div>
                              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs uppercase text-zinc-500">Canal</p>
                                <p className="mt-2 font-semibold text-zinc-100">
                                  {getSaleChannelLabel(sale.channel)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs uppercase text-zinc-500">Método</p>
                                <p className="mt-2 font-semibold text-zinc-100">
                                  {sale.method}
                                </p>
                              </div>
                              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs uppercase text-zinc-500">Fecha y hora</p>
                                <p className="mt-2 font-semibold text-zinc-100">
                                  {formatFullDateTime(sale.createdAt)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs uppercase text-zinc-500">Total</p>
                                <p className="mt-2 font-semibold text-emerald-200">
                                  {formatCurrency(sale.total)}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-lg border border-white/10 bg-white/[0.03]">
                              <div className="border-b border-white/10 px-4 py-3">
                                <p className="font-semibold text-zinc-100">
                                  Productos del pedido
                                </p>
                              </div>
                              <div className="divide-y divide-white/10">
                                {saleDetails.map((item) => (
                                  <div
                                    className="flex items-start justify-between gap-4 px-4 py-3"
                                    key={item.id}
                                  >
                                    <div>
                                      <p className="font-semibold text-zinc-100">
                                        {item.quantity}x {item.product}
                                      </p>
                                      {!!item.flavors.length && (
                                        <p className="mt-1 text-xs text-zinc-500">
                                          Gustos: {item.flavors.join(", ")}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs uppercase text-zinc-500">Subtotal</p>
                                <p className="mt-2 font-semibold text-zinc-100">
                                  {formatCurrency(sale.subtotal)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs uppercase text-zinc-500">Descuento</p>
                                <p className="mt-2 font-semibold text-amber-200">
                                  {formatCurrency(sale.discount)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                <p className="text-xs uppercase text-zinc-500">Total final</p>
                                <p className="mt-2 font-semibold text-emerald-200">
                                  {formatCurrency(sale.total)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredSales.length > analysisSalesPageSize && (
          <div className="border-t border-white/10 p-4">
            <PaginationControls
              currentPage={safeAnalysisSalesPage}
              label={`${filteredSales.length} comprobantes`}
              onPageChange={setAnalysisSalesPage}
              pageSize={analysisSalesPageSize}
              totalItems={filteredSales.length}
            />
          </div>
        )}
      </DarkPanel>
      )}

      {activePanel === "historico" && (
      <div className="grid gap-5 2xl:grid-cols-2">
        <DarkPanel>
          <PanelHeader
            icon={Snowflake}
            subtitle="Mes por mes, calculado por baldes cargados"
            title="Histórico mensual de gustos"
          />
          <div className="divide-y divide-white/10">
            {monthlyFlavorRows.map((row) => (
              <button
                className="grid w-full gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/[0.03] sm:grid-cols-[minmax(110px,0.8fr)_minmax(130px,1fr)_80px_minmax(120px,1fr)] sm:items-center lg:grid-cols-[minmax(130px,0.8fr)_minmax(150px,1fr)_90px_minmax(130px,1fr)]"
                key={row.key}
                onClick={() => setSelectedFlavorMonthKey(row.key)}
                type="button"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-100">{row.label}</p>
                  <p className="text-xs text-zinc-500">
                    {formatShortDate(row.start)} - {formatShortDate(row.end)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase text-zinc-500">Más pedido</p>
                  <p className="truncate font-semibold text-cyan-100">
                    {row.topFlavor
                      ? `${row.topFlavor.flavor} (${row.topFlavor.batches})`
                      : "Sin recargas"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-zinc-500">Recargas</p>
                  <p className="font-semibold text-zinc-100">{row.totalBatches}</p>
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-xs text-zinc-500">
                      {row.uniqueFlavors} gusto{row.uniqueFlavors === 1 ? "" : "s"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-cyan-100">
                      Ver mes
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-cyan-300"
                      style={{
                        width: `${(row.totalBatches / maxMonthlyFlavorBatches) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DarkPanel>

        <DarkPanel>
          <PanelHeader
            icon={Package}
            subtitle="Mes por mes, calculado por ventas cobradas"
            title="Histórico mensual de productos"
          />
          <div className="divide-y divide-white/10">
            {monthlyProductRows.map((row) => (
              <button
                className="grid w-full gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/[0.03] sm:grid-cols-[minmax(110px,0.8fr)_minmax(130px,1fr)_80px_minmax(120px,1fr)] sm:items-center lg:grid-cols-[minmax(130px,0.8fr)_minmax(150px,1fr)_90px_minmax(130px,1fr)]"
                key={row.key}
                onClick={() => setSelectedProductMonthKey(row.key)}
                type="button"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-100">{row.label}</p>
                  <p className="text-xs text-zinc-500">
                    {formatShortDate(row.start)} - {formatShortDate(row.end)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase text-zinc-500">Más vendido</p>
                  <p className="truncate font-semibold text-cyan-100">
                    {row.topProduct
                      ? `${row.topProduct.product} (${row.topProduct.quantity})`
                      : "Sin ventas"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-zinc-500">Unidades</p>
                  <p className="font-semibold text-zinc-100">{row.totalUnits}</p>
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-xs text-zinc-500">
                      {row.totalProducts} producto{row.totalProducts === 1 ? "" : "s"}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-cyan-100">
                      Ver mes
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-cyan-300"
                      style={{
                        width: `${(row.totalUnits / maxMonthlyProductUnits) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DarkPanel>

        <DarkPanel className="2xl:col-span-2">
          <PanelHeader
            icon={CalendarClock}
            title="Histórico por año"
          />
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {yearlyRows.length ? (
              yearlyRows.map((row) => (
                <div
                  className="rounded-lg border border-white/10 bg-black/20 p-4"
                  key={row.year}
                >
                  <p className="text-sm text-zinc-500">Año {row.year}</p>
                  <p className="mt-2 text-xl font-semibold text-cyan-100">
                    {formatCurrency(row.total)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">Todavía no hay ventas históricas.</p>
            )}
          </div>
        </DarkPanel>
      </div>
      )}

      {activePanel === "gastos" && (
      <DarkPanel>
        <PanelHeader
          icon={DollarSign}
          title="Resumen de costos y gastos"
        />
        <div className="grid gap-5 p-4 xl:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-zinc-500">Costo de productos vendidos</p>
            <p className="mt-2 text-2xl font-semibold text-amber-100">
              {formatCurrency(soldProductCost)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-zinc-500">Gastos fijos</p>
            <p className="mt-2 text-2xl font-semibold text-amber-100">
              {formatCurrency(allocatedFixedExpenses)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-zinc-500">Comisiones</p>
            <p className="mt-2 text-2xl font-semibold text-amber-100">
              {formatCurrency(commissionCost)}
            </p>
          </div>
          <div
            className={cn(
              "rounded-lg border p-4",
              netProfit >= 0
                ? "border-emerald-300/20 bg-emerald-300/10"
                : "border-rose-300/20 bg-rose-300/10",
            )}
          >
            <p className={cn("text-sm", netProfit >= 0 ? "text-emerald-100" : "text-rose-100")}>
              Ganancia real
            </p>
            <p className={cn("mt-2 text-2xl font-semibold", netProfit >= 0 ? "text-emerald-200" : "text-rose-200")}>
              {formatCurrency(netProfit)}
            </p>
          </div>
        </div>
      </DarkPanel>
      )}

      {activeRankingDetail === "flavors" && (
        <StockFormModal
          icon={Snowflake}
          onClose={() => setActiveRankingDetail(null)}
          title="Detalle del ranking de gustos"
        >
          <div className="p-4">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <AnalysisDetailCard
                label="Más pedido del período"
                value={allPeriodFlavors[0]?.flavor ?? "Sin recargas"}
              />
              <AnalysisDetailCard
                label="Baldes del período"
                value={String(periodFlavorBatches.length)}
              />
              <AnalysisDetailCard
                label="Gustos movidos"
                value={String(allPeriodFlavors.length)}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.2fr]">
              <DetailSection title={`${periodName}: ranking completo`}>
                {allPeriodFlavors.length ? (
                  allPeriodFlavors.map((flavor, index) => (
                    <DetailLine
                      key={flavor.id}
                      label={`${index + 1}. ${flavor.flavor} · ${flavor.kilos} kg`}
                      value={`${flavor.batches} recarga${flavor.batches === 1 ? "" : "s"}`}
                    />
                  ))
                ) : (
                  <p className="px-4 py-4 text-sm text-zinc-500">
                    No hay baldes cargados en este período.
                  </p>
                )}
              </DetailSection>

              <div className="rounded-lg border border-white/10 bg-black/20">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="font-semibold text-zinc-100">
                    Mes por mes
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Tocá un mes para ver cómo le fue a cada gusto.
                  </p>
                </div>
                <div className="max-h-[46vh] divide-y divide-white/10 overflow-y-auto">
                  {monthlyFlavorRows.map((row) => (
                    <button
                      className="grid w-full gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/[0.03] md:grid-cols-[minmax(120px,0.75fr)_minmax(160px,1fr)_90px] md:items-center"
                      key={row.key}
                      onClick={() => setSelectedFlavorMonthKey(row.key)}
                      type="button"
                    >
                      <div>
                        <p className="font-semibold text-zinc-100">{row.label}</p>
                        <p className="text-xs text-zinc-500">
                          {row.uniqueFlavors} gusto{row.uniqueFlavors === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-zinc-500">Más pedido</p>
                        <p className="font-semibold text-cyan-100">
                          {row.topFlavor
                            ? `${row.topFlavor.flavor} (${row.topFlavor.batches})`
                            : "Sin recargas"}
                        </p>
                      </div>
                      <p className="font-semibold text-zinc-100">
                        {row.totalBatches} recarga{row.totalBatches === 1 ? "" : "s"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </StockFormModal>
      )}

      {activeRankingDetail === "products" && (
        <StockFormModal
          icon={Package}
          onClose={() => setActiveRankingDetail(null)}
          title="Detalle del ranking de productos"
        >
          <div className="p-4">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <AnalysisDetailCard
                label="Más vendido"
                value={productRankingRows[0]?.product ?? "Sin ventas"}
              />
              <AnalysisDetailCard
                label="Unidades vendidas"
                value={String(soldProducts)}
              />
              <AnalysisDetailCard
                label="Ventas"
                value={String(filteredSales.length)}
              />
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20">
              <div className="erp-ranking-header grid gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase text-zinc-500 md:grid-cols-[42px_minmax(180px,1fr)_100px_120px_120px_120px]">
                <span>#</span>
                <span>Producto</span>
                <span>Vendidos</span>
                <span>Total</span>
                <span>Costo</span>
                <span>Margen</span>
              </div>
              <div className="divide-y divide-white/10">
                {productRankingRows.length ? (
                  productRankingRows.map((row, index) => (
                    <div
                      className="erp-product-ranking-row grid gap-3 px-4 py-3 text-sm md:grid-cols-[42px_minmax(180px,1fr)_100px_120px_120px_120px] md:items-center"
                      key={row.product}
                    >
                      <span className="flex size-7 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold text-zinc-300">
                        {index + 1}
                      </span>
                      <p className="font-semibold text-zinc-100">{row.product}</p>
                      <p className="text-zinc-300">{row.quantity}</p>
                      <p className="text-zinc-300">{formatCurrency(row.revenue)}</p>
                      <p className="text-amber-100">{formatCurrency(row.cost)}</p>
                      <p className={row.margin >= 0 ? "text-emerald-100" : "text-rose-100"}>
                        {formatCurrency(row.margin)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-6 text-sm text-zinc-500">
                    No hay productos vendidos en este período.
                  </p>
                )}
              </div>
            </div>
          </div>
        </StockFormModal>
      )}

      {activeRankingDetail === "margin" && (
        <StockFormModal
          icon={BadgeDollarSign}
          onClose={() => setActiveRankingDetail(null)}
          title="Detalle del margen por producto"
        >
          <div className="p-4">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <AnalysisDetailCard
                label="Mejor margen"
                value={allMarginRows[0]?.product ?? "Sin ventas"}
              />
              <AnalysisDetailCard
                label="Ganancia productos"
                value={formatCurrency(allMarginRows.reduce((total, row) => total + row.margin, 0))}
              />
              <AnalysisDetailCard
                label="Productos analizados"
                value={String(allMarginRows.length)}
              />
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20">
              <div className="erp-ranking-header grid gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase text-zinc-500 md:grid-cols-[42px_minmax(180px,1fr)_100px_120px_120px_120px]">
                <span>#</span>
                <span>Producto</span>
                <span>Vendidos</span>
                <span>Total</span>
                <span>Costo</span>
                <span>Margen</span>
              </div>
              <div className="divide-y divide-white/10">
                {allMarginRows.length ? (
                  allMarginRows.map((row, index) => (
                    <div
                      className="erp-product-ranking-row grid gap-3 px-4 py-3 text-sm md:grid-cols-[42px_minmax(180px,1fr)_100px_120px_120px_120px] md:items-center"
                      key={row.product}
                    >
                      <span className="flex size-7 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold text-zinc-300">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-zinc-100">{row.product}</p>
                        <p className="text-xs text-zinc-500">
                          {row.marginRate.toFixed(1)}% de margen
                        </p>
                      </div>
                      <p className="text-zinc-300">{row.quantity}</p>
                      <p className="text-zinc-300">{formatCurrency(row.revenue)}</p>
                      <p className="text-amber-100">{formatCurrency(row.cost)}</p>
                      <p className={row.margin >= 0 ? "text-emerald-100" : "text-rose-100"}>
                        {formatCurrency(row.margin)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-6 text-sm text-zinc-500">
                    No hay ventas para calcular margen en este período.
                  </p>
                )}
              </div>
            </div>
          </div>
        </StockFormModal>
      )}

      {selectedFlavorMonth && (
        <StockFormModal
          icon={Snowflake}
          onClose={() => setSelectedFlavorMonthKey(null)}
          title={`Gustos de ${selectedFlavorMonth.label}`}
        >
          <div className="p-4">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <AnalysisDetailCard
                label="Gusto más pedido"
                value={selectedFlavorMonth.topFlavor?.flavor ?? "Sin recargas"}
              />
              <AnalysisDetailCard
                label="Baldes cargados"
                value={String(selectedFlavorMonth.totalBatches)}
              />
              <AnalysisDetailCard
                label="Gustos movidos"
                value={String(selectedFlavorMonth.uniqueFlavors)}
              />
            </div>

            {selectedFlavorMonth.flavors.length ? (
              <div className="rounded-lg border border-white/10 bg-black/20">
                <div className="erp-ranking-header grid gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase text-zinc-500 md:grid-cols-[42px_minmax(160px,1fr)_110px_110px_minmax(170px,1fr)]">
                  <span>#</span>
                  <span>Gusto</span>
                  <span>Recargas</span>
                  <span>Kilos</span>
                  <span>Última carga</span>
                </div>
                <div className="divide-y divide-white/10">
                  {selectedFlavorMonth.flavors.map((flavor, index) => (
                    <div
                      className="erp-flavor-ranking-row grid gap-3 px-4 py-3 text-sm md:grid-cols-[42px_minmax(160px,1fr)_110px_110px_minmax(170px,1fr)] md:items-center"
                      key={flavor.id}
                    >
                      <span className="flex size-7 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold text-zinc-300">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-zinc-100">{flavor.flavor}</p>
                        <p className="text-xs text-zinc-500">
                          {flavor.activeBatches} en uso · {flavor.closedBatches} vacíos
                        </p>
                      </div>
                      <p className="font-semibold text-cyan-100">{flavor.batches}</p>
                      <p className="text-zinc-300">{flavor.kilos} kg</p>
                      <p className="text-zinc-400">{formatFullDateTime(flavor.lastLoadedAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
                No se cargaron baldes en este mes.
              </div>
            )}
          </div>
        </StockFormModal>
      )}

      {selectedProductMonth && (
        <StockFormModal
          icon={Package}
          onClose={() => setSelectedProductMonthKey(null)}
          title={`Productos de ${selectedProductMonth.label}`}
        >
          <div className="p-4">
            <div className="mb-4 grid gap-3 sm:grid-cols-4">
              <AnalysisDetailCard
                label="Producto más vendido"
                value={selectedProductMonth.topProduct?.product ?? "Sin ventas"}
              />
              <AnalysisDetailCard
                label="Unidades vendidas"
                value={String(selectedProductMonth.totalUnits)}
              />
              <AnalysisDetailCard
                label="Total vendido"
                value={formatCurrency(selectedProductMonth.totalRevenue)}
              />
              <AnalysisDetailCard
                label="Ventas"
                value={String(selectedProductMonth.salesCount)}
              />
            </div>

            {selectedProductMonth.products.length ? (
              <div className="rounded-lg border border-white/10 bg-black/20">
                <div className="erp-ranking-header grid gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase text-zinc-500 md:grid-cols-[42px_minmax(180px,1fr)_100px_120px_120px_120px]">
                  <span>#</span>
                  <span>Producto</span>
                  <span>Vendidos</span>
                  <span>Total</span>
                  <span>Costo</span>
                  <span>Margen</span>
                </div>
                <div className="divide-y divide-white/10">
                  {selectedProductMonth.products.map((product, index) => (
                    <div
                      className="erp-product-ranking-row grid gap-3 px-4 py-3 text-sm md:grid-cols-[42px_minmax(180px,1fr)_100px_120px_120px_120px] md:items-center"
                      key={product.product}
                    >
                      <span className="flex size-7 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold text-zinc-300">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-zinc-100">{product.product}</p>
                        <p className="text-xs text-zinc-500">
                          {product.marginRate.toFixed(1)}% de margen
                        </p>
                      </div>
                      <p className="font-semibold text-cyan-100">{product.quantity}</p>
                      <p className="text-zinc-300">{formatCurrency(product.revenue)}</p>
                      <p className="text-amber-100">{formatCurrency(product.cost)}</p>
                      <p className={product.margin >= 0 ? "text-emerald-100" : "text-rose-100"}>
                        {formatCurrency(product.margin)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
                No se vendieron productos en este mes.
              </div>
            )}
          </div>
        </StockFormModal>
      )}
    </div>
  );
}

function AnalysisDetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-xs uppercase text-zinc-500">{label}</p>
      <p className="mt-2 break-words text-lg font-semibold text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function DetailSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="font-semibold text-zinc-100">{title}</p>
      </div>
      <div className="divide-y divide-white/10">{children}</div>
    </div>
  );
}

function DetailLine({
  label,
  strong,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <span className={strong ? "font-semibold text-zinc-100" : "text-zinc-400"}>
        {label}
      </span>
      <span
        className={cn(
          "text-right font-semibold",
          strong ? "text-cyan-100" : "text-zinc-100",
        )}
      >
        {value}
      </span>
    </div>
  );
}

type HistoryRow = {
  label: string;
  dateLabel?: string;
  gross: number;
  net: number;
  items: number;
};

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const startOfDay = (date: Date) => {
  const parts = getArgentinaDateParts(date);
  return createArgentinaDate({
    year: parts.year,
    month: parts.month,
    day: parts.day,
  });
};

const endOfDay = (date: Date) => {
  const parts = getArgentinaDateParts(date);
  return createArgentinaDate({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: 23,
    minute: 59,
    second: 59,
    millisecond: 999,
  });
};

const getOperationalDayRange = (date: Date) => {
  const parts = getArgentinaDateParts(date);
  const candidateStart = createArgentinaDate({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: SHIFT_DAY_START_HOUR,
  });
  const start =
    date < candidateStart
      ? addArgentinaDays(candidateStart, -1)
      : candidateStart;

  return {
    start,
    end: new Date(addArgentinaDays(start, 1).getTime() - 1),
  };
};

const startOfWeek = (date: Date) => {
  const day = startOfDay(date);
  const weekday = day.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return startOfDay(addArgentinaDays(day, mondayOffset));
};

const getDataDateRange = (
  sales: Sale[],
  expenseHistory: ExpenseHistory[] = [],
  flavorBatches: FlavorBatch[] = [],
) => {
  const timestamps = [
    ...sales.map((sale) => new Date(sale.createdAt).getTime()),
    ...expenseHistory.map((snapshot) => new Date(snapshot.startsAt).getTime()),
    ...flavorBatches.map((batch) => new Date(batch.createdAt).getTime()),
  ].filter((value) => Number.isFinite(value));

  if (!timestamps.length) {
    const today = new Date();
    return { start: startOfDay(today), end: endOfDay(today) };
  }

  return {
    start: startOfDay(new Date(Math.min(...timestamps))),
    end: endOfDay(new Date(Math.max(...timestamps))),
  };
};

const getAnalysisPeriodRange = (
  period: AnalysisPeriod,
  sales: Sale[],
  expenseHistory: ExpenseHistory[],
  flavorBatches: FlavorBatch[] = [],
) => {
  const nowParts = getArgentinaDateParts(new Date());
  const today = createArgentinaDate(nowParts);

  if (period === "dia") {
    return { start: startOfDay(today), end: endOfDay(today) };
  }

  if (period === "semana") {
    const start = startOfWeek(today);
    return { start, end: endOfDay(addArgentinaDays(start, 6)) };
  }

  if (period === "mes") {
    const start = createArgentinaDate({
      year: nowParts.year,
      month: nowParts.month,
      day: 1,
    });
    const end = endOfDay(
      createArgentinaDate({
        year: nowParts.year,
        month: nowParts.month,
        day: getDaysInMonth(nowParts.year, nowParts.month),
      }),
    );
    return { start, end };
  }

  if (period === "ano") {
    const start = createArgentinaDate({
      year: nowParts.year,
      month: 1,
      day: 1,
    });
    const end = endOfDay(
      createArgentinaDate({
        year: nowParts.year,
        month: 12,
        day: 31,
      }),
    );
    return { start, end };
  }

  return getDataDateRange(sales, expenseHistory, flavorBatches);
};

const normalizeExpenseCategory = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const isProductionExpense = (expense: { category: string }) =>
  normalizeExpenseCategory(expense.category) === "produccion";

const currentExpenseBreakdown = (expenses: Expense[]) =>
  expenses.reduce(
    (acc, expense) => {
      if (!isProductionExpense(expense)) {
        acc.fixed += expense.amount;
        acc.total += expense.amount;
      }
      return acc;
    },
    { fixed: 0, production: 0, total: 0 },
  );

const getExpenseBreakdownForDate = (
  date: Date,
  expenses: Expense[],
  expenseHistory: ExpenseHistory[],
) => {
  const sortedHistory = [...expenseHistory].sort(
    (left, right) =>
      new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
  const activeSnapshot = sortedHistory
    .filter((snapshot) => new Date(snapshot.startsAt) <= date)
    .at(-1);
  const sourceExpenses =
    activeSnapshot?.expenses ??
    sortedHistory[0]?.expenses ??
    expenses;

  return currentExpenseBreakdown(sourceExpenses);
};

const calculateExpenseBreakdownBetween = (
  start: Date,
  end: Date,
  expenses: Expense[],
  expenseHistory: ExpenseHistory[],
) => {
  const breakdown = { fixed: 0, production: 0, total: 0 };
  let cursor = startOfDay(start);

  while (cursor <= end) {
    const dayStart = startOfDay(cursor);
    const dayEnd = endOfDay(cursor);
    const segmentStart = new Date(Math.max(start.getTime(), dayStart.getTime()));
    const segmentEnd = new Date(Math.min(end.getTime(), dayEnd.getTime()));

    if (segmentEnd < segmentStart) {
      cursor = startOfDay(addArgentinaDays(dayStart, 1));
      continue;
    }

    const dateParts = getArgentinaDateParts(dayStart);
    const daysInCursorMonth = getDaysInMonth(dateParts.year, dateParts.month);
    const snapshot = getExpenseBreakdownForDate(
      segmentEnd,
      expenses,
      expenseHistory,
    );
    const dayShare =
      (segmentEnd.getTime() - segmentStart.getTime() + 1) /
      (dayEnd.getTime() - dayStart.getTime() + 1);

    breakdown.fixed += (snapshot.fixed / daysInCursorMonth) * dayShare;
    breakdown.production += (snapshot.production / daysInCursorMonth) * dayShare;
    breakdown.total += (snapshot.total / daysInCursorMonth) * dayShare;
    cursor = startOfDay(addArgentinaDays(dayStart, 1));
  }

  return breakdown;
};

const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIMEZONE,
    day: "numeric",
    month: "short",
  })
    .format(date)
    .replace(".", "");

const getSalesBetween = (sales: Sale[], start: Date, end: Date) =>
  sales.filter((sale) => {
    const saleDate = new Date(sale.createdAt);
    return saleDate >= start && saleDate <= end;
  });

const summarizeSales = (
  sales: Sale[],
  saleItems: SaleItem[],
  expenseBreakdown: { total: number },
  paymentMethodCommissions: Record<string, number>,
  channelCommissions: Record<SaleChannel, number>,
  commissionHistory: CommissionHistory[] = [],
  shiftFilter: ShiftFilter = "todo",
  channelFilter: ChannelFilter = "todo",
): HistoryRow => {
  const filteredSales = sales.filter(
    (sale) =>
      saleMatchesShiftFilter(sale, shiftFilter) &&
      saleMatchesChannelFilter(sale, channelFilter),
  );
  const filteredSaleIds = new Set(filteredSales.map((sale) => sale.id));
  const filteredSaleItems = saleItems.filter((item) =>
    filteredSaleIds.has(item.saleId),
  );
  const periodGross = sales.reduce((total, sale) => total + sale.total, 0);
  const gross = filteredSales.reduce((total, sale) => total + sale.total, 0);
  const items = filteredSales.reduce((total, sale) => total + sale.items, 0);
  const soldProductCost = filteredSaleItems.reduce(
    (total, item) => total + item.cost * item.quantity,
    0,
  );
  const hasFilters = shiftFilter !== "todo" || channelFilter !== "todo";
  const allocatedExpense =
    !hasFilters
      ? expenseBreakdown.total
      : allocateExpenseByRevenueShare(expenseBreakdown.total, gross, periodGross);
  const commissionCost = calculateCommissionCost(
    filteredSales,
    paymentMethodCommissions,
    channelCommissions,
    commissionHistory,
  );

  return {
    label: "",
    gross,
    net: gross - soldProductCost - allocatedExpense - commissionCost,
    items,
  };
};

function HistorialView({
  channelCommissions,
  commissionHistory,
  expenses,
  expenseHistory,
  paymentMethodCommissions,
  saleItems,
  sales,
}: {
  channelCommissions: Record<SaleChannel, number>;
  commissionHistory: CommissionHistory[];
  expenses: Expense[];
  expenseHistory: ExpenseHistory[];
  paymentMethodCommissions: Record<string, number>;
  saleItems: SaleItem[];
  sales: Sale[];
}) {
  const [activeHistoryView, setActiveHistoryView] = useState<
    "diario" | "semanal" | "mensual" | "anual" | "total"
  >("diario");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("todo");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("todo");
  const argentinaTodayParts = getArgentinaDateParts(new Date());
  const currentDate = createArgentinaDate(argentinaTodayParts);
  const currentYear = argentinaTodayParts.year;

  const weeklyRows = Array.from({ length: 4 }, (_, index) => {
    const end = endOfDay(addArgentinaDays(currentDate, -index * 7));
    const start = startOfDay(addArgentinaDays(end, -6));
    const summary = summarizeSales(
      getSalesBetween(sales, start, end),
      saleItems,
      calculateExpenseBreakdownBetween(start, end, expenses, expenseHistory),
      paymentMethodCommissions,
      channelCommissions,
      commissionHistory,
      shiftFilter,
      channelFilter,
    );

    return {
      ...summary,
      label: `Semana ${4 - index}`,
      dateLabel: `${formatShortDate(start)} - ${formatShortDate(end)}`,
    };
  }).reverse();

  const dailyRows = Array.from({ length: 7 }, (_, index) => {
    const day = startOfDay(addArgentinaDays(currentDate, -(6 - index)));
    const dayRange = getOperationalDayRange(
      createArgentinaDate({
        ...getArgentinaDateParts(day),
        hour: SHIFT_DAY_START_HOUR,
      }),
    );
    const summary = summarizeSales(
      getSalesBetween(sales, dayRange.start, dayRange.end),
      saleItems,
      calculateExpenseBreakdownBetween(dayRange.start, dayRange.end, expenses, expenseHistory),
      paymentMethodCommissions,
      channelCommissions,
      commissionHistory,
      shiftFilter,
      channelFilter,
    );

    return {
      ...summary,
      label: getArgentinaWeekdayLabel(day),
      dateLabel: formatShortDate(day),
    };
  });

  const monthlyRows = monthNames.map((month, index) => {
    const start = createArgentinaDate({
      year: currentYear,
      month: index + 1,
      day: 1,
    });
    const end = endOfDay(
      createArgentinaDate({
        year: currentYear,
        month: index + 1,
        day: getDaysInMonth(currentYear, index + 1),
      }),
    );
    const summary = summarizeSales(
      getSalesBetween(sales, start, end),
      saleItems,
      calculateExpenseBreakdownBetween(start, end, expenses, expenseHistory),
      paymentMethodCommissions,
      channelCommissions,
      commissionHistory,
      shiftFilter,
      channelFilter,
    );

    return {
      ...summary,
      label: month,
      dateLabel: String(currentYear),
    };
  });

  const years = Array.from(
    new Set([
      currentYear,
      currentYear - 1,
      ...sales.map((sale) => getArgentinaYear(sale.createdAt)),
    ]),
  ).sort((a, b) => a - b);

  const annualRows = years.map((year) => {
    const start = createArgentinaDate({
      year,
      month: 1,
      day: 1,
    });
    const end = endOfDay(
      createArgentinaDate({
        year,
        month: 12,
        day: 31,
      }),
    );
    const summary = summarizeSales(
      getSalesBetween(sales, start, end),
      saleItems,
      calculateExpenseBreakdownBetween(start, end, expenses, expenseHistory),
      paymentMethodCommissions,
      channelCommissions,
      commissionHistory,
      shiftFilter,
      channelFilter,
    );

    return {
      ...summary,
      label: String(year),
    };
  });
  const totalRange = getDataDateRange(sales, expenseHistory);
  const totalSummary = summarizeSales(
    getSalesBetween(sales, totalRange.start, totalRange.end),
    saleItems,
    calculateExpenseBreakdownBetween(
      totalRange.start,
      totalRange.end,
      expenses,
      expenseHistory,
    ),
    paymentMethodCommissions,
    channelCommissions,
    commissionHistory,
    shiftFilter,
    channelFilter,
  );
  const totalRows = [
    {
      ...totalSummary,
      label: "Total",
      dateLabel: `${formatShortDate(totalRange.start)} - ${formatShortDate(totalRange.end)}`,
    },
  ];

  return (
    <div className="space-y-5">
      <DarkPanel>
        <div className="flex flex-col gap-3 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "diario", label: "Diario" },
              { id: "semanal", label: "Semanal" },
              { id: "mensual", label: "Mensual" },
              { id: "anual", label: "Anual" },
              { id: "total", label: "Total" },
            ].map((tab) => (
              <button
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                  activeHistoryView === tab.id
                    ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                )}
                key={tab.id}
                onClick={() =>
                  setActiveHistoryView(
                    tab.id as "diario" | "semanal" | "mensual" | "anual" | "total",
                  )
                }
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <CompactFilterGroup
              label="Turno"
              onChange={setShiftFilter}
              options={shiftFilterOptions}
              value={shiftFilter}
            />
            <CompactFilterGroup
              label="Canal"
              onChange={setChannelFilter}
              options={channelFilterOptions}
              value={channelFilter}
            />
          </div>
        </div>
      </DarkPanel>
      <div className="grid gap-5">
        {activeHistoryView === "diario" && (
          <HistoryTable
            icon={Lightbulb}
            rows={dailyRows}
            title="Ingresos diarios (última semana)"
            totalLabel="Total semana"
          />
        )}
        {activeHistoryView === "semanal" && (
          <HistoryTable
            icon={CalendarClock}
            rows={weeklyRows}
            title="Ingresos semanales"
            totalLabel="Total 4 semanas"
          />
        )}
        {activeHistoryView === "mensual" && (
          <HistoryTable
            icon={CalendarClock}
            rows={monthlyRows}
            title="Ingresos mensuales"
            totalLabel="Total año"
          />
        )}
        {activeHistoryView === "anual" && (
          <HistoryTable
            icon={WalletCards}
            rows={annualRows}
            title="Ingresos anuales"
            totalLabel="Total histórico"
          />
        )}
        {activeHistoryView === "total" && (
          <HistoryTable
            icon={BadgeDollarSign}
            rows={totalRows}
            title="Total histórico"
            totalLabel="Total"
          />
        )}
      </div>
    </div>
  );
}

function HistoryTable({
  icon,
  rows,
  title,
  totalLabel,
}: {
  icon: LucideIcon;
  rows: HistoryRow[];
  title: string;
  totalLabel: string;
}) {
  const totals = rows.reduce(
    (acc, row) => ({
      gross: acc.gross + row.gross,
      net: acc.net + row.net,
      items: acc.items + row.items,
    }),
    { gross: 0, net: 0, items: 0 },
  );

  return (
    <DarkPanel>
      <PanelHeader icon={icon} title={title} />
      <div className="erp-mobile-table-scroll overflow-x-auto p-4">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="pb-2 font-semibold">Período</th>
              <th className="pb-2 text-right font-semibold">Total vendido</th>
              <th className="pb-2 text-right font-semibold">Ganancia real</th>
              <th className="pb-2 text-right font-semibold">Productos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row) => (
              <tr key={`${row.label}-${row.dateLabel ?? ""}`}>
                <td className="py-2 pr-3">
                  <p className="font-semibold text-zinc-100">{row.label}</p>
                  {row.dateLabel && (
                    <p className="text-xs text-zinc-500">{row.dateLabel}</p>
                  )}
                </td>
                <td className="py-2 text-right text-cyan-100">
                  {formatCurrency(row.gross)}
                </td>
                <td
                  className={cn(
                    "py-2 text-right font-semibold",
                    row.net >= 0 ? "text-emerald-200" : "text-rose-200",
                  )}
                >
                  {formatCurrency(row.net)}
                </td>
                <td className="py-2 text-right text-zinc-100">{row.items}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-rose-500/80">
              <td className="pt-4 font-semibold text-zinc-100">{totalLabel}</td>
              <td className="pt-4 text-right font-semibold text-cyan-100">
                {formatCurrency(totals.gross)}
              </td>
              <td
                className={cn(
                  "pt-4 text-right font-semibold",
                  totals.net >= 0 ? "text-emerald-200" : "text-rose-200",
                )}
              >
                {formatCurrency(totals.net)}
              </td>
              <td className="pt-4 text-right font-semibold text-zinc-100">
                {totals.items}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </DarkPanel>
  );
}

function FinanzasView({
  channelCommissions,
  commissionHistory,
  commissionCost,
  deleteCommissionHistory,
  deleteExpenseHistory,
  editCommissionHistory,
  editExpenseHistory,
  expenses,
  expenseHistory,
  paymentMethodCommissions,
  paymentMethods,
  saveCommissions,
  saveExpenses,
  updateExpense,
}: {
  channelCommissions: Record<SaleChannel, number>;
  commissionHistory: CommissionHistory[];
  commissionCost: number;
  deleteCommissionHistory: (snapshot: CommissionHistory) => void;
  deleteExpenseHistory: (snapshot: ExpenseHistory) => void;
  editCommissionHistory: (snapshot: CommissionHistory) => Promise<boolean>;
  editExpenseHistory: (snapshot: ExpenseHistory) => Promise<boolean>;
  expenses: Expense[];
  expenseHistory: ExpenseHistory[];
  paymentMethodCommissions: Record<string, number>;
  paymentMethods: string[];
  saveCommissions: (
    methods: Record<string, number>,
    channels: Record<SaleChannel, number>,
  ) => Promise<boolean>;
  saveExpenses: (expensesToSave?: Expense[]) => void;
  updateExpense: (key: string, value: number) => void;
}) {
  const fixedExpenseItems = expenses.filter((expense) => !isProductionExpense(expense));
  const fixedExpenses = fixedExpenseItems.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
  const editableExpenseItems = [
    ...defaultExpenseItems.map((defaultExpense) => {
      const savedExpense = fixedExpenseItems.find(
        (expense) => expense.key === defaultExpense.key,
      );
      return savedExpense ?? defaultExpense;
    }),
    ...fixedExpenseItems.filter(
      (expense) =>
        !defaultExpenseItems.some(
          (defaultExpense) => defaultExpense.key === expense.key,
        ),
    ),
  ];
  const commissionMethodNames =
    paymentMethods.length > 0 ? paymentMethods : defaultPaymentMethods;
  const [methodDraft, setMethodDraft] = useState(paymentMethodCommissions);
  const [channelDraft, setChannelDraft] = useState(channelCommissions);
  const [isExpensesPopupOpen, setIsExpensesPopupOpen] = useState(false);
  const [isCommissionsPopupOpen, setIsCommissionsPopupOpen] = useState(false);
  const [isSavingCommissions, setIsSavingCommissions] = useState(false);

  useEffect(() => {
    setMethodDraft(paymentMethodCommissions);
    setChannelDraft(channelCommissions);
  }, [channelCommissions, paymentMethodCommissions]);

  const updateMethodDraft = (method: string, value: number) => {
    setMethodDraft((current) => ({
      ...current,
      [method]: Math.min(100, Math.max(0, value)),
    }));
  };

  const updateChannelDraft = (channel: SaleChannel, value: number) => {
    setChannelDraft((current) => ({
      ...current,
      [channel]: Math.min(100, Math.max(0, value)),
    }));
  };

  const handleSaveCommissions = async () => {
    setIsSavingCommissions(true);
    const completeMethodDraft = Object.fromEntries(
      commissionMethodNames.map((method) => [method, methodDraft[method] ?? 0]),
    );
    await saveCommissions(completeMethodDraft, channelDraft);
    setIsSavingCommissions(false);
    setIsCommissionsPopupOpen(false);
  };

  const loadRealisticCommissionExample = () => {
    setChannelDraft(defaultChannelCommissions);
    setMethodDraft(
      Object.fromEntries(
        commissionMethodNames.map((method) => [
          method,
          defaultPaymentMethodCommissions[method] ?? methodDraft[method] ?? 0,
        ]),
      ),
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <DarkPanel>
          <PanelHeader
            right={
              <Button
                className="h-10 bg-[var(--erp-primary)] font-semibold text-[var(--erp-primary-text)] hover:opacity-90"
                onClick={() => setIsExpensesPopupOpen(true)}
                type="button"
              >
                Editar gastos
              </Button>
            }
            icon={Lightbulb}
            title="Gastos fijos"
          />
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-2xl font-semibold text-zinc-100">
                {formatCurrency(fixedExpenses)}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {fixedExpenseItems.length} conceptos cargados
              </p>
            </div>
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={() => setIsExpensesPopupOpen(true)}
              type="button"
              variant="outline"
            >
              Ver detalle
            </Button>
          </div>
        </DarkPanel>

        <DarkPanel>
          <PanelHeader
            right={
              <Button
                className="h-10 bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
                onClick={() => setIsCommissionsPopupOpen(true)}
                type="button"
              >
                Editar comisiones
              </Button>
            }
            icon={CreditCard}
            title="Comisiones"
          />
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-2xl font-semibold text-zinc-100">
                {formatCurrency(commissionCost)}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Canales y medios de pago
              </p>
            </div>
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={() => setIsCommissionsPopupOpen(true)}
              type="button"
              variant="outline"
            >
              Ver detalle
            </Button>
          </div>
        </DarkPanel>
      </div>

      {isExpensesPopupOpen && (
        <StockFormModal
          icon={Lightbulb}
          onClose={() => setIsExpensesPopupOpen(false)}
          title="Gastos fijos"
        >
          <div className="grid gap-3 border-b border-white/10 p-4 sm:grid-cols-2">
            {editableExpenseItems.map((expense) => (
              <ExpenseAmountField
                key={expense.key}
                label={expense.label}
                onChange={(value) => updateExpense(expense.key, value)}
                value={expense.amount}
              />
            ))}
          </div>
          <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end">
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={() => setIsExpensesPopupOpen(false)}
              type="button"
              variant="outline"
            >
              Cerrar
            </Button>
            <Button
              className="bg-[var(--erp-primary)] font-semibold text-[var(--erp-primary-text)] hover:opacity-90"
              onClick={() => {
                saveExpenses(editableExpenseItems);
                setIsExpensesPopupOpen(false);
              }}
              type="button"
            >
              Guardar gastos
            </Button>
          </div>
        </StockFormModal>
      )}

      {isCommissionsPopupOpen && (
        <StockFormModal
          icon={CreditCard}
          onClose={() => setIsCommissionsPopupOpen(false)}
          title="Comisiones"
        >
          <div className="space-y-4 border-b border-white/10 p-4">
            <p className="text-sm text-zinc-400">
              Cargá el porcentaje que cobra cada canal o medio. En cada venta se suma el porcentaje del canal elegido más el método de pago elegido.
            </p>
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  Porcentaje por canal
                </p>
                <span className="text-xs text-zinc-500">Se aplica según Local o Pedidos Ya</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {saleChannelOptions.map((channel) => (
                  <CommissionField
                    key={channel.id}
                    label={channel.label}
                    onChange={(value) => updateChannelDraft(channel.id, value)}
                    value={channelDraft[channel.id] ?? 0}
                  />
                ))}
              </div>
            </section>
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  Porcentaje por método de pago
                </p>
                <span className="text-xs text-zinc-500">Se aplica según cómo paga el cliente</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {commissionMethodNames.map((method) => (
                  <CommissionField
                    key={method}
                    label={method}
                    onChange={(value) => updateMethodDraft(method, value)}
                    value={methodDraft[method] ?? 0}
                  />
                ))}
              </div>
            </section>
          </div>
          <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              className="border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20"
              disabled={isSavingCommissions}
              onClick={loadRealisticCommissionExample}
              type="button"
              variant="outline"
            >
              Cargar ejemplo realista
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              disabled={isSavingCommissions}
              onClick={() => setIsCommissionsPopupOpen(false)}
              type="button"
              variant="outline"
            >
              Cerrar
            </Button>
            <Button
              className="bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
              disabled={isSavingCommissions}
              onClick={handleSaveCommissions}
              type="button"
            >
              {isSavingCommissions ? "Guardando..." : "Guardar comisiones"}
            </Button>
            </div>
          </div>
        </StockFormModal>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/5 text-[var(--erp-primary)]">
            <ReceiptText className="size-4" />
          </div>
          <h2 className="font-semibold text-[var(--erp-text)]">
            Correcciones guardadas
          </h2>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <ExpenseHistoryPanel
            history={expenseHistory}
            onDelete={deleteExpenseHistory}
            onSave={editExpenseHistory}
          />

          <CommissionHistoryPanel
            history={commissionHistory}
            onDelete={deleteCommissionHistory}
            onSave={editCommissionHistory}
          />
        </div>
      </div>
    </div>
  );
}

function CommissionField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="min-w-0 text-xs font-semibold text-zinc-500">
      {label}
      <div className="mt-1 grid h-10 grid-cols-[minmax(0,1fr)_32px] overflow-hidden rounded-lg border border-white/10 bg-[#080a0c] focus-within:border-cyan-300/60">
        <input
          className="h-10 min-w-0 border-0 bg-transparent px-3 text-sm font-semibold text-zinc-100 outline-none"
          max={100}
          min={0}
          onChange={(event) => onChange(Number(event.target.value || 0))}
          step="0.01"
          type="number"
          value={value}
        />
        <span className="flex items-center justify-center border-l border-white/10 text-sm font-semibold text-zinc-500">
          %
        </span>
      </div>
    </label>
  );
}

function ExpenseAmountField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="min-w-0 text-xs font-semibold text-zinc-500">
      {label}
      <div className="mt-1 grid h-10 grid-cols-[32px_minmax(0,1fr)] overflow-hidden rounded-lg border border-white/10 bg-[#080a0c] focus-within:border-cyan-300/60">
        <span className="flex items-center justify-center border-r border-white/10 text-sm font-semibold text-zinc-500">
          $
        </span>
        <input
          className="h-10 min-w-0 border-0 bg-transparent px-3 text-sm font-semibold text-zinc-100 outline-none"
          min={0}
          onChange={(event) => onChange(Number(event.target.value || 0))}
          type="number"
          value={value}
        />
      </div>
    </label>
  );
}

function ExpenseHistoryPanel({
  history,
  onDelete,
  onSave,
}: {
  history: ExpenseHistory[];
  onDelete: (snapshot: ExpenseHistory) => void;
  onSave: (snapshot: ExpenseHistory) => Promise<boolean>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftExpenses, setDraftExpenses] = useState<Expense[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const sortedHistory = [...history]
    .sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime());
  const visibleHistory = sortedHistory.slice(historyIndex, historyIndex + 1);

  useEffect(() => {
    setHistoryIndex((current) => Math.min(current, Math.max(0, sortedHistory.length - 1)));
  }, [sortedHistory.length]);

  const startEditing = (snapshot: ExpenseHistory) => {
    setEditingId(snapshot.id);
    setDraftExpenses(snapshot.expenses);
  };

  const updateDraftExpense = (key: string, amount: number) => {
    setDraftExpenses((current) =>
      current.map((expense) =>
        expense.key === key ? { ...expense, amount: Math.max(0, amount) } : expense,
      ),
    );
  };

  const saveDraft = async (snapshot: ExpenseHistory) => {
    setIsSaving(true);
    const saved = await onSave({
      ...snapshot,
      expenses: draftExpenses,
      total: draftExpenses.reduce((total, expense) => total + expense.amount, 0),
    });
    setIsSaving(false);
    if (saved) {
      setEditingId(null);
    }
  };

  return (
    <DarkPanel>
      <PanelHeader
        right={
          sortedHistory.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {historyIndex > 0 && (
                <Button
                  className="h-9 border border-white/10 bg-white/[0.03] text-zinc-100 hover:bg-white/10"
                  onClick={() => {
                    setEditingId(null);
                    setHistoryIndex(0);
                  }}
                  type="button"
                  variant="ghost"
                >
                  Último guardado
                </Button>
              )}
              {historyIndex < sortedHistory.length - 1 && (
                <Button
                  className="h-9 border border-white/10 bg-white/[0.03] text-zinc-100 hover:bg-white/10"
                  onClick={() => {
                    setEditingId(null);
                    setHistoryIndex((current) => current + 1);
                  }}
                  type="button"
                  variant="ghost"
                >
                  Ver anterior
                </Button>
              )}
            </div>
          )
        }
        icon={ReceiptText}
        title="Historial de gastos"
      />
      <div className="space-y-3 p-4">
        {visibleHistory.length ? (
          visibleHistory.map((snapshot) => {
            const isEditing = editingId === snapshot.id;
            const sourceExpenses = isEditing ? draftExpenses : snapshot.expenses;
            const total = sourceExpenses.reduce((sum, expense) => sum + expense.amount, 0);

            return (
              <div
                className="rounded-lg border border-white/10 bg-black/20 p-4"
                key={snapshot.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-zinc-100">
                      {formatFullDateTime(snapshot.startsAt)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Total guardado: {formatCurrency(total)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="h-9 border border-white/10 bg-white/[0.03] text-zinc-100 hover:bg-white/10"
                      onClick={() => (isEditing ? setEditingId(null) : startEditing(snapshot))}
                      type="button"
                      variant="ghost"
                    >
                      {isEditing ? "Cancelar" : "Editar"}
                    </Button>
                    <Button
                      className="h-9 border-rose-400/40 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
                      onClick={() => onDelete(snapshot)}
                      type="button"
                      variant="outline"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {draftExpenses.map((expense) => (
                      <label
                        className="rounded-lg border border-white/10 bg-[#080a0c] p-3"
                        key={expense.key}
                      >
                        <span className="text-xs font-semibold text-zinc-400">
                          {expense.label}
                        </span>
                        <input
                          className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none focus:border-cyan-300/60"
                          min={0}
                          onChange={(event) =>
                            updateDraftExpense(expense.key, Number(event.target.value || 0))
                          }
                          type="number"
                          value={expense.amount}
                        />
                      </label>
                    ))}
                    <Button
                      className="h-10 bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200 sm:col-span-2"
                      disabled={isSaving}
                      onClick={() => saveDraft(snapshot)}
                      type="button"
                    >
                      {isSaving ? "Guardando..." : "Guardar corrección"}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    {sourceExpenses.map((expense) => (
                      <div
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                        key={expense.key}
                      >
                        <span className="text-zinc-400">{expense.label}</span>
                        <span className="font-semibold text-zinc-100">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
            Todavía no hay historial de gastos.
          </div>
        )}
      </div>
    </DarkPanel>
  );
}

function CommissionHistoryPanel({
  history,
  onDelete,
  onSave,
}: {
  history: CommissionHistory[];
  onDelete: (snapshot: CommissionHistory) => void;
  onSave: (snapshot: CommissionHistory) => Promise<boolean>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [channelDraft, setChannelDraft] = useState<Record<SaleChannel, number>>({
    local: 0,
    pedidos_ya: 0,
  });
  const [methodDraft, setMethodDraft] = useState<CommissionMethod[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const sortedHistory = [...history]
    .sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime());
  const visibleHistory = sortedHistory.slice(historyIndex, historyIndex + 1);

  useEffect(() => {
    setHistoryIndex((current) => Math.min(current, Math.max(0, sortedHistory.length - 1)));
  }, [sortedHistory.length]);

  const startEditing = (snapshot: CommissionHistory) => {
    setEditingId(snapshot.id);
    setChannelDraft(snapshot.channels);
    setMethodDraft(snapshot.methods);
  };

  const updateMethodDraft = (name: string, rate: number) => {
    setMethodDraft((current) =>
      current.map((method) =>
        method.name === name ? { ...method, rate: Math.max(0, rate) } : method,
      ),
    );
  };

  const saveDraft = async (snapshot: CommissionHistory) => {
    setIsSaving(true);
    const saved = await onSave({
      ...snapshot,
      channels: channelDraft,
      methods: methodDraft,
    });
    setIsSaving(false);
    if (saved) {
      setEditingId(null);
    }
  };

  return (
    <DarkPanel>
      <PanelHeader
        right={
          sortedHistory.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {historyIndex > 0 && (
                <Button
                  className="h-9 border border-white/10 bg-white/[0.03] text-zinc-100 hover:bg-white/10"
                  onClick={() => {
                    setEditingId(null);
                    setHistoryIndex(0);
                  }}
                  type="button"
                  variant="ghost"
                >
                  Último guardado
                </Button>
              )}
              {historyIndex < sortedHistory.length - 1 && (
                <Button
                  className="h-9 border border-white/10 bg-white/[0.03] text-zinc-100 hover:bg-white/10"
                  onClick={() => {
                    setEditingId(null);
                    setHistoryIndex((current) => current + 1);
                  }}
                  type="button"
                  variant="ghost"
                >
                  Ver anterior
                </Button>
              )}
            </div>
          )
        }
        icon={CreditCard}
        title="Historial de comisiones"
      />
      <div className="space-y-3 p-4">
        {visibleHistory.length ? (
          visibleHistory.map((snapshot) => {
            const isEditing = editingId === snapshot.id;
            const channels = isEditing ? channelDraft : snapshot.channels;
            const methods = isEditing ? methodDraft : snapshot.methods;

            return (
              <div
                className="rounded-lg border border-white/10 bg-black/20 p-4"
                key={snapshot.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-zinc-100">
                      {formatFullDateTime(snapshot.startsAt)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Canales y métodos guardados en ese momento.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="h-9 border border-white/10 bg-white/[0.03] text-zinc-100 hover:bg-white/10"
                      onClick={() => (isEditing ? setEditingId(null) : startEditing(snapshot))}
                      type="button"
                      variant="ghost"
                    >
                      {isEditing ? "Cancelar" : "Editar"}
                    </Button>
                    <Button
                      className="h-9 border-rose-400/40 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
                      onClick={() => onDelete(snapshot)}
                      type="button"
                      variant="outline"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {saleChannelOptions.map((channel) => (
                    <label
                      className="rounded-lg border border-white/10 bg-[#080a0c] p-3"
                      key={channel.id}
                    >
                      <span className="text-xs font-semibold text-zinc-400">
                        {channel.label}
                      </span>
                      {isEditing ? (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none focus:border-cyan-300/60"
                            min={0}
                            onChange={(event) =>
                              setChannelDraft((current) => ({
                                ...current,
                                [channel.id]: Math.max(0, Number(event.target.value || 0)),
                              }))
                            }
                            type="number"
                            value={channels[channel.id] ?? 0}
                          />
                          <span className="text-sm font-semibold text-zinc-500">%</span>
                        </div>
                      ) : (
                        <p className="mt-2 font-semibold text-zinc-100">
                          {channels[channel.id] ?? 0}%
                        </p>
                      )}
                    </label>
                  ))}

                  {methods.map((method) => (
                    <label
                      className="rounded-lg border border-white/10 bg-[#080a0c] p-3"
                      key={method.name}
                    >
                      <span className="text-xs font-semibold text-zinc-400">
                        {method.name}
                      </span>
                      {isEditing ? (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none focus:border-cyan-300/60"
                            min={0}
                            onChange={(event) =>
                              updateMethodDraft(method.name, Number(event.target.value || 0))
                            }
                            type="number"
                            value={method.rate}
                          />
                          <span className="text-sm font-semibold text-zinc-500">%</span>
                        </div>
                      ) : (
                        <p className="mt-2 font-semibold text-zinc-100">{method.rate}%</p>
                      )}
                    </label>
                  ))}

                  {isEditing && (
                    <Button
                      className="h-10 bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200 sm:col-span-2"
                      disabled={isSaving}
                      onClick={() => saveDraft(snapshot)}
                      type="button"
                    >
                      {isSaving ? "Guardando..." : "Guardar corrección"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-5 text-center text-sm text-zinc-500">
            Todavía no hay historial de comisiones.
          </div>
        )}
      </div>
    </DarkPanel>
  );
}

function EmpleadosView({
  attendance,
  attendanceStatusMap,
  currentCashierName,
  registerAttendance,
  staff,
}: {
  attendance: Attendance[];
  attendanceStatusMap: Map<string, AttendanceStatus>;
  currentCashierName: string | null;
  registerAttendance: (person: StaffMember, eventType: AttendanceEvent) => Promise<boolean>;
  staff: StaffMember[];
}) {
  const [employeeFilter, setEmployeeFilter] = useState<"jornada" | "alertas" | "todos">(
    "todos",
  );
  const [teamPage, setTeamPage] = useState(1);
  const [recordsPage, setRecordsPage] = useState(1);
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);
  const [pinRequest, setPinRequest] = useState<{
    eventType: AttendanceEvent;
    person: StaffMember;
  } | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const todayStart = startOfDay(new Date());
  const todayRecords = attendance.filter(
    (record) => new Date(record.recordedAt) >= todayStart,
  );
  const workingStatuses = Array.from(attendanceStatusMap.values()).filter(
    (status) => status.isWorking,
  );
  const activeCount = workingStatuses.length;
  const almostEndingShift = workingStatuses.filter((status) => status.alert === "soon");
  const exceededShift = workingStatuses.filter((status) => status.alert === "over");
  const latestAttendance = attendance.slice(0, 8);
  const todayEntries = todayRecords.filter((record) => record.eventType === "entrada").length;
  const todayExits = todayRecords.filter((record) => record.eventType === "salida").length;
  const latestRecord = latestAttendance[0] ?? null;
  const latestRecordName = latestRecord
    ? getAttendanceDisplayName(latestRecord, staff)
    : "Sin movimientos";
  const sortedStaff = [...staff].sort((left, right) => {
    const leftStatus = attendanceStatusMap.get(getStaffKey(left));
    const rightStatus = attendanceStatusMap.get(getStaffKey(right));
    const leftScore =
      (left.name === currentCashierName ? 4 : 0) +
      (leftStatus?.isWorking ? 2 : 0) +
      (leftStatus?.alert === "over" ? 1 : 0);
    const rightScore =
      (right.name === currentCashierName ? 4 : 0) +
      (rightStatus?.isWorking ? 2 : 0) +
      (rightStatus?.alert === "over" ? 1 : 0);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return left.name.localeCompare(right.name, "es-AR");
  });
  const visibleStaff = sortedStaff.filter((person) => {
    const status = attendanceStatusMap.get(getStaffKey(person));

    if (employeeFilter === "jornada") {
      return Boolean(status?.isWorking);
    }

    if (employeeFilter === "alertas") {
      return status?.alert === "soon" || status?.alert === "over";
    }

    return true;
  });
  const paginatedStaff = visibleStaff.slice(
    (teamPage - 1) * PAGE_SIZE,
    teamPage * PAGE_SIZE,
  );
  const paginatedAttendance = latestAttendance.slice(
    (recordsPage - 1) * PAGE_SIZE,
    recordsPage * PAGE_SIZE,
  );

  useEffect(() => {
    setTeamPage(1);
  }, [employeeFilter]);

  const requestAttendance = (person: StaffMember, eventType: AttendanceEvent) => {
    if (person.pin?.trim()) {
      setPinRequest({ person, eventType });
      setPinValue("");
      setPinError("");
      return;
    }

    void registerAttendance(person, eventType);
  };

  const confirmPinAttendance = async () => {
    if (!pinRequest) return;

    if (pinValue.trim() !== pinRequest.person.pin?.trim()) {
      setPinError("PIN incorrecto");
      return;
    }

    const saved = await registerAttendance(pinRequest.person, pinRequest.eventType);
    if (saved) {
      setPinRequest(null);
      setPinValue("");
      setPinError("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="erp-employee-summary grid gap-2 sm:grid-cols-3 xl:flex xl:flex-wrap">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2">
            <Users className="size-4 text-emerald-100" />
            <span className="text-xs font-semibold uppercase text-emerald-100">
              Trabajando
            </span>
            <strong className="text-lg leading-none text-emerald-100">
              {activeCount}
            </strong>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2">
            <CalendarClock className="size-4 text-cyan-100" />
            <span className="text-xs font-semibold uppercase text-cyan-100">
              Movimientos hoy
            </span>
            <strong className="text-lg leading-none text-cyan-100">
              {todayRecords.length}
            </strong>
          </div>

          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2",
              exceededShift.length > 0 || almostEndingShift.length > 0
                ? "border-rose-300/20 bg-rose-300/10"
                : "border-white/10 bg-white/5",
            )}
          >
            <TriangleAlert
              className={cn(
                "size-4",
                exceededShift.length > 0 || almostEndingShift.length > 0
                  ? "text-rose-100"
                  : "text-zinc-500",
              )}
            />
            <span
              className={cn(
                "text-xs font-semibold uppercase",
                exceededShift.length > 0 || almostEndingShift.length > 0
                  ? "text-rose-100"
                  : "text-zinc-400",
              )}
            >
              Avisos
            </span>
            <strong
              className={cn(
                "text-lg leading-none",
                exceededShift.length > 0 || almostEndingShift.length > 0
                  ? "text-rose-100"
                  : "text-zinc-100",
              )}
            >
              {almostEndingShift.length + exceededShift.length}
            </strong>
          </div>
        </div>

        <button
          className={cn(
            "flex w-full flex-col items-stretch gap-3 rounded-lg border px-4 py-3 text-left shadow-2xl transition sm:flex-row sm:items-center sm:justify-between xl:max-w-[430px]",
            isRecordsOpen
              ? "border-[var(--erp-border)] bg-[var(--erp-panel)] hover:bg-white/5"
              : "border-[var(--erp-primary-border)] bg-[var(--erp-primary-soft)] hover:bg-[var(--erp-primary-hover)]",
          )}
          onClick={() => setIsRecordsOpen((current) => !current)}
          type="button"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[var(--erp-primary)]">
              <CalendarClock className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-[var(--erp-text)]">Registros</p>
                <span className="rounded-md border border-white/10 bg-black/20 px-2 py-0.5 text-xs font-semibold text-zinc-300">
                  {latestAttendance.length}
                </span>
              </div>
              <p className="truncate text-sm text-[var(--erp-muted)]">
                {latestRecord
                  ? `${latestRecordName} - ${
                      latestRecord.eventType === "entrada" ? "Entrada" : "Salida"
                    }`
                  : "Sin movimientos"}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-center text-sm font-semibold sm:text-left",
              isRecordsOpen
                ? "border border-[var(--erp-border)] bg-[var(--erp-panel-alt)] text-[var(--erp-text)]"
                : "bg-[var(--erp-primary)] text-[var(--erp-primary-text)]",
            )}
          >
            {isRecordsOpen ? "Ocultar" : "Desplegar"}
          </span>
        </button>
      </div>

      <div
        className={cn(
          "grid items-start gap-5",
          isRecordsOpen && "xl:grid-cols-[1.1fr_0.9fr]",
        )}
      >
        <DarkPanel>
          <PanelHeader
          icon={Users}
          title="Equipo"
        />
        <div className="grid gap-3 p-4">
          {(almostEndingShift.length > 0 || exceededShift.length > 0) && (
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                <TriangleAlert className="size-4" />
                Avisos de jornada
              </div>
              <div className="mt-3 space-y-2 text-sm text-amber-50/90">
                {almostEndingShift.map((status) => (
                  <p key={`soon-${status.key}`}>
                    {status.employeeName} está por cumplir 8 horas. Lleva{" "}
                    {formatWorkedDuration(status.workedMinutes)}.
                  </p>
                ))}
                {exceededShift.map((status) => (
                  <p key={`over-${status.key}`}>
                    {status.employeeName} ya paso su horario. Lleva{" "}
                    {formatWorkedDuration(status.workedMinutes)}.
                  </p>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "todos", label: "Todo el equipo" },
              { id: "jornada", label: "Trabajando" },
              { id: "alertas", label: "Con aviso" },
            ].map((option) => (
              <Button
                key={option.id}
                className={cn(
                  employeeFilter === option.id
                    ? "bg-cyan-300 text-zinc-950 hover:bg-cyan-200"
                    : "border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10",
                )}
                onClick={() =>
                  setEmployeeFilter(option.id as "jornada" | "alertas" | "todos")
                }
                size="sm"
                type="button"
                variant={employeeFilter === option.id ? "default" : "outline"}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {paginatedStaff.map((person) => (
            <div
              className="rounded-lg border border-white/10 bg-black/20 p-4"
              key={person.id ?? person.name}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  {(() => {
                    const status = attendanceStatusMap.get(getStaffKey(person));

                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-lg font-semibold text-zinc-100">
                            {person.name}
                          </p>
                          {currentCashierName === person.name && (
                            <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">
                              Caja actual
                            </Badge>
                          )}
                          {status?.isWorking && (
                            <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/10">
                              En jornada
                            </Badge>
                          )}
                          {!status?.isWorking && (
                            <Badge className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/5">
                              {person.status}
                            </Badge>
                          )}
                          {status?.alert === "soon" && (
                            <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-100 hover:bg-amber-300/10">
                              Por cumplir 8 h
                            </Badge>
                          )}
                          {status?.alert === "over" && (
                            <Badge className="border-rose-300/20 bg-rose-300/10 text-rose-100 hover:bg-rose-300/10">
                              Pasado de horario
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-zinc-400">
                          {person.role} • {person.area || "Sin sector"} •{" "}
                          {person.shift || "Sin turno"}
                        </div>
                        {status?.isWorking && status.startedAt && (
                          <div className="mt-3 text-sm text-zinc-300">
                            Desde {formatFullDateTime(status.startedAt)} •{" "}
                            {formatWorkedDuration(status.workedMinutes)}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                  {attendanceStatusMap.get(getStaffKey(person))?.isWorking ? (
                    <Button
                      className="w-full border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20 sm:min-w-36"
                      onClick={() => requestAttendance(person, "salida")}
                      type="button"
                      variant="outline"
                    >
                      <ArrowDownCircle className="size-4" />
                      Marcar salida
                    </Button>
                  ) : (
                    <Button
                      className="w-full border-emerald-300/30 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/20 sm:min-w-36"
                      onClick={() => requestAttendance(person, "entrada")}
                      type="button"
                      variant="outline"
                    >
                      <ArrowUpCircle className="size-4" />
                      Marcar entrada
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {visibleStaff.length === 0 && (
            <div className="rounded-lg border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center">
              <p className="text-sm text-zinc-500">
                No hay empleados para mostrar en este filtro.
              </p>
              {employeeFilter !== "todos" && (
                <Button
                  className="mt-3 border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                  onClick={() => setEmployeeFilter("todos")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Ver todo el equipo
                </Button>
              )}
            </div>
          )}
          <PaginationControls
            currentPage={teamPage}
            label={`${visibleStaff.length} empleados`}
            onPageChange={setTeamPage}
            totalItems={visibleStaff.length}
          />
        </div>
        </DarkPanel>

        {isRecordsOpen && (
        <DarkPanel className="self-start">
          <button
            className="flex w-full flex-col items-stretch gap-3 p-4 text-left transition hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
            onClick={() => setIsRecordsOpen((current) => !current)}
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-[var(--erp-primary)]">
                <CalendarClock className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--erp-text)]">
                  Registros
                </h2>
              </div>
            </div>
            <span
              className={cn(
                "rounded-lg border px-4 py-2 text-center text-sm font-semibold",
                isRecordsOpen
                  ? "border-[var(--erp-border)] bg-[var(--erp-panel-alt)] text-[var(--erp-text)]"
                  : "border-[var(--erp-primary)] bg-[var(--erp-primary)] text-[var(--erp-primary-text)]",
              )}
            >
              {isRecordsOpen ? "Ocultar" : "Desplegar"}
            </span>
          </button>

          <div className="grid gap-3 border-t border-[var(--erp-border)] p-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs uppercase text-zinc-500">Hoy</p>
              <p className="mt-1 text-xl font-semibold text-zinc-100">
                {todayRecords.length}
              </p>
              <p className="mt-1 text-xs text-zinc-500">movimientos</p>
            </div>
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
              <p className="text-xs uppercase text-emerald-100">Entradas</p>
              <p className="mt-1 text-xl font-semibold text-emerald-100">
                {todayEntries}
              </p>
              <p className="mt-1 text-xs text-zinc-500">registradas hoy</p>
            </div>
            <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3">
              <p className="text-xs uppercase text-amber-100">Salidas</p>
              <p className="mt-1 text-xl font-semibold text-amber-100">
                {todayExits}
              </p>
              <p className="mt-1 text-xs text-zinc-500">registradas hoy</p>
            </div>
          </div>

          {!isRecordsOpen && (
            <div className="border-t border-[var(--erp-border)] px-4 py-3">
              <p className="text-xs uppercase text-zinc-500">Último movimiento</p>
              <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
                {latestRecordName}
              </p>
              {latestRecord && (
                <p className="mt-1 text-xs text-zinc-500">
                  {latestRecord.eventType === "entrada" ? "Entrada" : "Salida"} ·{" "}
                  {formatFullDateTime(latestRecord.recordedAt)}
                </p>
              )}
            </div>
          )}

          {isRecordsOpen && (
            <div className="space-y-3 border-t border-[var(--erp-border)] p-4">
              <div className="space-y-3">
                {paginatedAttendance.map((record) => {
                  const displayName = getAttendanceDisplayName(record, staff);

                  return (
                    <div
                      className="flex flex-col items-stretch gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-start sm:justify-between"
                      key={record.id}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "mt-0.5 size-2.5 rounded-full",
                              record.eventType === "entrada"
                                ? "bg-emerald-300"
                                : "bg-amber-300",
                            )}
                          />
                          <p className="truncate font-semibold text-zinc-100">
                            {displayName}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <Badge
                            className={cn(
                              record.eventType === "entrada"
                                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                                : "border-amber-300/20 bg-amber-300/10 text-amber-100",
                              "hover:bg-inherit",
                            )}
                          >
                            {record.eventType === "entrada" ? "Entrada" : "Salida"}
                          </Badge>
                          <Badge className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/5">
                            Turno {record.shift}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-left text-sm text-zinc-400 sm:shrink-0 sm:text-right">
                        {formatFullDateTime(record.recordedAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
              <PaginationControls
                currentPage={recordsPage}
                label={`${latestAttendance.length} registros`}
                onPageChange={setRecordsPage}
                totalItems={latestAttendance.length}
              />
            </div>
          )}
        </DarkPanel>
        )}
      </div>
      {pinRequest && (
        <div className="erp-modal-shell fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="erp-modal-panel w-full max-w-sm rounded-lg border border-white/10 bg-[#090d10] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100">
              Confirmar {pinRequest.eventType === "entrada" ? "entrada" : "salida"}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">{pinRequest.person.name}</p>
            <input
              autoFocus
              className="mt-4 h-12 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-center text-lg font-semibold tracking-[0.3em] text-zinc-100 outline-none focus:border-cyan-300/60"
              onChange={(event) => {
                setPinValue(event.target.value);
                setPinError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void confirmPinAttendance();
                }
              }}
              placeholder="PIN"
              type="password"
              value={pinValue}
            />
            {pinError && (
              <p className="mt-2 text-sm font-semibold text-rose-200">{pinError}</p>
            )}
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                onClick={() => setPinRequest(null)}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                className="bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
                onClick={confirmPinAttendance}
                type="button"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistorialEmpleadosView({
  attendance,
  saveAttendanceRecord,
  saveEmployee,
  staff,
}: {
  attendance: Attendance[];
  saveAttendanceRecord: (record: AttendanceForm) => Promise<boolean>;
  saveEmployee: (person: StaffForm) => Promise<boolean>;
  staff: StaffMember[];
}) {
  const emptyEmployee: StaffForm = {
    name: "",
    role: "",
    shift: "",
    area: "",
    status: "Activo",
    pin: "",
  };
  const emptyAttendance = (): AttendanceForm => ({
    employeeName: "",
    eventType: "entrada",
    shift: "manana",
    recordedAt: formatDateTimeInputValue(new Date().toISOString()),
    staffId: null,
  });
  const statusOptions: StaffMember["status"][] = [
    "Activo",
    "Pausa",
    "Ausente",
    "Franco",
  ];
  const [newEmployee, setNewEmployee] = useState<StaffForm>(emptyEmployee);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<StaffForm>(emptyEmployee);
  const [attendanceForm, setAttendanceForm] = useState<AttendanceForm>(emptyAttendance());
  const [isCreatingAttendance, setIsCreatingAttendance] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
  const [employeesPage, setEmployeesPage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const isEmployeeFormOpen = isCreatingEmployee || Boolean(editingId);
  const isAttendanceFormOpen = isCreatingAttendance || Boolean(editingAttendanceId);
  const employeeDraft = editingId ? editingEmployee : newEmployee;
  const sortedAttendance = [...attendance].sort(
    (left, right) =>
      new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
  );
  const paginatedStaff = staff.slice(
    (employeesPage - 1) * PAGE_SIZE,
    employeesPage * PAGE_SIZE,
  );
  const paginatedAttendance = sortedAttendance.slice(
    (attendancePage - 1) * PAGE_SIZE,
    attendancePage * PAGE_SIZE,
  );

  const syncAttendanceEmployee = (employeeName: string) => {
    const match = staff.find((person) => person.name === employeeName);
    setAttendanceForm((current) => ({
      ...current,
      employeeName,
      staffId: match?.id ?? null,
      shift: match ? getShiftForStaff(match) : current.shift,
    }));
  };

  const updateEmployeeDraft = (changes: Partial<StaffForm>) => {
    if (editingId) {
      setEditingEmployee((current) => ({ ...current, ...changes }));
      return;
    }

    setNewEmployee((current) => ({ ...current, ...changes }));
  };

  const closeEmployeeForm = () => {
    setNewEmployee(emptyEmployee);
    setEditingId(null);
    setEditingEmployee(emptyEmployee);
    setIsCreatingEmployee(false);
  };

  const saveEmployeeForm = async () => {
    const saved = await saveEmployee(employeeDraft);
    if (saved) closeEmployeeForm();
  };

  const closeAttendanceForm = () => {
    setIsCreatingAttendance(false);
    setEditingAttendanceId(null);
    setAttendanceForm(emptyAttendance());
  };

  const saveAttendanceForm = async () => {
    const saved = await saveAttendanceRecord(attendanceForm);
    if (saved) closeAttendanceForm();
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <DarkPanel>
          <PanelHeader
            icon={Users}
            title="Empleados"
            right={
              <Button
                className="bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
                disabled={isEmployeeFormOpen}
                onClick={() => {
                  setNewEmployee(emptyEmployee);
                  setEditingId(null);
                  setEditingEmployee(emptyEmployee);
                  setIsCreatingEmployee(true);
                }}
                size="sm"
                type="button"
              >
                <Plus className="size-4" />
                Agregar empleado
              </Button>
            }
          />

          <div className="grid gap-3 p-4">
            {paginatedStaff.map((person) => (
              <div
                className="rounded-lg border border-white/10 bg-black/20 p-4"
                key={person.id ?? person.name}
              >
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-100">{person.name}</p>
                    <p className="mt-1 truncate text-sm text-zinc-400">
                      {person.role} • {person.area || "Sin sector"} • {person.shift || "Sin turno"}
                    </p>
                  </div>
                  <Button
                    className="w-full shrink-0 border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20 sm:w-auto"
                    onClick={() => {
                      setIsCreatingEmployee(false);
                      setEditingId(person.id ?? person.name);
                      setEditingEmployee(person);
                    }}
                    type="button"
                    variant="outline"
                  >
                    Editar
                  </Button>
                </div>
              </div>
            ))}
            <PaginationControls
              currentPage={employeesPage}
              label={`${staff.length} empleados`}
              onPageChange={setEmployeesPage}
              totalItems={staff.length}
            />
          </div>
        </DarkPanel>

        <DarkPanel>
          <PanelHeader
            icon={CalendarClock}
            title="Fichajes"
            right={
              <Button
                className="bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
                disabled={isAttendanceFormOpen}
                onClick={() => {
                  setAttendanceForm(emptyAttendance());
                  setEditingAttendanceId(null);
                  setIsCreatingAttendance(true);
                }}
                size="sm"
                type="button"
              >
                <Plus className="size-4" />
                Agregar fichaje
              </Button>
            }
          />

          <div className="space-y-3 p-4">
            {paginatedAttendance.map((record) => {
              const displayName = getAttendanceDisplayName(record, staff);

              return (
                <div
                  className="flex flex-col items-stretch gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={record.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-100">{displayName}</p>
                    <p className="mt-1 truncate text-sm text-zinc-400">
                      {record.eventType === "entrada" ? "Entrada" : "Salida"} • Turno{" "}
                      {record.shift === "manana" ? "mañana" : "tarde"} •{" "}
                      {formatFullDateTime(record.recordedAt)}
                    </p>
                  </div>
                  <Button
                    className="w-full shrink-0 border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20 sm:w-auto"
                    onClick={() => {
                      setEditingAttendanceId(record.id);
                      setIsCreatingAttendance(false);
                      setAttendanceForm({
                        id: record.id,
                        staffId: record.staffId ?? null,
                        employeeName: displayName,
                        eventType: record.eventType,
                        shift: record.shift,
                        recordedAt: formatDateTimeInputValue(record.recordedAt),
                      });
                    }}
                    type="button"
                    variant="outline"
                  >
                    Editar
                  </Button>
                </div>
              );
            })}
            <PaginationControls
              currentPage={attendancePage}
              label={`${sortedAttendance.length} fichajes`}
              onPageChange={setAttendancePage}
              totalItems={sortedAttendance.length}
            />
          </div>
        </DarkPanel>
      </div>

      {isEmployeeFormOpen && (
        <StockFormModal
          icon={Users}
          onClose={closeEmployeeForm}
          title={editingId ? "Editar empleado" : "Agregar empleado"}
        >
          <div className="grid gap-3 border-b border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <InlineInput
              label="Nombre"
              onChange={(value) => updateEmployeeDraft({ name: value })}
              value={employeeDraft.name}
            />
            <label className="min-w-0 text-xs font-semibold text-zinc-500">
              Rol
              <select
                className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#080a0c] px-3 text-sm font-semibold text-zinc-100 outline-none transition focus:border-cyan-300/60"
                onChange={(event) => updateEmployeeDraft({ role: event.target.value })}
                value={employeeDraft.role}
              >
                <option value="">Elegir rol</option>
                {employeeRoleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                {employeeDraft.role &&
                  !employeeRoleOptions.includes(employeeDraft.role) && (
                    <option value={employeeDraft.role}>{employeeDraft.role}</option>
                  )}
              </select>
            </label>
            <label className="min-w-0 text-xs font-semibold text-zinc-500">
              Turno
              <select
                className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#080a0c] px-3 text-sm font-semibold text-zinc-100 outline-none transition focus:border-cyan-300/60"
                onChange={(event) => updateEmployeeDraft({ shift: event.target.value })}
                value={employeeDraft.shift}
              >
                <option value="">Elegir turno</option>
                {employeeShiftOptions.map((shift) => (
                  <option key={shift} value={shift}>
                    {shift}
                  </option>
                ))}
                {employeeDraft.shift &&
                  !employeeShiftOptions.includes(employeeDraft.shift) && (
                    <option value={employeeDraft.shift}>{employeeDraft.shift}</option>
                  )}
              </select>
            </label>
            <InlineInput
              label="Sector"
              onChange={(value) => updateEmployeeDraft({ area: value })}
              value={employeeDraft.area}
            />
            <InlineInput
              label="PIN"
              onChange={(value) => updateEmployeeDraft({ pin: value })}
              value={employeeDraft.pin ?? ""}
            />
            <label className="min-w-0 text-xs font-semibold text-zinc-500">
              Estado
              <select
                className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#080a0c] px-3 text-sm font-semibold text-zinc-100 outline-none transition focus:border-cyan-300/60"
                onChange={(event) =>
                  updateEmployeeDraft({
                    status: event.target.value as StaffMember["status"],
                  })
                }
                value={employeeDraft.status}
              >
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end">
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={closeEmployeeForm}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
              onClick={saveEmployeeForm}
              type="button"
            >
              {editingId ? "Guardar cambios" : "Guardar empleado"}
            </Button>
          </div>
        </StockFormModal>
      )}

      {isAttendanceFormOpen && (
        <StockFormModal
          icon={CalendarClock}
          onClose={closeAttendanceForm}
          title={editingAttendanceId ? "Editar fichaje" : "Agregar fichaje"}
        >
          <div className="grid gap-3 border-b border-white/10 p-4 sm:grid-cols-2">
            <label className="min-w-0 text-xs font-semibold text-zinc-500">
              Empleado
              <select
                className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#080a0c] px-3 text-sm font-semibold text-zinc-100 outline-none transition focus:border-cyan-300/60"
                onChange={(event) => syncAttendanceEmployee(event.target.value)}
                value={attendanceForm.employeeName}
              >
                <option value="">Elegir empleado</option>
                {staff.map((person) => (
                  <option key={person.id ?? person.name} value={person.name}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 text-xs font-semibold text-zinc-500">
              Fecha y hora
              <input
                className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#080a0c] px-3 text-sm font-semibold text-zinc-100 outline-none transition focus:border-cyan-300/60"
                onChange={(event) =>
                  setAttendanceForm((current) => ({
                    ...current,
                    recordedAt: event.target.value,
                  }))
                }
                type="datetime-local"
                value={attendanceForm.recordedAt}
              />
            </label>
            <label className="min-w-0 text-xs font-semibold text-zinc-500">
              Tipo
              <select
                className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#080a0c] px-3 text-sm font-semibold text-zinc-100 outline-none transition focus:border-cyan-300/60"
                onChange={(event) =>
                  setAttendanceForm((current) => ({
                    ...current,
                    eventType: event.target.value as AttendanceEvent,
                  }))
                }
                value={attendanceForm.eventType}
              >
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </label>
            <label className="min-w-0 text-xs font-semibold text-zinc-500">
              Turno
              <select
                className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#080a0c] px-3 text-sm font-semibold text-zinc-100 outline-none transition focus:border-cyan-300/60"
                onChange={(event) =>
                  setAttendanceForm((current) => ({
                    ...current,
                    shift: event.target.value as ShiftName,
                  }))
                }
                value={attendanceForm.shift}
              >
                <option value="manana">Mañana</option>
                <option value="tarde">Tarde</option>
              </select>
            </label>
          </div>
          <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end">
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={closeAttendanceForm}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
              onClick={saveAttendanceForm}
              type="button"
            >
              {editingAttendanceId ? "Guardar cambios" : "Guardar fichaje"}
            </Button>
          </div>
        </StockFormModal>
      )}
    </div>
  );
}

const auditEntityLabels: Record<string, string> = {
  cierres_caja: "Cierre de caja",
  comisiones: "Comisiones",
  comisiones_historial: "Historial de comisiones",
  empleado: "Empleado",
  gastos: "Gastos",
  gastos_historial: "Historial de gastos",
  producto: "Producto",
  stock: "Stock",
};

const auditActionLabels: Record<string, string> = {
  actualizar: "Actualizó",
  editar: "Editó",
  eliminar: "Eliminó",
  guardar: "Guardó",
};

const hiddenAuditKeys = new Set([
  "activo",
  "clave",
  "creado_por",
  "entidad_id",
  "id",
  "orden",
  "sucursal_id",
  "usuario_id",
]);

const isAuditRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const formatAuditEntity = (entity: string) =>
  auditEntityLabels[entity] ?? capitalizeLabel(entity.replace(/_/g, " "));

const formatAuditAction = (action: string) =>
  auditActionLabels[action] ?? capitalizeLabel(action.replace(/_/g, " "));

const formatAuditLabel = (key: string) =>
  capitalizeLabel(key.replace(/_/g, " "));

const formatAuditScalar = (value: unknown) => {
  if (typeof value === "number") return formatCurrency(value);
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "string") return value.trim() || "-";
  if (value === null || typeof value === "undefined") return "-";
  return String(value);
};

const formatExpenseAuditList = (value: unknown) => {
  if (!Array.isArray(value)) return null;
  const rows = value.filter(isAuditRecord);
  if (!rows.length) return null;

  return rows
    .map((expense, index) => {
      const name = String(expense.nombre ?? expense.name ?? `Gasto ${index + 1}`);
      const category =
        typeof expense.categoria === "string" && expense.categoria
          ? ` (${expense.categoria})`
          : "";
      return `${name}${category}: ${formatCurrency(toNumber(expense.monto as NumericValue))}`;
    })
    .join("\n");
};

const formatCommissionChannels = (value: unknown) => {
  if (!isAuditRecord(value)) return null;
  const labels: Record<string, string> = {
    local: "Local",
    pedidos_ya: "PedidosYa",
  };

  return Object.entries(value)
    .map(
      ([key, amount]) =>
        `${labels[key] ?? formatAuditLabel(key)}: ${formatCurrency(toNumber(amount as NumericValue))}`,
    )
    .join("\n");
};

const formatCommissionMethods = (value: unknown) => {
  if (!Array.isArray(value)) return null;
  const rows = value.filter(isAuditRecord);
  if (!rows.length) return null;

  return rows
    .map((method, index) => {
      const name = String(method.nombre ?? method.name ?? `Método ${index + 1}`);
      return `${name}: ${toNumber(method.comision as NumericValue)}%`;
    })
    .join("\n");
};

const formatAuditValue = (value: unknown): string => {
  const expenseList = formatExpenseAuditList(value);
  if (expenseList) return expenseList;

  if (Array.isArray(value)) {
    if (!value.length) return "-";
    return value
      .map((item, index) => {
        if (!isAuditRecord(item)) return formatAuditScalar(item);
        const summary = Object.entries(item)
          .filter(([key]) => !hiddenAuditKeys.has(key))
          .map(
            ([key, nestedValue]) =>
              `${formatAuditLabel(key)}: ${formatAuditScalar(nestedValue)}`,
          )
          .join(", ");
        return summary || `Item ${index + 1}`;
      })
      .join("\n");
  }

  if (isAuditRecord(value)) {
    const summary = Object.entries(value)
      .filter(([key]) => !hiddenAuditKeys.has(key))
      .map(([key, nestedValue]) => `${formatAuditLabel(key)}: ${formatAuditValue(nestedValue)}`)
      .join("\n");
    return summary || "Cambio registrado";
  }

  return formatAuditScalar(value);
};

const getAuditDetailItems = (log: AuditLog): Array<[string, unknown]> => {
  const detail = log.detail ?? {};

  if (log.entity === "cierres_caja") {
    return [
      ["Turno", detail.turno === "manana" ? "Mañana" : "Tarde"],
      ["Ventas", String(detail.ventas ?? 0)],
      ["Efectivo contado", formatCurrency(toNumber(detail.efectivo_contado as NumericValue))],
      ["Diferencia", formatCurrency(Number(detail.diferencia ?? 0))],
      ["Nota", detail.observacion],
    ];
  }

  if (log.entity === "empleado") {
    return [
      ["Nombre", detail.nombre],
      ["Rol", detail.rol],
      ["Sector", detail.sector],
    ];
  }

  if (log.entity === "gastos" || log.entity === "gastos_historial") {
    if (log.action === "eliminar") {
      return [["Cambio", "Historial eliminado"]];
    }

    return [
      ["Total", toNumber(detail.total as NumericValue)],
      ["Gastos", formatExpenseAuditList(detail.gastos) ?? detail.gastos],
    ];
  }

  if (log.entity === "comisiones" || log.entity === "comisiones_historial") {
    if (log.action === "eliminar") {
      return [["Cambio", "Historial eliminado"]];
    }

    return [
      ["Canales", formatCommissionChannels(detail.canales) ?? detail.canales],
      ["Métodos de pago", formatCommissionMethods(detail.metodos) ?? detail.metodos],
    ];
  }

  if (log.action === "eliminar") {
    return [["Cambio", "Registro eliminado"]];
  }

  return Object.entries(detail)
    .filter(([key]) => !hiddenAuditKeys.has(key))
    .slice(0, 6)
    .map(([key, value]) => [formatAuditLabel(key), value]);
};

function AuditoriaView({ auditLogs }: { auditLogs: AuditLog[] }) {
  return (
    <DarkPanel>
      <PanelHeader icon={ReceiptText} title="Auditoría" />
      <div className="space-y-3 p-4">
        {auditLogs.length ? (
          auditLogs.map((log) => {
            const detailItems = getAuditDetailItems(log);

            return (
            <div
              className="rounded-lg border border-white/10 bg-black/20 p-4"
              key={log.id}
            >
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">
                      {formatAuditAction(log.action)}
                    </Badge>
                    <p className="font-semibold text-zinc-100">
                      {formatAuditEntity(log.entity)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    {log.userName ?? "Sistema"} - {formatFullDateTime(log.createdAt)}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {detailItems.map(([label, value]) => (
                    <div
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                      key={String(label)}
                    >
                      <p className="text-xs uppercase text-zinc-500">{label}</p>
                      <p className="mt-1 whitespace-pre-line break-words text-sm font-semibold text-zinc-100">
                        {formatAuditValue(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center">
            <p className="text-sm text-zinc-500">Todavía no hay cambios guardados.</p>
          </div>
        )}
      </div>
    </DarkPanel>
  );
}

function StockView({
  canManageStock,
  closeFlavorBatch,
  deleteFlavorBatch,
  deleteFlavor,
  deleteProduct,
  flavors,
  flavorBatches,
  loadFlavorBatch,
  lowStock,
  products,
  reopenFlavorBatch,
  saveProduct,
  saveFlavor,
  unitsInStock,
}: {
  canManageStock: boolean;
  closeFlavorBatch: (batch: FlavorBatch, currentStock: number) => Promise<boolean>;
  deleteFlavorBatch: (batch: FlavorBatch) => void;
  deleteFlavor: (flavor: IceCreamFlavor) => void;
  deleteProduct: (product: Product) => void;
  flavors: IceCreamFlavor[];
  flavorBatches: FlavorBatch[];
  loadFlavorBatch: (
    flavor: IceCreamFlavor,
    kilos: number,
    portionsLoaded: number,
  ) => Promise<boolean>;
  lowStock: Product[];
  products: Product[];
  reopenFlavorBatch: (batch: FlavorBatch) => void;
  saveProduct: (product: ProductForm, previousStock?: number) => Promise<boolean>;
  saveFlavor: (flavor: FlavorForm) => Promise<boolean>;
  unitsInStock: number;
}) {
  const emptyProduct: ProductForm = {
    id: "",
    name: "",
    category: "",
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0,
    unit: "unid.",
    imageUrl: "",
    maxFlavors: 0,
    flavorUsage: 0,
  };
  const [newProduct, setNewProduct] = useState<ProductForm>(emptyProduct);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductForm>(emptyProduct);
  const [editingFlavor, setEditingFlavor] = useState<FlavorForm | null>(null);
  const [batchFlavorId, setBatchFlavorId] = useState<string | null>(null);
  const [batchKilos, setBatchKilos] = useState("20");
  const [flavorFormError, setFlavorFormError] = useState("");
  const emptyFlavor: FlavorForm = {
    id: "",
    name: "",
    category: "Crema",
    available: true,
    color: "#67e8f9",
    stock: 0,
    minStock: 0,
    unit: "porciones",
  };
  const [newFlavor, setNewFlavor] = useState<FlavorForm>(emptyFlavor);
  const [isCreatingFlavor, setIsCreatingFlavor] = useState(false);
  const [stockTab, setStockTab] = useState<"productos" | "gustos">("productos");
  const [productQuery, setProductQuery] = useState("");
  const [productCategory, setProductCategory] = useState("Todas");
  const [flavorQuery, setFlavorQuery] = useState("");
  const [showOnlyLowProducts, setShowOnlyLowProducts] = useState(false);
  const [productsPage, setProductsPage] = useState(1);
  const [isFlavorHistoryOpen, setIsFlavorHistoryOpen] = useState(false);
  const [isStockAlertOpen, setIsStockAlertOpen] = useState(false);
  const [isProductCategoryOpen, setIsProductCategoryOpen] = useState(false);
  const [quickStockTarget, setQuickStockTarget] =
    useState<QuickStockTarget | null>(null);
  const [quickStockAmount, setQuickStockAmount] = useState("");
  const [isQuickStockSaving, setIsQuickStockSaving] = useState(false);
  const manualFlavorBatches = flavorBatches.filter(isManualFlavorBatch);
  const activeBatchesByFlavor = new Map(
    manualFlavorBatches
      .filter((batch) => batch.status === "activa")
      .map((batch) => [batch.flavorId, batch] as const),
  );
  const latestClosedBatchByFlavor = manualFlavorBatches.reduce((map, batch) => {
    if (batch.status === "cerrada" && !map.has(batch.flavorId)) {
      map.set(batch.flavorId, batch);
    }
    return map;
  }, new Map<string, FlavorBatch>());
  const flavorBatchEvents = manualFlavorBatches
    .flatMap((batch) => [
      {
        batch,
        date: batch.createdAt,
        id: `${batch.id}-carga`,
        type: "carga" as const,
      },
      ...(batch.closedAt
        ? [
            {
              batch,
              date: batch.closedAt,
              id: `${batch.id}-vacio`,
              type: "vacio" as const,
            },
          ]
        : []),
    ])
    .sort(
      (left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime(),
    );
  const productCategories = [
    "Todas",
    ...new Set(products.map((product) => product.category).sort((left, right) => left.localeCompare(right, "es-AR"))),
  ];
  const productCategoryOptions = productCategories.filter(
    (category) => category !== "Todas",
  );
  const flavorCategoryOptions = [
    ...new Set(
      [
        ...defaultFlavorCategories,
        ...flavors
        .map((flavor) => getFlavorCategoryName(flavor.category))
      ].sort((left, right) => left.localeCompare(right, "es-AR")),
    ),
  ];
  const filteredProducts = products
    .filter((product) => {
      const matchesCategory =
        productCategory === "Todas" || product.category === productCategory;
      const normalizedQuery = productQuery.trim().toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    })
    .sort((left, right) => {
      const leftLow = isProductLowStock(left) ? 0 : 1;
      const rightLow = isProductLowStock(right) ? 0 : 1;
      if (leftLow !== rightLow) return leftLow - rightLow;
      return left.name.localeCompare(right.name);
    });
  const visibleProducts = showOnlyLowProducts
    ? filteredProducts.filter(isProductLowStock)
    : filteredProducts;
  const paginatedProducts = visibleProducts.slice(
    (productsPage - 1) * PAGE_SIZE,
    productsPage * PAGE_SIZE,
  );
  const filteredFlavors = flavors
    .filter((flavor) => {
      const normalizedQuery = flavorQuery.trim().toLowerCase();
      return (
        !normalizedQuery ||
        flavor.name.toLowerCase().includes(normalizedQuery) ||
        flavor.category.toLowerCase().includes(normalizedQuery)
      );
    })
    .sort((left, right) => left.name.localeCompare(right.name));
  const visibleFlavors = filteredFlavors;
  const flavorGroups = groupFlavorsByCategory(visibleFlavors);

  useEffect(() => {
    setProductsPage(1);
  }, [productCategory, productQuery, showOnlyLowProducts]);

  const openQuickStock = (target: QuickStockTarget) => {
    setQuickStockTarget(target);
    setQuickStockAmount("");
  };

  const closeQuickStock = () => {
    if (isQuickStockSaving) return;
    setQuickStockTarget(null);
    setQuickStockAmount("");
  };

  const quickStockIncrement = Math.max(0, Number(quickStockAmount || 0));
  const quickStockCurrent = quickStockTarget?.item.stock ?? 0;
  const quickStockNext = quickStockCurrent + quickStockIncrement;
  const openProductForm = () => {
    setNewProduct(emptyProduct);
    setEditingId(null);
    setIsCreatingProduct(true);
  };
  const closeProductForm = () => {
    setIsCreatingProduct(false);
    setNewProduct(emptyProduct);
  };
  const openEditProductModal = (product: Product) => {
    setEditingId(product.id);
    setEditingProduct({ ...product });
  };
  const closeEditProductModal = () => {
    setEditingId(null);
    setEditingProduct(emptyProduct);
  };
  const saveEditProductModal = async () => {
    if (!editingId) return;

    const originalProduct = products.find((product) => product.id === editingId);
    const saved = await saveProduct(editingProduct, originalProduct?.stock);
    if (saved) closeEditProductModal();
  };
  const openFlavorForm = () => {
    setNewFlavor(emptyFlavor);
    setFlavorFormError("");
    setEditingFlavor(null);
    setIsCreatingFlavor(true);
  };
  const closeFlavorForm = () => {
    setIsCreatingFlavor(false);
    setNewFlavor(emptyFlavor);
    setFlavorFormError("");
  };

  const createFlavorOnly = async () => {
    if (!newFlavor.name.trim()) {
      setFlavorFormError("Completá el nombre del gusto");
      return;
    }

    setFlavorFormError("");

    const flavorId = createAutomaticId(
      newFlavor.name,
      flavors.map((item) => item.id),
      newFlavor.id,
    );
    const flavorToCreate: IceCreamFlavor = {
      ...newFlavor,
      id: flavorId,
      name: newFlavor.name.trim(),
      category: getFlavorCategoryName(newFlavor.category),
      stock: 0,
      unit: newFlavor.unit.trim() || "porciones",
    };
    const saved = await saveFlavor(flavorToCreate);
    if (saved) closeFlavorForm();
  };

  const openEditFlavorModal = (flavor: IceCreamFlavor) => {
    setEditingFlavor({ ...flavor });
  };

  const closeEditFlavorModal = () => {
    setEditingFlavor(null);
  };

  const saveEditFlavorModal = async () => {
    if (!editingFlavor) return;

    const saved = await saveFlavor(editingFlavor);
    if (saved) closeEditFlavorModal();
  };

  const openFlavorBatchModal = (flavor: IceCreamFlavor) => {
    setBatchFlavorId(flavor.id);
    setBatchKilos("20");
  };

  const closeFlavorBatchModal = () => {
    setBatchFlavorId(null);
    setBatchKilos("20");
  };

  const batchFlavor = batchFlavorId
    ? flavors.find((flavor) => flavor.id === batchFlavorId)
    : null;

  const confirmQuickStock = async () => {
    if (!quickStockTarget || quickStockIncrement <= 0) return;

    setIsQuickStockSaving(true);
    const saved =
      quickStockTarget.type === "product"
        ? await saveProduct(
            {
              ...quickStockTarget.item,
              stock: quickStockNext,
            },
            quickStockTarget.item.stock,
          )
        : await saveFlavor({
            ...quickStockTarget.item,
            stock: quickStockNext,
          });

    setIsQuickStockSaving(false);

    if (saved) {
      setQuickStockTarget(null);
      setQuickStockAmount("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Package}
          label="Productos activos"
          tone="neutral"
          value={String(products.length)}
        />
        <MetricCard
          icon={TimerReset}
          label="Alertas de stock"
          tone={lowStock.length ? "amber" : "green"}
          value={String(lowStock.length)}
        />
        <MetricCard
          icon={Store}
          label="Unidades disponibles"
          tone="cyan"
          value={String(unitsInStock)}
        />
        <MetricCard
          icon={Snowflake}
          label="Baldes en uso"
          tone={activeBatchesByFlavor.size ? "green" : "neutral"}
          value={String(activeBatchesByFlavor.size)}
        />
      </div>

      {lowStock.length > 0 && (
        <DarkPanel>
          <div className="space-y-4 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-zinc-100">Alertas rápidas de stock</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {lowStock.length} producto{lowStock.length === 1 ? "" : "s"} en bajo stock.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button
                  className="w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"
                  onClick={() => setIsStockAlertOpen((current) => !current)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {isStockAlertOpen ? "Ocultar detalle" : "Ver detalle"}
                </Button>
                <Button
                  className="w-full border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20 sm:w-auto"
                  onClick={() => {
                    setStockTab("productos");
                    setShowOnlyLowProducts(true);
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {lowStock.length} productos bajos
                </Button>
              </div>
            </div>

            {isStockAlertOpen && (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-zinc-100">Productos a reponer</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {lowStock.slice(0, 8).map((product) => (
                      <Badge
                        className="border-amber-300/20 bg-amber-300/10 text-amber-100 hover:bg-amber-300/10"
                        key={product.id}
                      >
                        {product.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DarkPanel>
      )}

      <DarkPanel>
        <div className="flex flex-wrap gap-2 p-4">
          {[
            { id: "productos", label: "Productos" },
            { id: "gustos", label: "Gustos" },
          ].map((tab) => (
            <button
              className={cn(
                "flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition sm:flex-none",
                stockTab === tab.id
                  ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
              )}
              key={tab.id}
              onClick={() => setStockTab(tab.id as "productos" | "gustos")}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </DarkPanel>

      {!canManageStock && (
        <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-400">
          Esta vista es solo consulta para empleados. Los cambios de stock,
          productos y gustos los hacen admin o dueño.
        </div>
      )}

      {stockTab === "gustos" && (
        <DarkPanel>
          <PanelHeader
            icon={Snowflake}
            title="Gustos"
            right={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button
                  className="w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"
                  onClick={() => setIsFlavorHistoryOpen(true)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <CalendarClock className="size-4" />
                  Historial
                </Button>
                {canManageStock ? (
                  <Button
                    className="w-full bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200 sm:w-auto"
                    onClick={openFlavorForm}
                    size="sm"
                    type="button"
                  >
                    <Plus className="size-4" />
                    Agregar gusto
                  </Button>
                ) : null}
              </div>
            }
          />
          <div className="space-y-4 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <input
                  className="h-11 w-full rounded-lg border border-white/10 bg-black/30 pl-10 pr-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-cyan-300/60"
                  onChange={(event) => setFlavorQuery(event.target.value)}
                  placeholder="Buscar gusto"
                  value={flavorQuery}
                />
              </div>
            </div>

            <div className="space-y-5">
              {flavorGroups.map((group) => (
                <div className="space-y-3" key={group.category}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-100">{formatCategoryLabel(group.category)}</p>
                      <p className="text-sm text-zinc-500">
                        {group.items.length} gusto{group.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {group.items.map((flavor) => {
                      const activeBatch = activeBatchesByFlavor.get(flavor.id);
                      const latestClosedBatch = latestClosedBatchByFlavor.get(flavor.id);

                      return (
                  <DarkPanel className="overflow-hidden" key={flavor.id}>
                    <div className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="size-3 rounded-full border border-black/10"
                              style={{ backgroundColor: flavor.color }}
                            />
                            <p className="truncate font-semibold text-zinc-100">
                              {flavor.name}
                            </p>
                            <Badge className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/5">
                              {formatCategoryLabel(flavor.category)}
                            </Badge>
                          </div>
                          {activeBatch ? (
                            <p className="mt-1 text-xs text-cyan-200">
                              Balde cargado el {formatFullDateTime(activeBatch.createdAt)}
                            </p>
                          ) : latestClosedBatch?.closedAt ? (
                            <p className="mt-1 text-xs text-zinc-500">
                              Último balde marcado vacío el{" "}
                              {formatFullDateTime(latestClosedBatch.closedAt)}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-zinc-500">
                              Sin balde cargado
                            </p>
                          )}
                        </div>
                        <Badge
                          className={cn(
                            activeBatch
                              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                              : "border-zinc-500/20 bg-white/5 text-zinc-300",
                            "hover:bg-inherit",
                          )}
                        >
                          {activeBatch ? "Balde en uso" : "Sin balde"}
                        </Badge>
                      </div>

                      <div className="space-y-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-cyan-50">
                              {activeBatch ? "Balde en uso" : "Control manual"}
                            </p>
                            {activeBatch ? (
                              <p className="text-xs font-semibold text-cyan-50/80">
                                {activeBatch.kilos} kg
                              </p>
                            ) : null}
                          </div>
                          <p className="text-sm leading-relaxed text-cyan-50/75">
                            {activeBatch
                              ? "Cuando el balde físico se termine, marcá vacío. La próxima recarga queda guardada con fecha para el ranking."
                              : "Cuando pongas un balde nuevo en mostrador, cargalo acá para guardar la fecha de recarga."}
                          </p>
                        </div>

                      {canManageStock && (
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                            {activeBatch ? (
                              <Button
                                className="w-full border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20 sm:w-auto"
                                onClick={async () => {
                                  await closeFlavorBatch(activeBatch, 0);
                                }}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Marcar balde vacío
                              </Button>
                            ) : (
                              <Button
                                className="w-full border-emerald-300/30 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/20 sm:w-auto"
                                onClick={() => openFlavorBatchModal(flavor)}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                <Plus className="size-4" />
                                Cargar balde
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  className="w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  <MoreHorizontal className="size-4" />
                                  Más
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="border-white/10 bg-[#111517] text-zinc-100"
                              >
                                <DropdownMenuItem
                                  className="cursor-pointer focus:bg-white/10"
                                  onClick={() => openEditFlavorModal(flavor)}
                                >
                                  Editar gusto
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                  className="cursor-pointer text-rose-100 focus:bg-rose-300/10 focus:text-rose-100"
                                  onClick={() => deleteFlavor(flavor)}
                                >
                                  <Trash2 className="size-4" />
                                  Eliminar gusto
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </DarkPanel>
                );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </DarkPanel>
      )}

      {stockTab === "productos" && (
        <DarkPanel>
          <PanelHeader
            icon={Package}
            title="Productos"
            right={canManageStock ? (
              <Button
                className="w-full bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200 sm:w-auto"
                onClick={openProductForm}
                size="sm"
                type="button"
              >
                <Plus className="size-4" />
                Agregar producto
              </Button>
            ) : null}
          />
          <div className="space-y-4 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <input
                  className="h-11 w-full rounded-lg border border-white/10 bg-black/30 pl-10 pr-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-cyan-300/60"
                  onChange={(event) => setProductQuery(event.target.value)}
                  placeholder="Buscar producto"
                  value={productQuery}
                />
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button
                  className="w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"
                  onClick={() => setIsProductCategoryOpen((current) => !current)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Categoría
                  {productCategory !== "Todas" ? `: ${productCategory}` : ""}
                </Button>
                <Button
                  className={cn(
                    "w-full font-semibold hover:bg-amber-300/20 sm:w-auto",
                    showOnlyLowProducts
                      ? "border-amber-300 bg-amber-300 text-zinc-950"
                      : "border-amber-300/30 bg-amber-300/10 text-amber-100",
                  )}
                  onClick={() => setShowOnlyLowProducts((current) => !current)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <TimerReset className="size-4" />
                  {showOnlyLowProducts ? "Ver todos" : "Solo bajo stock"}
                </Button>
              </div>
            </div>

            {isProductCategoryOpen && (
              <div className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-black/20 p-3">
                {productCategories.map((category) => (
                  <button
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                      productCategory === category
                        ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                        : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                    )}
                    key={category}
                    onClick={() => {
                      setProductCategory(category);
                      setIsProductCategoryOpen(false);
                    }}
                    type="button"
                  >
                    {formatCategoryLabel(category)}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-3 xl:grid-cols-2">
              {paginatedProducts.map((product) => {
                const isLow = isProductLowStock(product);

                return (
                  <DarkPanel className="overflow-hidden" key={product.id}>
                    <div className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold text-zinc-100">
                              {product.name}
                            </p>
                            <Badge className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/5">
                              {formatCategoryLabel(product.category)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-zinc-500">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            isLow
                              ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                              : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
                            "hover:bg-inherit",
                          )}
                        >
                          {isLow ? "Reponer" : "Disponible"}
                        </Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <p className="text-xs uppercase text-zinc-500">Stock</p>
                          <p className="mt-1 font-semibold text-zinc-100">
                            {product.stock} {product.unit}
                          </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <p className="text-xs uppercase text-zinc-500">Mínimo</p>
                          <p className="mt-1 font-semibold text-zinc-100">
                            {product.minStock} {product.unit}
                          </p>
                        </div>
                        {canManageStock && (
                          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                            <p className="text-xs uppercase text-zinc-500">Costo</p>
                            <p className="mt-1 font-semibold text-zinc-100">
                              {formatCurrency(product.cost)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                        <Button
                          className="w-full border-emerald-300/30 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/20 sm:w-auto"
                          onClick={() =>
                            openQuickStock({ item: product, type: "product" })
                          }
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Plus className="size-4" />
                          Sumar stock
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              className="w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              <MoreHorizontal className="size-4" />
                              Más
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="border-white/10 bg-[#111517] text-zinc-100"
                          >
                            <DropdownMenuItem
                              className="cursor-pointer focus:bg-white/10"
                              onClick={() => openEditProductModal(product)}
                            >
                              Editar producto
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem
                              className="cursor-pointer text-rose-100 focus:bg-rose-300/10 focus:text-rose-100"
                              onClick={() => deleteProduct(product)}
                            >
                              <Trash2 className="size-4" />
                              Eliminar producto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </DarkPanel>
                );
              })}
            </div>
            <PaginationControls
              currentPage={productsPage}
              label={`${visibleProducts.length} productos`}
              onPageChange={setProductsPage}
              totalItems={visibleProducts.length}
            />
          </div>
        </DarkPanel>
      )}

      {isFlavorHistoryOpen && (
        <StockFormModal
          icon={CalendarClock}
          onClose={() => setIsFlavorHistoryOpen(false)}
          title="Historial de baldes"
        >
          <div className="space-y-4 p-4">
            <div className="flex flex-col gap-1 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-cyan-50">
                  Movimientos de baldes
                </p>
                <p className="text-sm text-cyan-50/70">
                  Cargas y baldes marcados vacíos con su fecha real.
                </p>
              </div>
              <Badge className="border-cyan-300/20 bg-black/20 text-cyan-100 hover:bg-black/20">
                {flavorBatchEvents.length} movimiento
                {flavorBatchEvents.length === 1 ? "" : "s"}
              </Badge>
            </div>
            {flavorBatchEvents.length ? (
              <div className="max-h-[62vh] overflow-y-auto rounded-lg border border-white/10 bg-black/20">
                <div className="divide-y divide-white/10">
                  {flavorBatchEvents.slice(0, 120).map((event) => (
                    <div
                      className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[minmax(150px,1fr)_110px_minmax(180px,1fr)_minmax(150px,1fr)_150px] md:items-center"
                      key={event.id}
                    >
                      <div>
                        <p className="font-semibold text-zinc-100">
                          {event.batch.flavorName}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {event.batch.kilos} kg
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          event.type === "carga"
                            ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                            : "border-amber-300/20 bg-amber-300/10 text-amber-100",
                          "w-fit hover:bg-inherit",
                        )}
                      >
                        {event.type === "carga" ? "Carga" : "Vacío"}
                      </Badge>
                      <div>
                        <p className="text-xs uppercase text-zinc-500">
                          {event.type === "carga" ? "Cargado" : "Marcado vacío"}
                        </p>
                        <p
                          className={cn(
                            "font-semibold",
                            event.type === "carga"
                              ? "text-cyan-100"
                              : "text-amber-100",
                          )}
                        >
                          {formatFullDateTime(event.date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-zinc-500">
                          Estado actual del balde
                        </p>
                        <p className="font-semibold text-zinc-100">
                          {event.batch.status === "activa" ? "En uso" : "Vacío"}
                        </p>
                      </div>
                      {canManageStock ? (
                        <Button
                          className={cn(
                            "h-9 w-fit border-white/10 bg-white/5 text-xs font-semibold text-zinc-100 hover:bg-white/10 md:w-full",
                            event.type === "carga"
                              ? "hover:border-rose-300/40 hover:text-rose-100"
                              : "hover:border-amber-300/40 hover:text-amber-100",
                          )}
                          onClick={() =>
                            event.type === "carga"
                              ? deleteFlavorBatch(event.batch)
                              : reopenFlavorBatch(event.batch)
                          }
                          type="button"
                          variant="outline"
                        >
                          {event.type === "carga" ? (
                            <Trash2 className="size-4" />
                          ) : (
                            <RefreshCw className="size-4" />
                          )}
                          {event.type === "carga" ? "Eliminar carga" : "Deshacer vacío"}
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-6 text-sm text-zinc-500">
                Todavía no hay movimientos de baldes con el flujo nuevo.
              </div>
            )}
          </div>
        </StockFormModal>
      )}

      {canManageStock && isCreatingProduct && (
        <StockFormModal
          icon={Package}
          onClose={closeProductForm}
          title="Agregar producto"
        >
          <ProductFields
            categoryOptions={productCategoryOptions}
            product={newProduct}
            setProduct={setNewProduct}
          />
          <div className="flex flex-col-reverse gap-2 border-t border-white/10 p-4 sm:flex-row sm:justify-end">
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={closeProductForm}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="bg-[var(--erp-primary)] font-semibold text-[var(--erp-primary-text)] hover:opacity-90"
              onClick={async () => {
                const saved = await saveProduct(newProduct);
                if (saved) closeProductForm();
              }}
              type="button"
            >
              Guardar producto
            </Button>
          </div>
        </StockFormModal>
      )}

      {canManageStock && editingId && (
        <StockFormModal
          icon={Package}
          onClose={closeEditProductModal}
          title="Editar producto"
        >
          <ProductFields
            categoryOptions={productCategoryOptions}
            product={editingProduct}
            setProduct={setEditingProduct}
          />
          <div className="flex flex-col-reverse gap-2 border-t border-white/10 p-4 sm:flex-row sm:justify-end">
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={closeEditProductModal}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="bg-[var(--erp-primary)] font-semibold text-[var(--erp-primary-text)] hover:opacity-90"
              onClick={saveEditProductModal}
              type="button"
            >
              Guardar cambios
            </Button>
          </div>
        </StockFormModal>
      )}

      {canManageStock && isCreatingFlavor && (
        <StockFormModal
          icon={Snowflake}
          onClose={closeFlavorForm}
          title="Agregar gusto de helado"
        >
          <FlavorFields
            categoryOptions={flavorCategoryOptions}
            flavor={newFlavor}
            setFlavor={setNewFlavor}
          />
          {flavorFormError ? (
            <div className="border-t border-white/10 px-4 pt-3">
              <p className="rounded-lg border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-sm font-semibold text-rose-100">
                {flavorFormError}
              </p>
            </div>
          ) : null}
          <div className="flex flex-col-reverse gap-2 border-t border-white/10 p-4 sm:flex-row sm:justify-end">
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={closeFlavorForm}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="bg-[var(--erp-primary)] font-semibold text-[var(--erp-primary-text)] hover:opacity-90"
              onClick={createFlavorOnly}
              type="button"
            >
              Crear gusto
            </Button>
          </div>
        </StockFormModal>
      )}

      {canManageStock && editingFlavor && (
        <StockFormModal
          icon={Snowflake}
          onClose={closeEditFlavorModal}
          title="Editar gusto de helado"
        >
          <EditFlavorFields
            categoryOptions={flavorCategoryOptions}
            flavor={editingFlavor}
            setFlavor={setEditingFlavor}
          />
          <div className="flex flex-col-reverse gap-2 border-t border-white/10 p-4 sm:flex-row sm:justify-end">
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={closeEditFlavorModal}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="bg-[var(--erp-primary)] font-semibold text-[var(--erp-primary-text)] hover:opacity-90"
              onClick={saveEditFlavorModal}
              type="button"
            >
              Guardar cambios
            </Button>
          </div>
        </StockFormModal>
      )}

      {canManageStock && batchFlavor && !activeBatchesByFlavor.get(batchFlavor.id) && (
        <StockFormModal
          icon={Plus}
          onClose={closeFlavorBatchModal}
          title="Cargar balde"
        >
          <div className="space-y-4 border-b border-white/10 p-4">
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-50">
                    {batchFlavor.name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-50/70">
                    Indicá cuántos kilos tiene el balde. La recarga queda guardada con fecha.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid max-w-sm min-w-0 gap-3">
              <InlineInput
                label="Kilos del balde"
                onChange={setBatchKilos}
                type="number"
                value={batchKilos}
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-white/10 p-4 sm:flex-row sm:justify-end">
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={closeFlavorBatchModal}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="bg-[var(--erp-primary)] font-semibold text-[var(--erp-primary-text)] hover:opacity-90"
              onClick={async () => {
                const saved = await loadFlavorBatch(
                  batchFlavor,
                  Number(batchKilos || 0),
                  1,
                );
                if (saved) closeFlavorBatchModal();
              }}
              type="button"
            >
              Cargar balde
            </Button>
          </div>
        </StockFormModal>
      )}

      {quickStockTarget && (
        <div className="erp-modal-shell fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="erp-modal-panel w-full max-w-lg overflow-hidden rounded-lg border border-[var(--erp-border)] bg-[var(--erp-panel)] shadow-2xl">
            <PanelHeader
              icon={Plus}
              title="Reponer stock"
            />
            <div className="erp-modal-scroll-area space-y-4 overflow-y-auto p-4">
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[var(--erp-muted)]">
                      Producto
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--erp-text)]">
                      {quickStockTarget.item.name}
                    </p>
                  </div>
                  <Badge className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/5">
                    {quickStockTarget.item.unit}
                  </Badge>
                </div>
              </div>

              <label className="block text-xs font-semibold uppercase text-[var(--erp-muted)]">
                Cantidad que entra
                <input
                  autoFocus
                  className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-lg font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/60"
                  min={0}
                  onChange={(event) => setQuickStockAmount(event.target.value)}
                  placeholder="Ej: 10"
                  step="any"
                  type="number"
                  value={quickStockAmount}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase text-[var(--erp-muted)]">Actual</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--erp-text)]">
                    {quickStockCurrent}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
                  <p className="text-xs uppercase text-emerald-100/70">Entra</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-100">
                    +{quickStockIncrement}
                  </p>
                </div>
                <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
                  <p className="text-xs uppercase text-cyan-100/70">Final</p>
                  <p className="mt-1 text-xl font-semibold text-cyan-100">
                    {quickStockNext}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                  disabled={isQuickStockSaving}
                  onClick={closeQuickStock}
                  type="button"
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-[var(--erp-primary)] font-semibold text-[var(--erp-primary-text)] hover:opacity-90"
                  disabled={quickStockIncrement <= 0 || isQuickStockSaving}
                  onClick={confirmQuickStock}
                  type="button"
                >
                  {isQuickStockSaving ? "Guardando..." : "Guardar reposición"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StockFormModal({
  children,
  icon,
  onClose,
  title,
}: {
  children: React.ReactNode;
  icon: LucideIcon;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      className="erp-modal-shell fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        aria-modal="true"
        className="erp-modal-panel max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-lg border border-[var(--erp-border)] bg-[var(--erp-panel)] shadow-2xl"
        role="dialog"
      >
        <PanelHeader
          icon={icon}
          right={
            <Button
              className="size-9 border-white/10 bg-white/5 p-0 text-zinc-100 hover:bg-white/10"
              onClick={onClose}
              type="button"
              variant="outline"
            >
              <X className="size-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          }
          title={title}
        />
        <div className="erp-modal-scroll-area max-h-[calc(92vh-74px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ProductFields({
  categoryOptions,
  product,
  setProduct,
}: {
  categoryOptions: string[];
  product: ProductForm;
  setProduct: React.Dispatch<React.SetStateAction<ProductForm>>;
}) {
  return (
    <div className="min-w-0 space-y-4 border-b border-white/10 p-4">
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(220px,1.1fr)_minmax(220px,0.9fr)]">
        <InlineInput
          label="Nombre del producto"
          onChange={(value) => setProduct((current) => ({ ...current, name: value }))}
          placeholder="Ej: 1/4 kg helado"
          value={product.name}
        />
        <ProductCategoryField
          categories={categoryOptions}
          onChange={(value) => setProduct((current) => ({ ...current, category: value }))}
          value={product.category}
        />
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InlineInput
          label="Precio de venta"
          onChange={(value) =>
            setProduct((current) => ({ ...current, price: Number(value || 0) }))
          }
          type="number"
          value={String(product.price)}
        />
        <InlineInput
          label="Costo"
          onChange={(value) =>
            setProduct((current) => ({ ...current, cost: Number(value || 0) }))
          }
          type="number"
          value={String(product.cost)}
        />
        <InlineInput
          label="Stock actual"
          onChange={(value) =>
            setProduct((current) => ({ ...current, stock: Number(value || 0) }))
          }
          type="number"
          value={String(product.stock)}
        />
        <InlineInput
          label="Avisar con stock"
          onChange={(value) =>
            setProduct((current) => ({ ...current, minStock: Number(value || 0) }))
          }
          type="number"
          value={String(product.minStock)}
        />
      </div>

      <details
        className="rounded-lg border border-white/10 bg-black/20 p-3"
        open={product.imageUrl ? true : undefined}
      >
        <summary className="cursor-pointer select-none text-sm font-semibold text-zinc-100">
          Imagen del producto opcional
        </summary>
        <ImageUploadControl
          carpeta="productos"
          className="mt-3"
          label="Imagen"
          onChange={(value) =>
            setProduct((current) => ({ ...current, imageUrl: value }))
          }
          tipo="producto"
          value={product.imageUrl}
        />
      </details>
    </div>
  );
}

function FlavorFields({
  categoryOptions,
  flavor,
  setFlavor,
}: {
  categoryOptions: string[];
  flavor: FlavorForm;
  setFlavor: React.Dispatch<React.SetStateAction<FlavorForm>>;
}) {
  return (
    <div className="min-w-0 space-y-4 border-b border-white/10 p-4">
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(220px,1.1fr)_minmax(220px,0.9fr)]">
        <InlineInput
          label="Nombre del gusto"
          onChange={(value) =>
            setFlavor((current) => ({ ...current, name: value }))
          }
          placeholder="Ej: Chocolate"
          value={flavor.name}
        />
        <ProductCategoryField
          categories={categoryOptions}
          label="Tipo de gusto"
          onChange={(value) =>
            setFlavor((current) => ({ ...current, category: value }))
          }
          value={flavor.category}
        />
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <label className="min-w-0 text-xs font-semibold text-zinc-500">
          Color
          <div className="mt-1 grid h-10 grid-cols-[42px_minmax(0,1fr)] overflow-hidden rounded-lg border border-white/10 bg-[#080a0c] focus-within:border-cyan-300/60">
            <input
              className="h-10 w-full cursor-pointer border-0 bg-transparent p-1"
              onChange={(event) =>
                setFlavor((current) => ({
                  ...current,
                  color: event.target.value,
                }))
              }
              type="color"
              value={flavor.color}
            />
            <div className="flex min-w-0 items-center px-3 text-sm font-semibold text-zinc-100">
              <span className="truncate">{flavor.color}</span>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}

function EditFlavorFields({
  categoryOptions,
  flavor,
  setFlavor,
}: {
  categoryOptions: string[];
  flavor: FlavorForm;
  setFlavor: React.Dispatch<React.SetStateAction<FlavorForm | null>>;
}) {
  return (
    <div className="min-w-0 space-y-4 border-b border-white/10 p-4">
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(220px,1.1fr)_minmax(220px,0.9fr)]">
        <InlineInput
          label="Nombre del gusto"
          onChange={(value) =>
            setFlavor((current) => (current ? { ...current, name: value } : current))
          }
          placeholder="Ej: Chocolate"
          value={flavor.name}
        />
        <ProductCategoryField
          categories={categoryOptions}
          label="Tipo de gusto"
          onChange={(value) =>
            setFlavor((current) => (current ? { ...current, category: value } : current))
          }
          value={flavor.category}
        />
      </div>

      <label className="block min-w-0 text-xs font-semibold text-zinc-500">
        Color
        <div className="mt-1 grid h-10 grid-cols-[42px_minmax(0,1fr)] overflow-hidden rounded-lg border border-white/10 bg-[#080a0c] focus-within:border-cyan-300/60">
          <input
            className="h-10 w-full cursor-pointer border-0 bg-transparent p-1"
            onChange={(event) =>
              setFlavor((current) =>
                current ? { ...current, color: event.target.value } : current,
              )
            }
            type="color"
            value={flavor.color}
          />
          <div className="flex min-w-0 items-center px-3 text-sm font-semibold text-zinc-100">
            <span className="truncate">{flavor.color}</span>
          </div>
        </div>
      </label>
    </div>
  );
}

function ProductCategoryField({
  categories,
  label = "Categoría",
  onChange,
  value,
}: {
  categories: string[];
  label?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const selectedExistingCategory = categories.find((category) => category === value.trim());
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const showNewCategoryInput =
    isCreatingCategory || categories.length === 0 || Boolean(value.trim() && !selectedExistingCategory);

  useEffect(() => {
    if (value.trim() && !selectedExistingCategory) {
      setIsCreatingCategory(true);
    }
  }, [selectedExistingCategory, value]);

  return (
    <div className="min-w-0">
      <label className="block min-w-0 text-xs font-semibold text-zinc-500">
        {label}
        <select
          className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#080a0c] px-3 text-sm font-semibold text-zinc-100 outline-none transition focus:border-cyan-300/60"
          onChange={(event) => {
            if (event.target.value === "__new__") {
              setIsCreatingCategory(true);
              onChange("");
              return;
            }

            setIsCreatingCategory(false);
            onChange(event.target.value);
          }}
          value={selectedExistingCategory ?? (showNewCategoryInput ? "__new__" : "")}
        >
          <option value="" disabled>
            Elegir categoría
          </option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {formatCategoryLabel(category)}
            </option>
          ))}
          <option value="__new__">Crear categoría nueva</option>
        </select>
      </label>

      {showNewCategoryInput ? (
        <input
          className="mt-2 h-10 w-full rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 text-sm font-semibold text-cyan-50 outline-none transition placeholder:text-cyan-100/50 focus:border-cyan-200"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Nombre de la nueva categoría"
          value={selectedExistingCategory ? "" : value}
        />
      ) : null}
    </div>
  );
}

function InlineInput({
  className,
  help,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  className?: string;
  help?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  value: string;
}) {
  return (
    <label className={cn("min-w-0 text-xs font-semibold text-zinc-500", className)}>
      {label}
      <input
        className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#080a0c] px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
        min={type === "number" ? 0 : undefined}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {help ? <p className="mt-1 text-xs font-normal text-zinc-500">{help}</p> : null}
    </label>
  );
}

function ImageUploadControl({
  carpeta,
  className,
  label,
  onChange,
  tipo,
  value,
}: {
  carpeta: string;
  className?: string;
  label: string;
  onChange: (value: string) => void;
  tipo: "producto" | "logo" | "favicon";
  value: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadImage = async (file: File) => {
    setError("");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("carpeta", carpeta);
    formData.append("tipo", tipo);

    const response = await fetch("/api/erp/imagenes", {
      method: "POST",
      body: formData,
    }).catch(() => null);

    setIsUploading(false);

    if (!response?.ok) {
      const data = (await response?.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "No se pudo subir la imagen");
      return;
    }

    const data = (await response.json()) as {
      bytes?: number;
      url?: string;
    };

    if (data.url) {
      onChange(data.url);
    }
  };

  return (
    <div className={cn("min-w-0 max-w-full text-xs font-semibold text-zinc-500", className)}>
      {label}
      <div className="mt-1 min-w-0 max-w-full overflow-hidden rounded-lg border border-white/10 bg-[#080a0c] p-3">
        {value ? (
          <div className="mb-3 grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <div
              className="size-14 shrink-0 rounded-lg border border-white/10 bg-cover bg-center"
              style={{ backgroundImage: `url("${value}")` }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-200">
                Imagen optimizada en Supabase
              </p>
              <p className="truncate text-xs font-normal text-zinc-500" title={value}>
                {value}
              </p>
            </div>
            <Button
              className="shrink-0 border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={() => onChange("")}
              size="sm"
              type="button"
              variant="outline"
            >
              Quitar
            </Button>
          </div>
        ) : (
          <p className="mb-3 text-xs font-normal text-zinc-500">
            Se sube a Supabase Storage y se optimiza automáticamente.
          </p>
        )}
        <label className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/20">
          {isUploading ? "Optimizando..." : "Elegir imagen"}
          <input
            accept="image/avif,image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                void uploadImage(file);
              }
            }}
            type="file"
          />
        </label>
        {error && <p className="mt-2 text-xs font-normal text-rose-200">{error}</p>}
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  confirmLabel,
  description,
  isLoading,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: {
  confirmLabel: string;
  description: string;
  isLoading: boolean;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="erp-modal-shell fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="erp-modal-panel w-full max-w-md overflow-hidden rounded-lg border border-white/10 bg-[#101315] shadow-2xl">
        <div className="erp-modal-scroll-area border-b border-white/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-rose-300/20 bg-rose-300/10 text-rose-100">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end">
          <Button
            className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
            disabled={isLoading}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            className="border-rose-300/30 bg-rose-300/10 text-rose-100 hover:bg-rose-300/20"
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
            variant="outline"
          >
            {isLoading ? "Eliminando..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function HelpModal({
  activeView,
  groups,
  isOpen,
  onClose,
}: {
  activeView: ViewId;
  groups: HelpGuideGroup[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const [expandedView, setExpandedView] = useState<ViewId | null>(activeView);

  useEffect(() => {
    if (isOpen) {
      setExpandedView(activeView);
    }
  }, [activeView, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="erp-modal-shell fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="erp-modal-panel flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-white/10 bg-[#101315] shadow-2xl">
        <PanelHeader
          icon={CircleHelp}
          right={
            <Button
              className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
              onClick={onClose}
              size="sm"
              type="button"
              variant="outline"
            >
              Cerrar
            </Button>
          }
          subtitle="Guía completa de cada opción del menú: qué es, cómo se usa y qué modifica."
          title="Ayuda del sistema"
        />
        <div className="erp-modal-scroll-area min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          {groups.map((group) => (
            <section className="space-y-3" key={group.label}>
              <p className="px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100/80">
                {group.label}
              </p>
              <div className="grid gap-3">
                {group.items.map(({ help, item }) => {
                  const Icon = item.icon;
                  const isExpanded = expandedView === item.id;

                  return (
                    <article
                      className={cn(
                        "rounded-lg border bg-black/20 transition",
                        isExpanded
                          ? "border-cyan-300/40 bg-cyan-300/5"
                          : "border-white/10",
                      )}
                      key={item.id}
                    >
                      <button
                        className="flex w-full items-start gap-3 p-4 text-left"
                        onClick={() =>
                          setExpandedView((current) =>
                            current === item.id ? null : item.id,
                          )
                        }
                        type="button"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-100">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-zinc-100">{item.label}</p>
                          <p className="mt-1 text-sm leading-6 text-zinc-400">
                            {help.summary}
                          </p>
                        </div>
                        <div className="shrink-0 text-cyan-100">
                          {isExpanded ? (
                            <Minus className="size-4" />
                          ) : (
                            <Plus className="size-4" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="space-y-3 border-t border-white/10 p-4 pt-3">
                          {help.sections.map((section, sectionIndex) => (
                            <div
                              className="rounded-lg border border-white/10 bg-black/20 p-3"
                              key={`${item.id}-${section.title}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs font-semibold text-cyan-100">
                                  {sectionIndex + 1}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-zinc-100">
                                    {section.title}
                                  </p>
                                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                                    {section.description}
                                  </p>
                                  <div className="mt-3 space-y-2">
                                    {section.details.map((detail, detailIndex) => (
                                      <div
                                        className="flex items-start gap-3"
                                        key={`${item.id}-${section.title}-${detailIndex}`}
                                      >
                                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-300" />
                                        <p className="text-sm leading-6 text-zinc-300">
                                          {detail}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
                    </div>
      </div>
    </div>
  );
}

function BrandLogo({
  className,
  iconClassName,
  theme,
}: {
  className?: string;
  iconClassName?: string;
  theme: ThemeSettings;
}) {
  const imageUrl = getBrandLogoUrl(theme);
  const Icon = getBrandIconOption(theme.brandIcon)?.icon ?? Snowflake;

  return (
    <div
      className={cn(
        "erp-brand-logo flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--erp-primary)] text-[var(--erp-primary-text)]",
        className,
      )}
    >
      {imageUrl ? (
        <div
          aria-label="Logo"
          className="size-full bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        />
      ) : (
        <Icon className={cn("size-6", iconClassName)} />
      )}
    </div>
  );
}

function DisenoView({
  isSaving,
  onApplyPreset,
  onReset,
  onSave,
  onUpdate,
  theme,
}: {
  isSaving: boolean;
  onApplyPreset: (
    preset: ThemeColorPreset,
    options: ApplyThemePresetOptions,
  ) => void;
  onReset: () => void;
  onSave: () => void;
  onUpdate: (key: keyof ThemeSettings, value: string) => void;
  theme: ThemeSettings;
}) {
  const [applyPresetTypography, setApplyPresetTypography] = useState(true);

  return (
    <div className="space-y-5">
      <DarkPanel>
        <PanelHeader
          icon={Palette}
          right={
            <div className="flex flex-wrap gap-2">
              <Button
                className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                disabled={isSaving}
                onClick={onReset}
                type="button"
                variant="outline"
              >
                Restablecer
              </Button>
              <Button
                className="bg-[var(--erp-primary)] text-[var(--erp-primary-text)] hover:opacity-90"
                disabled={isSaving}
                onClick={onSave}
                type="button"
              >
                {isSaving ? "Guardando..." : "Guardar diseño"}
              </Button>
            </div>
          }
          subtitle="Cambia colores y tipografía de la página"
          title="Diseño"
        />

        <div className="grid min-w-0 gap-5 p-4 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-4 overflow-hidden rounded-lg border border-[var(--erp-border)] bg-black/20 p-4 sm:col-span-2">
              <div>
                <p className="font-semibold text-[var(--erp-text)]">
                  Nombre e identidad
                </p>
                <p className="mt-1 text-sm text-[var(--erp-muted)]">
                  Cambia el nombre del local, el texto superior, el logo y el icono de la pestaña.
                </p>
              </div>

              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[var(--erp-muted)]">
                  Nombre de la página
                  <input
                    className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none transition focus:border-[var(--erp-primary)]"
                    onChange={(event) => onUpdate("brandName", event.target.value)}
                    value={theme.brandName}
                  />
                </label>
                <label className="text-xs font-semibold text-[var(--erp-muted)]">
                  Texto superior
                  <input
                    className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none transition focus:border-[var(--erp-primary)]"
                    onChange={(event) => onUpdate("brandSubtitle", event.target.value)}
                    value={theme.brandSubtitle}
                  />
                </label>
              </div>

              <label className="block min-w-0 text-xs font-semibold text-[var(--erp-muted)]">
                Tipografía del nombre
                <select
                  className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none transition focus:border-[var(--erp-primary)]"
                  onChange={(event) => onUpdate("brandFontFamily", event.target.value)}
                  value={theme.brandFontFamily}
                >
                  {fontOptions.map((option) => (
                    <option
                      className="bg-zinc-950 text-zinc-100"
                      key={`brand-${option.value}`}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                  <option className="bg-zinc-950 text-zinc-100" value={BRAND_FONT_FAMILY}>
                    Estilo logo clásico
                  </option>
                </select>
              </label>

              <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--erp-muted)]">
                    Logo del sistema
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { id: "icon", label: "Icono" },
                      { id: "image", label: "Imagen" },
                    ].map((option) => (
                      <button
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs font-semibold transition",
                          theme.brandLogoMode === option.id
                            ? "border-[var(--erp-primary)] bg-[var(--erp-primary)] text-[var(--erp-primary-text)]"
                            : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                        )}
                        key={option.id}
                        onClick={() => onUpdate("brandLogoMode", option.id)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {theme.brandLogoMode === "icon" ? (
                    <select
                      className="mt-3 h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none transition focus:border-[var(--erp-primary)]"
                      onChange={(event) => onUpdate("brandIcon", event.target.value)}
                      value={theme.brandIcon}
                    >
                      {brandIconOptions.map((option) => (
                        <option
                          className="bg-zinc-950 text-zinc-100"
                          key={option.id}
                          value={option.id}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-3">
                      <ImageUploadControl
                        carpeta="marca"
                        label="Imagen del logo"
                        onChange={(value) => onUpdate("brandImageUrl", value)}
                        tipo="logo"
                        value={theme.brandImageUrl}
                      />
                    </div>
                  )}
                </div>

                <div className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-black/20 p-3">
                  <ImageUploadControl
                    carpeta="marca"
                    label="Icono de pestaña"
                    onChange={(value) => onUpdate("faviconUrl", value)}
                    tipo="favicon"
                    value={theme.faviconUrl}
                  />
                  <p className="mt-2 text-xs font-normal text-[var(--erp-muted)]">
                    Si lo dejás vacío, se usa la imagen del logo o una inicial automática.
                  </p>
                </div>
              </div>
            </div>

            <div className="min-w-0 space-y-3 overflow-hidden rounded-lg border border-[var(--erp-border)] bg-black/20 p-4 sm:col-span-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-semibold text-[var(--erp-text)]">
                    Diseños rápidos
                  </p>
                  <p className="mt-1 text-sm text-[var(--erp-muted)]">
                    Tocá un estilo para cambiar todos los colores juntos.
                  </p>
                </div>
                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-[var(--erp-border)] bg-[var(--erp-panel-alt)] px-3 py-2 text-xs font-semibold text-[var(--erp-text)]">
                  <input
                    checked={applyPresetTypography}
                    className="size-4 accent-[var(--erp-primary)]"
                    onChange={(event) =>
                      setApplyPresetTypography(event.target.checked)
                    }
                    type="checkbox"
                  />
                  Aplicar tipografía
                </label>
              </div>

            <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-4">
                {themeColorPresets.map((preset) => {
                  const isActive = isThemeColorPresetActive(theme, preset);

                  return (
                    <button
                      className={cn(
                        "group rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:bg-white/5",
                        isActive
                          ? "border-[var(--erp-primary)] bg-white/5"
                          : "border-white/10 bg-black/25",
                      )}
                      key={preset.id}
                      onClick={() =>
                        onApplyPreset(preset, {
                          includeTypography: applyPresetTypography,
                        })
                      }
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--erp-text)]">
                            {preset.name}
                          </p>
                          <p className="mt-1 text-xs text-[var(--erp-muted)]">
                            {preset.description}
                          </p>
                          <p
                            className="mt-2 text-[11px] font-semibold uppercase text-[var(--erp-primary)]"
                            style={{ fontFamily: preset.typography.fontFamily }}
                          >
                            {getFontOptionLabel(preset.typography.fontFamily)}
                          </p>
                        </div>
                        {isActive && (
                          <span className="shrink-0 rounded-full bg-[var(--erp-primary)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--erp-primary-text)]">
                            Activo
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-6 gap-1.5">
                        {presetSwatchKeys.map((key) => (
                          <span
                            aria-hidden="true"
                            className="h-8 rounded-md border border-white/10 shadow-inner"
                            key={key}
                            style={{ backgroundColor: preset.colors[key] }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="rounded-lg border border-[var(--erp-border)] bg-black/20 p-4 sm:col-span-2">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-semibold text-[var(--erp-text)]">
                    Tipografía
                  </p>
                  <p className="mt-1 text-sm text-[var(--erp-muted)]">
                    Cambia la letra de toda la página y se guarda con el diseño.
                  </p>
                </div>
                <Badge className="w-fit border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">
                  {getFontOptionLabel(theme.fontFamily)}
                </Badge>
              </div>
              <select
                className="mt-3 h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none transition focus:border-[var(--erp-primary)]"
                onChange={(event) => onUpdate("fontFamily", event.target.value)}
                value={theme.fontFamily}
              >
                {fontOptions.map((option) => (
                  <option
                    className="bg-zinc-950 text-zinc-100"
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <p
                className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-[var(--erp-text)]"
                style={{ fontFamily: theme.fontFamily }}
              >
                Vista de ejemplo: Caja, análisis, stock y empleados.
              </p>
            </label>

            {themeFields.map((field) => (
              <label
                className="rounded-lg border border-[var(--erp-border)] bg-black/20 p-4"
                key={field.key}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--erp-text)]">
                      {field.label}
                    </p>
                    <p className="mt-1 text-sm text-[var(--erp-muted)]">
                      {field.description}
                    </p>
                  </div>
                  <input
                    className="h-10 w-12 cursor-pointer rounded-md border border-white/10 bg-transparent p-1"
                    onChange={(event) => onUpdate(field.key, event.target.value)}
                    type="color"
                    value={theme[field.key].startsWith("#") ? theme[field.key] : "#000000"}
                  />
                </div>
                <input
                  className="mt-3 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 outline-none transition focus:border-[var(--erp-primary)]"
                  onChange={(event) => onUpdate(field.key, event.target.value)}
                  value={theme[field.key]}
                />
              </label>
            ))}
          </div>

          <div className="min-w-0 space-y-4">
            <div className="min-w-0 overflow-hidden rounded-lg border border-[var(--erp-border)] bg-[var(--erp-bg)] p-4">
              <div className="min-w-0 overflow-hidden rounded-lg border border-[var(--erp-border)] bg-[var(--erp-header)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--erp-primary)]">
                  {theme.brandSubtitle}
                </p>
                <h3
                  className="mt-2 truncate text-4xl leading-none text-[var(--erp-text)]"
                  style={{ fontFamily: theme.brandFontFamily }}
                >
                  {theme.brandName}
                </h3>
              </div>
              <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                <div className="min-w-0 rounded-lg bg-[var(--erp-sidebar)] p-3">
                  <div className="flex items-center gap-2 rounded-lg bg-[var(--erp-primary)] px-3 py-2 text-sm font-semibold text-[var(--erp-primary-text)]">
                    <BrandLogo className="size-8 rounded-md" iconClassName="size-4" theme={theme} />
                    <span>Caja</span>
                  </div>
                  <div className="mt-2 rounded-lg px-3 py-2 text-sm text-[var(--erp-muted)]">
                    Stock
                  </div>
                </div>
                <div className="min-w-0 rounded-lg border border-[var(--erp-border)] bg-[var(--erp-panel)] p-4">
                  <p className="text-sm text-[var(--erp-muted)]">Panel principal</p>
                  <p className="mt-2 text-xl font-semibold text-[var(--erp-text)]">
                    Total vendido
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-[var(--erp-primary)] px-3 py-2 text-sm font-semibold text-[var(--erp-primary-text)]">
                      Botón principal
                    </span>
                    <span className="rounded-lg border border-[var(--erp-border)] bg-[var(--erp-panel-alt)] px-3 py-2 text-sm text-[var(--erp-text)]">
                      Botón secundario
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DarkPanel>
              <div className="p-4">
                <p className="font-semibold text-[var(--erp-text)]">
                  Cómo se guarda
                </p>
                <p className="mt-2 text-sm text-[var(--erp-muted)]">
                  Los cambios se ven al instante. Cuando tocás Guardar diseño,
                  quedan guardados para que la página mantenga ese diseño al
                  volver a entrar.
                </p>
              </div>
            </DarkPanel>
          </div>
        </div>
      </DarkPanel>
    </div>
  );
}

function DesktopUpdateButton({
  isWaitingForOfflineSync,
  onCheck,
  onDownload,
  onInstall,
  update,
}: {
  isWaitingForOfflineSync: boolean;
  onCheck: () => void;
  onDownload: () => void;
  onInstall: () => void;
  update: DesktopUpdaterState;
}) {
  if (update.status === "unsupported") {
    return null;
  }

  if (isWaitingForOfflineSync) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100">
        <RefreshCw className="size-4 animate-spin" />
        Actualiza al sincronizar
      </div>
    );
  }

  if (
    update.status === "idle" ||
    update.status === "not-available" ||
    update.status === "updated"
  ) {
    return (
      <Button
        className="border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
        onClick={onCheck}
        size="sm"
        type="button"
        variant="outline"
      >
        <RefreshCw className="size-4" />
        {update.status === "not-available" ? "App actualizada" : "Buscar actualización"}
      </Button>
    );
  }

  if (update.status === "available") {
    return (
      <Button
        className="border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20"
        onClick={onDownload}
        size="sm"
        type="button"
        variant="outline"
      >
        <ArrowDownCircle className="size-4" />
        Descargar {update.version ? `v${update.version}` : "actualización"}
      </Button>
    );
  }

  if (update.status === "downloaded") {
    return (
      <Button
        className="bg-[var(--erp-primary)] font-semibold text-[var(--erp-primary-text)] hover:opacity-90"
        onClick={onInstall}
        size="sm"
        type="button"
      >
        <CheckCircle2 className="size-4" />
        Actualizar ahora
      </Button>
    );
  }

  if (update.status === "downloading") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100">
        <ArrowDownCircle className="size-4" />
        Descargando {update.progress ?? 0}%
      </div>
    );
  }

  if (update.status === "checking") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-zinc-100">
        <RefreshCw className="size-4 animate-spin" />
        Buscando actualización
      </div>
    );
  }

  if (update.status === "error") {
    return (
      <Button
        className="border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20"
        onClick={onCheck}
        size="sm"
        type="button"
        variant="outline"
      >
        <RefreshCw className="size-4" />
        Reintentar actualización
      </Button>
    );
  }

  return null;
}

function DarkPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-[var(--erp-border)] bg-[var(--erp-panel)] shadow-2xl", className)}>
      {children}
    </div>
  );
}

function PanelHeader({
  icon: Icon,
  right,
  subtitle,
  title,
}: {
  icon: LucideIcon;
  right?: React.ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="erp-panel-header flex flex-col gap-3 border-b border-[var(--erp-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-[var(--erp-primary)]">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="break-words font-semibold leading-tight text-[var(--erp-text)]">{title}</h2>
          {subtitle && <p className="text-sm text-[var(--erp-muted)]">{subtitle}</p>}
        </div>
      </div>
      {right ? <div className="erp-panel-header-actions">{right}</div> : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  onClick,
  tone,
  value,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  tone: "cyan" | "amber" | "green" | "red" | "neutral";
  value: string;
}) {
  const toneClass = {
    cyan: "text-cyan-200 bg-cyan-300/10 border-cyan-300/20",
    amber: "text-amber-200 bg-amber-300/10 border-amber-300/20",
    green: "text-emerald-200 bg-emerald-300/10 border-emerald-300/20",
    red: "text-rose-200 bg-rose-300/10 border-rose-300/20",
    neutral: "text-zinc-200 bg-white/5 border-white/10",
  };

  const content = (
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-zinc-500">{label}</p>
          <p className="erp-metric-value mt-2 break-words text-xl font-semibold leading-tight tracking-normal text-zinc-100">
            {value}
          </p>
        </div>
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border", toneClass[tone])}>
          <Icon className="size-4" />
        </div>
      </div>
  );

  if (onClick) {
    return (
      <button
        className="erp-metric-card rounded-lg border border-[var(--erp-border)] bg-[var(--erp-panel)] p-3 text-left shadow-2xl transition hover:border-cyan-300/40 hover:bg-white/[0.03]"
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="erp-metric-card rounded-lg border border-[var(--erp-border)] bg-[var(--erp-panel)] p-3 shadow-2xl">
      {content}
    </div>
  );
}

function ShiftCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-sm text-zinc-500">
            Gana por la {label.toLowerCase()}
          </p>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
            <Icon className="size-5" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="break-words text-2xl font-semibold leading-tight tracking-normal text-zinc-100">
            {formatCurrency(value)}
          </p>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function TotalRow({
  label,
  strong,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 py-1 text-sm",
        strong && "text-base font-semibold",
      )}
    >
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className={cn("break-words text-right", strong ? "text-zinc-100" : "text-zinc-300")}>
        {value}
      </span>
    </div>
  );
}

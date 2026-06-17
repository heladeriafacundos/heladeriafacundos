import assert from "node:assert/strict";

const SHIFT_DAY_START_HOUR = 6;
const SHIFT_CHANGE_HOUR = 16;

const getDaysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const startOfDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const endOfDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
const addDays = (date, days) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
const getOperationalDayRange = (date) => {
  const candidateStart = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      SHIFT_DAY_START_HOUR,
    ),
  );
  const start = date < candidateStart ? addDays(candidateStart, -1) : candidateStart;
  return { start, end: new Date(addDays(start, 1).getTime() - 1) };
};

const normalizeExpenseCategory = (category) =>
  category
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const isProductionExpense = (expense) =>
  normalizeExpenseCategory(expense.category) === "produccion";

const currentExpenseBreakdown = (expenses) =>
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

const getExpenseBreakdownForDate = (date, expenses, expenseHistory) => {
  const sortedHistory = [...expenseHistory].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );
  const activeSnapshot = sortedHistory
    .filter((snapshot) => new Date(snapshot.startsAt) <= date)
    .at(-1);
  const sourceExpenses = activeSnapshot?.expenses ?? sortedHistory[0]?.expenses ?? expenses;

  return currentExpenseBreakdown(sourceExpenses);
};

const calculateExpenseBreakdownBetween = (start, end, expenses, expenseHistory = []) => {
  const breakdown = { fixed: 0, production: 0, total: 0 };
  let cursor = startOfDay(start);
  const finalDay = startOfDay(end);

  while (cursor <= finalDay) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    const daysInCursorMonth = getDaysInMonth(year, month);
    const snapshot = getExpenseBreakdownForDate(endOfDay(cursor), expenses, expenseHistory);
    breakdown.fixed += snapshot.fixed / daysInCursorMonth;
    breakdown.production += snapshot.production / daysInCursorMonth;
    breakdown.total += snapshot.total / daysInCursorMonth;
    cursor = addDays(cursor, 1);
  }

  return breakdown;
};

const getSaleHour = (sale) => {
  const parsedHour = Number(sale.time.split(":")[0]);
  return Number.isFinite(parsedHour) ? parsedHour : new Date(sale.createdAt).getUTCHours();
};
const saleMatchesShiftFilter = (sale, shiftFilter) => {
  if (shiftFilter === "todo") return true;
  const saleHour = getSaleHour(sale);
  return shiftFilter === "manana"
    ? saleHour >= SHIFT_DAY_START_HOUR && saleHour < SHIFT_CHANGE_HOUR
    : saleHour < SHIFT_DAY_START_HOUR || saleHour >= SHIFT_CHANGE_HOUR;
};
const saleMatchesChannelFilter = (sale, channelFilter) =>
  channelFilter === "todo" || sale.channel === channelFilter;
const allocateExpenseByRevenueShare = (totalExpense, filteredGross, periodGross) => {
  if (periodGross <= 0 || filteredGross <= 0) return 0;
  return totalExpense * (filteredGross / periodGross);
};
const calculateCommissionCost = (sales, methodCommissions, channelCommissions) =>
  sales.reduce((total, sale) => {
    const methodRate = methodCommissions[sale.method] ?? 0;
    const channelRate = channelCommissions[sale.channel] ?? 0;
    return total + sale.total * ((methodRate + channelRate) / 100);
  }, 0);

const summarizeAnalysis = ({
  fixedExpenses,
  monthGrossRevenue,
  saleItems,
  sales,
  methodCommissions = {},
  channelCommissions = { local: 0, pedidos_ya: 0 },
  shiftFilter = "todo",
  channelFilter = "todo",
}) => {
  const filteredSales = sales.filter(
    (sale) =>
      saleMatchesShiftFilter(sale, shiftFilter) &&
      saleMatchesChannelFilter(sale, channelFilter),
  );
  const saleIds = new Set(filteredSales.map((sale) => sale.id));
  const filteredItems = saleItems.filter((item) => saleIds.has(item.saleId));
  const grossRevenue = filteredSales.reduce((total, sale) => total + sale.total, 0);
  const soldProductCost = filteredItems.reduce(
    (total, item) => total + item.cost * item.quantity,
    0,
  );
  const hasFilters = shiftFilter !== "todo" || channelFilter !== "todo";
  const allocatedFixedExpenses = hasFilters
    ? allocateExpenseByRevenueShare(fixedExpenses, grossRevenue, monthGrossRevenue)
    : fixedExpenses;
  const commissionCost = calculateCommissionCost(
    filteredSales,
    methodCommissions,
    channelCommissions,
  );

  return {
    grossRevenue,
    soldProductCost,
    allocatedFixedExpenses,
    commissionCost,
    netProfit: grossRevenue - soldProductCost - allocatedFixedExpenses - commissionCost,
  };
};

const productMargins = (items) =>
  Object.values(
    items.reduce((acc, item) => {
      const normalizedName = item.product.replace(/\s*\([^)]*\)\s*$/, "").trim();
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
  ).map((row) => ({ ...row, margin: row.revenue - row.cost }));

const topProducts = (items) =>
  Object.entries(
    items.reduce((acc, item) => {
      const normalizedName = item.product.replace(/\s*\([^)]*\)\s*$/, "").trim();
      acc[normalizedName] = (acc[normalizedName] ?? 0) + item.quantity;
      return acc;
    }, {}),
  ).sort(([, left], [, right]) => right - left);

const topFlavors = (items) =>
  Object.entries(
    items.reduce((acc, item) => {
      item.flavors.forEach((flavor) => {
        acc[flavor] = (acc[flavor] ?? 0) + item.quantity;
      });
      return acc;
    }, {}),
  ).sort(([, left], [, right]) => right - left);

const isLowStock = (item) => item.minStock > 0 && item.stock <= item.minStock;

const calculateSoldFlavorQuantities = (cart) =>
  cart.reduce((acc, item) => {
    const usagePerSelection =
      item.flavors.length > 0 ? item.flavorUsage / item.flavors.length : 0;
    item.flavors.forEach((flavorName) => {
      acc[flavorName] = (acc[flavorName] ?? 0) + item.quantity * usagePerSelection;
    });
    return acc;
  }, {});

const applyFlavorSale = (flavors, cart) => {
  const soldFlavorQuantities = calculateSoldFlavorQuantities(cart);
  return flavors.map((flavor) => ({
    ...flavor,
    stock: flavor.stock - (soldFlavorQuantities[flavor.name] ?? 0),
  }));
};

const loadFlavorBatchStock = (flavor, portionsLoaded) => ({
  ...flavor,
  stock: flavor.stock + portionsLoaded,
});

const closeFlavorBatchStock = (batch, currentStock) => ({
  nextStock: 0,
  suggestedYield: Math.max(0, batch.portionsLoaded - currentStock),
});

const round = (value) => Math.round(value * 100) / 100;

const fixedOnly = [{ key: "rent", category: "Local", amount: 300000 }];
const withProduction = [
  ...fixedOnly,
  { key: "cream", category: "Produccion", amount: 120000 },
];

assert.equal(
  round(calculateExpenseBreakdownBetween(new Date("2026-05-01"), new Date("2026-05-31"), withProduction).fixed),
  300000,
  "un mes completo de 31 dias debe descontar exactamente el gasto fijo mensual",
);
assert.equal(
  round(calculateExpenseBreakdownBetween(new Date("2026-02-01"), new Date("2026-02-28"), fixedOnly).fixed),
  300000,
  "febrero completo debe descontar exactamente el gasto fijo mensual",
);
assert.equal(
  round(calculateExpenseBreakdownBetween(new Date("2026-05-01"), new Date("2026-05-15"), fixedOnly).fixed),
  round(300000 * (15 / 31)),
  "un periodo parcial debe prorratear por dias reales del mes",
);
assert.equal(
  calculateExpenseBreakdownBetween(new Date("2026-05-01"), new Date("2026-05-31"), withProduction).production,
  0,
  "los gastos de produccion manuales no deben descontarse de la ganancia",
);
assert.deepEqual(
  getOperationalDayRange(new Date("2026-05-26T02:00:00.000Z")),
  {
    start: new Date("2026-05-25T06:00:00.000Z"),
    end: new Date("2026-05-26T05:59:59.999Z"),
  },
  "a la madrugada el dia operativo debe seguir siendo el dia anterior",
);
assert.deepEqual(
  getOperationalDayRange(new Date("2026-05-26T12:00:00.000Z")),
  {
    start: new Date("2026-05-26T06:00:00.000Z"),
    end: new Date("2026-05-27T05:59:59.999Z"),
  },
  "despues de las 6 el dia operativo debe ser el dia actual",
);

const history = [
  {
    startsAt: "2026-05-01T00:00:00.000Z",
    expenses: [{ key: "old", category: "Local", amount: 100000 }],
  },
  {
    startsAt: "2026-05-15T00:00:00.000Z",
    expenses: [{ key: "new", category: "Local", amount: 310000 }],
  },
];
assert.equal(
  round(calculateExpenseBreakdownBetween(new Date("2026-05-01"), new Date("2026-05-31"), [], history).fixed),
  round(100000 * (14 / 31) + 310000 * (17 / 31)),
  "el historial de gastos debe cambiar el monto desde su fecha_desde",
);

const sales = [
  { id: "A", channel: "local", time: "10:00", total: 1000, items: 1, method: "Efectivo", createdAt: "2026-05-25T10:00:00.000Z" },
  { id: "B", channel: "local", time: "18:00", total: 2000, items: 2, method: "Tarjeta", createdAt: "2026-05-25T18:00:00.000Z" },
  { id: "C", channel: "pedidos_ya", time: "12:00", total: 1000, items: 1, method: "Mercado Pago", createdAt: "2026-05-25T12:00:00.000Z" },
  { id: "D", channel: "local", time: "02:00", total: 500, items: 1, method: "Efectivo", createdAt: "2026-05-26T02:00:00.000Z" },
  { id: "E", channel: "local", time: "--:--", total: 700, items: 1, method: "Efectivo", createdAt: "2026-05-25T19:00:00.000Z" },
];
const saleItems = [
  { saleId: "A", product: "Cucurucho simple (Chocolate)", quantity: 1, price: 1000, total: 1000, cost: 300, flavors: ["Chocolate"] },
  { saleId: "B", product: "1 kg helado artesanal (Limon, Frutilla)", quantity: 2, price: 1000, total: 2000, cost: 800, flavors: ["Limon", "Frutilla"] },
  { saleId: "C", product: "Cucurucho simple (Chocolate)", quantity: 1, price: 1000, total: 1000, cost: 300, flavors: ["Chocolate"] },
  { saleId: "D", product: "Agua mineral", quantity: 1, price: 500, total: 500, cost: 200, flavors: [] },
  { saleId: "E", product: "Cafe", quantity: 1, price: 700, total: 700, cost: 100, flavors: [] },
];
const monthGrossRevenue = sales.reduce((total, sale) => total + sale.total, 0);
const methodCommissions = { Tarjeta: 3, "Mercado Pago": 6 };
const channelCommissions = { local: 0, pedidos_ya: 12 };

assert.deepEqual(summarizeAnalysis({
  fixedExpenses: 300000,
  methodCommissions,
  channelCommissions,
  monthGrossRevenue,
  saleItems,
  sales,
}), {
  grossRevenue: 5200,
  soldProductCost: 2500,
  allocatedFixedExpenses: 300000,
  commissionCost: 240,
  netProfit: -297540,
});
assert.deepEqual(summarizeAnalysis({
  fixedExpenses: 300000,
  methodCommissions,
  channelCommissions,
  monthGrossRevenue,
  saleItems,
  sales,
  shiftFilter: "manana",
  channelFilter: "local",
}), {
  grossRevenue: 1000,
  soldProductCost: 300,
  allocatedFixedExpenses: 300000 * (1000 / 5200),
  commissionCost: 0,
  netProfit: 1000 - 300 - 300000 * (1000 / 5200),
});
assert.deepEqual(summarizeAnalysis({
  fixedExpenses: 300000,
  methodCommissions,
  channelCommissions,
  monthGrossRevenue,
  saleItems,
  sales,
  shiftFilter: "tarde",
  channelFilter: "local",
}), {
  grossRevenue: 3200,
  soldProductCost: 1900,
  allocatedFixedExpenses: 300000 * (3200 / 5200),
  commissionCost: 60,
  netProfit: 3200 - 1900 - 300000 * (3200 / 5200) - 60,
});
assert.deepEqual(topProducts(saleItems), [
  ["Cucurucho simple", 2],
  ["1 kg helado artesanal", 2],
  ["Agua mineral", 1],
  ["Cafe", 1],
]);
assert.deepEqual(topFlavors(saleItems), [
  ["Chocolate", 2],
  ["Limon", 2],
  ["Frutilla", 2],
]);
{
  const operationalDay = getOperationalDayRange(new Date("2026-05-26T02:00:00.000Z"));
  assert.deepEqual(
    sales
      .filter((sale) => {
        const createdAt = new Date(sale.createdAt);
        return createdAt >= operationalDay.start && createdAt <= operationalDay.end;
      })
      .map((sale) => sale.id),
    ["A", "B", "C", "D", "E"],
    "el cierre de madrugada debe incluir ventas de la tarde anterior y de despues de medianoche",
  );
}

assert.deepEqual(
  [
    { name: "Sin aviso", stock: 0, minStock: 0 },
    { name: "Bajo", stock: 4, minStock: 6 },
    { name: "Justo en minimo", stock: 6, minStock: 6 },
    { name: "Disponible", stock: 8, minStock: 6 },
  ].filter(isLowStock).map((item) => item.name),
  ["Bajo", "Justo en minimo"],
  "los productos/gustos con minimo 0 no deben generar alerta falsa",
);

assert.deepEqual(
  calculateSoldFlavorQuantities([
    { name: "1 kg helado", quantity: 2, flavorUsage: 4, flavors: ["Chocolate", "Limon"] },
    { name: "1/4 kg helado", quantity: 1, flavorUsage: 1, flavors: ["Chocolate"] },
    { name: "Cafe", quantity: 3, flavorUsage: 0, flavors: [] },
  ]),
  { Chocolate: 5, Limon: 4 },
  "el descuento de gustos debe usar porciones estimadas y repartirlas entre gustos elegidos",
);

assert.deepEqual(
  applyFlavorSale(
    [
      { name: "Chocolate", stock: 10 },
      { name: "Limon", stock: 3 },
    ],
    [
      { quantity: 2, flavorUsage: 4, flavors: ["Chocolate", "Limon"] },
      { quantity: 1, flavorUsage: 1, flavors: ["Chocolate"] },
    ],
  ),
  [
    { name: "Chocolate", stock: 5 },
    { name: "Limon", stock: -1 },
  ],
  "el stock de gustos puede quedar negativo para detectar que el balde rindio menos",
);

assert.deepEqual(
  loadFlavorBatchStock({ name: "Frutilla", stock: 3 }, 160),
  { name: "Frutilla", stock: 163 },
  "cargar un balde debe sumar porciones al stock actual",
);

assert.deepEqual(
  closeFlavorBatchStock({ portionsLoaded: 160 }, 25),
  { nextStock: 0, suggestedYield: 135 },
  "cerrar un balde debe dejar el stock en 0 y sugerir el rendimiento vendido",
);
assert.deepEqual(productMargins(saleItems), [
  { product: "Cucurucho simple", quantity: 2, revenue: 2000, cost: 600, margin: 1400 },
  { product: "1 kg helado artesanal", quantity: 2, revenue: 2000, cost: 1600, margin: 400 },
  { product: "Agua mineral", quantity: 1, revenue: 500, cost: 200, margin: 300 },
  { product: "Cafe", quantity: 1, revenue: 700, cost: 100, margin: 600 },
]);

console.log("financial-analysis tests passed");

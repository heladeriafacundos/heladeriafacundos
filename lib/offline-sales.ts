export type OfflineSalePayload = {
  venta: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  movimientos: Array<Record<string, unknown>>;
  stock: Array<{ cantidad?: number; id: string; stock: number }>;
  stock_gustos?: Array<{ cantidad?: number; id: string; stock: number }>;
};

export type OfflineSaleRecord = {
  id: string;
  createdAt: string;
  payload: OfflineSalePayload;
  sale: {
    id: string;
    customer: string;
    channel: "local" | "pedidos_ya";
    items: number;
    method: string;
    time: string;
    total: number;
    subtotal: number;
    discount: number;
    createdAt: string;
  };
  saleItems: Array<{
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
  }>;
  productAdjustments: Array<{ id: string; quantity: number }>;
  flavorAdjustments: Array<{ id: string; quantity: number }>;
};

export type OfflineCashClosePayload = {
  id: string;
  fecha_operativa: string;
  turno: "manana" | "tarde";
  total_sistema: number;
  efectivo_sistema: number;
  efectivo_contado: number;
  ventas: number;
  observacion: string;
};

export type OfflineCashCloseRecord = {
  id: string;
  createdAt: string;
  payload: OfflineCashClosePayload;
};

export type OfflineJsonMutationRecord = {
  id: string;
  createdAt: string;
  label: string;
  request: {
    body: Record<string, unknown>;
    method: "DELETE" | "PATCH" | "POST" | "PUT";
    url: string;
  };
};

const DB_NAME = "heladeria-offline";
const DB_VERSION = 3;
const SALES_STORE_NAME = "pending-sales";
const CASH_CLOSES_STORE_NAME = "pending-cash-closes";
const MUTATIONS_STORE_NAME = "pending-json-mutations";
const STORE_NAMES = [
  SALES_STORE_NAME,
  CASH_CLOSES_STORE_NAME,
  MUTATIONS_STORE_NAME,
] as const;

const isBrowser = () => typeof window !== "undefined" && "indexedDB" in window;

const openOfflineDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("IndexedDB no disponible"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SALES_STORE_NAME)) {
        db.createObjectStore(SALES_STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CASH_CLOSES_STORE_NAME)) {
        db.createObjectStore(CASH_CLOSES_STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(MUTATIONS_STORE_NAME)) {
        db.createObjectStore(MUTATIONS_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir IndexedDB"));
    request.onsuccess = () => resolve(request.result);
  });

const runStore = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) => {
  const db = await openOfflineDb();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);
    let closed = false;
    const closeDb = () => {
      if (closed) return;
      closed = true;
      db.close();
    };

    request.onerror = () => reject(request.error ?? new Error("Operación offline fallida"));
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = closeDb;
    transaction.onerror = () => {
      closeDb();
      reject(transaction.error ?? new Error("Transacción offline fallida"));
    };
    transaction.onabort = () => {
      closeDb();
      reject(transaction.error ?? new Error("Transacción offline cancelada"));
    };
  });
};

export const enqueueOfflineSale = (sale: OfflineSaleRecord) =>
  runStore(SALES_STORE_NAME, "readwrite", (store) => store.put(sale));

export const removeOfflineSale = (id: string) =>
  runStore(SALES_STORE_NAME, "readwrite", (store) => store.delete(id));

export const getOfflineSales = async () => {
  try {
    const sales = await runStore<OfflineSaleRecord[]>(
      SALES_STORE_NAME,
      "readonly",
      (store) => store.getAll(),
    );
    return sales.sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  } catch {
    return [];
  }
};

export const countOfflineSales = async () => {
  try {
    return await runStore<number>(SALES_STORE_NAME, "readonly", (store) =>
      store.count(),
    );
  } catch {
    return 0;
  }
};

export const enqueueOfflineCashClose = (close: OfflineCashCloseRecord) =>
  runStore(CASH_CLOSES_STORE_NAME, "readwrite", (store) => store.put(close));

export const removeOfflineCashClose = (id: string) =>
  runStore(CASH_CLOSES_STORE_NAME, "readwrite", (store) => store.delete(id));

export const getOfflineCashCloses = async () => {
  try {
    const closes = await runStore<OfflineCashCloseRecord[]>(
      CASH_CLOSES_STORE_NAME,
      "readonly",
      (store) => store.getAll(),
    );
    return closes.sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  } catch {
    return [];
  }
};

export const countOfflineCashCloses = async () => {
  try {
    return await runStore<number>(CASH_CLOSES_STORE_NAME, "readonly", (store) =>
      store.count(),
    );
  } catch {
    return 0;
  }
};

export const enqueueOfflineJsonMutation = (mutation: OfflineJsonMutationRecord) =>
  runStore(MUTATIONS_STORE_NAME, "readwrite", (store) => store.put(mutation));

export const removeOfflineJsonMutation = (id: string) =>
  runStore(MUTATIONS_STORE_NAME, "readwrite", (store) => store.delete(id));

export const getOfflineJsonMutations = async () => {
  try {
    const mutations = await runStore<OfflineJsonMutationRecord[]>(
      MUTATIONS_STORE_NAME,
      "readonly",
      (store) => store.getAll(),
    );
    return mutations.sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  } catch {
    return [];
  }
};

export const countOfflineJsonMutations = async () => {
  try {
    return await runStore<number>(MUTATIONS_STORE_NAME, "readonly", (store) =>
      store.count(),
    );
  } catch {
    return 0;
  }
};

export const clearOfflineQueues = async () => {
  try {
    const db = await openOfflineDb();

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([...STORE_NAMES], "readwrite");

      for (const storeName of STORE_NAMES) {
        transaction.objectStore(storeName).clear();
      }

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error ?? new Error("No se pudo limpiar la cola offline"));
      };
      transaction.onabort = () => {
        db.close();
        reject(transaction.error ?? new Error("Limpieza offline cancelada"));
      };
    });
  } catch {
    // Si IndexedDB no está disponible, no hay cola offline que limpiar.
  }
};

/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("node:fs");
const path = require("node:path");

const PORT = 5123;
const HOST = "127.0.0.1";
const DEFAULT_UPDATE_URL =
  "https://github.com/heladeriafacundos/heladeriafacundos/releases/latest/download";
const AUTO_UPDATE_CHECK_DELAY_MS = 60000;
const AUTO_UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const SHOULD_AUTO_CHECK_UPDATES = process.env.ELECTRON_AUTO_UPDATE_CHECK !== "false";
const UPDATE_HISTORY_FILE_NAME = "update-history.json";
const DESKTOP_USER_AGENT_MARKER = "CajaHeladeriaDesktop";
let serverStarted = false;
let mainWindow;
let updaterStatus = {
  status: "idle",
  currentVersion: app.getVersion(),
};
let updaterSetupDone = false;
let updateCheckInProgress = false;
let updateDownloadInProgress = false;

const configureLowEndRuntime = () => {
  process.env.NEXT_TELEMETRY_DISABLED = "1";

  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("disable-background-networking");
  app.commandLine.appendSwitch("disable-component-update");
  app.commandLine.appendSwitch("disable-domain-reliability");
  app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
  app.commandLine.appendSwitch("disable-smooth-scrolling");
  app.commandLine.appendSwitch("disk-cache-size", "33554432");
  app.commandLine.appendSwitch(
    "disable-features",
    "AutofillServerCommunication,BackForwardCache,CalculateNativeWinOcclusion,MediaRouter,OptimizationHints",
  );
};

configureLowEndRuntime();

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  });
}

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      process.env[key] = value;
    }
  }
};

const waitForServer = async (url, timeoutMs = 30000) => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  throw new Error("No se pudo iniciar la app local");
};

const startProductionServer = async () => {
  if (serverStarted) return;
  serverStarted = true;

  const resourcesPath = process.resourcesPath;
  parseEnvFile(path.join(resourcesPath, ".env.local"));

  process.env.NODE_ENV = "production";
  process.env.PORT = String(PORT);
  process.env.HOSTNAME = HOST;

  const serverPath = path.join(
    resourcesPath,
    "app.asar.unpacked",
    ".next",
    "standalone",
    "server.js",
  );

  require(serverPath);
  await waitForServer(`http://${HOST}:${PORT}`);
};

const getAppUrl = () =>
  app.isPackaged
    ? `http://${HOST}:${PORT}`
    : process.env.ELECTRON_START_URL || "http://localhost:3000";

const getCachedDesktopIcon = () => {
  const iconPath = path.join(app.getPath("userData"), "app-icon.png");
  return fs.existsSync(iconPath) ? iconPath : undefined;
};

const getUpdateHistoryPath = () =>
  path.join(app.getPath("userData"), UPDATE_HISTORY_FILE_NAME);

const readUpdateHistory = () => {
  try {
    const historyPath = getUpdateHistoryPath();
    if (!fs.existsSync(historyPath)) return null;
    return JSON.parse(fs.readFileSync(historyPath, "utf8"));
  } catch {
    return null;
  }
};

const writeUpdateHistory = (history) => {
  try {
    fs.writeFileSync(getUpdateHistoryPath(), JSON.stringify(history, null, 2));
  } catch {
    // El aviso de actualizacion es informativo; la app puede seguir igual.
  }
};

const refreshInstalledUpdateStatus = () => {
  const currentVersion = app.getVersion();
  const history = readUpdateHistory();

  if (
    history?.pendingInstallVersion === currentVersion &&
    history?.lastVersion &&
    history.lastVersion !== currentVersion
  ) {
    const updatedAt = new Date().toISOString();
    const nextHistory = {
      lastInstalledAt: updatedAt,
      lastVersion: currentVersion,
      previousVersion: history.lastVersion,
    };
    writeUpdateHistory(nextHistory);
    updaterStatus = {
      currentVersion,
      message: "Actualizacion instalada correctamente",
      previousVersion: history.lastVersion,
      status: "updated",
      updatedAt,
      version: currentVersion,
    };
    return;
  }

  if (!history?.lastVersion) {
    writeUpdateHistory({
      lastInstalledAt: new Date().toISOString(),
      lastVersion: currentVersion,
    });
    updaterStatus = {
      ...updaterStatus,
      currentVersion,
    };
    return;
  }

  updaterStatus = {
    ...updaterStatus,
    currentVersion,
  };
};

const sendUpdaterStatus = (nextStatus) => {
  updaterStatus = {
    ...updaterStatus,
    ...nextStatus,
    currentVersion: app.getVersion(),
  };
  mainWindow?.webContents.send("updater:status", updaterStatus);
};

const getUpdaterUrl = () =>
  process.env.ELECTRON_UPDATE_URL ||
  process.env.NEXT_PUBLIC_ELECTRON_UPDATE_URL ||
  DEFAULT_UPDATE_URL;

const canUseUpdater = () => app.isPackaged && Boolean(getUpdaterUrl());

const checkForUpdatesSafely = async () => {
  if (
    !canUseUpdater() ||
    updateCheckInProgress ||
    updateDownloadInProgress ||
    updaterStatus.status === "checking" ||
    updaterStatus.status === "downloading" ||
    updaterStatus.status === "downloaded"
  ) {
    return updaterStatus;
  }

  updateCheckInProgress = true;

  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    sendUpdaterStatus({
      message: error instanceof Error ? error.message : "No se pudo buscar actualizacion",
      status: "error",
    });
  } finally {
    updateCheckInProgress = false;
  }

  return updaterStatus;
};

const downloadUpdateSafely = async () => {
  if (
    !canUseUpdater() ||
    updateDownloadInProgress ||
    updaterStatus.status === "downloading" ||
    updaterStatus.status === "downloaded"
  ) {
    return updaterStatus;
  }

  updateDownloadInProgress = true;

  try {
    await autoUpdater.downloadUpdate();
  } catch (error) {
    sendUpdaterStatus({
      message: error instanceof Error ? error.message : "No se pudo descargar la actualizacion",
      status: "error",
    });
  } finally {
    updateDownloadInProgress = false;
  }

  return updaterStatus;
};

const setupAutoUpdater = () => {
  if (updaterSetupDone) return;
  updaterSetupDone = true;

  const updateUrl = getUpdaterUrl();

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.logger = null;

  if (!app.isPackaged) {
    sendUpdaterStatus({
      message: "Las actualizaciones se prueban en la app instalada.",
      status: "unsupported",
    });
    return;
  }

  autoUpdater.setFeedURL({
    provider: "generic",
    url: updateUrl,
  });

  autoUpdater.on("checking-for-update", () => {
    sendUpdaterStatus({ message: "Buscando actualizacion...", status: "checking" });
  });
  autoUpdater.on("update-available", (info) => {
    sendUpdaterStatus({
      message: `Version ${info.version} disponible`,
      status: "available",
      version: info.version,
    });
  });
  autoUpdater.on("update-not-available", () => {
    sendUpdaterStatus({
      message: "La app esta actualizada.",
      status: "not-available",
    });
  });
  autoUpdater.on("download-progress", (progress) => {
    sendUpdaterStatus({
      message: `Descargando ${Math.round(progress.percent || 0)}%`,
      progress: Math.round(progress.percent || 0),
      status: "downloading",
    });
  });
  autoUpdater.on("update-downloaded", (info) => {
    sendUpdaterStatus({
      message: "Actualizacion lista para instalar",
      progress: 100,
      status: "downloaded",
      version: info.version,
    });
  });
  autoUpdater.on("error", (error) => {
    sendUpdaterStatus({
      message: error instanceof Error ? error.message : "No se pudo actualizar",
      status: "error",
    });
  });

  if (!SHOULD_AUTO_CHECK_UPDATES) {
    return;
  }

  setTimeout(() => {
    void checkForUpdatesSafely();
  }, AUTO_UPDATE_CHECK_DELAY_MS);
  setInterval(() => {
    void checkForUpdatesSafely();
  }, AUTO_UPDATE_CHECK_INTERVAL_MS);
};

ipcMain.handle("updater:get-status", () => updaterStatus);
ipcMain.handle("updater:check", async () => {
  return checkForUpdatesSafely();
});
ipcMain.handle("updater:download", async () => {
  return downloadUpdateSafely();
});
ipcMain.handle("updater:install", () => {
  writeUpdateHistory({
    lastVersion: app.getVersion(),
    pendingInstallAt: new Date().toISOString(),
    pendingInstallVersion: updaterStatus.version,
  });
  autoUpdater.quitAndInstall(true, true);
});

const createWindow = async () => {
  if (app.isPackaged) {
    await startProductionServer();
  }

  const appUrl = getAppUrl();
  const iconPath = getCachedDesktopIcon();
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#070809",
    title: "Caja Heladeria",
    autoHideMenuBar: true,
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      backgroundThrottling: true,
      contextIsolation: true,
      devTools: !app.isPackaged,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
      sandbox: true,
      spellcheck: false,
    },
  });
  mainWindow = win;
  const currentUserAgent = win.webContents.getUserAgent();
  win.webContents.setUserAgent(
    `${currentUserAgent} ${DESKTOP_USER_AGENT_MARKER}/${app.getVersion()}`,
  );
  win.setMenuBarVisibility(false);
  win.removeMenu();

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (app.isPackaged) {
    await win.loadURL(appUrl);
  } else {
    await win.loadURL(appUrl);
    win.webContents.openDevTools({ mode: "detach" });
  }

  setupAutoUpdater();
};

if (gotSingleInstanceLock) {
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    refreshInstalledUpdateStatus();
    void createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void createWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

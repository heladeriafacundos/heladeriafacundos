/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cajaUpdater", {
  check: () => ipcRenderer.invoke("updater:check"),
  download: () => ipcRenderer.invoke("updater:download"),
  getStatus: () => ipcRenderer.invoke("updater:get-status"),
  install: () => ipcRenderer.invoke("updater:install"),
  onStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("updater:status", listener);

    return () => ipcRenderer.removeListener("updater:status", listener);
  },
});

contextBridge.exposeInMainWorld("cajaDesktop", {
  isElectron: true,
});

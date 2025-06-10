"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const child_process = require("child_process");
const util = require("util");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const execAsync = util.promisify(child_process.exec);
function scanDirectory(dir) {
  return new Promise((resolve, reject) => {
    const jarFiles = [];
    function scan(directory) {
      const files = fs__namespace.readdirSync(directory);
      for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs__namespace.statSync(fullPath);
        if (stat.isDirectory()) {
          if (path.basename(fullPath) === "target") {
            const targetFiles = fs__namespace.readdirSync(fullPath);
            for (const targetFile of targetFiles) {
              if (targetFile.endsWith(".jar")) {
                jarFiles.push(path.join(fullPath, targetFile));
              }
            }
          } else {
            scan(fullPath);
          }
        }
      }
    }
    try {
      scan(dir);
      resolve(jarFiles);
    } catch (error) {
      reject(error);
    }
  });
}
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  electron.ipcMain.handle("select-directory", async () => {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    return result.filePaths[0];
  });
  electron.ipcMain.handle("scan-jar-files", async (_, dirPath) => {
    try {
      const jarPaths = await scanDirectory(dirPath);
      return jarPaths.map((filePath) => ({
        name: path.basename(filePath),
        path: path.dirname(filePath) + path.sep,
        createTime: fs__namespace.statSync(filePath).birthtime.getTime()
      }));
    } catch (error) {
      console.error("Error scanning JAR files:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("copy-files", async (_, files) => {
    try {
      const filePaths = files.map((file) => path.join(file.path, file.name));
      if (process.platform === "win32") {
        const psScript = `
          Add-Type -AssemblyName System.Windows.Forms
          $paths = @(
            ${filePaths.map((p) => `'${p.replace(/'/g, "''")}'`).join(",\n            ")}
          )
          $fileCollection = New-Object System.Collections.Specialized.StringCollection
          foreach ($path in $paths) {
            $fileCollection.Add($path)
          }
          [System.Windows.Forms.Clipboard]::SetFileDropList($fileCollection)
        `;
        const tempScriptPath = path.join(electron.app.getPath("temp"), "copy-files.ps1");
        fs__namespace.writeFileSync(tempScriptPath, psScript);
        await execAsync(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`);
        fs__namespace.unlinkSync(tempScriptPath);
      } else {
        electron.clipboard.writeText(filePaths.join("\n"));
      }
      return true;
    } catch (error) {
      console.error("Error copying files:", error);
      throw error;
    }
  });
}
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});

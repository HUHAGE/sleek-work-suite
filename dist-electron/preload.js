"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    invoke: (channel, ...args) => {
      const validChannels = [
        "select-directory",
        "scan-jar-files",
        "copy-files",
        "set-window-title",
        "scan-job-classes",
        "open-file",
        "add-annotation"
      ];
      if (validChannels.includes(channel)) {
        return electron.ipcRenderer.invoke(channel, ...args);
      }
      throw new Error(`不允许调用未注册的IPC通道: ${channel}`);
    }
  }
});

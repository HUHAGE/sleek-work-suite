import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 定义所有允许的IPC通道
const validChannels = [
  'scan-jar-files',
  'copy-to-clipboard',
  'open-path',
  'select-directory',
  'scan-sensitive-logs'
] as const

type ValidChannel = typeof validChannels[number]

// Custom APIs for renderer
const api = {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      if (validChannels.includes(channel as ValidChannel)) {
        return ipcRenderer.invoke(channel, ...args)
      }

      throw new Error(`不允许调用未注册的IPC通道: ${channel}`)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', api)
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = api
  // @ts-ignore (define in dts)
  window.electronAPI = electronAPI
} 
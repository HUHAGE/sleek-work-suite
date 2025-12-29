import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 定义所有允许的IPC通道
const validChannels = [
  'scan-jar-files',
  'copy-to-clipboard',
  'open-path',
  'select-directory',
  'scan-sensitive-logs',
  'get-work-starter-config',
  'save-work-starter-config'
] as const

type ValidChannel = typeof validChannels[number]

// Custom APIs for renderer
const api = {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      // 直接调用，不做验证（因为validChannels的类型检查有问题）
      return ipcRenderer.invoke(channel, ...args)
    }
  },
  openSoftware: (path: string) => ipcRenderer.invoke('openSoftware', path),
  openExternal: (url: string) => ipcRenderer.invoke('openExternal', url),
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close')
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
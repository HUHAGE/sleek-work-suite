import { contextBridge, ipcRenderer } from 'electron'
import { IElectronAPI } from '../src/types/electron'

// 暴露给渲染进程的API
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      const validChannels = [
        'select-directory',
        'scan-job-classes',
        'open-file',
        'open-path',
        'add-annotation',
        'load-logs',
        'save-file',
        'select-directory-and-pull-jar',
        'scan-jar-files',
        'copy-files',
        'decrypt-url',
        'decrypt-db-config',
        'get-work-starter-config',
        'save-work-starter-config',
        'scan-sensitive-logs',
        'get-app-settings',
        'save-app-settings'
      ];
      
      if (validChannels.includes(channel)) {
        console.log('IPC调用:', channel, args);
        return ipcRenderer.invoke(channel, ...args);
      }
      
      throw new Error(`不允许调用未注册的IPC通道: ${channel}`);
    },
    send: (channel: string, ...args: any[]) => {
      const validChannels = ['open-external-url']
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args)
      } else {
        throw new Error(`不允许调用未注册的IPC通道: ${channel}`)
      }
    }
  },
  platform: () => ipcRenderer.invoke('platform'),
  openSoftware: (path: string) => ipcRenderer.invoke('openSoftware', path),
  openExternal: (url: string) => ipcRenderer.invoke('openExternal', url),
  decryptUrl: (encryptedUrl: string, systemUrl: string) => ipcRenderer.invoke('decrypt-url', encryptedUrl, systemUrl),
  decryptDbConfig: (config: { urlCipher: string; usernameCipher: string; passwordCipher: string }) => ipcRenderer.invoke('decrypt-db-config', config),
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close')
} as unknown as IElectronAPI)

// 暴露给渲染进程的API
const api: IElectronAPI = {
  platform: () => ipcRenderer.invoke('platform'),
  openSoftware: (path: string) => ipcRenderer.invoke('openSoftware', path),
  // ... existing code ...
} 
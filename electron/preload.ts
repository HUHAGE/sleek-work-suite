import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的API
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      const validChannels = [
        'select-directory',
        'scan-jar-files',
        'copy-files',
        'set-window-title',
        'scan-job-classes',
        'open-file',
        'add-annotation',
        'open-path'
      ]
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args)
      }
      throw new Error(`不允许调用未注册的IPC通道: ${channel}`)
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
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close'),
}) 
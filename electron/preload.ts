import { contextBridge, ipcRenderer } from 'electron'

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
        'select-directory-and-pull-jar'
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
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close'),
}) 
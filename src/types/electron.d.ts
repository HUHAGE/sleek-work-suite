interface IElectronAPI {
  ipcRenderer: {
    invoke(channel: 'select-directory'): Promise<string>
    invoke(channel: 'scan-jar-files', path: string): Promise<Array<{
      name: string
      path: string
      createTime: number
    }>>
    invoke(channel: 'copy-to-clipboard', paths: string[]): Promise<void>
    invoke(channel: 'set-window-title', title: string): Promise<boolean>
  }
}

declare global {
  interface Window {
    electron: IElectronAPI
  }
} 
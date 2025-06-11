interface IElectronAPI {
  ipcRenderer: {
    invoke(channel: 'select-directory'): Promise<string>
    invoke(channel: 'scan-jar-files', path: string): Promise<Array<{
      name: string
      path: string
      createTime: number
    }>>
    invoke(channel: 'copy-to-clipboard', paths: string[]): Promise<void>
    invoke(channel: 'open-path', path: string): Promise<void>
    invoke(channel: 'scan-sensitive-logs', params: { 
      projectPath: string
      sensitiveWords: string[] 
    }): Promise<Array<{
      filePath: string
      line: number
      content: string
      sensitiveWord: string
    }>>
  }
}

declare interface Window {
  electron: IElectronAPI
} 
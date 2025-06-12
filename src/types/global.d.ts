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
      fileTypes: string[]
    }): Promise<Array<{
      filePath: string
      fileType: string
      line: number
      content: string
      sensitiveWord: string
    }>>
    invoke(channel: 'save-file', params: {
      defaultPath: string
      fileContent: string
    }): Promise<string | null>
  }
  openSoftware: (path: string) => Promise<void>
  openExternal: (url: string) => Promise<void>
}

declare interface Window {
  electron: IElectronAPI
} 
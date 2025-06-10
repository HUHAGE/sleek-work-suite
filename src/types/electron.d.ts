interface IElectronAPI {
  ipcRenderer: {
    invoke(channel: 'select-directory'): Promise<string>
    invoke(channel: 'scan-jar-files', path: string): Promise<{ name: string; path: string; createTime: number; }[]>
    invoke(channel: 'copy-files', files: { path: string, name: string }[]): Promise<boolean>
    invoke(channel: 'set-window-title', title: string): Promise<boolean>
    invoke(channel: 'scan-job-classes', path: string): Promise<{ className: string; classPath: string; hasAnnotation: boolean; }[]>
    invoke(channel: 'open-file', filePath: string): Promise<void>
    invoke(channel: 'add-annotation', filePath: string): Promise<boolean>
    invoke(channel: 'open-path', dirPath: string): Promise<boolean>
  }
}

declare global {
  interface Window {
    electron: IElectronAPI
  }
} 
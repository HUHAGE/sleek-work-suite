export interface ElectronAPI {
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
    send(channel: string, ...args: any[]): void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};

interface IpcRenderer {
  invoke(channel: 'scan-jar-files', path: string): Promise<{ name: string; path: string; createTime: number; }[]>;
  invoke(channel: 'copy-to-clipboard', paths: string[]): Promise<void>;
  invoke(channel: 'select-directory'): Promise<string>;
  invoke(channel: 'scan-sensitive-logs', params: { projectPath: string; sensitiveWords: string[] }): Promise<{
    filePath: string;
    line: number;
    content: string;
    sensitiveWord: string;
  }[]>;
  invoke(channel: 'open-path', path: string): Promise<void>;
} 
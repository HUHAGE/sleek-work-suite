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
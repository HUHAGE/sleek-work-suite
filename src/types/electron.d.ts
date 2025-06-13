import { LogEntry } from '../main/services/logManager'

export interface ElectronAPI {
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
    send(channel: string, ...args: any[]): void;
  };
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: 'select-directory'): Promise<string | null>;
        invoke(channel: 'scan-job-classes', path: string): Promise<JobClass[]>;
        invoke(channel: 'add-annotation', path: string): Promise<boolean>;
        invoke(channel: 'open-file', path: string): Promise<void>;
        invoke(channel: 'open-path', path: string): Promise<void>;
        invoke(channel: 'load-logs'): Promise<LogEntry[]>;
        invoke(channel: 'select-directory-and-pull-jar', params: {
          type: 'single' | 'batch';
          repoUrl: string;
          username: string;
          password: string;
          jar?: {
            groupId: string;
            artifactId: string;
            version: string;
          };
          dependencies?: string;
        }): Promise<{ success: boolean }>;
      };
      openSoftware: (path: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
    };
  }
}

export {};

interface IpcRenderer {
  invoke(channel: string, args: any): Promise<any>;
}

interface JobClass {
  className: string;
  classPath: string;
  hasAnnotation: boolean;
}

export interface IElectronAPI {
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
    send(channel: string, ...args: any[]): void;
  };
  platform: () => Promise<string>;
  openSoftware: (path: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
} 
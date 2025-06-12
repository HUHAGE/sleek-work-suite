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
      };
    };
  }
}

export {};

interface IpcRenderer {
  invoke(channel: 'scan-jar-files', path: string): Promise<{ name: string; path: string; createTime: number; }[]>;
  invoke(channel: 'copy-to-clipboard', paths: string[]): Promise<void>;
  invoke(channel: 'scan-sensitive-logs', params: { projectPath: string; sensitiveWords: string[] }): Promise<{
    filePath: string;
    line: number;
    content: string;
    sensitiveWord: string;
  }[]>;
}

interface JobClass {
  className: string;
  classPath: string;
  hasAnnotation: boolean;
} 
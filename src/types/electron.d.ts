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
        invoke(channel: string, ...args: any[]): Promise<any>;
      };
      openSoftware: (path: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      decryptUrl: (encryptedUrl: string, systemUrl: string) => Promise<{ success: boolean; decryptedUrl?: string; error?: string }>;
      decryptDbConfig: (config: { urlCipher: string; usernameCipher: string; passwordCipher: string }) => Promise<{ success: boolean; url?: string; username?: string; password?: string; error?: string }>;
      encryptDbConfig: (config: { urlPlain: string; usernamePlain: string; passwordPlain: string }) => Promise<{ success: boolean; urlCipher?: string; usernameCipher?: string; passwordCipher?: string; error?: string }>;
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
  decryptUrl: (encryptedUrl: string, systemUrl: string) => Promise<{ success: boolean; decryptedUrl?: string; error?: string }>;
  decryptDbConfig: (config: { urlCipher: string; usernameCipher: string; passwordCipher: string }) => Promise<{ success: boolean; url?: string; username?: string; password?: string; error?: string }>;
  encryptDbConfig: (config: { urlPlain: string; usernamePlain: string; passwordPlain: string }) => Promise<{ success: boolean; urlCipher?: string; usernameCipher?: string; passwordCipher?: string; error?: string }>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
} 
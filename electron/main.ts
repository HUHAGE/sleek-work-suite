import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import * as fs from 'fs';
import { clipboard } from 'electron';

function scanDirectory(dir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const jarFiles: string[] = [];
    
    function scan(directory: string) {
      const files = fs.readdirSync(directory);
      
      for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (path.basename(fullPath) === 'target') {
            // 如果是target目录，扫描其中的jar文件
            const targetFiles = fs.readdirSync(fullPath);
            for (const targetFile of targetFiles) {
              if (targetFile.endsWith('.jar')) {
                jarFiles.push(path.join(fullPath, targetFile));
              }
            }
          } else {
            // 递归扫描其他目录
            scan(fullPath);
          }
        }
      }
    }
    
    try {
      scan(dir);
      resolve(jarFiles);
    } catch (error) {
      reject(error);
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 在开发环境中加载本地服务器
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    // 在生产环境中加载打包后的文件
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 选择目录
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.filePaths[0];
  });

  // 扫描JAR文件
  ipcMain.handle('scan-jar-files', async (_, dirPath: string) => {
    try {
      const jarPaths = await scanDirectory(dirPath);
      return jarPaths.map(filePath => ({
        name: path.basename(filePath),
        path: path.dirname(filePath) + path.sep,
        createTime: fs.statSync(filePath).birthtime.getTime()
      }));
    } catch (error) {
      console.error('Error scanning JAR files:', error);
      throw error;
    }
  });

  // 复制到剪贴板
  ipcMain.handle('copy-to-clipboard', (_, paths: string[]) => {
    clipboard.writeText(paths.join('\n'));
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 
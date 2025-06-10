import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import * as fs from 'fs';
import { clipboard } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

// 复制文件到临时目录并返回临时文件路径
async function copyFileToTemp(sourcePath: string): Promise<string> {
  const tempDir = path.join(app.getPath('temp'), 'sleek-work-suite');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const fileName = path.basename(sourcePath);
  const tempPath = path.join(tempDir, fileName);
  
  await fs.promises.copyFile(sourcePath, tempPath);
  return tempPath;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'HUHA工作提效小助手',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    frame: true
  });

  win.setMenu(null);

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

  // 复制文件到剪贴板
  ipcMain.handle('copy-files', async (_, files: { path: string, name: string }[]) => {
    try {
      const filePaths = files.map(file => path.join(file.path, file.name));
      
      if (process.platform === 'win32') {
        // 构建 PowerShell 命令来复制文件到剪贴板
        const psScript = `
          Add-Type -AssemblyName System.Windows.Forms
          $paths = @(
            ${filePaths.map(p => `'${p.replace(/'/g, "''")}'`).join(",\n            ")}
          )
          $fileCollection = New-Object System.Collections.Specialized.StringCollection
          foreach ($path in $paths) {
            $fileCollection.Add($path)
          }
          [System.Windows.Forms.Clipboard]::SetFileDropList($fileCollection)
        `;
        
        // 将 PowerShell 脚本保存到临时文件
        const tempScriptPath = path.join(app.getPath('temp'), 'copy-files.ps1');
        fs.writeFileSync(tempScriptPath, psScript);
        
        // 执行 PowerShell 脚本
        await execAsync(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`);
        
        // 删除临时脚本文件
        fs.unlinkSync(tempScriptPath);
      } else {
        // 在其他平台上，我们至少可以复制文件路径
        clipboard.writeText(filePaths.join('\n'));
      }
      
      return true;
    } catch (error) {
      console.error('Error copying files:', error);
      throw error;
    }
  });

  // 添加设置窗口标题的处理程序
  ipcMain.handle('set-window-title', async (_, title: string) => {
    win.setTitle(title);
    return true;
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
import { app, BrowserWindow, ipcMain, dialog, clipboard, nativeTheme, shell, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import glob from 'glob';

const execAsync = promisify(exec);
const globPromise = promisify(glob);

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

// 扫描Java文件中的Job类
async function scanJobClasses(dirPath: string): Promise<any[]> {
  try {
    console.log('开始扫描目录:', dirPath);
    
    // 检查目录是否存在
    if (!fs.existsSync(dirPath)) {
      throw new Error('指定的目录不存在');
    }

    // 使用 glob 的 cwd 选项而不是 root，并确保使用正确的路径分隔符
    const pattern = '**/*.java';
    console.log('使用搜索模式:', pattern);
    console.log('在目录下搜索:', dirPath);

    const javaFiles = await globPromise(pattern, {
      ignore: ['**/target/**', '**/build/**', '**/bin/**', '**/test/**'],
      cwd: dirPath,
      dot: true,
      nodir: true
    });
    
    console.log('找到的Java文件:', javaFiles);
    console.log('找到的Java文件数量:', javaFiles.length);
    
    if (javaFiles.length === 0) {
      throw new Error('未找到任何Java文件，请检查目录是否正确');
    }

    const jobClasses = [];
    for (const relativePath of javaFiles) {
      try {
        const filePath = path.join(dirPath, relativePath);
        console.log('正在处理文件:', filePath);
        
        const content = await fs.promises.readFile(filePath, 'utf-8');
        
        // 使用更严格的正则表达式来匹配Job接口实现
        const implementsJobPattern = /implements\s+(?:org\.quartz\.)?Job\b/;
        const extendsWithJobPattern = /extends\s+\w+\s+implements\s+(?:org\.quartz\.)?Job\b/;
        
        if (implementsJobPattern.test(content) || extendsWithJobPattern.test(content)) {
          console.log('找到Job类:', filePath);
          const className = path.basename(filePath, '.java');
          const hasAnnotation = content.includes('@DisallowConcurrentExecution');
          
          jobClasses.push({
            className,
            classPath: filePath,
            hasAnnotation
          });
        }
      } catch (error) {
        console.error('读取文件失败:', relativePath, error);
      }
    }
    
    console.log('找到的Job类数量:', jobClasses.length);
    if (jobClasses.length === 0) {
      throw new Error('未找到任何Job类，请确认项目中是否包含实现了org.quartz.Job接口的类');
    }
    
    return jobClasses;
  } catch (error) {
    console.error('Error scanning Job classes:', error);
    throw error;
  }
}

// 添加@DisallowConcurrentExecution注解
async function addJobAnnotation(filePath: string): Promise<void> {
  try {
    let content = await fs.promises.readFile(filePath, 'utf-8');
    
    // 如果已经有注解，直接返回
    if (content.includes('@DisallowConcurrentExecution')) {
      return;
    }
    
    // 添加import语句（如果不存在）
    if (!content.includes('import org.quartz.DisallowConcurrentExecution;')) {
      const importStatement = 'import org.quartz.DisallowConcurrentExecution;\n';
      // 在package语句后或文件开头添加import
      if (content.includes('package ')) {
        content = content.replace(/package [^;]+;/, `$&\n${importStatement}`);
      } else {
        content = importStatement + content;
      }
    }
    
    // 在class声明前添加注解
    content = content.replace(
      /(public\s+class\s+[^{]+)/,
      '@DisallowConcurrentExecution\n$1'
    );
    
    await fs.promises.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    console.error('Error adding annotation:', error);
    throw error;
  }
}

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#ffffff',
  });

  // 开发环境：等待开发服务器启动后再加载页面
  if (isDev) {
    const loadURL = async () => {
      try {
        await mainWindow?.loadURL('http://localhost:8080');
        mainWindow?.webContents.openDevTools();
      } catch (error) {
        console.log('开发服务器未就绪，5秒后重试...');
        setTimeout(loadURL, 5000);
      }
    };
    loadURL();
  } else {
    // 生产环境：加载打包后的文件
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow?.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
    });
  }

  // 监听窗口控制事件
  ipcMain.on('minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow?.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('close', () => {
    mainWindow?.close();
  });

  // IPC处理函数类型定义
  interface IpcMainInvokeEvent extends Electron.IpcMainInvokeEvent {}

  // 处理打开外部URL的请求
  ipcMain.on('open-external-url', (_event, url) => {
    shell.openExternal(url);
  });

  // 选择目录
  ipcMain.handle('select-directory', async (_: IpcMainInvokeEvent) => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.filePaths[0];
  });

  // 打开路径
  ipcMain.handle('open-path', async (_: IpcMainInvokeEvent, dirPath: string) => {
    try {
      await shell.openPath(dirPath);
      return true;
    } catch (error) {
      console.error('Error opening path:', error);
      throw error;
    }
  });

  // 扫描JAR文件
  ipcMain.handle('scan-jar-files', async (_: IpcMainInvokeEvent, dirPath: string) => {
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
  ipcMain.handle('copy-files', async (_: IpcMainInvokeEvent, files: { path: string, name: string }[]) => {
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
        clipboard.writeText(filePaths.join('\n'));
      }
      
      return true;
    } catch (error) {
      console.error('Error copying files:', error);
      throw error;
    }
  });

  // 设置窗口标题
  ipcMain.handle('set-window-title', async (_: IpcMainInvokeEvent, title: string) => {
    mainWindow?.setTitle(title);
    return true;
  });

  // 扫描Job类
  ipcMain.handle('scan-job-classes', async (_: IpcMainInvokeEvent, dirPath: string) => {
    try {
      return await scanJobClasses(dirPath);
    } catch (error) {
      console.error('Error scanning Job classes:', error);
      throw error;
    }
  });

  // 打开文件
  ipcMain.handle('open-file', async (_: IpcMainInvokeEvent, filePath: string) => {
    try {
      if (process.platform === 'win32') {
        await execAsync(`code "${filePath}"`);
      } else {
        await execAsync(`open "${filePath}"`);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      throw error;
    }
  });

  // 添加注解
  ipcMain.handle('add-annotation', async (_, filePath: string) => {
    try {
      await addJobAnnotation(filePath);
      return true;
    } catch (error) {
      console.error('Error adding annotation:', error);
      throw error;
    }
  });

  // 扫描敏感日志
  ipcMain.handle('scan-sensitive-logs', async (_: IpcMainInvokeEvent, { projectPath, sensitiveWords }) => {
    try {
      // 递归获取所有 Java 文件
      const javaFiles: string[] = [];
      
      async function scanJavaFiles(dir: string) {
        const files = await fs.promises.readdir(dir);
        
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stats = await fs.promises.stat(fullPath);
          
          // 忽略 node_modules、.git 等目录
          if (file === 'node_modules' || file === '.git' || file === 'target' || file === 'build') {
            continue;
          }
          
          if (stats.isDirectory()) {
            await scanJavaFiles(fullPath);
          } else if (file.endsWith('.java')) {
            javaFiles.push(fullPath);
          }
        }
      }
      
      await scanJavaFiles(projectPath);
      
      // 扫描每个 Java 文件中的敏感日志
      const results = [];
      
      for (const file of javaFiles) {
        const content = await fs.promises.readFile(file, 'utf-8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // 只检查包含日志相关方法调用的行
          if (line.match(/\b(log|logger|LOG|LOGGER)\b.*\.(info|debug|warn|error|trace)\b/i)) {
            for (const word of sensitiveWords) {
              if (line.includes(word)) {
                results.push({
                  filePath: file,
                  line: i + 1,
                  content: line.trim(),
                  sensitiveWord: word
                });
                break; // 一行只记录一次，即使可能包含多个敏感词
              }
            }
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('扫描敏感日志失败:', error);
      throw error;
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 
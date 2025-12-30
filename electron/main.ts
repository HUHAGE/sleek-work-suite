import { app, BrowserWindow, ipcMain, dialog, clipboard, nativeTheme, shell, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import glob from 'glob';
import { SUPPORTED_FILE_EXTENSIONS, FileType } from '../src/types/file-types';
import axios from 'axios';

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
    console.log('开始添加注解:', filePath);
    let content = await fs.promises.readFile(filePath, 'utf-8');
    
    // 如果已经有注解，直接返回
    if (content.includes('@DisallowConcurrentExecution')) {
      console.log('文件已有注解，跳过');
      return;
    }
    
    // 添加import语句（如果不存在）
    if (!content.includes('import org.quartz.DisallowConcurrentExecution;')) {
      console.log('添加import语句');
      const importStatement = 'import org.quartz.DisallowConcurrentExecution;\n';
      // 在package语句后或文件开头添加import
      if (content.includes('package ')) {
        content = content.replace(/package [^;]+;/, `$&\n${importStatement}`);
      } else {
        content = importStatement + content;
      }
    }
    
    // 在class声明前添加注解
    console.log('添加注解到类定义前');
    content = content.replace(
      /(public\s+class\s+[^{]+)/,
      '@DisallowConcurrentExecution\n$1'
    );
    
    await fs.promises.writeFile(filePath, content, 'utf-8');
    console.log('文件已更新，准备记录日志');
    
    // 记录日志
    await logManager.addLog(filePath, '添加@DisallowConcurrentExecution注解');
    console.log('注解添加完成');
  } catch (error) {
    console.error('添加注解失败:', error);
    throw error;
  }
}

// 工作启动器配置管理器
class WorkStarterConfigManager {
  private configFilePath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configFilePath = path.join(userDataPath, 'work_starter_config.json');
    console.log('工作启动器配置文件路径:', this.configFilePath);
    this.initConfigFile();
  }

  private initConfigFile() {
    try {
      if (!fs.existsSync(this.configFilePath)) {
        console.log('创建新的工作启动器配置文件');
        fs.writeFileSync(this.configFilePath, JSON.stringify({ workItems: [] }, null, 2));
      } else {
        console.log('工作启动器配置文件已存在');
        // 验证文件内容是否是有效的JSON
        const content = fs.readFileSync(this.configFilePath, 'utf-8');
        try {
          JSON.parse(content);
        } catch (e) {
          console.log('配置文件内容无效，重新初始化');
          fs.writeFileSync(this.configFilePath, JSON.stringify({ workItems: [] }, null, 2));
        }
      }
    } catch (error) {
      console.error('初始化工作启动器配置文件失败:', error);
    }
  }

  async getConfig() {
    try {
      console.log('读取工作启动器配置');
      const data = await fs.promises.readFile(this.configFilePath, 'utf-8');
      const config = JSON.parse(data);
      console.log('当前配置项数量:', config.workItems?.length || 0);
      return config;
    } catch (error) {
      console.error('读取配置失败:', error);
      return { workItems: [] };
    }
  }

  async saveConfig(config: any) {
    try {
      console.log('保存工作启动器配置');
      await fs.promises.writeFile(this.configFilePath, JSON.stringify(config, null, 2));
      console.log('配置保存成功');
      return true;
    } catch (error) {
      console.error('保存配置失败:', error);
      throw error;
    }
  }
}

const workStarterConfigManager = new WorkStarterConfigManager();

// 应用设置管理器
class AppSettingsManager {
  private configFilePath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configFilePath = path.join(userDataPath, 'app_settings.json');
    console.log('应用设置文件路径:', this.configFilePath);
    this.initConfigFile();
  }

  private initConfigFile() {
    try {
      if (!fs.existsSync(this.configFilePath)) {
        console.log('创建新的应用设置文件');
        const defaultSettings = {
          sidebarOpen: true,
          theme: 'dark',
          themeColor: 'green'
        };
        fs.writeFileSync(this.configFilePath, JSON.stringify(defaultSettings, null, 2));
      } else {
        console.log('应用设置文件已存在');
        // 验证文件内容是否是有效的JSON
        const content = fs.readFileSync(this.configFilePath, 'utf-8');
        try {
          JSON.parse(content);
        } catch (e) {
          console.log('设置文件内容无效，重新初始化');
          const defaultSettings = {
            sidebarOpen: true,
            theme: 'dark',
            themeColor: 'green'
          };
          fs.writeFileSync(this.configFilePath, JSON.stringify(defaultSettings, null, 2));
        }
      }
    } catch (error) {
      console.error('初始化应用设置文件失败:', error);
    }
  }

  async getSettings() {
    try {
      console.log('读取应用设置');
      const data = await fs.promises.readFile(this.configFilePath, 'utf-8');
      const settings = JSON.parse(data);
      console.log('当前设置:', settings);
      return settings;
    } catch (error) {
      console.error('读取设置失败:', error);
      return {
        sidebarOpen: true,
        theme: 'dark',
        themeColor: 'green'
      };
    }
  }

  async saveSettings(settings: any) {
    try {
      console.log('保存应用设置');
      await fs.promises.writeFile(this.configFilePath, JSON.stringify(settings, null, 2));
      console.log('设置保存成功');
      return true;
    } catch (error) {
      console.error('保存设置失败:', error);
      throw error;
    }
  }
}

const appSettingsManager = new AppSettingsManager();

// JAR工具配置管理器
class JarToolsConfigManager {
  private configFilePath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configFilePath = path.join(userDataPath, 'jar_tools_config.json');
    console.log('JAR工具配置文件路径:', this.configFilePath);
    this.initConfigFile();
  }

  private initConfigFile() {
    try {
      if (!fs.existsSync(this.configFilePath)) {
        console.log('创建新的JAR工具配置文件');
        fs.writeFileSync(this.configFilePath, JSON.stringify({ pathHistory: [] }, null, 2));
      } else {
        console.log('JAR工具配置文件已存在');
        // 验证文件内容是否是有效的JSON
        const content = fs.readFileSync(this.configFilePath, 'utf-8');
        try {
          JSON.parse(content);
        } catch (e) {
          console.log('配置文件内容无效，重新初始化');
          fs.writeFileSync(this.configFilePath, JSON.stringify({ pathHistory: [] }, null, 2));
        }
      }
    } catch (error) {
      console.error('初始化JAR工具配置文件失败:', error);
    }
  }

  async getConfig() {
    try {
      console.log('读取JAR工具配置');
      const data = await fs.promises.readFile(this.configFilePath, 'utf-8');
      const config = JSON.parse(data);
      console.log('当前路径历史数量:', config.pathHistory?.length || 0);
      return config;
    } catch (error) {
      console.error('读取配置失败:', error);
      return { pathHistory: [] };
    }
  }

  async saveConfig(config: any) {
    try {
      console.log('保存JAR工具配置');
      await fs.promises.writeFile(this.configFilePath, JSON.stringify(config, null, 2));
      console.log('配置保存成功');
      return true;
    } catch (error) {
      console.error('保存配置失败:', error);
      throw error;
    }
  }
}

const jarToolsConfigManager = new JarToolsConfigManager();

// 加解密窗口管理器
class CryptoWindowManager {
  private cryptoWindow: BrowserWindow | null = null;
  private isReady: boolean = false;
  private initPromise: Promise<void> | null = null;

  async ensureWindow(): Promise<BrowserWindow> {
    if (this.cryptoWindow && !this.cryptoWindow.isDestroyed() && this.isReady) {
      return this.cryptoWindow;
    }

    // 如果正在初始化，等待初始化完成
    if (this.initPromise) {
      await this.initPromise;
      return this.cryptoWindow!;
    }

    // 开始初始化
    this.initPromise = this.initWindow();
    await this.initPromise;
    this.initPromise = null;
    return this.cryptoWindow!;
  }

  private async initWindow(): Promise<void> {
    try {
      console.log('初始化加解密窗口...');
      this.isReady = false;

      // 创建隐藏窗口
      this.cryptoWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false,
        }
      });

      // 加载页面
      const systemUrl = 'http://172.29.3.91:8080/epoint-common-web/webencrypt';
      await this.cryptoWindow.loadURL(systemUrl);

      // 等待页面加载完成 - 减少到1.5秒
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 初始化页面设置
      await this.cryptoWindow.webContents.executeJavaScript(`
        (function() {
          try {
            // 切换到通用加解密tab
            const tabs = mini.get('tabs1');
            if (tabs) {
              tabs.activeIndex = 1;
            }
            
            // 预设参数
            mini.get('encryptType').setValue('2'); // SM4_1
            mini.get('isaddprefix').setValue(true);
            mini.get('model').setValue(true);
            
            return true;
          } catch (error) {
            console.error('初始化失败:', error);
            return false;
          }
        })()
      `);

      this.isReady = true;
      console.log('加解密窗口初始化完成');
    } catch (error) {
      console.error('初始化加解密窗口失败:', error);
      if (this.cryptoWindow && !this.cryptoWindow.isDestroyed()) {
        this.cryptoWindow.close();
      }
      this.cryptoWindow = null;
      this.isReady = false;
      throw error;
    }
  }

  async decrypt(ciphertext: string): Promise<string> {
    const window = await this.ensureWindow();
    
    const result = await window.webContents.executeJavaScript(`
      (function() {
        try {
          mini.get('ciphertext').setValue('${ciphertext.replace(/'/g, "\\'")}');
          decrypt();
          
          // 减少等待时间到300ms
          return new Promise((resolve) => {
            setTimeout(() => {
              const plaintext = mini.get('plaintext').getValue();
              resolve(plaintext);
            }, 300);
          });
        } catch (error) {
          return 'ERROR: ' + error.message;
        }
      })()
    `);

    if (typeof result === 'string' && result.startsWith('ERROR:')) {
      throw new Error(result.substring(7));
    }

    return result;
  }

  async encrypt(plaintext: string): Promise<string> {
    const window = await this.ensureWindow();
    
    const result = await window.webContents.executeJavaScript(`
      (function() {
        try {
          mini.get('plaintext').setValue('${plaintext.replace(/'/g, "\\'")}');
          encrypt();
          
          // 减少等待时间到300ms
          return new Promise((resolve) => {
            setTimeout(() => {
              const ciphertext = mini.get('ciphertext').getValue();
              const cipher = ciphertext.replace(/^\{SM4_1::\}/, '');
              resolve(cipher);
            }, 300);
          });
        } catch (error) {
          return 'ERROR: ' + error.message;
        }
      })()
    `);

    if (typeof result === 'string' && result.startsWith('ERROR:')) {
      throw new Error(result.substring(7));
    }

    return result;
  }

  destroy() {
    if (this.cryptoWindow && !this.cryptoWindow.isDestroyed()) {
      this.cryptoWindow.close();
    }
    this.cryptoWindow = null;
    this.isReady = false;
  }
}

const cryptoWindowManager = new CryptoWindowManager();

// URL解密窗口管理器
class UrlDecryptWindowManager {
  private windows: Map<string, { window: BrowserWindow; isReady: boolean }> = new Map();
  private initPromises: Map<string, Promise<void>> = new Map();

  async ensureWindow(systemUrl: string): Promise<BrowserWindow> {
    const cached = this.windows.get(systemUrl);
    
    if (cached && !cached.window.isDestroyed() && cached.isReady) {
      return cached.window;
    }

    // 如果正在初始化，等待初始化完成
    const existingPromise = this.initPromises.get(systemUrl);
    if (existingPromise) {
      await existingPromise;
      return this.windows.get(systemUrl)!.window;
    }

    // 开始初始化
    const initPromise = this.initWindow(systemUrl);
    this.initPromises.set(systemUrl, initPromise);
    
    try {
      await initPromise;
    } finally {
      this.initPromises.delete(systemUrl);
    }
    
    return this.windows.get(systemUrl)!.window;
  }

  private async initWindow(systemUrl: string): Promise<void> {
    try {
      console.log(`初始化URL解密窗口: ${systemUrl}`);
      
      // 创建隐藏窗口
      const window = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false,
        }
      });

      // 加载系统地址
      await window.loadURL(systemUrl);

      // 等待页面加载完成 - 减少到1秒
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 验证Util.decryptUrlParams方法是否存在
      const hasMethod = await window.webContents.executeJavaScript(`
        typeof Util !== 'undefined' && typeof Util.decryptUrlParams === 'function'
      `);

      if (!hasMethod) {
        window.close();
        throw new Error('系统中未找到 Util.decryptUrlParams 方法');
      }

      this.windows.set(systemUrl, { window, isReady: true });
      console.log(`URL解密窗口初始化完成: ${systemUrl}`);
    } catch (error) {
      console.error(`初始化URL解密窗口失败: ${systemUrl}`, error);
      const cached = this.windows.get(systemUrl);
      if (cached && !cached.window.isDestroyed()) {
        cached.window.close();
      }
      this.windows.delete(systemUrl);
      throw error;
    }
  }

  async decrypt(encryptedUrl: string, systemUrl: string): Promise<{ success: boolean; decryptedUrl?: string; error?: string }> {
    try {
      const window = await this.ensureWindow(systemUrl);
      
      const result = await window.webContents.executeJavaScript(`
        (function() {
          try {
            if (typeof Util !== 'undefined' && typeof Util.decryptUrlParams === 'function') {
              return { success: true, decryptedUrl: Util.decryptUrlParams('${encryptedUrl.replace(/'/g, "\\'")}') };
            } else {
              return { success: false, error: '系统中未找到 Util.decryptUrlParams 方法' };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        })()
      `);

      return result;
    } catch (error) {
      console.error('URL解密失败:', error);
      return { success: false, error: error.message || '解密过程中发生错误' };
    }
  }

  destroy(systemUrl?: string) {
    if (systemUrl) {
      const cached = this.windows.get(systemUrl);
      if (cached && !cached.window.isDestroyed()) {
        cached.window.close();
      }
      this.windows.delete(systemUrl);
    } else {
      // 销毁所有窗口
      for (const [url, cached] of this.windows.entries()) {
        if (!cached.window.isDestroyed()) {
          cached.window.close();
        }
      }
      this.windows.clear();
    }
  }
}

const urlDecryptWindowManager = new UrlDecryptWindowManager();

// 在createWindow函数之前添加日志管理器
class LogManager {
  private logFilePath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.logFilePath = path.join(userDataPath, 'job_annotation_logs.json');
    console.log('日志文件路径:', this.logFilePath);
    this.initLogFile();
  }

  private initLogFile() {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        console.log('创建新的日志文件');
        fs.writeFileSync(this.logFilePath, JSON.stringify([], null, 2));
      } else {
        console.log('日志文件已存在');
        // 验证文件内容是否是有效的JSON
        const content = fs.readFileSync(this.logFilePath, 'utf-8');
        try {
          JSON.parse(content);
        } catch (e) {
          console.log('日志文件内容无效，重新初始化');
          fs.writeFileSync(this.logFilePath, JSON.stringify([], null, 2));
        }
      }
    } catch (error) {
      console.error('初始化日志文件失败:', error);
    }
  }

  async addLog(filePath: string, action: string) {
    try {
      console.log('添加新日志:', { filePath, action });
      const logs = await this.getLogs();
      
      // 获取文件名
      const fileName = path.basename(filePath);
      
      const newLog = {
        timestamp: new Date().toISOString(),
        filePath,
        fileName,
        action: `${action}：${fileName}`
      };
      
      // 限制日志数量，保留最新的1000条
      const MAX_LOGS = 1000;
      logs.unshift(newLog);
      if (logs.length > MAX_LOGS) {
        logs.length = MAX_LOGS;
      }
      
      await fs.promises.writeFile(this.logFilePath, JSON.stringify(logs, null, 2));
      console.log('日志添加成功');
      return newLog;
    } catch (error) {
      console.error('添加日志失败:', error);
      throw error;
    }
  }

  async getLogs() {
    try {
      console.log('读取日志文件');
      const data = await fs.promises.readFile(this.logFilePath, 'utf-8');
      const logs = JSON.parse(data);
      console.log('当前日志数量:', logs.length);
      return logs;
    } catch (error) {
      console.error('读取日志失败:', error);
      return [];
    }
  }
}

const logManager = new LogManager();

// 注册IPC处理器
function registerIpcHandlers() {
  // 加载日志
  ipcMain.handle('load-logs', async () => {
    console.log('收到加载日志请求');
    const logs = await logManager.getLogs();
    console.log('返回日志数据:', logs);
    return logs;
  });

  // 添加注解
  ipcMain.handle('add-annotation', async (_, filePath: string) => {
    console.log('收到添加注解请求:', filePath);
    await addJobAnnotation(filePath);
    return true;
  });

  // 处理jar包下载
  ipcMain.handle('select-directory-and-pull-jar', async (event, { type, repoUrl, username, password, jar, dependencies }) => {
    try {
      // 验证仓库地址格式
      if (!repoUrl.startsWith('http://') && !repoUrl.startsWith('https://')) {
        throw new Error('仓库地址格式不正确，必须以 http:// 或 https:// 开头');
      }

      // 选择保存目录
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: '选择保存位置',
        buttonLabel: '选择文件夹'
      });

      if (result.canceled || result.filePaths.length === 0) {
        throw new Error('未选择保存位置');
      }

      const targetDir = result.filePaths[0];

      if (type === 'single') {
        // 单个jar包下载
        const { groupId, artifactId, version } = jar;
        if (!groupId || !artifactId || !version) {
          throw new Error('GroupId、ArtifactId和Version都不能为空');
        }
        await downloadJar(repoUrl, groupId, artifactId, version, targetDir, username, password);
      } else {
        // 批量下载
        const dependencyMatches = dependencies.match(/<dependency>[\s\S]*?<\/dependency>/g);
        if (!dependencyMatches) {
          throw new Error('未找到有效的Maven依赖配置');
        }

        let successCount = 0;
        let failureCount = 0;
        const errors = [];

        for (const depXml of dependencyMatches) {
          const depInfo = parseMavenDependency(depXml);
          if (depInfo) {
            try {
              await downloadJar(repoUrl, depInfo.groupId, depInfo.artifactId, depInfo.version, targetDir, username, password);
              successCount++;
            } catch (error) {
              failureCount++;
              errors.push(`${depInfo.artifactId}: ${error.message}`);
            }
          }
        }

        if (failureCount > 0) {
          throw new Error(`批量下载完成，成功 ${successCount} 个，失败 ${failureCount} 个。\n失败详情：\n${errors.join('\n')}`);
        }
      }

      return { success: true };
    } catch (error) {
      throw new Error(error.message);
    }
  });

  // 处理打开软件的请求
  ipcMain.handle('openSoftware', async (_, path: string) => {
    try {
      if (process.platform === 'win32') {
        await execAsync(`start "" "${path}"`)
      } else if (process.platform === 'darwin') {
        await execAsync(`open "${path}"`)
      } else {
        await execAsync(`xdg-open "${path}"`)
      }
      return 'success'
    } catch (error) {
      console.error('打开软件失败:', error)
      throw error
    }
  })

  // 工作启动器配置相关
  ipcMain.handle('get-work-starter-config', async () => {
    console.log('收到获取工作启动器配置请求');
    return await workStarterConfigManager.getConfig();
  })

  ipcMain.handle('save-work-starter-config', async (_, config) => {
    console.log('收到保存工作启动器配置请求');
    return await workStarterConfigManager.saveConfig(config);
  })

  // 应用设置相关
  ipcMain.handle('get-app-settings', async () => {
    console.log('收到获取应用设置请求');
    return await appSettingsManager.getSettings();
  })

  ipcMain.handle('save-app-settings', async (_, settings) => {
    console.log('收到保存应用设置请求');
    return await appSettingsManager.saveSettings(settings);
  })

  // JAR工具配置相关
  ipcMain.handle('get-jar-tools-config', async () => {
    console.log('收到获取JAR工具配置请求');
    return await jarToolsConfigManager.getConfig();
  })

  ipcMain.handle('save-jar-tools-config', async (_, config) => {
    console.log('收到保存JAR工具配置请求');
    return await jarToolsConfigManager.saveConfig(config);
  })

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
        createTime: fs.statSync(filePath).mtime.getTime()
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

  // 保存文件
  ipcMain.handle('save-file', async (_: IpcMainInvokeEvent, { defaultPath, fileContent }) => {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog({
        defaultPath,
        filters: [
          { name: 'CSV 文件', extensions: ['csv'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });

      if (!canceled && filePath) {
        await fs.promises.writeFile(filePath, fileContent, 'utf-8');
        return filePath;
      }
      return null;
    } catch (error) {
      console.error('保存文件失败:', error);
      throw error;
    }
  });

  // 支持的文件类型
  const SUPPORTED_FILE_EXTENSIONS = {
    '.java': 'Java',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript React',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript React',
    '.html': 'HTML',
    '.htm': 'HTML',
    '.vue': 'Vue',
    '.jsp': 'JSP',
    '.php': 'PHP',
    '.py': 'Python',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.cs': 'C#',
    '.cpp': 'C++',
    '.c': 'C',
    '.log': 'Log',
    '.xml': 'XML',
    '.properties': 'Properties',
    '.yml': 'YAML',
    '.yaml': 'YAML',
    '.json': 'JSON',
    '.md': 'Markdown',
    '.sql': 'SQL'
  } as const;

  type FileType = typeof SUPPORTED_FILE_EXTENSIONS[keyof typeof SUPPORTED_FILE_EXTENSIONS];

  // 检查一行代码是否包含日志语句
  function isLogStatement(line: string, fileType: FileType): boolean {
    const logPatterns = {
      // Java相关的日志模式
      java: [
        /\b(?:log|logger|LOG|LOGGER)\b.*\.(?:info|debug|warn|error|trace|fatal)\s*\(/i,
        /\bSystem\.(?:out|err)\.print(?:ln)?\s*\(/i,
        /\.printStackTrace\s*\(/i,
        /\b(?:log4j|Log4j)\b.*\.(?:info|debug|warn|error|trace|fatal)\s*\(/i,
        /\b(?:slf4j|Slf4j)\b.*\.(?:info|debug|warn|error|trace|fatal)\s*\(/i,
        /\b(?:logback|Logback)\b.*\.(?:info|debug|warn|error|trace|fatal)\s*\(/i,
        /\b(?:commons-logging|CommonsLogging)\b.*\.(?:info|debug|warn|error|trace|fatal)\s*\(/i,
        /\b(?:Logger|LOGGER)\.getLogger\s*\(/i,
        /\b(?:LogUtils?|LogHelper|LogManager)\b.*\.(?:log|write|record|print)\s*\(/i,
      ],
      // JavaScript/TypeScript相关的日志模式
      javascript: [
        /\bconsole\.[a-zA-Z]+\s*\(/i,
        /\b(?:log|logger|LOG|LOGGER)\b.*\.(?:info|debug|warn|error|trace|fatal)\s*\(/i,
        /\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/i,
        /\bdebugger\b/,
      ],
      // Python相关的日志模式
      python: [
        /\b(?:print|logging)\b.*\(/i,
        /\blogger\.[a-zA-Z]+\s*\(/i,
      ],
      // 通用的日志模式
      common: [
        /\.log\s*\(/i,
        /\.debug\s*\(/i,
        /\.info\s*\(/i,
        /\.warn\s*\(/i,
        /\.error\s*\(/i,
        /\.trace\s*\(/i,
        /\.fatal\s*\(/i,
        /\blog\b/i,
      ],
    };

    // 根据文件类型选择要检查的模式
    let patternsToCheck: RegExp[] = [...logPatterns.common];
    
    if (fileType === 'Java' || fileType === 'JSP') {
      patternsToCheck.push(...logPatterns.java);
    }
    
    if (fileType.includes('JavaScript') || fileType.includes('TypeScript') || fileType === 'Vue') {
      patternsToCheck.push(...logPatterns.javascript);
    }
    
    if (fileType === 'Python') {
      patternsToCheck.push(...logPatterns.python);
    }

    return patternsToCheck.some(pattern => pattern.test(line.trim()));
  }

  // 扫描敏感日志
  ipcMain.handle('scan-sensitive-logs', async (_: IpcMainInvokeEvent, { projectPath, sensitiveWords, fileTypes }) => {
    try {
      const results = [];
      const files: string[] = [];
      
      // 递归获取所有支持的文件
      async function scanFiles(dir: string) {
        const entries = await fs.promises.readdir(dir);
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stats = await fs.promises.stat(fullPath);
          
          // 忽略 node_modules、.git 等目录
          if (entry === 'node_modules' || entry === '.git' || entry === 'target' || entry === 'build' || entry === 'dist') {
            continue;
          }
          
          if (stats.isDirectory()) {
            await scanFiles(fullPath);
          } else {
            const ext = path.extname(fullPath).toLowerCase();
            if (fileTypes.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      }
      
      await scanFiles(projectPath);
      
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const fileType = SUPPORTED_FILE_EXTENSIONS[ext as keyof typeof SUPPORTED_FILE_EXTENSIONS];
        const content = await fs.promises.readFile(file, 'utf-8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (isLogStatement(line, fileType)) {
            for (const word of sensitiveWords) {
              if (line.includes(word)) {
                results.push({
                  filePath: file,
                  fileType,
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

  // 处理打开网页的请求
  ipcMain.handle('openExternal', async (_, url: string) => {
    try {
      await shell.openExternal(url)
      return 'success'
    } catch (error) {
      console.error('打开网页失败:', error)
      throw error
    }
  })

  // 处理URL解密请求 - 优化版本
  ipcMain.handle('decrypt-url', async (_, encryptedUrl: string, systemUrl: string) => {
    try {
      console.log('开始URL解密...');
      const startTime = Date.now();

      const result = await urlDecryptWindowManager.decrypt(encryptedUrl, systemUrl);

      const elapsed = Date.now() - startTime;
      console.log(`URL解密完成，耗时: ${elapsed}ms`);

      return result;
    } catch (error) {
      console.error('URL解密失败:', error);
      return { success: false, error: error.message || '解密过程中发生错误' };
    }
  })

  // 处理数据库配置解密请求 - 优化版本
  ipcMain.handle('decrypt-db-config', async (_, { urlCipher, usernameCipher, passwordCipher }) => {
    try {
      console.log('开始解密数据库配置...');
      const startTime = Date.now();

      // 串行解密三个字段（避免并行时互相覆盖输入框）
      const url = await cryptoWindowManager.decrypt(urlCipher);
      const username = await cryptoWindowManager.decrypt(usernameCipher);
      const password = await cryptoWindowManager.decrypt(passwordCipher);

      const elapsed = Date.now() - startTime;
      console.log(`解密完成，耗时: ${elapsed}ms`);

      return {
        success: true,
        url,
        username,
        password
      };
    } catch (error) {
      console.error('数据库配置解密失败:', error);
      return { success: false, error: error.message || '解密过程中发生错误' };
    }
  })

  // 处理数据库配置加密请求 - 优化版本
  ipcMain.handle('encrypt-db-config', async (_, { urlPlain, usernamePlain, passwordPlain }) => {
    try {
      console.log('开始加密数据库配置...');
      const startTime = Date.now();

      // 串行加密三个字段（避免并行时互相覆盖输入框）
      const urlCipher = await cryptoWindowManager.encrypt(urlPlain);
      const usernameCipher = await cryptoWindowManager.encrypt(usernamePlain);
      const passwordCipher = await cryptoWindowManager.encrypt(passwordPlain);

      const elapsed = Date.now() - startTime;
      console.log(`加密完成，耗时: ${elapsed}ms`);

      return {
        success: true,
        urlCipher,
        usernameCipher,
        passwordCipher
      };
    } catch (error) {
      console.error('数据库配置加密失败:', error);
      return { success: false, error: error.message || '加密过程中发生错误' };
    }
  })
}

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

function createWindow() {
  // 获取图标路径 - 开发环境和生产环境使用不同的路径
  const getIconPath = () => {
    if (isDev) {
      // 开发环境：从项目根目录的 build 文件夹
      return path.join(process.cwd(), 'build', 'icon.ico');
    } else {
      // 生产环境：从 resources 目录
      return path.join(process.resourcesPath, 'build', 'icon.ico');
    }
  };

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
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
        createTime: fs.statSync(filePath).mtime.getTime()
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

  // 保存文件
  ipcMain.handle('save-file', async (_: IpcMainInvokeEvent, { defaultPath, fileContent }) => {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog({
        defaultPath,
        filters: [
          { name: 'CSV 文件', extensions: ['csv'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });

      if (!canceled && filePath) {
        await fs.promises.writeFile(filePath, fileContent, 'utf-8');
        return filePath;
      }
      return null;
    } catch (error) {
      console.error('保存文件失败:', error);
      throw error;
    }
  });

  // 支持的文件类型
  const SUPPORTED_FILE_EXTENSIONS = {
    '.java': 'Java',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript React',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript React',
    '.html': 'HTML',
    '.htm': 'HTML',
    '.vue': 'Vue',
    '.jsp': 'JSP',
    '.php': 'PHP',
    '.py': 'Python',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.cs': 'C#',
    '.cpp': 'C++',
    '.c': 'C',
    '.log': 'Log',
    '.xml': 'XML',
    '.properties': 'Properties',
    '.yml': 'YAML',
    '.yaml': 'YAML',
    '.json': 'JSON',
    '.md': 'Markdown',
    '.sql': 'SQL'
  } as const;

  type FileType = typeof SUPPORTED_FILE_EXTENSIONS[keyof typeof SUPPORTED_FILE_EXTENSIONS];

  // 检查一行代码是否包含日志语句
  function isLogStatement(line: string, fileType: FileType): boolean {
    const logPatterns = {
      // Java相关的日志模式
      java: [
        /\b(?:log|logger|LOG|LOGGER)\b.*\.(?:info|debug|warn|error|trace|fatal)\s*\(/i,
        /\bSystem\.(?:out|err)\.print(?:ln)?\s*\(/i,
        /\.printStackTrace\s*\(/i,
        /\b(?:log4j|Log4j)\b.*\.(?:info|debug|warn|error|trace|fatal)\s*\(/i,
        /\b(?:slf4j|Slf4j)\b.*\.(?:info|debug|warn|error|trace|fatal)\s*\(/i,
        /\b(?:logback|Logback)\b.*\.(?:info|debug|warn|error|trace|fatal)\s*\(/i,
        /\b(?:commons-logging|CommonsLogging)\b.*\.(?:info|debug|warn|error|trace|fatal)\s*\(/i,
        /\b(?:Logger|LOGGER)\.getLogger\s*\(/i,
        /\b(?:LogUtils?|LogHelper|LogManager)\b.*\.(?:log|write|record|print)\s*\(/i,
      ],
      // JavaScript/TypeScript相关的日志模式
      javascript: [
        /\bconsole\.[a-zA-Z]+\s*\(/i,
        /\b(?:log|logger|LOG|LOGGER)\b.*\.(?:info|debug|warn|error|trace|fatal)\s*\(/i,
        /\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/i,
        /\bdebugger\b/,
      ],
      // Python相关的日志模式
      python: [
        /\b(?:print|logging)\b.*\(/i,
        /\blogger\.[a-zA-Z]+\s*\(/i,
      ],
      // 通用的日志模式
      common: [
        /\.log\s*\(/i,
        /\.debug\s*\(/i,
        /\.info\s*\(/i,
        /\.warn\s*\(/i,
        /\.error\s*\(/i,
        /\.trace\s*\(/i,
        /\.fatal\s*\(/i,
        /\blog\b/i,
      ],
    };

    // 根据文件类型选择要检查的模式
    let patternsToCheck: RegExp[] = [...logPatterns.common];
    
    if (fileType === 'Java' || fileType === 'JSP') {
      patternsToCheck.push(...logPatterns.java);
    }
    
    if (fileType.includes('JavaScript') || fileType.includes('TypeScript') || fileType === 'Vue') {
      patternsToCheck.push(...logPatterns.javascript);
    }
    
    if (fileType === 'Python') {
      patternsToCheck.push(...logPatterns.python);
    }

    return patternsToCheck.some(pattern => pattern.test(line.trim()));
  }

  // 扫描敏感日志
  ipcMain.handle('scan-sensitive-logs', async (_: IpcMainInvokeEvent, { projectPath, sensitiveWords, fileTypes }) => {
    try {
      const results = [];
      const files: string[] = [];
      
      // 递归获取所有支持的文件
      async function scanFiles(dir: string) {
        const entries = await fs.promises.readdir(dir);
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stats = await fs.promises.stat(fullPath);
          
          // 忽略 node_modules、.git 等目录
          if (entry === 'node_modules' || entry === '.git' || entry === 'target' || entry === 'build' || entry === 'dist') {
            continue;
          }
          
          if (stats.isDirectory()) {
            await scanFiles(fullPath);
          } else {
            const ext = path.extname(fullPath).toLowerCase();
            if (fileTypes.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      }
      
      await scanFiles(projectPath);
      
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const fileType = SUPPORTED_FILE_EXTENSIONS[ext as keyof typeof SUPPORTED_FILE_EXTENSIONS];
        const content = await fs.promises.readFile(file, 'utf-8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (isLogStatement(line, fileType)) {
            for (const word of sensitiveWords) {
              if (line.includes(word)) {
                results.push({
                  filePath: file,
                  fileType,
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

// 在app.whenReady()中注册IPC处理器
app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  cryptoWindowManager.destroy();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  cryptoWindowManager.destroy();
});

// 处理Maven依赖字符串，提取groupId、artifactId和version
function parseMavenDependency(xmlString: string): { groupId: string; artifactId: string; version: string } | null {
  const groupIdMatch = xmlString.match(/<groupId>([^<]+)<\/groupId>/);
  const artifactIdMatch = xmlString.match(/<artifactId>([^<]+)<\/artifactId>/);
  const versionMatch = xmlString.match(/<version>([^<]+)<\/version>/);

  if (groupIdMatch && artifactIdMatch && versionMatch) {
    return {
      groupId: groupIdMatch[1],
      artifactId: artifactIdMatch[1],
      version: versionMatch[1]
    };
  }
  return null;
}

// 从Maven仓库下载jar包
async function downloadJar(repoUrl: string, groupId: string, artifactId: string, version: string, targetDir: string, username: string, password: string): Promise<string> {
  const groupPath = groupId.replace(/\./g, '/');
  const jarName = `${artifactId}-${version}.jar`;
  const jarUrl = `${repoUrl}${groupPath}/${artifactId}/${version}/${jarName}`;

  try {
    const response = await axios({
      method: 'get',
      url: jarUrl,
      responseType: 'stream',
      auth: { username, password },
      timeout: 30000, // 30秒超时
      timeoutErrorMessage: '下载超时，请检查网络连接或仓库地址是否正确'
    });

    const targetPath = path.join(targetDir, jarName);
    const writer = fs.createWriteStream(targetPath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(targetPath));
      writer.on('error', reject);
    });
  } catch (error) {
    let errorMessage = '下载失败';
    if (error.code === 'ECONNABORTED') {
      errorMessage = '下载超时，请检查网络连接或仓库地址是否正确';
    } else if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = '认证失败，请检查用户名和密码是否正确';
          break;
        case 403:
          errorMessage = '没有权限访问该资源，请检查用户权限';
          break;
        case 404:
          errorMessage = '找不到指定的Jar包，请检查GroupId、ArtifactId和Version是否正确';
          break;
        case 500:
          errorMessage = '服务器错误，请稍后重试';
          break;
        default:
          errorMessage = `服务器返回错误: ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = '无法连接到服务器，请检查仓库地址是否正确';
    }
    throw new Error(errorMessage);
  }
} 
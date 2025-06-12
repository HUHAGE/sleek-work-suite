import { ipcMain, dialog, shell } from 'electron'
import fs from 'fs'
import path from 'path'
import { logManager } from '../services/logManager'

// 注册所有IPC处理器
export function registerIpcHandlers() {
  // 处理选择目录
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // 扫描Job类
  ipcMain.handle('scan-job-classes', async (_, projectPath: string) => {
    try {
      const jobClasses = [];
      const files = await findJavaFiles(projectPath);
      
      for (const file of files) {
        const content = await fs.promises.readFile(file, 'utf8');
        if (content.includes('implements Job') || content.includes('extends Job')) {
          jobClasses.push({
            className: path.basename(file, '.java'),
            classPath: file,
            hasAnnotation: content.includes('@DisallowConcurrentExecution')
          });
        }
      }
      
      return jobClasses;
    } catch (error) {
      console.error('扫描Job类失败:', error);
      throw error;
    }
  });

  // 添加注解
  ipcMain.handle('add-annotation', async (_, filePath: string) => {
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      if (!fileContent.includes('@DisallowConcurrentExecution')) {
        const lines = fileContent.split('\n');
        const classIndex = lines.findIndex(line => line.includes('class'));
        if (classIndex === -1) throw new Error('未找到类定义');
        
        lines.splice(classIndex, 0, '@DisallowConcurrentExecution');
        await fs.promises.writeFile(filePath, lines.join('\n'));
        
        // 添加日志记录
        await logManager.addLog(filePath, '添加@DisallowConcurrentExecution注解');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('添加注解失败:', error);
      throw error;
    }
  });

  // 打开文件
  ipcMain.handle('open-file', async (_, filePath: string) => {
    await shell.openPath(filePath);
  });

  // 打开路径
  ipcMain.handle('open-path', async (_, dirPath: string) => {
    await shell.openPath(dirPath);
  });

  // 加载日志
  ipcMain.handle('load-logs', async () => {
    return await logManager.getLogs();
  });
}

// 递归查找Java文件
async function findJavaFiles(dir: string): Promise<string[]> {
  const files = await fs.promises.readdir(dir);
  const javaFiles: string[] = [];
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.promises.stat(filePath);
    
    if (stat.isDirectory()) {
      javaFiles.push(...await findJavaFiles(filePath));
    } else if (file.endsWith('.java')) {
      javaFiles.push(filePath);
    }
  }
  
  return javaFiles;
} 
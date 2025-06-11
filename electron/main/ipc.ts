import { ipcMain, dialog } from 'electron';
import { scanSensitiveLogs } from './services/sensitiveLogScanner';

// 选择目录
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

// 扫描敏感日志
ipcMain.handle('scan-sensitive-logs', async (_, { projectPath, sensitiveWords }) => {
  try {
    const results = await scanSensitiveLogs(projectPath, sensitiveWords);
    return results;
  } catch (error) {
    console.error('扫描敏感日志时出错:', error);
    throw error;
  }
}); 
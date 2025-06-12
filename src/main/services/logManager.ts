import fs from 'fs'
import path from 'path'
import { app } from 'electron'

export interface LogEntry {
  timestamp: string;
  filePath: string;
  action: string;
}

class LogManager {
  private logFilePath: string;

  constructor() {
    // 在用户数据目录下创建日志文件
    const userDataPath = app.getPath('userData');
    this.logFilePath = path.join(userDataPath, 'job_annotation_logs.json');
    this.initLogFile();
  }

  private initLogFile() {
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, JSON.stringify([], null, 2));
    }
  }

  async addLog(filePath: string, action: string) {
    try {
      const logs = await this.getLogs();
      const newLog: LogEntry = {
        timestamp: new Date().toISOString(),
        filePath,
        action
      };
      logs.unshift(newLog); // 添加到开头
      await fs.promises.writeFile(this.logFilePath, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('添加日志失败:', error);
    }
  }

  async getLogs(): Promise<LogEntry[]> {
    try {
      const data = await fs.promises.readFile(this.logFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('读取日志失败:', error);
      return [];
    }
  }
}

// 导出单例实例
export const logManager = new LogManager(); 
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

interface ScanResult {
  filePath: string;
  line: number;
  content: string;
  sensitiveWord: string;
}

async function getAllJavaFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function traverse(currentDir: string) {
    try {
      const entries = await readdir(currentDir);
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          // 排除一些常见的不需要扫描的目录
          if (!entry.startsWith('.') && 
              !['node_modules', 'build', 'target', 'dist'].includes(entry)) {
            await traverse(fullPath);
          }
        } else if (entry.endsWith('.java')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error traversing directory ${currentDir}:`, error);
    }
  }
  
  await traverse(dir);
  return files;
}

export async function scanSensitiveLogs(
  projectPath: string,
  sensitiveWords: string[]
): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  
  try {
    const javaFiles = await getAllJavaFiles(projectPath);
    
    for (const file of javaFiles) {
      try {
        const content = await readFile(file, 'utf-8');
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
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('扫描过程出错:', error);
    throw error;
  }
  
  return results;
} 
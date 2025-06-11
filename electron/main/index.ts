import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { join } from 'path'

// 递归扫描Java文件
async function scanJavaFiles(dir: string): Promise<string[]> {
  const readdir = promisify(fs.readdir)
  const stat = promisify(fs.stat)
  const files = await readdir(dir)
  const javaFiles: string[] = []

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stats = await stat(filePath)

    // 忽略node_modules、.git等目录
    if (file === 'node_modules' || file === '.git' || file === 'target' || file === 'build') {
      continue
    }

    if (stats.isDirectory()) {
      const subFiles = await scanJavaFiles(filePath)
      javaFiles.push(...subFiles)
    } else if (file.endsWith('.java')) {
      javaFiles.push(filePath)
    }
  }

  return javaFiles
}

// 检查一行代码是否包含日志语句
function isLogStatement(line: string): boolean {
  const logPatterns = [
    /\blog\b.*\.(info|debug|warn|error|trace)\(/i,
    /\blogger\b.*\.(info|debug|warn|error|trace)\(/i,
    /System\.(out|err)\.print(ln)?\(/i,
    /printStackTrace\(/i
  ]
  return logPatterns.some(pattern => pattern.test(line))
}

// 检查日志语句是否包含敏感信息
function containsSensitiveInfo(line: string, sensitiveWords: string[]): string | null {
  for (const word of sensitiveWords) {
    if (line.toLowerCase().includes(word.toLowerCase())) {
      return word
    }
  }
  return null
}

function createWindow(): void {
  // ... existing createWindow code ...
}

// ... existing app.whenReady() code ...

// 注册IPC处理程序
ipcMain.handle('scan-sensitive-logs', async (_, { projectPath, sensitiveWords }) => {
  try {
    const results = []
    const javaFiles = await scanJavaFiles(projectPath)
    
    for (const file of javaFiles) {
      const content = await fs.promises.readFile(file, 'utf-8')
      const lines = content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (isLogStatement(line)) {
          const sensitiveWord = containsSensitiveInfo(line, sensitiveWords)
          if (sensitiveWord) {
            results.push({
              filePath: file,
              line: i + 1,
              content: line.trim(),
              sensitiveWord
            })
          }
        }
      }
    }
    
    return results
  } catch (error) {
    console.error('扫描敏感日志失败:', error)
    throw error
  }
})

// 打开路径
ipcMain.handle('open-path', async (_, pathToOpen) => {
  try {
    await shell.openPath(pathToOpen)
  } catch (error) {
    console.error('打开路径失败:', error)
    throw error
  }
})

// ... rest of the code ... 
import { app } from 'electron'
import { registerIpcHandlers } from './ipc/handlers'

function initialize() {
  // 注册所有IPC处理器
  registerIpcHandlers();
}

// 等待应用程序准备就绪
if (app.isReady()) {
  initialize();
} else {
  app.whenReady().then(initialize);
}

// 处理窗口关闭事件
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  initialize();
}); 
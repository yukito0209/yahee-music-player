import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window-manager';
import { MusicService } from './utils/music-service';
import { IpcHandlers } from './ipc/ipc-handlers';

/**
 * 主应用程序类
 */
class YaheeMusic {
  private windowManager: WindowManager;
  private musicService: MusicService;
  private ipcHandlers: IpcHandlers;

  constructor() {
    this.windowManager = new WindowManager();
    this.musicService = new MusicService();
    this.ipcHandlers = new IpcHandlers(this.musicService, this.windowManager);
  }

  /**
   * 初始化应用程序
   */
  async initialize(): Promise<void> {
    // 注册IPC处理器
    this.ipcHandlers.registerAllHandlers();

    // 等待Electron准备就绪
    await app.whenReady();

    // 创建主窗口
    this.windowManager.createMainWindow();

    // 注册应用程序事件
    this.registerAppEvents();
  }

  /**
   * 注册应用程序级别的事件
   */
  private registerAppEvents(): void {
    // macOS: 当点击dock图标并且没有其他窗口打开时，重新创建窗口
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.windowManager.createMainWindow();
      }
    });

    // Windows & Linux: 当所有窗口都关闭时退出应用
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // 应用程序即将退出时的清理工作
    app.on('before-quit', () => {
      this.cleanup();
    });
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    this.ipcHandlers.removeAllHandlers();
    this.windowManager.destroy();
  }
}

// 创建并启动应用程序
const yaheeMusic = new YaheeMusic();

// 启动应用程序
yaheeMusic.initialize().catch((error) => {
  console.error('[Main] Failed to initialize application:', error);
  app.quit();
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught Exception:', error);
  app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled Rejection at:', promise, 'reason:', reason);
  app.quit();
}); 
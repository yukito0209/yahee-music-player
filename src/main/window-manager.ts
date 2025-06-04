import { BrowserWindow, Menu } from 'electron';
import * as path from 'path';

/**
 * 窗口管理器类
 */
export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  /**
   * 创建主窗口
   */
  createMainWindow(): BrowserWindow {
    this.mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      icon: path.join(__dirname, '../../assets/icon.png'),
      frame: false, // 无边框窗口
      // transparent: true, // 暂时注释掉透明设置，避免鼠标交互问题
      show: false, // 初始隐藏窗口
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // 加载HTML文件 - 修复路径，指向项目根目录
    const htmlPath = path.join(__dirname, '../../index.html');
    console.log('[WindowManager] Loading HTML from:', htmlPath);
    this.mainWindow.loadFile(htmlPath);

    // 窗口准备好时显示
    this.mainWindow.once('ready-to-show', () => {
      console.log('[WindowManager] Window ready to show. Showing window now.');
      this.mainWindow?.show();
    });

    // 移除菜单栏
    Menu.setApplicationMenu(null);

    // 强制打开开发者工具（调试用）
    this.mainWindow.webContents.openDevTools();

    return this.mainWindow;
  }

  /**
   * 获取主窗口
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  /**
   * 最小化窗口
   */
  minimizeWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.minimize();
    }
  }

  /**
   * 最大化/还原窗口
   */
  toggleMaximizeWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    }
  }

  /**
   * 关闭窗口
   */
  closeWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.mainWindow = null;
  }
} 
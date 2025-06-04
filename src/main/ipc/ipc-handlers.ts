import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../types';
import { MusicService } from '../utils/music-service';
import { WindowManager } from '../window-manager';

/**
 * IPC处理器类
 */
export class IpcHandlers {
  private musicService: MusicService;
  private windowManager: WindowManager;

  constructor(musicService: MusicService, windowManager: WindowManager) {
    this.musicService = musicService;
    this.windowManager = windowManager;
  }

  /**
   * 注册所有IPC处理器
   */
  registerAllHandlers(): void {
    this.registerFileDialogHandler();
    this.registerAlbumArtHandler();
    this.registerFileSizeHandler();
    this.registerWindowHandlers();
    this.registerExternalLinkHandler();
  }

  /**
   * 注册文件对话框处理器
   */
  private registerFileDialogHandler(): void {
    ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async () => {
      try {
        const { canceled, filePaths } = await dialog.showOpenDialog({
          properties: ['openFile', 'multiSelections'],
          filters: [
            { 
              name: 'Music Files', 
              extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'] 
            },
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (!canceled && filePaths.length > 0) {
          return await this.musicService.parseMultipleAudioFiles(filePaths);
        }

        return [];
      } catch (error) {
        console.error('[IpcHandlers] Error in file dialog:', error);
        return [];
      }
    });
  }

  /**
   * 注册专辑封面处理器
   */
  private registerAlbumArtHandler(): void {
    ipcMain.handle(IPC_CHANNELS.GET_ALBUM_ART, async (event, filePath: string) => {
      try {
        return await this.musicService.getAlbumArt(filePath);
      } catch (error) {
        console.error('[IpcHandlers] Error getting album art:', error);
        return null;
      }
    });
  }

  /**
   * 注册文件大小处理器
   */
  private registerFileSizeHandler(): void {
    ipcMain.handle(IPC_CHANNELS.GET_FILE_SIZE, async (event, filePath: string) => {
      try {
        return await this.musicService.getFileSize(filePath);
      } catch (error) {
        console.error('[IpcHandlers] Error getting file size:', error);
        return null;
      }
    });
  }

  /**
   * 注册窗口控制处理器
   */
  private registerWindowHandlers(): void {
    // 最小化窗口
    ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
      this.windowManager.minimizeWindow();
    });

    // 最大化/还原窗口
    ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
      this.windowManager.toggleMaximizeWindow();
    });

    // 关闭窗口
    ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
      this.windowManager.closeWindow();
    });
  }

  /**
   * 注册外部链接处理器
   */
  private registerExternalLinkHandler(): void {
    ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL, (event, url: string) => {
      // 安全检查：确保URL是http或https协议
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        console.log(`[IpcHandlers] Opening external link: ${url}`);
        shell.openExternal(url);
      } else {
        console.warn(`[IpcHandlers] Attempted to open invalid external link: ${url}`);
      }
    });
  }

  /**
   * 清理所有处理器
   */
  removeAllHandlers(): void {
    ipcMain.removeAllListeners(IPC_CHANNELS.DIALOG_OPEN_FILE);
    ipcMain.removeAllListeners(IPC_CHANNELS.GET_ALBUM_ART);
    ipcMain.removeAllListeners(IPC_CHANNELS.GET_FILE_SIZE);
    ipcMain.removeAllListeners(IPC_CHANNELS.WINDOW_MINIMIZE);
    ipcMain.removeAllListeners(IPC_CHANNELS.WINDOW_MAXIMIZE);
    ipcMain.removeAllListeners(IPC_CHANNELS.WINDOW_CLOSE);
    ipcMain.removeAllListeners(IPC_CHANNELS.OPEN_EXTERNAL);
  }
} 
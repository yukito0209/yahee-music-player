import { DomElements } from '../utils/dom-elements';
import { ToastNotification } from '../utils/toast-notification';

/**
 * UI控制器
 * 处理界面交互、窗口控制等UI相关功能
 */
export class UIController {
  private dom: DomElements;
  private isPlaylistVisible: boolean = true;

  constructor(dom: DomElements) {
    this.dom = dom;
    this.initializeWindowControls();
    this.initializePlaylistToggle();
  }

  /**
   * 初始化窗口控制按钮
   */
  private initializeWindowControls(): void {
    // 最小化按钮
    this.dom.minimizeBtn.addEventListener('click', async () => {
      try {
        await window.electronAPI.window.minimize();
      } catch (error) {
        console.error('[UIController] Failed to minimize window:', error);
        this.showError('窗口最小化失败');
      }
    });

    // 最大化/还原按钮
    this.dom.maximizeBtn.addEventListener('click', async () => {
      try {
        await window.electronAPI.window.maximize();
      } catch (error) {
        console.error('[UIController] Failed to maximize/restore window:', error);
        this.showError('窗口最大化失败');
      }
    });

    // 关闭按钮
    this.dom.closeBtn.addEventListener('click', async () => {
      try {
        await window.electronAPI.window.close();
      } catch (error) {
        console.error('[UIController] Failed to close window:', error);
        this.showError('窗口关闭失败');
      }
    });
  }

  /**
   * 初始化播放列表切换
   */
  private initializePlaylistToggle(): void {
    this.dom.togglePlaylistBtn.addEventListener('click', () => {
      this.togglePlaylist();
    });
  }

  /**
   * 切换播放列表显示状态
   */
  togglePlaylist(): void {
    this.isPlaylistVisible = !this.isPlaylistVisible;
    
    if (this.isPlaylistVisible) {
      // 显示播放列表
      this.dom.playlistContainer.classList.remove('playlist-hidden');
      this.dom.togglePlaylistBtn.innerHTML = '&#x25C0;'; // 左指向三角 (表示隐藏)
      this.dom.togglePlaylistBtn.title = '隐藏播放列表';
    } else {
      // 隐藏播放列表
      this.dom.playlistContainer.classList.add('playlist-hidden');
      this.dom.togglePlaylistBtn.innerHTML = '&#x25B6;'; // 右指向三角 (表示显示)
      this.dom.togglePlaylistBtn.title = '显示播放列表';
    }
  }

  /**
   * 显示错误消息
   */
  showError(message: string): void {
    console.error('[UIController] Error:', message);
    ToastNotification.error(message, { duration: 4000 });
  }

  /**
   * 获取播放列表可见性
   */
  isPlaylistVisibleState(): boolean {
    return this.isPlaylistVisible;
  }

  /**
   * 显示成功消息
   */
  showSuccess(message: string): void {
    console.log('[UIController] Success:', message);
    ToastNotification.success(message, { duration: 3000 });
  }

  /**
   * 显示信息消息
   */
  showInfo(message: string): void {
    console.info('[UIController] Info:', message);
    ToastNotification.info(message, { duration: 2500 });
  }

  /**
   * 显示警告消息
   */
  showWarning(message: string): void {
    console.warn('[UIController] Warning:', message);
    ToastNotification.warning(message, { duration: 3500 });
  }

  /**
   * 设置加载状态
   */
  setLoading(isLoading: boolean, message?: string): void {
    if (isLoading) {
      console.log('[UIController] Loading:', message || 'Loading...');
      if (message) {
        ToastNotification.info(message, { 
          duration: 0, // 持续显示直到手动关闭
          closable: true 
        });
      }
    } else {
      console.log('[UIController] Loading complete');
      // 可以清除所有loading相关的toast
      // ToastNotification.clearAll(); // 如果需要的话
    }
  }

  /**
   * 注册键盘快捷键
   */
  registerKeyboardShortcuts(callbacks: {
    onPlayPause: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onVolumeUp: () => void;
    onVolumeDown: () => void;
  }): void {
    document.addEventListener('keydown', (event) => {
      // 防止在输入框中触发快捷键
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          callbacks.onPlayPause();
          break;
          
        case 'ArrowLeft':
          if (event.ctrlKey) {
            event.preventDefault();
            callbacks.onPrevious();
          }
          break;
          
        case 'ArrowRight':
          if (event.ctrlKey) {
            event.preventDefault();
            callbacks.onNext();
          }
          break;
          
        case 'ArrowUp':
          if (event.ctrlKey) {
            event.preventDefault();
            callbacks.onVolumeUp();
          }
          break;
          
        case 'ArrowDown':
          if (event.ctrlKey) {
            event.preventDefault();
            callbacks.onVolumeDown();
          }
          break;
      }
    });
  }

  /**
   * 添加文件拖放支持
   */
  initializeFileDrop(onFilesDropped: (files: FileList) => void): void {
    // 阻止默认的拖放行为
    document.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    document.addEventListener('drop', (event) => {
      event.preventDefault();
      
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        onFilesDropped(files);
      }
    });

    // 添加拖放视觉反馈
    document.addEventListener('dragenter', (event) => {
      event.preventDefault();
      document.body.classList.add('drag-over');
    });

    document.addEventListener('dragleave', (event) => {
      // 只有当离开整个窗口时才移除样式
      if (event.clientX === 0 && event.clientY === 0) {
        document.body.classList.remove('drag-over');
      }
    });

    document.addEventListener('drop', () => {
      document.body.classList.remove('drag-over');
    });
  }
} 
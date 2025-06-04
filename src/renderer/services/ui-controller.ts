import { DomElements } from '../utils/dom-elements';

/**
 * UI控制器
 * 处理界面交互、窗口控制等UI相关功能
 */
export class UIController {
  private dom: DomElements;
  private isPlaylistVisible: boolean = true;

  constructor(dom: DomElements) {
    this.dom = dom;
    console.log('[UIController] Initializing UI controller...');
    console.log('[UIController] DOM elements check:');
    // 暂时注释掉GitHub按钮相关调试，按钮已移除
    // console.log('  - GitHub button:', this.dom.githubLinkBtn);
    // console.log('  - GitHub button exists:', !!this.dom.githubLinkBtn);
    // console.log('  - GitHub button id:', this.dom.githubLinkBtn?.id);
    // console.log('  - GitHub button href:', this.dom.githubLinkBtn?.href);
    console.log('  - Window control buttons:', {
      minimize: this.dom.minimizeBtn,
      maximize: this.dom.maximizeBtn,
      close: this.dom.closeBtn
    });
    
    // 暂时注释掉GitHub按钮测试代码，按钮已移除
    // 添加直接测试按钮点击的事件监听器
    // if (this.dom.githubLinkBtn) {
    //   console.log('[UIController] Adding test click listener to GitHub button');
    //   this.dom.githubLinkBtn.addEventListener('click', (event) => {
    //     console.log('[UIController] TEST: GitHub button clicked!', event);
    //   });
    // } else {
    //   console.error('[UIController] GitHub button not found!');
    // }
    
    this.initializeWindowControls();
    this.initializePlaylistToggle();
    // 暂时注释掉GitHub按钮初始化，按钮已移除
    // this.initializeExternalLinks();
    
    console.log('[UIController] UI controller initialized successfully');
  }

  /**
   * 切换播放列表显示/隐藏
   */
  togglePlaylist(): void {
    this.isPlaylistVisible = !this.isPlaylistVisible;
    
    if (this.isPlaylistVisible) {
      this.dom.playlistContainer.classList.remove('playlist-hidden');
      this.dom.togglePlaylistBtn.innerHTML = '&#x25C0;'; // 左箭头
      this.dom.togglePlaylistBtn.title = '隐藏播放列表';
    } else {
      this.dom.playlistContainer.classList.add('playlist-hidden');
      this.dom.togglePlaylistBtn.innerHTML = '&#x25B6;'; // 右箭头
      this.dom.togglePlaylistBtn.title = '显示播放列表';
    }
  }

  /**
   * 获取播放列表可见性
   */
  isPlaylistVisibleState(): boolean {
    return this.isPlaylistVisible;
  }

  /**
   * 初始化窗口控制
   */
  private initializeWindowControls(): void {
    console.log('[UIController] Initializing window controls...');
    
    // 最小化窗口
    this.dom.minimizeBtn.addEventListener('click', async () => {
      console.log('[UIController] Minimize button clicked');
      try {
        await window.electronAPI.window.minimize();
        console.log('[UIController] Window minimized successfully');
      } catch (error) {
        console.error('[UIController] Failed to minimize window:', error);
      }
    });

    // 最大化/还原窗口
    this.dom.maximizeBtn.addEventListener('click', async () => {
      console.log('[UIController] Maximize button clicked');
      try {
        await window.electronAPI.window.maximize();
        console.log('[UIController] Window maximized successfully');
      } catch (error) {
        console.error('[UIController] Failed to maximize window:', error);
      }
    });

    // 关闭窗口
    this.dom.closeBtn.addEventListener('click', async () => {
      console.log('[UIController] Close button clicked');
      try {
        await window.electronAPI.window.close();
        console.log('[UIController] Window closed successfully');
      } catch (error) {
        console.error('[UIController] Failed to close window:', error);
      }
    });
    
    console.log('[UIController] Window controls initialized');
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
   * 初始化外部链接
   */
  /* 暂时注释掉，GitHub按钮已移除
  private initializeExternalLinks(): void {
    this.dom.githubLinkBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      
      console.log('[UIController] GitHub link clicked');
      console.log('[UIController] GitHub link element:', this.dom.githubLinkBtn);
      console.log('[UIController] GitHub link href:', this.dom.githubLinkBtn.href);
      
      try {
        const url = this.dom.githubLinkBtn.href || 'https://github.com/yukito0209/yahee-music-player';
        console.log('[UIController] Opening URL:', url);
        await window.electronAPI.window.openExternal(url);
        console.log('[UIController] Successfully opened external link');
      } catch (error) {
        console.error('[UIController] Failed to open external link:', error);
      }
    });
  }
  */

  /**
   * 显示错误消息（可以扩展为更复杂的通知系统）
   */
  showError(message: string): void {
    console.error('[UIController] Error:', message);
    // 可以在这里添加更复杂的错误提示UI
    // 例如：显示toast通知、错误对话框等
  }

  /**
   * 显示成功消息
   */
  showSuccess(message: string): void {
    console.log('[UIController] Success:', message);
    // 可以在这里添加成功提示UI
  }

  /**
   * 显示信息消息
   */
  showInfo(message: string): void {
    console.info('[UIController] Info:', message);
    // 可以在这里添加信息提示UI
  }

  /**
   * 设置加载状态
   */
  setLoading(isLoading: boolean, message?: string): void {
    // 可以在这里添加加载状态UI
    // 例如：显示加载动画、禁用按钮等
    if (isLoading) {
      console.log('[UIController] Loading:', message || 'Loading...');
    } else {
      console.log('[UIController] Loading complete');
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
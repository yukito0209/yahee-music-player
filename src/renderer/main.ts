import { YaheeMusicApp } from './app';

/**
 * 渲染进程入口文件
 * 初始化并启动音乐播放器应用
 */

// 等待DOM加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

/**
 * 初始化应用
 */
function initializeApp(): void {
  try {
    // 创建应用实例
    const app = new YaheeMusicApp();
    
    // 初始化应用
    app.initialize();
    
    // 处理未捕获的错误
    window.addEventListener('error', (event) => {
      console.error('[Main] Uncaught error:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[Main] Unhandled promise rejection:', event.reason);
    });
    
  } catch (error) {
    console.error('[Main] Failed to initialize application:', error);
    
    // 显示错误信息给用户
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      z-index: 10000;
    `;
    errorDiv.textContent = '应用启动失败，请检查控制台获取详细信息';
    document.body.appendChild(errorDiv);
  }
}

/**
 * 应用关闭时的清理
 */
window.addEventListener('beforeunload', () => {
  const app = (window as any).yaheeMusicApp;
  if (app && typeof app.destroy === 'function') {
    app.destroy();
  }
});

// 开发环境下的调试帮助
if (process.env.NODE_ENV === 'development') {
  console.log('[Main] Development mode enabled');
  
  // 添加调试快捷键
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'D') {
      const app = (window as any).yaheeMusicApp;
      if (app) {
        console.log('[Debug] Current app state:', app.getAppState());
      }
    }
  });
} 
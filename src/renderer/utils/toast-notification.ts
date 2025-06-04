/**
 * Toast通知系统
 * 提供美观的用户反馈通知
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom';
  showIcon?: boolean;
  closable?: boolean;
}

export class ToastNotification {
  private static container: HTMLElement | null = null;
  private static toasts: HTMLElement[] = [];

  /**
   * 初始化Toast容器
   */
  private static initContainer(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
  }

  /**
   * 显示Toast通知
   */
  static show(
    message: string, 
    type: ToastType = 'info', 
    options: ToastOptions = {}
  ): void {
    const {
      duration = 3000,
      position = 'top',
      showIcon = true,
      closable = true
    } = options;

    this.initContainer();

    const toast = this.createToastElement(message, type, showIcon, closable);
    
    // 设置位置类
    toast.classList.add(`toast-${position}`);

    // 添加到容器
    this.container!.appendChild(toast);
    this.toasts.push(toast);

    // 触发进入动画
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }

    // 添加关闭按钮事件
    if (closable) {
      const closeBtn = toast.querySelector('.toast-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.removeToast(toast);
        });
      }
    }
  }

  /**
   * 创建Toast元素
   */
  private static createToastElement(
    message: string, 
    type: ToastType, 
    showIcon: boolean, 
    closable: boolean
  ): HTMLElement {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const content = document.createElement('div');
    content.className = 'toast-content';

    // 添加图标
    if (showIcon) {
      const icon = document.createElement('div');
      icon.className = 'toast-icon';
      icon.innerHTML = this.getIcon(type);
      content.appendChild(icon);
    }

    // 添加消息文本
    const text = document.createElement('div');
    text.className = 'toast-message';
    text.textContent = message;
    content.appendChild(text);

    toast.appendChild(content);

    // 添加关闭按钮
    if (closable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.innerHTML = '×';
      closeBtn.title = '关闭';
      toast.appendChild(closeBtn);
    }

    return toast;
  }

  /**
   * 获取类型对应的图标
   */
  private static getIcon(type: ToastType): string {
    const icons = {
      success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
      error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
      info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
    };
    
    return icons[type] || icons.info;
  }

  /**
   * 移除Toast
   */
  private static removeToast(toast: HTMLElement): void {
    toast.classList.add('toast-hide');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      
      // 从数组中移除
      const index = this.toasts.indexOf(toast);
      if (index > -1) {
        this.toasts.splice(index, 1);
      }

      // 如果没有toast了，移除容器
      if (this.toasts.length === 0 && this.container) {
        document.body.removeChild(this.container);
        this.container = null;
      }
    }, 300);
  }

  /**
   * 清除所有Toast
   */
  static clearAll(): void {
    this.toasts.forEach(toast => {
      this.removeToast(toast);
    });
  }

  /**
   * 便捷方法
   */
  static success(message: string, options?: ToastOptions): void {
    this.show(message, 'success', options);
  }

  static error(message: string, options?: ToastOptions): void {
    this.show(message, 'error', options);
  }

  static info(message: string, options?: ToastOptions): void {
    this.show(message, 'info', options);
  }

  static warning(message: string, options?: ToastOptions): void {
    this.show(message, 'warning', options);
  }
} 
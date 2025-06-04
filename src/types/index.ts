// 导出所有类型定义
export * from './music';
export * from './ipc';

// 全局声明 - 扩展 Window 接口
declare global {
  interface Window {
    electronAPI: import('./ipc').ElectronApi;
  }
} 
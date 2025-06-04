import { contextBridge, ipcRenderer } from 'electron';
import { ElectronApi, IPC_CHANNELS } from '../types/index';

console.log('[Preload] Starting preload script...');

// 创建安全的API对象
const electronAPI: ElectronApi = {
  window: {
    minimize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
    openExternal: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL, url),
  },
  music: {
    openFileDialog: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE),
    getAlbumArt: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_ALBUM_ART, filePath),
  },
};

console.log('[Preload] Created electronAPI:', electronAPI);

// 将API暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('[Preload] API exposed to main world successfully'); 
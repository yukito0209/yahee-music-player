import { contextBridge, ipcRenderer } from 'electron';
import { ElectronApi, IPC_CHANNELS } from '../types/index';

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

// 暴露API到主世界
contextBridge.exposeInMainWorld('electronAPI', electronAPI); 
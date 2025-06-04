import { FileData, AlbumArt } from './music';

// IPC通道名称常量
export const IPC_CHANNELS = {
  DIALOG_OPEN_FILE: 'dialog:openFile',
  GET_ALBUM_ART: 'get-album-art',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  OPEN_EXTERNAL: 'open-external',
} as const;

// IPC请求响应类型
export interface IpcResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 文件对话框响应
export type FileDialogResponse = FileData[];

// 专辑封面响应
export type AlbumArtResponse = AlbumArt | null;

// Window API接口
export interface WindowApi {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
}

// Music API接口
export interface MusicApi {
  openFileDialog: () => Promise<FileDialogResponse>;
  getAlbumArt: (filePath: string) => Promise<AlbumArtResponse>;
}

// 完整的预加载API接口
export interface ElectronApi {
  window: WindowApi;
  music: MusicApi;
} 
// 音乐元数据接口
export interface MusicMetadata {
  title?: string;
  artist?: string;
  artists?: string[];
  album?: string;
  year?: number;
  genre?: string[];
  duration?: number;
  track?: {
    no?: number;
    of?: number;
  };
  picture?: Array<{
    format: string;
    data: Buffer | Uint8Array;
    description?: string;
  }>;
}

// 播放列表项接口
export interface PlaylistItem {
  filePath: string;
  metadata: MusicMetadata | null;
  displayTitle: string;
  id?: string; // 可选的唯一标识符
}

// 播放模式枚举
export enum PlayMode {
  LIST_LOOP = 'LIST_LOOP',
  SINGLE_LOOP = 'SINGLE_LOOP',
  RANDOM = 'RANDOM',
}

// 播放器状态接口
export interface PlayerState {
  isPlaying: boolean;
  currentTrackIndex: number;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;
}

// 文件选择结果接口
export interface FileData {
  filePath: string;
  metadata: MusicMetadata | null;
}

// 专辑封面数据接口
export interface AlbumArt {
  format: string;
  base64Data: string;
} 
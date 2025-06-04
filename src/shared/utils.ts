import { MusicMetadata, PlaylistItem } from '../types';

/**
 * 从文件路径获取文件名
 */
export function getFilename(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1];
}

/**
 * 格式化时间（秒 -> MM:SS）
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * 从文件信息生成显示标题
 */
export function getDisplayTitle(fileInfo: PlaylistItem): string {
  if (!fileInfo) return '未知曲目';
  const { metadata, filePath } = fileInfo;
  
  if (metadata) {
    const title = metadata.title;
    const artist = metadata.artist || metadata.artists?.join(', ');
    
    if (title && artist) return `${title} - ${artist}`;
    if (title) return title;
    if (artist) return `${artist} - ${getFilename(filePath)}`;
  }
  
  return getFilename(filePath);
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 验证音频文件扩展名
 */
export function isValidAudioFile(filePath: string): boolean {
  const validExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];
  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  return validExtensions.includes(extension);
}

/**
 * 创建播放列表项
 */
export function createPlaylistItem(
  filePath: string,
  metadata: MusicMetadata | null
): PlaylistItem {
  const item: PlaylistItem = {
    filePath,
    metadata,
    displayTitle: '',
    id: generateId(),
  };
  
  item.displayTitle = getDisplayTitle(item);
  return item;
} 
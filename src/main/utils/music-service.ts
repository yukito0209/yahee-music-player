import * as mm from 'music-metadata';
import * as path from 'path';
import * as util from 'util';
import { FileData, AlbumArt, MusicMetadata } from '../../types';
import { createPlaylistItem } from '../../shared/utils';

/**
 * 音乐服务类
 */
export class MusicService {
  /**
   * 解析单个音频文件的元数据
   */
  async parseAudioFile(filePath: string): Promise<FileData> {
    console.log(`[MusicService] Processing filePath: ${filePath}`);
    
    try {
      const metadata = await mm.parseFile(filePath);
      console.log(`[MusicService] Metadata parsed for: ${path.basename(filePath)}`);
      
      return {
        filePath: filePath,
        metadata: metadata.common as MusicMetadata,
      };
    } catch (error) {
      console.error(`[MusicService] Failed to parse metadata for ${path.basename(filePath)}:`, error);
      return {
        filePath: filePath,
        metadata: null,
      };
    }
  }

  /**
   * 批量解析音频文件的元数据
   */
  async parseMultipleAudioFiles(filePaths: string[]): Promise<FileData[]> {
    console.log('[MusicService] Raw filePaths from dialog:', filePaths);
    
    const filesData = await Promise.all(
      filePaths.map((filePath) => this.parseAudioFile(filePath))
    );
    
    return filesData;
  }

  /**
   * 获取专辑封面
   */
  async getAlbumArt(filePath: string): Promise<AlbumArt | null> {
    console.log(`[MusicService] Received request for album art: ${filePath}`);
    
    if (!filePath) {
      return null;
    }

    try {
      const metadata = await mm.parseFile(filePath);
      
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const picture = metadata.common.picture[0];
        console.log(`[MusicService] Found picture data. Format: '${picture.format}'`);

        // 验证图片格式
        if (typeof picture.format !== 'string' || !picture.format.startsWith('image/')) {
          console.warn('[MusicService] Invalid or missing picture format.');
          return null;
        }

        // 处理图片数据
        const pictureBuffer = this.processPictureData(picture.data);
        
        if (!pictureBuffer) {
          console.error('[MusicService] Failed to obtain or convert pictureBuffer.');
          return null;
        }

        // 生成Base64数据
        const base64Data = pictureBuffer.toString('base64');
        
        if (!base64Data || base64Data.includes(',')) {
          console.error('[MusicService] Generated base64 string seems invalid!');
          return null;
        }

        console.log(`[MusicService] Successfully generated album art data`);
        
        return {
          format: picture.format,
          base64Data: `data:${picture.format};base64,${base64Data}`,
        };
      } else {
        console.log(`[MusicService] No album art found in metadata.`);
        return null;
      }
    } catch (error) {
      console.error(`[MusicService] Error parsing file for album art: ${filePath}`, error);
      return null;
    }
  }

  /**
   * 处理图片数据，确保转换为Buffer
   */
  private processPictureData(pictureData: any): Buffer | null {
    console.log(`[MusicService] Type of picture.data: ${typeof pictureData}`);
    console.log(`[MusicService] Is picture.data a Buffer? ${Buffer.isBuffer(pictureData)}`);
    
    if (!pictureData) {
      console.warn('[MusicService] picture.data is missing!');
      return null;
    }

    // 如果已经是Buffer
    if (Buffer.isBuffer(pictureData)) {
      console.log('[MusicService] picture.data is already a Buffer.');
      return pictureData;
    }

    // 如果是Uint8Array
    if (pictureData instanceof Uint8Array) {
      console.log('[MusicService] picture.data is a Uint8Array. Converting to Buffer.');
      try {
        return Buffer.from(pictureData);
      } catch (conversionError) {
        console.error('[MusicService] Error converting Uint8Array data:', conversionError);
        return null;
      }
    }

    // 如果是对象类型
    if (typeof pictureData === 'object') {
      console.log('[MusicService] picture.data is an object. Inspecting structure:');
      console.log(util.inspect(pictureData, { showHidden: false, depth: 2, colors: false }));

      // 处理 { type: 'Buffer', data: [...] } 结构
      if (pictureData.type === 'Buffer' && Array.isArray(pictureData.data)) {
        console.log('[MusicService] Found { type: "Buffer", data: [...] } structure.');
        try {
          return Buffer.from(pictureData.data);
        } catch (conversionError) {
          console.error('[MusicService] Error converting array-like Buffer data:', conversionError);
          return null;
        }
      }

      // 处理直接的数组结构
      if (Array.isArray(pictureData)) {
        console.log('[MusicService] picture.data seems to be an Array of bytes.');
        try {
          return Buffer.from(pictureData);
        } catch (conversionError) {
          console.error('[MusicService] Error converting array data:', conversionError);
          return null;
        }
      }

      console.error('[MusicService] picture.data is an unrecognized object structure.');
      return null;
    }

    console.error('[MusicService] picture.data is not a Buffer or a recognized object.');
    return null;
  }
} 
import { DomElements } from './utils/dom-elements';
import { PlaylistManager } from './services/playlist-manager';
import { AudioController } from './services/audio-controller';
import { PlaybackController } from './services/playback-controller';
import { UIController } from './services/ui-controller';
import { FileData } from '../types';
import { isValidAudioFile } from '../shared/utils';

/**
 * 主应用类
 * 协调各个模块，处理应用的核心逻辑
 */
export class YaheeMusicApp {
  private dom: DomElements;
  private playlistManager: PlaylistManager;
  private audioController: AudioController;
  private playbackController: PlaybackController;
  private uiController: UIController;

  constructor() {
    this.dom = new DomElements();
    this.playlistManager = new PlaylistManager(this.dom);
    this.audioController = new AudioController(this.dom);
    this.playbackController = new PlaybackController(this.playlistManager, this.audioController);
    this.uiController = new UIController(this.dom);
  }

  /**
   * 初始化应用
   */
  initialize(): void {
    console.log('[YaheeMusicApp] Initializing application...');
    
    try {
      this.registerEventListeners();
      this.registerKeyboardShortcuts();
      this.initializeFileDrop();
      
      // 初始化UI控制器（确保窗口控制、外部链接等功能正常）
      console.log('[YaheeMusicApp] UI controller initialized during app initialization');
      
      console.log('[YaheeMusicApp] Application initialized successfully');
    } catch (error) {
      console.error('[YaheeMusicApp] Failed to initialize application:', error);
      this.uiController.showError('应用初始化失败');
    }
  }

  /**
   * 注册事件监听器
   */
  private registerEventListeners(): void {
    // 播放列表事件
    this.playlistManager.registerEventListeners(
      (index) => this.handleTrackClick(index),
      (index) => this.handleTrackDelete(index)
    );

    // 播放控制按钮
    this.dom.addFilesBtn.addEventListener('click', () => this.handleAddFiles());
    this.dom.clearPlaylistBtn.addEventListener('click', () => this.handleClearPlaylist());
    this.dom.playPauseBtn.addEventListener('click', () => this.handlePlayPause());
    this.dom.prevBtn.addEventListener('click', () => this.handlePrevious());
    this.dom.nextBtn.addEventListener('click', () => this.handleNext());
    this.dom.modeBtn.addEventListener('click', () => this.handleModeToggle());
  }

  /**
   * 注册键盘快捷键
   */
  private registerKeyboardShortcuts(): void {
    this.uiController.registerKeyboardShortcuts({
      onPlayPause: () => this.handlePlayPause(),
      onPrevious: () => this.handlePrevious(),
      onNext: () => this.handleNext(),
      onVolumeUp: () => this.handleVolumeUp(),
      onVolumeDown: () => this.handleVolumeDown(),
    });
  }

  /**
   * 初始化文件拖放
   */
  private initializeFileDrop(): void {
    this.uiController.initializeFileDrop((files) => this.handleFileDrop(files));
  }

  /**
   * 处理播放列表项点击
   */
  private async handleTrackClick(index: number): Promise<void> {
    console.log(`[YaheeMusicApp] Track clicked: ${index}`);
    await this.playbackController.playTrackAtIndex(index);
  }

  /**
   * 处理播放列表项删除
   */
  private handleTrackDelete(index: number): void {
    console.log(`[YaheeMusicApp] Deleting track: ${index}`);
    
    // 如果删除的是当前播放的曲目，停止播放
    if (index === this.playlistManager.getCurrentTrackIndex()) {
      this.playbackController.stopPlayback();
    }
    
    this.playlistManager.deleteTrack(index);
  }

  /**
   * 处理添加文件
   */
  private async handleAddFiles(): Promise<void> {
    try {
      this.uiController.setLoading(true, '正在选择文件...');
      
      const filesData = await window.electronAPI.music.openFileDialog();
      
      if (filesData && filesData.length > 0) {
        this.playlistManager.addFiles(filesData);
        this.uiController.showSuccess(`成功添加 ${filesData.length} 个文件`);
      }
    } catch (error) {
      console.error('[YaheeMusicApp] Failed to add files:', error);
      this.uiController.showError('添加文件失败');
    } finally {
      this.uiController.setLoading(false);
    }
  }

  /**
   * 处理清空播放列表
   */
  private handleClearPlaylist(): void {
    this.playbackController.stopPlayback();
    this.playlistManager.clearPlaylist();
    this.uiController.showInfo('播放列表已清空');
  }

  /**
   * 处理播放/暂停
   */
  private handlePlayPause(): void {
    this.playbackController.togglePlayPause();
  }

  /**
   * 处理上一首
   */
  private handlePrevious(): void {
    this.playbackController.playPreviousTrack();
  }

  /**
   * 处理下一首
   */
  private handleNext(): void {
    this.playbackController.playNextTrack();
  }

  /**
   * 处理播放模式切换
   */
  private handleModeToggle(): void {
    const newMode = this.audioController.togglePlayMode();
    console.log(`[YaheeMusicApp] Play mode changed to: ${newMode}`);
  }

  /**
   * 处理音量增加
   */
  private handleVolumeUp(): void {
    const currentVolume = this.audioController.getPlayerState().volume;
    const newVolume = Math.min(1, currentVolume + 0.1);
    this.audioController.setVolume(newVolume);
  }

  /**
   * 处理音量减少
   */
  private handleVolumeDown(): void {
    const currentVolume = this.audioController.getPlayerState().volume;
    const newVolume = Math.max(0, currentVolume - 0.1);
    this.audioController.setVolume(newVolume);
  }

  /**
   * 处理文件拖放
   */
  private async handleFileDrop(files: FileList): Promise<void> {
    try {
      this.uiController.setLoading(true, '正在处理拖放的文件...');
      
      // 过滤出音频文件
      const audioFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (isValidAudioFile(file.name)) {
          audioFiles.push(file);
        }
      }

      if (audioFiles.length === 0) {
        this.uiController.showError('没有找到有效的音频文件');
        return;
      }

      // 将文件路径转换为 FileData 格式
      // 注意：这里我们使用文件路径，但在实际的Electron环境中可能需要特殊处理
      const filesData: FileData[] = audioFiles.map(file => ({
        filePath: (file as any).path || file.name, // 在Electron中文件会有path属性
        metadata: null, // 元数据需要通过IPC获取
      }));

      // 如果有路径信息，尝试解析元数据
      const validFilesData = filesData.filter(data => data.filePath);
      
      if (validFilesData.length > 0) {
        this.playlistManager.addFiles(validFilesData);
        this.uiController.showSuccess(`成功添加 ${validFilesData.length} 个音频文件`);
      }
    } catch (error) {
      console.error('[YaheeMusicApp] Failed to handle file drop:', error);
      this.uiController.showError('处理拖放文件失败');
    } finally {
      this.uiController.setLoading(false);
    }
  }

  /**
   * 获取应用状态（用于调试）
   */
  getAppState() {
    return {
      playlist: this.playlistManager.getPlaylist(),
      currentTrackIndex: this.playlistManager.getCurrentTrackIndex(),
      playerState: this.audioController.getPlayerState(),
      isPlaylistVisible: this.uiController.isPlaylistVisibleState(),
    };
  }

  /**
   * 清理资源
   */
  destroy(): void {
    console.log('[YaheeMusicApp] Destroying application...');
    this.playbackController.stopPlayback();
    // 这里可以添加其他清理逻辑
  }
} 
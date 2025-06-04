import { PlayMode } from '../../types';
import { PlaylistManager } from './playlist-manager';
import { AudioController } from './audio-controller';

/**
 * 播放控制器
 * 协调音频控制器和播放列表管理器，处理播放逻辑
 */
export class PlaybackController {
  private playlistManager: PlaylistManager;
  private audioController: AudioController;

  constructor(playlistManager: PlaylistManager, audioController: AudioController) {
    this.playlistManager = playlistManager;
    this.audioController = audioController;
    
    // 注册音频控制器的事件
    this.audioController.onTrackEnded(() => this.handleTrackEnded());
  }

  /**
   * 播放指定索引的曲目
   */
  async playTrackAtIndex(index: number): Promise<void> {
    console.log(`[PlaybackController] Playing track at index: ${index}`);
    
    if (index < 0 || index >= this.playlistManager.getLength()) {
      console.warn(`[PlaybackController] Invalid index ${index}`);
      this.audioController.stop();
      return;
    }

    const track = this.playlistManager.getPlaylist()[index];
    if (!track) {
      console.warn(`[PlaybackController] No track found at index ${index}`);
      return;
    }

    try {
      await this.audioController.playTrack(track);
      this.playlistManager.setCurrentTrackIndex(index);
      console.log(`[PlaybackController] Successfully playing: ${track.displayTitle}`);
    } catch (error) {
      console.error('[PlaybackController] Failed to play track:', error);
    }
  }

  /**
   * 切换播放/暂停
   */
  togglePlayPause(): void {
    if (this.audioController.isPlaying()) {
      this.audioController.pause();
    } else {
      // 如果没有当前曲目，播放第一首
      if (!this.audioController.getCurrentTrack() && this.playlistManager.getLength() > 0) {
        this.playTrackAtIndex(0);
      } else {
        this.audioController.play();
      }
    }
  }

  /**
   * 播放上一首
   */
  playPreviousTrack(): void {
    const currentIndex = this.playlistManager.getCurrentTrackIndex();
    const playlistLength = this.playlistManager.getLength();
    
    if (playlistLength === 0) return;

    let previousIndex: number;
    
    if (currentIndex <= 0) {
      // 如果是第一首或没有当前曲目，播放最后一首
      previousIndex = playlistLength - 1;
    } else {
      previousIndex = currentIndex - 1;
    }

    this.playTrackAtIndex(previousIndex);
  }

  /**
   * 播放下一首
   */
  playNextTrack(): void {
    const nextIndex = this.getNextTrackIndex();
    if (nextIndex !== -1) {
      this.playTrackAtIndex(nextIndex);
    } else {
      // 没有下一首，停止播放
      this.audioController.stop();
      this.playlistManager.setCurrentTrackIndex(-1);
    }
  }

  /**
   * 停止播放
   */
  stopPlayback(): void {
    this.audioController.stop();
    this.playlistManager.setCurrentTrackIndex(-1);
  }

  /**
   * 处理曲目播放结束
   */
  private handleTrackEnded(): void {
    console.log('[PlaybackController] Track ended, determining next action');
    
    const playMode = this.audioController.getPlayMode();
    
    switch (playMode) {
      case PlayMode.SINGLE_LOOP:
        // 单曲循环：重播当前曲目
        const currentTrack = this.audioController.getCurrentTrack();
        if (currentTrack) {
          this.audioController.playTrack(currentTrack);
        }
        break;
        
      case PlayMode.LIST_LOOP:
      case PlayMode.RANDOM:
        // 列表循环和随机播放：播放下一首
        this.playNextTrack();
        break;
    }
  }

  /**
   * 获取下一首曲目的索引
   */
  private getNextTrackIndex(): number {
    const currentIndex = this.playlistManager.getCurrentTrackIndex();
    const playlistLength = this.playlistManager.getLength();
    const playMode = this.audioController.getPlayMode();

    if (playlistLength === 0) return -1;

    switch (playMode) {
      case PlayMode.LIST_LOOP:
        // 列表循环
        if (currentIndex === -1) return 0;
        return (currentIndex + 1) % playlistLength;

      case PlayMode.SINGLE_LOOP:
        // 单曲循环：返回当前索引
        return currentIndex;

      case PlayMode.RANDOM:
        // 随机播放
        if (playlistLength === 1) return 0;
        
        let randomIndex: number;
        do {
          randomIndex = Math.floor(Math.random() * playlistLength);
        } while (randomIndex === currentIndex && playlistLength > 1);
        
        return randomIndex;

      default:
        return -1;
    }
  }

  /**
   * 获取播放列表管理器
   */
  getPlaylistManager(): PlaylistManager {
    return this.playlistManager;
  }

  /**
   * 获取音频控制器
   */
  getAudioController(): AudioController {
    return this.audioController;
  }
} 
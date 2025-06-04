import { PlaylistItem, PlayMode, PlayerState } from '../../types';
import { formatTime } from '../../shared/utils';
import { DomElements } from '../utils/dom-elements';

/**
 * 音频控制器
 */
export class AudioController {
  private dom: DomElements;
  private currentTrack: PlaylistItem | null = null;
  private playMode: PlayMode = PlayMode.LIST_LOOP;
  private isSeeking: boolean = false;
  private playNextTimeoutId: number | null = null;
  private isHandlingError: boolean = false;
  private defaultCoverPath: string = './assets/default-cover.png';

  // 播放模式顺序
  private readonly playModeOrder = [
    PlayMode.LIST_LOOP,
    PlayMode.SINGLE_LOOP,
    PlayMode.RANDOM
  ];

  constructor(dom: DomElements) {
    this.dom = dom;
    this.initializeAudioEvents();
    this.initializeProgressBar();
    this.initializeVolumeControl();
    this.initializeAlbumCoverToggle();
    
    // 初始化CSS自定义属性
    this.initializeSliderStyles();
  }

  /**
   * 播放指定曲目
   */
  async playTrack(track: PlaylistItem): Promise<void> {
    this.currentTrack = track;
    this.dom.audioPlayer.src = track.filePath;
    
    try {
      await this.dom.audioPlayer.play();
      this.updateTrackInfo();
      await this.loadAlbumArt();
    } catch (error) {
      console.error('[AudioController] Failed to play track:', error);
      this.handlePlaybackError();
    }
  }

  /**
   * 暂停播放
   */
  pause(): void {
    this.dom.audioPlayer.pause();
  }

  /**
   * 继续播放
   */
  play(): void {
    this.dom.audioPlayer.play().catch(error => {
      console.error('[AudioController] Failed to resume playback:', error);
      this.handlePlaybackError();
    });
  }

  /**
   * 停止播放
   */
  stop(): void {
    this.dom.audioPlayer.pause();
    this.dom.audioPlayer.currentTime = 0;
    this.currentTrack = null;
    this.updateTrackInfo();
    this.resetAlbumArt();
  }

  /**
   * 获取播放器状态
   */
  getPlayerState(): PlayerState {
    return {
      isPlaying: !this.dom.audioPlayer.paused,
      currentTrackIndex: -1, // 由外部管理
      currentTime: this.dom.audioPlayer.currentTime,
      duration: this.dom.audioPlayer.duration || 0,
      volume: this.dom.audioPlayer.volume,
      isMuted: this.dom.audioPlayer.muted,
      playMode: this.playMode,
    };
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.dom.audioPlayer.volume = Math.max(0, Math.min(1, volume));
    this.dom.volumeSlider.value = this.dom.audioPlayer.volume.toString();
    this.updateVolumeUI();
  }

  /**
   * 切换静音
   */
  toggleMute(): void {
    this.dom.audioPlayer.muted = !this.dom.audioPlayer.muted;
    this.updateVolumeUI();
  }

  /**
   * 设置播放位置
   */
  setCurrentTime(time: number): void {
    if (isFinite(time) && time >= 0) {
      const clampedTime = Math.min(time, this.dom.audioPlayer.duration || 0);
      this.dom.audioPlayer.currentTime = clampedTime;
    }
  }

  /**
   * 获取当前播放模式
   */
  getPlayMode(): PlayMode {
    return this.playMode;
  }

  /**
   * 切换播放模式
   */
  togglePlayMode(): PlayMode {
    const currentIndex = this.playModeOrder.indexOf(this.playMode);
    const nextIndex = (currentIndex + 1) % this.playModeOrder.length;
    this.playMode = this.playModeOrder[nextIndex];
    this.updateModeButtonUI();
    return this.playMode;
  }

  /**
   * 是否正在播放
   */
  isPlaying(): boolean {
    return !this.dom.audioPlayer.paused;
  }

  /**
   * 获取当前曲目
   */
  getCurrentTrack(): PlaylistItem | null {
    return this.currentTrack;
  }

  /**
   * 注册播放结束回调
   */
  onTrackEnded(callback: () => void): void {
    this.dom.audioPlayer.addEventListener('ended', callback);
  }

  /**
   * 注册播放状态变化回调
   */
  onPlayStateChange(callback: (isPlaying: boolean) => void): void {
    this.dom.audioPlayer.addEventListener('play', () => callback(true));
    this.dom.audioPlayer.addEventListener('pause', () => callback(false));
  }

  /**
   * 初始化音频事件
   */
  private initializeAudioEvents(): void {
    // 音频加载完成
    this.dom.audioPlayer.addEventListener('loadedmetadata', () => {
      this.updateTimeDisplay();
      this.dom.progressBar.max = this.dom.audioPlayer.duration.toString();
    });

    // 播放时间更新
    this.dom.audioPlayer.addEventListener('timeupdate', () => {
      if (!this.isSeeking) {
        this.updateTimeDisplay();
        this.updateProgressBar();
      }
    });

    // 播放状态变化
    this.dom.audioPlayer.addEventListener('play', () => {
      this.updatePlayPauseButton(true);
    });

    this.dom.audioPlayer.addEventListener('pause', () => {
      this.updatePlayPauseButton(false);
    });

    // 错误处理
    this.dom.audioPlayer.addEventListener('error', () => {
      this.handlePlaybackError();
    });
  }

  /**
   * 初始化进度条
   */
  private initializeProgressBar(): void {
    console.log('[AudioController] Initializing progress bar...');
    
    // 进度条拖拽开始
    this.dom.progressBar.addEventListener('mousedown', () => {
      console.log('[AudioController] Progress bar mousedown - seeking started');
      this.isSeeking = true;
    });

    // 进度条值变化
    this.dom.progressBar.addEventListener('input', () => {
      if (this.isSeeking) {
        const time = parseFloat(this.dom.progressBar.value);
        console.log('[AudioController] Progress bar input - time:', time);
        this.dom.currentTimeSpan.textContent = formatTime(time);
        this.updateProgressBarStyle();
      }
    });

    // 进度条拖拽结束 - 使用 mouseup 而不是 change
    this.dom.progressBar.addEventListener('mouseup', () => {
      if (this.isSeeking) {
        const time = parseFloat(this.dom.progressBar.value);
        console.log('[AudioController] Progress bar mouseup - seeking to time:', time);
        this.setCurrentTime(time);
        this.isSeeking = false;
      }
    });

    // 备用：进度条change事件
    this.dom.progressBar.addEventListener('change', () => {
      if (this.isSeeking) {
        const time = parseFloat(this.dom.progressBar.value);
        console.log('[AudioController] Progress bar change - seeking to time:', time);
        this.setCurrentTime(time);
        this.isSeeking = false;
      }
    });

    // 全局鼠标释放备用处理（延迟执行以确保其他事件先处理）
    document.addEventListener('mouseup', () => {
      if (this.isSeeking) {
        setTimeout(() => {
          if (this.isSeeking) {
            console.log('[AudioController] Document mouseup - ending seek (backup)');
            this.isSeeking = false;
          }
        }, 10);
      }
    });
  }

  /**
   * 初始化音量控制
   */
  private initializeVolumeControl(): void {
    // 音量滑块变化
    this.dom.volumeSlider.addEventListener('input', () => {
      const volume = parseFloat(this.dom.volumeSlider.value);
      this.dom.audioPlayer.volume = volume;
      this.dom.audioPlayer.muted = volume === 0;
      this.updateVolumeUI();
    });

    // 音量按钮点击
    this.dom.volumeBtn.addEventListener('click', () => {
      this.toggleMute();
    });

    // 初始化音量UI
    this.updateVolumeUI();
  }

  /**
   * 初始化专辑封面点击切换歌词的事件监听器
   */
  private initializeAlbumCoverToggle(): void {
    const albumContainer = document.getElementById('album-art-container');
    const lyricsContainer = document.getElementById('lyrics-container');
    const albumLyricsSection = document.getElementById('album-lyrics-section');
    
    if (!albumContainer || !lyricsContainer || !albumLyricsSection) {
      console.warn('[AudioController] Album cover toggle elements not found');
      return;
    }

    // 专辑封面点击事件
    albumContainer.addEventListener('click', () => {
      this.showLyrics();
    });

    // 歌词容器点击事件（返回专辑封面）
    lyricsContainer.addEventListener('click', () => {
      this.showAlbumCover();
    });
  }

  /**
   * 显示歌词界面
   */
  private showLyrics(): void {
    const albumContainer = document.getElementById('album-art-container');
    const lyricsContainer = document.getElementById('lyrics-container');
    
    if (albumContainer && lyricsContainer) {
      // 添加淡出动画
      albumContainer.classList.add('fade-out');
      
      // 延迟切换显示，等待淡出动画完成
      setTimeout(() => {
        albumContainer.style.display = 'none';
        albumContainer.classList.remove('fade-out');
        
        // 显示歌词容器并添加淡入动画
        lyricsContainer.style.display = 'flex';
        lyricsContainer.classList.add('fade-in');
        
        // 清除淡入动画类
        setTimeout(() => {
          lyricsContainer.classList.remove('fade-in');
        }, 500);
        
      }, 300); // 等待淡出动画完成
      
      console.log('[AudioController] Switching to lyrics view with animation');
    }
  }

  /**
   * 显示专辑封面
   */
  private showAlbumCover(): void {
    const albumContainer = document.getElementById('album-art-container');
    const lyricsContainer = document.getElementById('lyrics-container');
    
    if (albumContainer && lyricsContainer) {
      // 添加淡出动画
      lyricsContainer.classList.add('fade-out');
      
      // 延迟切换显示，等待淡出动画完成
      setTimeout(() => {
        lyricsContainer.style.display = 'none';
        lyricsContainer.classList.remove('fade-out');
        
        // 显示专辑封面容器并添加淡入动画
        albumContainer.style.display = 'flex';
        albumContainer.classList.add('fade-in');
        
        // 清除淡入动画类
        setTimeout(() => {
          albumContainer.classList.remove('fade-in');
        }, 500);
        
      }, 300); // 等待淡出动画完成
      
      console.log('[AudioController] Switching to album cover view with animation');
    }
  }

  /**
   * 更新播放/暂停按钮
   */
  private updatePlayPauseButton(isPlaying: boolean): void {
    if (isPlaying) {
      this.dom.playIcon.style.display = 'none';
      this.dom.pauseIcon.style.display = 'inline-block';
      this.dom.playPauseBtn.title = '暂停';
    } else {
      this.dom.playIcon.style.display = 'inline-block';
      this.dom.pauseIcon.style.display = 'none';
      this.dom.playPauseBtn.title = '播放';
    }
  }

  /**
   * 更新曲目信息显示
   */
  private updateTrackInfo(): void {
    if (this.currentTrack) {
      // 更新详细信息卡片
      const metadata = this.currentTrack.metadata;
      
      // 歌曲标题
      this.dom.songTitle.textContent = metadata?.title || this.getFilenameFromPath(this.currentTrack.filePath);
      
      // 艺术家
      const artist = metadata?.artist || metadata?.artists?.join(', ') || '未知艺术家';
      this.dom.songArtist.textContent = artist;
      
      // 专辑
      this.dom.songAlbum.textContent = metadata?.album || '未知专辑';
      
      // 格式信息
      this.updateFormatInfo();
      
    } else {
      // 重置所有信息
      this.resetSongDetails();
    }
  }

  /**
   * 更新格式技术信息
   */
  private updateFormatInfo(): void {
    if (!this.currentTrack) return;
    
    const filePath = this.currentTrack.filePath;
    const fileExtension = filePath.split('.').pop()?.toUpperCase() || '未知';
    
    // 格式
    this.dom.songFormat.textContent = fileExtension;
    
    // 比特率和采样率将在音频加载后更新
    this.dom.songBitrate.textContent = '加载中...';
    this.dom.songSamplerate.textContent = '加载中...';
    
    // 监听音频元数据加载完成
    const updateMetadata = () => {
      if (this.dom.audioPlayer.duration) {
        // 时长
        this.dom.songDuration.textContent = this.formatTime(this.dom.audioPlayer.duration);
        
        // 估算比特率（文件大小 / 时长）
        this.estimateBitrate();
        
        // 采样率（如果可用）
        this.updateSampleRate();
      }
    };
    
    if (this.dom.audioPlayer.readyState >= 1) {
      updateMetadata();
    } else {
      this.dom.audioPlayer.addEventListener('loadedmetadata', updateMetadata, { once: true });
    }
  }

  /**
   * 估算比特率
   */
  private async estimateBitrate(): Promise<void> {
    try {
      if (!this.currentTrack) return;
      
      // 尝试获取文件大小
      const fileSize = await this.getFileSize(this.currentTrack.filePath);
      if (fileSize && this.dom.audioPlayer.duration) {
        const durationInSeconds = this.dom.audioPlayer.duration;
        const bitrate = Math.round((fileSize * 8) / (durationInSeconds * 1000)); // kbps
        this.dom.songBitrate.textContent = `${bitrate} kbps`;
      } else {
        this.dom.songBitrate.textContent = '未知';
      }
    } catch (error) {
      console.error('[AudioController] Failed to estimate bitrate:', error);
      this.dom.songBitrate.textContent = '未知';
    }
  }

  /**
   * 更新采样率信息
   */
  private updateSampleRate(): void {
    // HTML5 Audio API 不直接提供采样率信息
    // 我们可以尝试使用 Web Audio API 获取更详细的信息
    try {
      if (window.AudioContext || (window as any).webkitAudioContext) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.dom.songSamplerate.textContent = `${audioContext.sampleRate} Hz`;
        audioContext.close();
      } else {
        this.dom.songSamplerate.textContent = '未知';
      }
    } catch (error) {
      console.error('[AudioController] Failed to get sample rate:', error);
      this.dom.songSamplerate.textContent = '未知';
    }
  }

  /**
   * 获取文件大小
   */
  private async getFileSize(filePath: string): Promise<number | null> {
    try {
      // 通过Electron API获取文件大小
      if (window.electronAPI?.music?.getFileSize) {
        return await window.electronAPI.music.getFileSize(filePath);
      }
      return null;
    } catch (error) {
      console.error('[AudioController] Failed to get file size:', error);
      return null;
    }
  }

  /**
   * 重置歌曲详情
   */
  private resetSongDetails(): void {
    this.dom.songTitle.textContent = '选择音乐开始播放';
    this.dom.songArtist.textContent = '未知艺术家';
    this.dom.songAlbum.textContent = '未知专辑';
    this.dom.songDuration.textContent = '--:--';
    this.dom.songFormat.textContent = '未知';
    this.dom.songBitrate.textContent = '-- kbps';
    this.dom.songSamplerate.textContent = '-- Hz';
  }

  /**
   * 从文件路径提取文件名
   */
  private getFilenameFromPath(filePath: string): string {
    return filePath.split(/[\\\/]/).pop()?.replace(/\.[^/.]+$/, '') || '未知文件';
  }

  /**
   * 格式化时间
   */
  private formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '--:--';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * 更新时间显示
   */
  private updateTimeDisplay(): void {
    const currentTime = this.dom.audioPlayer.currentTime;
    const duration = this.dom.audioPlayer.duration || 0;

    this.dom.currentTimeSpan.textContent = formatTime(currentTime);
    this.dom.totalTimeSpan.textContent = formatTime(duration);
  }

  /**
   * 更新进度条
   */
  private updateProgressBar(): void {
    const currentTime = this.dom.audioPlayer.currentTime;
    this.dom.progressBar.value = currentTime.toString();
    this.updateProgressBarStyle();
  }

  /**
   * 更新进度条样式
   */
  private updateProgressBarStyle(): void {
    const current = parseFloat(this.dom.progressBar.value);
    const max = parseFloat(this.dom.progressBar.max);
    const progress = max > 0 ? (current / max) * 100 : 0;
    
    // 使用CSS自定义属性精确控制填充
    this.dom.progressBar.style.setProperty('--progress', `${progress}%`);
  }

  /**
   * 更新音量UI
   */
  private updateVolumeUI(): void {
    const volume = this.dom.audioPlayer.volume;
    const isMuted = this.dom.audioPlayer.muted;

    // 更新图标
    if (isMuted || volume === 0) {
      this.dom.volumeHighIcon.style.display = 'none';
      this.dom.volumeMutedIcon.style.display = 'inline-block';
      this.dom.volumeBtn.title = '取消静音';
    } else {
      this.dom.volumeHighIcon.style.display = 'inline-block';
      this.dom.volumeMutedIcon.style.display = 'none';
      this.dom.volumeBtn.title = '静音';
    }

    // 更新滑块值和填充
    const volumeValue = isMuted ? 0 : volume;
    this.dom.volumeSlider.value = volumeValue.toString();
    
    // 使用CSS自定义属性精确控制填充
    this.dom.volumeSlider.style.setProperty('--volume', `${volumeValue * 100}%`);
  }

  /**
   * 更新播放模式按钮UI
   */
  private updateModeButtonUI(): void {
    // 隐藏所有图标
    Object.values(this.dom.modeIcons).forEach(icon => {
      icon.style.display = 'none';
    });

    // 显示当前模式图标并更新标题
    switch (this.playMode) {
      case PlayMode.LIST_LOOP:
        this.dom.modeIcons.listLoop.style.display = 'inline-block';
        this.dom.modeBtn.title = '切换播放模式：列表循环';
        break;
      case PlayMode.SINGLE_LOOP:
        this.dom.modeIcons.singleLoop.style.display = 'inline-block';
        this.dom.modeBtn.title = '切换播放模式：单曲循环';
        break;
      case PlayMode.RANDOM:
        this.dom.modeIcons.random.style.display = 'inline-block';
        this.dom.modeBtn.title = '切换播放模式：随机播放';
        break;
    }
  }

  /**
   * 加载专辑封面
   */
  private async loadAlbumArt(): Promise<void> {
    if (!this.currentTrack) {
      this.resetAlbumArt();
      return;
    }

    try {
      const albumArt = await window.electronAPI.music.getAlbumArt(this.currentTrack.filePath);
      
      if (albumArt) {
        this.dom.albumArtImg.src = albumArt.base64Data;
        console.log('[AudioController] Album art loaded successfully');
      } else {
        this.resetAlbumArt();
      }
    } catch (error) {
      console.error('[AudioController] Failed to load album art:', error);
      this.resetAlbumArt();
    }
  }

  /**
   * 重置专辑封面
   */
  private resetAlbumArt(): void {
    this.dom.albumArtImg.src = this.defaultCoverPath;
  }

  /**
   * 处理播放错误
   */
  private handlePlaybackError(): void {
    if (this.isHandlingError) return;
    
    this.isHandlingError = true;
    console.error('[AudioController] Playback error occurred');
    
    // 清除任何待处理的播放下一首的超时
    if (this.playNextTimeoutId) {
      clearTimeout(this.playNextTimeoutId);
      this.playNextTimeoutId = null;
    }

    // 重置播放状态
    this.updatePlayPauseButton(false);
    
    // 延迟重置错误标志
    setTimeout(() => {
      this.isHandlingError = false;
    }, 1000);
  }

  /**
   * 初始化滑块样式
   */
  private initializeSliderStyles(): void {
    // 初始化进度条样式
    this.dom.progressBar.style.setProperty('--progress', '0%');
    this.dom.progressBar.max = '0'; // 初始化为0，音频加载后会更新
    this.dom.progressBar.value = '0';
    
    // 初始化音量条样式
    const initialVolume = this.dom.audioPlayer.volume * 100;
    this.dom.volumeSlider.style.setProperty('--volume', `${initialVolume}%`);
    this.dom.volumeSlider.value = this.dom.audioPlayer.volume.toString();
    
    console.log('[AudioController] Slider styles initialized:', {
      progressValue: this.dom.progressBar.value,
      progressMax: this.dom.progressBar.max,
      volumeValue: this.dom.volumeSlider.value,
      audioVolume: this.dom.audioPlayer.volume
    });
  }
} 
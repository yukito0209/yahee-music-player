/**
 * DOM元素管理器
 * 统一管理所有DOM元素的获取和缓存
 */
export class DomElements {
  // 播放列表相关
  public readonly addFilesBtn: HTMLButtonElement;
  public readonly clearPlaylistBtn: HTMLButtonElement;
  public readonly playlistUl: HTMLUListElement;
  public readonly togglePlaylistBtn: HTMLButtonElement;
  public readonly playlistContainer: HTMLDivElement;

  // 播放器相关
  public readonly audioPlayer: HTMLAudioElement;
  public readonly trackInfoDiv: HTMLDivElement;
  public readonly albumArtImg: HTMLImageElement;

  // 控制按钮
  public readonly playPauseBtn: HTMLButtonElement;
  public readonly prevBtn: HTMLButtonElement;
  public readonly nextBtn: HTMLButtonElement;
  public readonly modeBtn: HTMLButtonElement;

  // 播放/暂停图标
  public readonly playIcon: HTMLElement;
  public readonly pauseIcon: HTMLElement;

  // 时间显示
  public readonly currentTimeSpan: HTMLSpanElement;
  public readonly totalTimeSpan: HTMLSpanElement;

  // 进度条
  public readonly progressBar: HTMLInputElement;

  // 音量控制
  public readonly volumeBtn: HTMLButtonElement;
  public readonly volumeSlider: HTMLInputElement;
  public readonly volumeHighIcon: HTMLElement;
  public readonly volumeMutedIcon: HTMLElement;

  // 模式图标
  public readonly modeIcons: {
    listLoop: HTMLElement;
    singleLoop: HTMLElement;
    random: HTMLElement;
  };

  // 其他按钮
  // 暂时注释掉GitHub按钮，已从HTML中移除
  // this.githubLinkBtn = this.getElement<HTMLAnchorElement>('github-link-btn');

  // 窗口控制按钮
  public readonly minimizeBtn: HTMLElement;
  public readonly maximizeBtn: HTMLElement;
  public readonly closeBtn: HTMLElement;

  constructor() {
    // 播放列表相关
    this.addFilesBtn = this.getElement<HTMLButtonElement>('add-files-btn');
    this.clearPlaylistBtn = this.getElement<HTMLButtonElement>('clear-playlist-btn');
    this.playlistUl = this.getElement<HTMLUListElement>('playlist');
    this.togglePlaylistBtn = this.getElement<HTMLButtonElement>('toggle-playlist-btn');
    this.playlistContainer = this.getElement<HTMLDivElement>('playlist-container');

    // 播放器相关
    this.audioPlayer = this.getElement<HTMLAudioElement>('audio-player');
    this.trackInfoDiv = this.getElement<HTMLDivElement>('track-info');
    this.albumArtImg = this.getElement<HTMLImageElement>('album-art-img');

    // 控制按钮
    this.playPauseBtn = this.getElement<HTMLButtonElement>('play-pause-btn');
    this.prevBtn = this.getElement<HTMLButtonElement>('prev-btn');
    this.nextBtn = this.getElement<HTMLButtonElement>('next-btn');
    this.modeBtn = this.getElement<HTMLButtonElement>('mode-btn');

    // 播放/暂停图标
    this.playIcon = this.getElementByClass(this.playPauseBtn, 'play-icon');
    this.pauseIcon = this.getElementByClass(this.playPauseBtn, 'pause-icon');

    // 时间显示
    this.currentTimeSpan = this.getElementBySelector<HTMLSpanElement>('.current-time');
    this.totalTimeSpan = this.getElementBySelector<HTMLSpanElement>('.total-time');

    // 进度条
    this.progressBar = this.getElement<HTMLInputElement>('progress-bar');

    // 音量控制
    this.volumeBtn = this.getElement<HTMLButtonElement>('volume-btn');
    this.volumeSlider = this.getElement<HTMLInputElement>('volume-slider');
    this.volumeHighIcon = this.getElementByClass(this.volumeBtn, 'volume-high-icon');
    this.volumeMutedIcon = this.getElementByClass(this.volumeBtn, 'volume-muted-icon');

    // 模式图标
    this.modeIcons = {
      listLoop: this.getElementByClass(this.modeBtn, 'mode-list-loop'),
      singleLoop: this.getElementByClass(this.modeBtn, 'mode-single-loop'),
      random: this.getElementByClass(this.modeBtn, 'mode-random'),
    };

    // 其他按钮
    // 暂时注释掉GitHub按钮，已从HTML中移除
    // this.githubLinkBtn = this.getElement<HTMLAnchorElement>('github-link-btn');

    // 窗口控制按钮
    this.minimizeBtn = this.getElement<HTMLElement>('minimize-btn');
    this.maximizeBtn = this.getElement<HTMLElement>('maximize-btn');
    this.closeBtn = this.getElement<HTMLElement>('close-btn');
  }

  /**
   * 安全获取DOM元素
   */
  private getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id) as T;
    if (!element) {
      throw new Error(`Element with id '${id}' not found`);
    }
    return element;
  }

  /**
   * 通过类名获取子元素
   */
  private getElementByClass<T extends HTMLElement>(parent: HTMLElement, className: string): T {
    const element = parent.querySelector(`.${className}`) as T;
    if (!element) {
      throw new Error(`Element with class '${className}' not found in parent`);
    }
    return element;
  }

  /**
   * 通过选择器获取元素
   */
  private getElementBySelector<T extends HTMLElement>(selector: string): T {
    const element = document.querySelector(selector) as T;
    if (!element) {
      throw new Error(`Element with selector '${selector}' not found`);
    }
    return element;
  }
} 
import { PlaylistItem, FileData, PlayMode } from '../../types';
import { createPlaylistItem, getDisplayTitle } from '../../shared/utils';
import { DomElements } from '../utils/dom-elements';

/**
 * 播放列表管理器
 */
export class PlaylistManager {
  private playlistData: PlaylistItem[] = [];
  private currentTrackIndex: number = -1;
  private draggedIndex: number | null = null;
  private dom: DomElements;

  constructor(dom: DomElements) {
    this.dom = dom;
  }

  /**
   * 添加文件到播放列表
   */
  addFiles(filesData: FileData[]): void {
    const newItems = filesData.map(fileData => 
      createPlaylistItem(fileData.filePath, fileData.metadata)
    );
    
    this.playlistData.push(...newItems);
    this.updateUI();
  }

  /**
   * 清空播放列表
   */
  clearPlaylist(): void {
    this.playlistData = [];
    this.currentTrackIndex = -1;
    this.updateUI();
  }

  /**
   * 删除指定索引的曲目
   */
  deleteTrack(indexToDelete: number): void {
    if (indexToDelete < 0 || indexToDelete >= this.playlistData.length) {
      return;
    }

    const currentPlayingPath = this.getCurrentTrack()?.filePath || null;
    
    // 删除曲目
    this.playlistData.splice(indexToDelete, 1);

    // 更新当前播放索引
    if (indexToDelete < this.currentTrackIndex) {
      this.currentTrackIndex--;
    } else if (indexToDelete === this.currentTrackIndex) {
      this.currentTrackIndex = -1; // 如果删除的是当前播放的曲目
    }

    this.updateUI(currentPlayingPath);
  }

  /**
   * 获取播放列表数据
   */
  getPlaylist(): PlaylistItem[] {
    return [...this.playlistData];
  }

  /**
   * 获取当前曲目
   */
  getCurrentTrack(): PlaylistItem | null {
    if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.playlistData.length) {
      return this.playlistData[this.currentTrackIndex];
    }
    return null;
  }

  /**
   * 设置当前播放索引
   */
  setCurrentTrackIndex(index: number): void {
    if (index >= -1 && index < this.playlistData.length) {
      this.currentTrackIndex = index;
      this.updateUI();
    }
  }

  /**
   * 获取当前播放索引
   */
  getCurrentTrackIndex(): number {
    return this.currentTrackIndex;
  }

  /**
   * 获取播放列表长度
   */
  getLength(): number {
    return this.playlistData.length;
  }

  /**
   * 通过文件路径查找曲目索引
   */
  findTrackIndexByPath(filePath: string): number {
    return this.playlistData.findIndex(item => item.filePath === filePath);
  }

  /**
   * 移动曲目位置（拖拽重排）
   */
  moveTrack(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.playlistData.length ||
        toIndex < 0 || toIndex >= this.playlistData.length ||
        fromIndex === toIndex) {
      return;
    }

    const currentPlayingPath = this.getCurrentTrack()?.filePath || null;
    
    // 移动曲目
    const [movedItem] = this.playlistData.splice(fromIndex, 1);
    this.playlistData.splice(toIndex, 0, movedItem);

    // 更新当前播放索引
    if (this.currentTrackIndex === fromIndex) {
      this.currentTrackIndex = toIndex;
    } else if (fromIndex < this.currentTrackIndex && toIndex >= this.currentTrackIndex) {
      this.currentTrackIndex--;
    } else if (fromIndex > this.currentTrackIndex && toIndex <= this.currentTrackIndex) {
      this.currentTrackIndex++;
    }

    this.updateUI(currentPlayingPath);
  }

  /**
   * 设置拖拽索引
   */
  setDraggedIndex(index: number | null): void {
    this.draggedIndex = index;
  }

  /**
   * 获取拖拽索引
   */
  getDraggedIndex(): number | null {
    return this.draggedIndex;
  }

  /**
   * 更新播放列表UI
   */
  private updateUI(currentPlayingPath?: string | null): void {
    console.log('[PlaylistManager] Updating UI');
    
    // 使用传入的路径，或者如果没传，则尝试用当前索引获取
    const playingPath = currentPlayingPath ?? this.getCurrentTrack()?.filePath ?? null;
    console.log('[PlaylistManager] Using playingPath:', playingPath);
    
    let newPlayingIndex = -1;

    this.dom.playlistUl.innerHTML = '';

    if (this.playlistData.length === 0) {
      this.showEmptyMessage();
      this.currentTrackIndex = -1;
      return;
    }

    this.playlistData.forEach((fileInfo, index) => {
      const li = this.createPlaylistItem(fileInfo, index);
      
      // 检查是否是当前播放的曲目
      if (playingPath && fileInfo.filePath === playingPath) {
        console.log(`[PlaylistManager] Found playing track '${fileInfo.displayTitle}' at index: ${index}`);
        li.classList.add('playing');
        newPlayingIndex = index;
      }

      this.dom.playlistUl.appendChild(li);
    });

    // 更新当前播放索引
    this.currentTrackIndex = newPlayingIndex;
    console.log('[PlaylistManager] Final currentTrackIndex:', this.currentTrackIndex);
  }

  /**
   * 显示空播放列表消息
   */
  private showEmptyMessage(): void {
    const emptyLi = document.createElement('li');
    emptyLi.textContent = '将音乐文件拖放到这里或点击"添加"';
    emptyLi.style.textAlign = 'center';
    emptyLi.style.cursor = 'default';
    this.dom.playlistUl.appendChild(emptyLi);
  }

  /**
   * 创建播放列表项元素
   */
  private createPlaylistItem(fileInfo: PlaylistItem, index: number): HTMLLIElement {
    const li = document.createElement('li');
    li.dataset.index = index.toString();
    li.draggable = true;

    // 创建标题元素
    const titleSpan = document.createElement('span');
    titleSpan.className = 'track-title';
    titleSpan.textContent = fileInfo.displayTitle;
    li.appendChild(titleSpan);

    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-track-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = '从列表中移除';
    li.appendChild(deleteBtn);

    return li;
  }

  /**
   * 注册事件监听器
   */
  registerEventListeners(
    onTrackClick: (index: number) => void,
    onTrackDelete: (index: number) => void
  ): void {
    // 使用事件委托处理播放列表项的点击和删除
    this.dom.playlistUl.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const li = target.closest('li') as HTMLLIElement;
      
      if (!li || !li.dataset.index) return;
      
      const index = parseInt(li.dataset.index);
      
      if (target.closest('.delete-track-btn')) {
        event.stopPropagation();
        onTrackDelete(index);
      } else {
        onTrackClick(index);
      }
    });

    // 注册拖拽事件
    this.registerDragEvents();
  }

  /**
   * 注册拖拽事件
   */
  private registerDragEvents(): void {
    this.dom.playlistUl.addEventListener('dragstart', (event) => {
      const target = event.target as HTMLLIElement;
      if (target.tagName === 'LI' && target.dataset.index) {
        this.draggedIndex = parseInt(target.dataset.index);
        target.classList.add('dragging');
      }
    });

    this.dom.playlistUl.addEventListener('dragend', (event) => {
      const target = event.target as HTMLLIElement;
      if (target.tagName === 'LI') {
        target.classList.remove('dragging');
        this.draggedIndex = null;
      }
    });

    this.dom.playlistUl.addEventListener('dragover', (event) => {
      event.preventDefault();
      const afterElement = this.getDragAfterElement(event.clientY);
      const draggedElement = this.dom.playlistUl.querySelector('.dragging') as HTMLLIElement;
      
      if (afterElement == null) {
        this.dom.playlistUl.appendChild(draggedElement);
      } else {
        this.dom.playlistUl.insertBefore(draggedElement, afterElement);
      }
    });

    this.dom.playlistUl.addEventListener('drop', (event) => {
      event.preventDefault();
      
      if (this.draggedIndex !== null) {
        const allItems = Array.from(this.dom.playlistUl.children) as HTMLLIElement[];
        const newIndex = allItems.findIndex(item => item.classList.contains('dragging'));
        
        if (newIndex !== -1 && newIndex !== this.draggedIndex) {
          this.moveTrack(this.draggedIndex, newIndex);
        }
      }
    });
  }

  /**
   * 获取拖拽后的目标位置
   */
  private getDragAfterElement(y: number): HTMLLIElement | null {
    const draggableElements = Array.from(
      this.dom.playlistUl.querySelectorAll('li:not(.dragging)')
    ) as HTMLLIElement[];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY, element: null as HTMLLIElement | null }).element;
  }
} 
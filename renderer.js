// --- DOM Elements ---
const addFilesBtn = document.getElementById('add-files-btn');
const clearPlaylistBtn = document.getElementById('clear-playlist-btn'); // 获取清空按钮
const trackInfoDiv = document.getElementById('track-info');
const audioPlayer = document.getElementById('audio-player');
const playlistUl = document.getElementById('playlist'); // 获取 ul 元素
const togglePlaylistBtn = document.getElementById('toggle-playlist-btn'); // 获取切换按钮
const playlistContainer = document.getElementById('playlist-container'); // 获取播放列表容器
const albumArtImg = document.getElementById('album-art-img'); // 获取封面图片元素
const defaultCoverPath = './assets/default-cover.png'; // 定义默认封面路径
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const currentTimeSpan = document.querySelector('.current-time');
const totalTimeSpan = document.querySelector('.total-time');
const playIcon = playPauseBtn.querySelector('.play-icon');
const pauseIcon = playPauseBtn.querySelector('.pause-icon');
const progressBar = document.getElementById('progress-bar'); // 获取进度条 input
const volumeBtn = document.getElementById('volume-btn');
const volumeSlider = document.getElementById('volume-slider');
const volumeHighIcon = volumeBtn.querySelector('.volume-high-icon');
const volumeMutedIcon = volumeBtn.querySelector('.volume-muted-icon');

// --- State ---
let playlistData = []; // 存储播放列表数据 { filePath: string, metadata: object | null, displayTitle: string }
let currentTrackIndex = -1; // 当前播放曲目的索引, -1 表示没有播放
let draggedIndex = null; // 用于存储正在拖动的项目的索引
let isHandlingError = false; // 添加一个标志位，防止错误处理重入
let isSeeking = false; // 新增：标记用户是否正在拖动进度条
let playNextTimeoutId = null; // 跟踪 setTimeout
// let currentlyPlayingFilePath = null; // 用于在重新排序时跟踪当前播放歌曲

// --- Helper Functions ---

// 从文件路径或元数据生成显示标题
function getDisplayTitle(fileInfo) {
    if (!fileInfo) return '未知曲目';
    const { metadata, filePath } = fileInfo;
    if (metadata) {
        const title = metadata.title;
        const artist = metadata.artist || metadata.artists?.join(', ');
        if (title && artist) return `${title} - ${artist}`;
        if (title) return title;
        if (artist) return `${artist} - ${getFilename(filePath)}`;
    }
    return getFilename(filePath); // 回退到文件名
}

// 从完整路径获取文件名 (保持不变)
function getFilename(filePath) {
    if (!filePath) return '';
    const parts = filePath.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1];
}

// 格式化时间 (秒 -> MM:SS)
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// 更新播放列表 UI (添加 console.log)
function updatePlaylistUI(currentPlayingPath = null) {
    console.log('[updatePlaylistUI] Start.');
    // 使用传入的路径，或者如果没传，则尝试用当前索引获取
    const playingPath = currentPlayingPath ?? (currentTrackIndex !== -1 && playlistData[currentTrackIndex] 
                        ? playlistData[currentTrackIndex].filePath 
                        : null);
    console.log('[updatePlaylistUI] Using playingPath:', playingPath);
    let newPlayingIndex = -1; // 用于存储找到的新索引

    playlistUl.innerHTML = ''; 

    if (playlistData.length === 0) {
        console.log('[updatePlaylistUI] Playlist is empty. Displaying prompt.');
        const emptyLi = document.createElement('li');
        emptyLi.textContent = '将音乐文件拖放到这里或点击“添加”';
        emptyLi.style.textAlign = 'center';
        // emptyLi.style.color = '#888';
        emptyLi.style.cursor = 'default'; 
        playlistUl.appendChild(emptyLi);
        currentTrackIndex = -1; // 确保空列表时索引为 -1
        console.log('[updatePlaylistUI] Finished. Playlist empty, index set to -1.');
        return; 
    }

    playlistData.forEach((fileInfo, index) => {
        const li = document.createElement('li');
        li.dataset.index = index; 
        li.draggable = true;

        // 将点击监听器添加到 li 元素
        li.addEventListener('click', (event) => {
            // 检查点击事件是否发生在删除按钮上
            if (event.target.closest('.delete-track-btn')) {
                console.log('[li click] Clicked on delete button, ignoring play.');
                return; // 如果是删除按钮，则不执行播放逻辑
            }
            // 否则，执行播放逻辑
            console.log(`[li click] Clicked on li index ${index}, triggering play.`);
            playTrack(index);
        });

        const titleSpan = document.createElement('span');
        titleSpan.className = 'track-title';
        titleSpan.textContent = fileInfo.displayTitle;
        // titleSpan.addEventListener('click', () => {
        //     playTrack(index);
        // });
        li.appendChild(titleSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-track-btn';
        deleteBtn.innerHTML = '&times;'; 
        deleteBtn.title = '从列表中移除'; 
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation(); 
            deleteTrack(index);
        });
        li.appendChild(deleteBtn);

        // 检查并记录当前播放状态的新索引
        if (playingPath && fileInfo.filePath === playingPath) {
            console.log(`[updatePlaylistUI] Found playing track '${fileInfo.displayTitle}' at new index: ${index}`);
            li.classList.add('playing');
            newPlayingIndex = index; // 记录新索引
        }

        playlistUl.appendChild(li);
    });

    // 循环结束后，更新全局的 currentTrackIndex
    currentTrackIndex = newPlayingIndex;
    console.log('[updatePlaylistUI] Finished. Final currentTrackIndex:', currentTrackIndex); 
}

// 更新播放/暂停按钮的图标和 title
function updatePlayPauseButton(isPlaying) {
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'inline-block'; // 或者 'block'
        playPauseBtn.title = '暂停';
    } else {
        playIcon.style.display = 'inline-block'; // 或者 'block'
        pauseIcon.style.display = 'none';
        playPauseBtn.title = '播放';
    }
}

// 更新音量图标和滑块填充
function updateVolumeUI(volume, isMuted) {
    // 更新图标
    if (isMuted || volume === 0) {
        volumeHighIcon.style.display = 'none';
        volumeMutedIcon.style.display = 'inline-block';
        volumeBtn.title = '取消静音';
    } else {
        volumeHighIcon.style.display = 'inline-block';
        volumeMutedIcon.style.display = 'none';
        volumeBtn.title = '静音';
        // 可选：根据音量大小显示不同图标 (low, medium, high)
        // if (volume < 0.1) { /* 显示静音图标 */ }
        // else if (volume < 0.6) { /* 显示低音量图标 */ } 
        // else { /* 显示高音量图标 */ }
    }

    // 更新滑块的值和背景填充
    volumeSlider.value = isMuted ? 0 : volume; // 静音时滑块也归零
    // 通过改变 background-size 的宽度百分比来模拟填充效果
    volumeSlider.style.backgroundSize = `${volumeSlider.value * 100}% 100%`; 
}

// 播放指定索引的曲目 (修改以加载封面)
async function playTrack(index) {
    console.log(`[playTrack] Attempting to play index: ${index}`);
    if (index < 0 || index >= playlistData.length) {
        console.warn('[playTrack] Invalid track index or playlist empty. Stopping playback.');
        stopPlayback(); 
        trackInfoDiv.textContent = '播放列表为空或索引无效';
        return;
    }

    // 检查是否点击了当前已在播放的歌曲
    if (index === currentTrackIndex && !audioPlayer.paused) {
        console.log(`[playTrack] Track at index ${index} is already playing.`);
         // 可选：实现点击已播放歌曲暂停/重新播放的逻辑
         // audioPlayer.pause(); 
         return; // 或者根据需要决定是否重新加载
    }

    currentTrackIndex = index; 
    const trackToPlay = playlistData[currentTrackIndex];
    console.log(`[playTrack] File path to play: ${trackToPlay.filePath}`); // <-- 添加日志
    console.log(`[playTrack] Display title: ${trackToPlay.displayTitle}`); // <-- 添加日志

    // --- 检查路径是否看起来有效 ---
    if (!trackToPlay.filePath || typeof trackToPlay.filePath !== 'string') {
        console.error('[playTrack] Invalid file path found in playlist data!', trackToPlay);
        handlePlaybackError(); // 触发错误处理
        return; // 阻止继续执行
    }
    // --- 检查结束 ---

    console.log(`[playTrack] Setting currentTrackIndex to: ${currentTrackIndex}`);
    console.log(`[playTrack] Playing track: ${trackToPlay.displayTitle}, Path: ${trackToPlay.filePath}`);
    trackInfoDiv.textContent = `当前播放: ${trackToPlay.displayTitle}`;

    // --- 修改：设置 src，但不显式调用 load ---
    audioPlayer.src = trackToPlay.filePath;
    // audioPlayer.load(); // 移除或注释掉这行，设置 src 通常会自动加载
    // --- 修改结束 ---

    const playPromise = audioPlayer.play(); 

    // --- 新增：异步获取并设置专辑封面 ---
    // 先设置为默认封面
    albumArtImg.src = defaultCoverPath; 
    try {
        console.log(`[playTrack] Requesting album art for: ${trackToPlay.filePath}`);
        const imageUrl = await window.electronAPI.getAlbumArt(trackToPlay.filePath);
        if (imageUrl) {
            console.log('[playTrack] Received album art data URL.');
            albumArtImg.src = imageUrl; // 设置获取到的封面
        } else {
            console.log('[playTrack] No album art received, keeping default.');
            // 如果没有获取到，保持默认封面即可，因为上面已经设置了
        }
    } catch (error) {
        console.error('[playTrack] Error getting album art:', error);
        albumArtImg.src = defaultCoverPath; // 出错时也设置为默认
    }
    // --- 封面逻辑结束 ---

    // 确保播放操作完成（虽然我们不一定需要等待它）
    if (playPromise !== undefined) {
        playPromise.catch(e => {
            // 检查是否是用户中止的错误，如果是，可以不视为严重错误
            if (e.name === 'AbortError') {
                console.warn(`[playTrack] Playback aborted (likely due to rapid transition): ${e.message}`);
            } else {
                console.error("[playTrack] Error playing audio:", e);
                handlePlaybackError(); 
            }
        });
    }

    console.log('[playTrack] Calling updatePlaylistUI to highlight track.');
    updatePlaylistUI(); // 更新 UI 以高亮新播放的曲目
}

// 停止播放并清除状态 (修改以重置封面)
// stopPlayback 函数确保重置状态和 UI (修改版)
function stopPlayback() {
    console.log('[stopPlayback] Stopping playback and clearing state.');
    audioPlayer.pause(); // 先暂停

    // --- 谨慎地清空 src ---
    // 检查 src 是否已经是空的，避免不必要的设置
    if (audioPlayer.src && audioPlayer.src !== '') {
        console.log('[stopPlayback] Clearing audio source.');
        audioPlayer.src = '';
        // 在清空 src 后不建议立即调用 load()，因为它可能在空 src 上也触发事件
        // audioPlayer.load(); 
    } else {
        console.log('[stopPlayback] Audio source already empty or not set.');
    }
    // --- src 清空结束 ---

    const oldIndex = currentTrackIndex;
    currentTrackIndex = -1;
    trackInfoDiv.textContent = '当前未播放';
    albumArtImg.src = defaultCoverPath; 
    updatePlayPauseButton(false); // 确保按钮是播放状态
    console.log(`[stopPlayback] Set currentTrackIndex to -1 (was ${oldIndex}). Reset album art. Calling updatePlaylistUI.`);
    updatePlaylistUI(); 
}

// 删除指定索引的曲目 (添加 console.log)
function deleteTrack(indexToDelete) {
    console.log(`[deleteTrack] Attempting to delete index: ${indexToDelete}`);
    if (indexToDelete < 0 || indexToDelete >= playlistData.length) {
        console.error('[deleteTrack] Invalid index to delete:', indexToDelete);
        return;
    }

    // 在修改数组前获取当前播放路径
    const playingPathBeforeDelete = currentTrackIndex !== -1 && playlistData[currentTrackIndex]
                                    ? playlistData[currentTrackIndex].filePath 
                                    : null;
    const deletedFilePath = playlistData[indexToDelete].filePath; 
    const wasCurrentlyPlaying = (deletedFilePath === playingPathBeforeDelete);
    console.log(`[deleteTrack] Deleting path: ${deletedFilePath}`);
    console.log(`[deleteTrack] Was currently playing: ${wasCurrentlyPlaying}`);

    // 从播放列表数据中移除
    playlistData.splice(indexToDelete, 1);
    console.log('[deleteTrack] Track removed from playlistData.');

    if (wasCurrentlyPlaying) {
        console.log('[deleteTrack] Deleted track was playing. Determining next action.');
        if (playlistData.length === 0) {
            console.log('[deleteTrack] Playlist empty after deleting playing track. Stopping playback.');
            stopPlayback(); 
        } else {
            // 尝试播放下一首（或新的最后一首）
            const nextIndex = Math.min(indexToDelete, playlistData.length - 1);
            console.log(`[deleteTrack] Playlist not empty. Playing next track at index: ${nextIndex}`);
            playTrack(nextIndex); 
        }
    } else {
        // 如果删除的不是当前播放的歌曲, 只需更新 UI 即可
        console.log('[deleteTrack] Deleted track was not playing. Calling updatePlaylistUI to refresh list and potentially update index.');
        updatePlaylistUI(playingPathBeforeDelete);
    }
    
    // 如果列表变空（即使删的是非播放项），确保信息正确
    if (playlistData.length === 0 && !wasCurrentlyPlaying) {
        console.log('[deleteTrack] Playlist became empty after deleting non-playing track.');
        // stopPlayback(); // 确保状态清除
        if (currentTrackIndex !== -1) stopPlayback(); // 如果之前有播放则停止
        trackInfoDiv.textContent = '播放列表为空';
    } else if (playlistData.length === 0 && wasCurrentlyPlaying) {
        // stopPlayback 已经处理了信息，但可以再确认一下
        trackInfoDiv.textContent = '播放列表为空';
    }

    console.log('[deleteTrack] Finished. Playlist size:', playlistData.length);
}

// 清空整个播放列表 (修改以重置封面)
function clearPlaylist() {
    console.log('[clearPlaylist] Clearing playlist.');
    stopPlayback(); // stopPlayback 会清空状态并调用 updatePlaylistUI
    playlistData = []; 
    trackInfoDiv.textContent = '播放列表已清空';
    // albumArtImg.src = defaultCoverPath; // stopPlayback 已经做了
    console.log('[clearPlaylist] Playlist data cleared.');
    // updatePlaylistUI(); // stopPlayback 已调用
}

// --- Drag and Drop Event Handlers ---

// 辅助函数：获取拖动经过的 li 元素及其索引
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')]; // 获取所有非拖动中的 li

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2; // 计算鼠标位置与元素中点的垂直距离
        // 如果距离小于 0 (鼠标在元素上半部分) 且比当前最近的距离更近
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element; // 初始设为负无穷远
}

playlistUl.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'LI' && e.target.draggable) {
        draggedIndex = parseInt(e.target.dataset.index);
        // 延迟添加 dragging 类，有时可以改善视觉效果
        setTimeout(() => e.target.classList.add('dragging'), 0); 
        e.dataTransfer.setData('text/plain', draggedIndex);
        e.dataTransfer.effectAllowed = 'move'; 
        console.log(`[dragstart] Drag Start on index: ${draggedIndex}`);
    } else {
        e.preventDefault(); 
    }
});

playlistUl.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    const targetLi = e.target.closest('li');
    
    // 清除旧的 over 样式
    const currentOver = playlistUl.querySelector('.over');
    if (currentOver && currentOver !== targetLi) {
        currentOver.classList.remove('over');
    }

    // 添加 over 样式到当前悬停的 li (如果它不是被拖动的元素)
    if (targetLi && !targetLi.classList.contains('dragging') && !targetLi.classList.contains('over')) {
        targetLi.classList.add('over');
        // console.log(`[dragover] Added .over to index: ${targetLi.dataset.index}`); // 这个日志可能过于频繁
    }
    
    e.dataTransfer.dropEffect = 'move'; 
});
playlistUl.addEventListener('dragleave', (e) => {
    const targetLi = e.target.closest('li');
    if (targetLi && targetLi.classList.contains('over')) {
        targetLi.classList.remove('over');
        // console.log(`[dragleave] Removed .over from index: ${targetLi.dataset.index}`); // 这个日志可能过于频繁
    }
});


playlistUl.addEventListener('drop', (e) => {
    console.log('[drop] Drop event triggered.');
    e.preventDefault(); 
    const targetLi = e.target.closest('li:not(.dragging)'); // 确保目标不是正在拖动的元素本身
    
    // 清除 over 样式
    const currentOver = playlistUl.querySelector('.over');
    if (currentOver) {
        console.log(`[drop] Removing .over from index: ${currentOver.dataset.index}`);
        currentOver.classList.remove('over');
    }
    
    const draggedElement = playlistUl.querySelector('.dragging');
    if (draggedElement) {
        console.log(`[drop] Removing .dragging from index: ${draggedElement.dataset.index}`);
        draggedElement.classList.remove('dragging');
    }

    // 检查拖动索引和目标是否有效
    if (draggedIndex === null || !targetLi || !playlistData[draggedIndex]) {
        console.warn('[drop] Drop cancelled. Invalid draggedIndex, targetLi, or data.', { draggedIndex, targetLiExists: !!targetLi });
        draggedIndex = null; 
        return; 
    }

    const targetIndex = parseInt(targetLi.dataset.index);
    console.log(`[drop] Dropped index ${draggedIndex} onto index ${targetIndex}`);

    // 避免拖放到自身位置（虽然理论上 targetLi 不会是 dragging 的，但多一层保险）
    if (draggedIndex === targetIndex) {
        console.log('[drop] Dropped onto original position. No change needed.');
        draggedIndex = null;
        return;
    }

    // --- 关键修改：在修改 playlistData 之前获取当前播放路径 ---
    const playingPathBeforeReorder = currentTrackIndex !== -1 && playlistData[currentTrackIndex]
                                     ? playlistData[currentTrackIndex].filePath
                                     : null;

    console.log('[drop] Playlist data BEFORE reorder:', playingPathBeforeReorder);

    // --- 重新排序 playlistData ---
    // 1. 从数组中移除被拖动的项
    const [draggedItem] = playlistData.splice(draggedIndex, 1);
    console.log(`[drop] Removed item '${draggedItem.displayTitle}' from index ${draggedIndex}`);

    // 2. 将被拖动的项插入到目标索引位置
    playlistData.splice(targetIndex, 0, draggedItem);
    console.log(`[drop] Inserted item '${draggedItem.displayTitle}' at index ${targetIndex}`);

    console.log('[drop] Playlist data AFTER reorder:', JSON.stringify(playlistData.map(t => t.displayTitle)));

    // 3. 更新 UI 并恢复播放状态
    console.log('[drop] Calling updatePlaylistUI to reflect reordering.');
    updatePlaylistUI(playingPathBeforeReorder); 

    draggedIndex = null; // 重置拖动索引
    console.log('[drop] Drop handling finished.');
});

playlistUl.addEventListener('dragend', (e) => {
    console.log('[dragend] Drag End event.');
    // 清理可能残留的 dragging 样式 (以防 drop 未触发或失败)
    const draggedElement = playlistUl.querySelector('.dragging');
    if (draggedElement) {
        console.log('[dragend] Cleaning up .dragging class.');
        draggedElement.classList.remove('dragging');
    }
    // 清理可能残留的 over 样式
    const currentOver = playlistUl.querySelector('.over');
    if (currentOver) {
        console.log('[dragend] Cleaning up .over class.');
        currentOver.classList.remove('over');
    }
    
    draggedIndex = null; // 确保重置
    console.log('[dragend] Drag index reset.');
});

// --- Event Listeners ---

// 添加文件按钮点击事件
addFilesBtn.addEventListener('click', async () => {
    console.log('[addFilesBtn] Clicked.');
    const newFiles = await window.electronAPI.openFile();

    if (newFiles && newFiles.length > 0) {
        console.log('[addFilesBtn] Received file data from main process:', JSON.stringify(newFiles, null, 2));
        
        const newPlaylistItems = newFiles.map(fileInfo => ({
            ...fileInfo, 
            displayTitle: getDisplayTitle(fileInfo) 
        }));

        const wasPlaylistEmpty = playlistData.length === 0; 
        playlistData = playlistData.concat(newPlaylistItems); 
        console.log('[addFilesBtn] Playlist data updated. Calling updatePlaylistUI.');
        updatePlaylistUI(); // 更新 UI

        if (wasPlaylistEmpty && playlistData.length > 0) {
            console.log('[addFilesBtn] Playlist was empty, playing first added track (index 0).');
            playTrack(0); 
        } else {
            console.log('[addFilesBtn] Playlist was not empty or no files added. No auto-play triggered.');
        }
    } else {
        console.log('[addFilesBtn] No files selected or added.');
    }
});

// 清空按钮点击事件
clearPlaylistBtn.addEventListener('click', clearPlaylist);

// 播放列表切换按钮点击事件
togglePlaylistBtn.addEventListener('click', () => {
    console.log('[togglePlaylistBtn] Clicked.');
    // 切换 playlist-hidden 类
    playlistContainer.classList.toggle('playlist-hidden');

    // 根据是否包含 'playlist-hidden' 类来更新按钮图标
    if (playlistContainer.classList.contains('playlist-hidden')) {
        // 如果已隐藏，显示右指向图标 (表示点击会显示)
        togglePlaylistBtn.innerHTML = '&#x25B6;'; // ►
        togglePlaylistBtn.title = '显示播放列表';
        console.log('[togglePlaylistBtn] Playlist hidden.');
    } else {
        // 如果已显示，显示左指向图标 (表示点击会隐藏)
        togglePlaylistBtn.innerHTML = '&#x25C0;'; // ◀
        togglePlaylistBtn.title = '隐藏播放列表';
        console.log('[togglePlaylistBtn] Playlist shown.');
    }
});

// 音频播放结束事件 - 自动播放下一首
audioPlayer.addEventListener('ended', () => {
    console.log('Track ended. Playing next.');
    currentTimeSpan.textContent = formatTime(0); 
    updatePlayPauseButton(false); 

    // --- 增加检查 ---
    if (currentTrackIndex === -1 || playlistData.length === 0) { 
        console.log('[audioEnded] No valid current track or empty playlist, stopping.');
        // 确保完全停止，以防万一 stopPlayback 没完全清理干净
        if (!audioPlayer.paused) audioPlayer.pause();
        if (audioPlayer.src) audioPlayer.src = '';
        currentTrackIndex = -1; // 再次确认索引
        updatePlaylistUI(); // 更新高亮（应该没有高亮了）
        return; 
    }
    // --- 检查结束 --

    const nextIndex = currentTrackIndex + 1;
    if (nextIndex >= playlistData.length) {
        console.log('End of playlist reached.');
        stopPlayback(); // 播放完毕停止
        trackInfoDiv.textContent = '播放列表已结束';
        // updatePlaylistUI(); // 更新 UI 移除高亮
        // playTrack(0); // 循环播放
    } else {
        playTrack(nextIndex);
    }
});

// 辅助函数处理播放错误后的逻辑 (修改版)
function handlePlaybackError() {
    // --- 防止错误处理重入 ---
    if (isHandlingError) {
        console.warn('[handlePlaybackError] Already handling an error, ignoring subsequent error.');
        return; // 如果已经在处理错误，则直接返回，避免循环
    }
    isHandlingError = true; // 标记开始处理错误
    console.warn('[handlePlaybackError] Handling playback error.');
    // --- 重入保护结束 ---

    const trackInfo = currentTrackIndex !== -1 ? playlistData[currentTrackIndex] : null;
    const trackName = trackInfo ? trackInfo.displayTitle : '文件';
    trackInfoDiv.textContent = `错误: 无法播放 ${trackName}。`;

    console.log('[handlePlaybackError] Stopping playback due to error.');
    stopPlayback(); // 调用 stopPlayback 清理状态

    // --- 延迟重置错误处理标志 ---
    // 给一小段时间让状态稳定下来，避免因清理操作本身触发的瞬时错误导致循环
    setTimeout(() => {
        isHandlingError = false;
        console.log('[handlePlaybackError] Error handling flag reset.');
    }, 100); // 100毫秒延迟
    // --- 延迟结束 ---
}

audioPlayer.addEventListener('canplay', () => {
    // 这个事件可能会频繁触发，谨慎添加日志
    // console.log('[canplay] Audio can play.'); 
    if (currentTrackIndex !== -1 && playlistData[currentTrackIndex]) {
        // 确保信息显示正确
        trackInfoDiv.textContent = `当前播放: ${playlistData[currentTrackIndex].displayTitle}`;
    } else if (currentTrackIndex === -1) {
        // 如果因为某种原因索引是 -1 但 canplay 触发了，确保信息一致
        trackInfoDiv.textContent = '当前未播放';
    }
});

// 播放/暂停按钮点击事件
playPauseBtn.addEventListener('click', () => {
    if (!audioPlayer.src) { // 检查是否有音频源
        console.log('[playPauseBtn] No audio source loaded.');
        // 可以考虑播放列表的第一首歌，如果列表不为空
        if(playlistData.length > 0 && currentTrackIndex === -1) {
            playTrack(0);
        }
        return; 
    }

    if (audioPlayer.paused) {
        console.log('[playPauseBtn] Audio paused, playing...');
        audioPlayer.play().catch(handlePlaybackError); // 播放并处理潜在错误
    } else {
        console.log('[playPauseBtn] Audio playing, pausing...');
        audioPlayer.pause();
    }
    // 注意：播放状态的图标更新将在 'play' 和 'pause' 事件中处理
});

// 上一首按钮点击事件
prevBtn.addEventListener('click', () => {
    console.log('[prevBtn] Clicked.');
    if (playlistData.length === 0) return; // 列表为空则不操作
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) {
        prevIndex = playlistData.length - 1; // 循环到最后一首
    }
    playTrack(prevIndex);
});

// 下一首按钮点击事件
nextBtn.addEventListener('click', () => {
    console.log('[nextBtn] Clicked.');
    if (playlistData.length === 0) return; // 列表为空则不操作
    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= playlistData.length) {
        nextIndex = 0; // 循环到第一首
    }
    playTrack(nextIndex);
});

// --- Audio Element Event Listeners ---

// 当音频开始播放时
audioPlayer.addEventListener('play', () => {
    console.log('[audioEvent] Play event triggered.');
    updatePlayPauseButton(true); // 更新按钮为暂停状态
});

// 当音频暂停时
audioPlayer.addEventListener('pause', () => {
    console.log('[audioEvent] Pause event triggered.');
    updatePlayPauseButton(false); // 更新按钮为播放状态
});

// 当音频元数据加载完成时 (获取总时长)
audioPlayer.addEventListener('loadedmetadata', () => {
    console.log('[audioEvent] Loaded metadata.');
    totalTimeSpan.textContent = formatTime(audioPlayer.duration);
    progressBar.max = audioPlayer.duration; // <-- 设置进度条最大值
    progressBar.value = 0; // 确保新歌开始时进度条在开头
    currentTimeSpan.textContent = formatTime(0); // 确保时间显示也重置
    // --- 重置填充 ---
    // progressBar.style.backgroundSize = '0% 100%'; 
    // --- 重置渐变背景 ---
    progressBar.style.background = `linear-gradient(to right, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.2) 0%)`;
});

// 当播放时间更新时
audioPlayer.addEventListener('timeupdate', () => {
    currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
    if (!isSeeking) { 
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration;
        let percentage = 0; // 默认百分比为 0

        // --- 增加检查：确保 duration 是有效的数字 ---
        if (duration && typeof duration === 'number' && duration > 0) {
            percentage = (currentTime / duration) * 100;
        } else {
            // 如果 duration 无效（例如 NaN 或 0），则保持百分比为 0
            console.warn(`[timeupdate] Invalid duration (${duration}) detected. Resetting percentage to 0.`);
        }
        // --- 检查结束 ---

        progressBar.value = currentTime; // 更新滑块位置仍然需要

        // --- 添加日志：打印计算出的百分比和将要设置的 backgroundSize ---
        // const newBackgroundSize = `${percentage}% 100%`;
        // console.log(`[timeupdate] currentTime: ${currentTime.toFixed(2)}, duration: ${duration}, percentage: ${percentage.toFixed(2)}%, Setting backgroundSize to: ${newBackgroundSize}`);
        // --- 日志结束 ---

        // --- 更新渐变背景 ---
        progressBar.style.background = `linear-gradient(to right, rgba(255, 255, 255, 0.7) ${percentage}%, rgba(255, 255, 255, 0.2) ${percentage}%)`;
        // --- 更新结束 ---
    }
});

// 当音频播放结束时 (除了播放下一首，也重置时间显示)
audioPlayer.addEventListener('ended', () => {
    // --- 添加非常详细的日志 ---
    console.log('------------------------------------'); // 分隔符
    console.log('[audioEnded] Event triggered.');
    const endedTrackIndex = currentTrackIndex; // 捕获事件触发时的索引
    console.log(`[audioEnded] currentTrackIndex BEFORE processing: ${currentTrackIndex}`);
    console.log(`[audioEnded] playlistData.length: ${playlistData.length}`);
    // --- 日志结束 ---

    currentTimeSpan.textContent = formatTime(0); // 重置当前时间显示
    // totalTimeSpan.textContent = formatTime(0); // 总时长通常保留
    updatePlayPauseButton(false); // 确保按钮是播放状态

    // --- 清理任何可能存在的旧 timeout ---
    if (playNextTimeoutId) { // 假设你在 state 中定义了 let playNextTimeoutId = null;
        clearTimeout(playNextTimeoutId);
        console.log('[audioEnded] Cleared previous playNext timeout.');
        playNextTimeoutId = null;
    }
    // --- 清理结束 ---

    // 检查索引有效性
    if (currentTrackIndex === -1 || playlistData.length === 0) { 
        console.log('[audioEnded] Condition (currentTrackIndex === -1 || playlistData.length === 0) is TRUE. Stopping.'); // <-- 日志
        if (!audioPlayer.paused) audioPlayer.pause();
        if (audioPlayer.src) audioPlayer.src = '';
        currentTrackIndex = -1; 
        updatePlaylistUI(); 
        console.log('------------------------------------'); // 分隔符
        return; 
    }

    console.log('[audioEnded] Condition (currentTrackIndex === -1 || playlistData.length === 0) is FALSE. Proceeding...'); // <-- 日志

    progressBar.value = 0; // <-- 重置进度条值
    // --- 重置渐变背景 ---
    progressBar.style.background = `linear-gradient(to right, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.2) 0%)`;

    // const nextIndex = currentTrackIndex + 1;
    const nextIndex = currentTrackIndex
    console.log(`[audioEnded] Calculated nextIndex: ${nextIndex}`); // <-- 日志

    // 检查是否到达列表末尾
    if (nextIndex >= playlistData.length) {
        console.log('[audioEnded] Condition (nextIndex >= playlistData.length) is TRUE. End of playlist reached.'); // <-- 日志
        stopPlayback(); 
        trackInfoDiv.textContent = '播放列表已结束';
    } else {
        console.log('[audioEnded] Condition (nextIndex >= playlistData.length) is FALSE. Preparing to play next song.'); 
        
        // 使用 setTimeout 
        playNextTimeoutId = setTimeout(() => { // 保存 timeout ID
            // --- 在执行播放前再次检查状态 ---
            if (currentTrackIndex === endedTrackIndex) { // 检查索引是否仍是刚结束那首歌的索引
                console.log(`[audioEnded] setTimeout: State consistent (currentTrackIndex still ${endedTrackIndex}). Calling playTrack for index ${nextIndex}`);
                playTrack(nextIndex);
            } else {
                console.warn(`[audioEnded] setTimeout: State changed during timeout (currentTrackIndex is now ${currentTrackIndex}, expected ${endedTrackIndex}). Aborting play next.`);
            }
            playNextTimeoutId = null; // 清除 ID
            // --- 检查结束 ---
        }, 50); 

        // // 移除 setTimeout，直接播放下一首
        // if (currentTrackIndex === endedTrackIndex) {
        //     console.log(`[audioEnded] Immediately playing next index: ${nextIndex}`);
        //     playTrack(nextIndex);
        // }
    }
    console.log('------------------------------------'); // 分隔符
});

// --- Progress Bar Event Listeners ---

// 当用户开始与进度条交互时 (按下鼠标或触摸开始)
progressBar.addEventListener('input', () => {
    if (!isSeeking) { // 第一次触发 input 时标记为正在拖动
        console.log('[progressBar] Start seeking (input event).');
        isSeeking = true;
    }
    // 可以在这里实时更新时间显示，但不更新音频 currentTime
    currentTimeSpan.textContent = formatTime(progressBar.value); 
    // --- 实时更新填充 ---
    const percentage = (progressBar.value / progressBar.max) * 100;
    progressBar.style.background = `linear-gradient(to right, rgba(255, 255, 255, 0.7) ${percentage}%, rgba(255, 255, 255, 0.2) ${percentage}%)`;
});

// 当用户完成交互时 (松开鼠标或触摸结束)
progressBar.addEventListener('change', () => {
    console.log(`[progressBar] Finish seeking (change event). Setting time to: ${progressBar.value}`);
    audioPlayer.currentTime = progressBar.value; // 设置音频的播放时间
    // --- 确保渐变与最终值一致 ---
    const percentage = (progressBar.value / progressBar.max) * 100;
    progressBar.style.background = `linear-gradient(to right, rgba(255, 255, 255, 0.7) ${percentage}%, rgba(255, 255, 255, 0.2) ${percentage}%)`;
    // --- 更新结束 ---
    isSeeking = false; // 取消拖动标记
    // 如果此时音频是暂停的，可能需要手动调用 play()
    // if (audioPlayer.paused) {
    //    audioPlayer.play().catch(handlePlaybackError);
    // }
});

// 可选：处理鼠标松开事件，确保 isSeeking 被重置
progressBar.addEventListener('mouseup', () => {
    if (isSeeking) {
        console.log('[progressBar] Mouse up during seeking.');
        // change 事件通常会处理，但可以作为备用
        // audioPlayer.currentTime = progressBar.value; 
        // isSeeking = false;
    }
});
 // 可选：处理触摸结束事件
progressBar.addEventListener('touchend', () => {
    if (isSeeking) {
        console.log('[progressBar] Touch end during seeking.');
        // change 事件通常会处理
        // audioPlayer.currentTime = progressBar.value; 
        // isSeeking = false;
    }
});

// --- Volume Control Event Listeners ---

// 当音量滑块的值改变时 (拖动中)
volumeSlider.addEventListener('input', () => {
    const newVolume = parseFloat(volumeSlider.value);
    audioPlayer.volume = newVolume; // 直接设置音量
    audioPlayer.muted = newVolume === 0; // 如果拖到0，则静音
    console.log(`[volumeSlider] Volume changed to: ${newVolume}, Muted: ${audioPlayer.muted}`);
    // 实时更新 UI (图标和填充)
    updateVolumeUI(newVolume, audioPlayer.muted); 
});

// 点击音量按钮 (切换静音)
volumeBtn.addEventListener('click', () => {
    audioPlayer.muted = !audioPlayer.muted; // 切换静音状态
    console.log(`[volumeBtn] Muted toggled to: ${audioPlayer.muted}`);
    // 更新 UI (图标和填充) - 使用当前的实际音量（如果取消静音）
    updateVolumeUI(audioPlayer.volume, audioPlayer.muted); 
});

// --- 初始化音量UI ---
// 在脚本加载后，根据 audioPlayer 的初始状态设置一次 UI
updateVolumeUI(audioPlayer.volume, audioPlayer.muted); 

// 错误处理
audioPlayer.addEventListener('error', (e) => {
    console.error('[audioError] Audio Element Error Event:', e);
    // 尝试打印更详细的错误信息
    if (e.target && e.target.error) {
        console.error('[audioError] MediaError details:', {
            code: e.target.error.code, // 错误代码
            message: e.target.error.message // 错误信息
        });
        // 常见的 MediaError 代码:
        // 1: MEDIA_ERR_ABORTED - 用户中止
        // 2: MEDIA_ERR_NETWORK - 网络错误
        // 3: MEDIA_ERR_DECODE - 解码错误
        // 4: MEDIA_ERR_SRC_NOT_SUPPORTED - 源不支持或无效
    }
    // 调用统一的错误处理函数
    handlePlaybackError();
});

// --- Initial Load ---
// 应用启动时可以尝试加载上次的播放列表（如果实现了持久化）
// 目前启动时列表为空
console.log('[Initial Load] Calling updatePlaylistUI.');
updatePlaylistUI();
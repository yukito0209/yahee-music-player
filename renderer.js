// renderer.js

// --- DOM Elements ---
const addFilesBtn = document.getElementById('add-files-btn');
const clearPlaylistBtn = document.getElementById('clear-playlist-btn'); // 获取清空按钮
const trackInfoDiv = document.getElementById('track-info');
const audioPlayer = document.getElementById('audio-player');
const playlistUl = document.getElementById('playlist'); // 获取 ul 元素
const togglePlaylistBtn = document.getElementById('toggle-playlist-btn'); // 获取切换按钮
const playlistContainer = document.getElementById('playlist-container'); // 获取播放列表容器

// --- State ---
let playlistData = []; // 存储播放列表数据 { filePath: string, metadata: object | null, displayTitle: string }
let currentTrackIndex = -1; // 当前播放曲目的索引, -1 表示没有播放
let draggedIndex = null; // 用于存储正在拖动的项目的索引
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
        emptyLi.style.color = '#888';
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

// 播放指定索引的曲目 (添加 console.log)
function playTrack(index) {
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
    
    console.log(`[playTrack] Setting currentTrackIndex to: ${currentTrackIndex}`);
    console.log(`[playTrack] Playing track: ${trackToPlay.displayTitle}, Path: ${trackToPlay.filePath}`);

    trackInfoDiv.textContent = `当前播放: ${trackToPlay.displayTitle}`;
    audioPlayer.src = trackToPlay.filePath;
    audioPlayer.load(); 
    audioPlayer.play().catch(e => {
        console.error("[playTrack] Error playing audio:", e);
        // 可以在这里调用错误处理逻辑，比如尝试下一首
        handlePlaybackError(); 
    }); 

    console.log('[playTrack] Calling updatePlaylistUI to highlight track.');
    updatePlaylistUI(); // 更新 UI 以高亮新播放的曲目
}

// 停止播放并清除状态 (添加 console.log)
function stopPlayback() {
    console.log('[stopPlayback] Stopping playback and clearing state.');
    audioPlayer.pause();
    audioPlayer.src = '';
    const oldIndex = currentTrackIndex;
    currentTrackIndex = -1;
    trackInfoDiv.textContent = '当前未播放';
    console.log(`[stopPlayback] Set currentTrackIndex to -1 (was ${oldIndex}). Calling updatePlaylistUI.`);
    updatePlaylistUI(); // 停止时也需要更新UI（移除高亮）
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

// 清空整个播放列表 (添加 console.log)
function clearPlaylist() {
    console.log('[clearPlaylist] Clearing playlist.');
    stopPlayback(); // stopPlayback 会清空状态并调用 updatePlaylistUI
    playlistData = []; 
    trackInfoDiv.textContent = '播放列表已清空';
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
        console.log(`[addFilesBtn] Received ${newFiles.length} new files.`);
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
    if (currentTrackIndex === -1 || playlistData.length === 0) {
        // 如果没有有效索引或列表为空，则不执行任何操作
        return;
    }
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

// 辅助函数处理播放错误后的逻辑
function handlePlaybackError() {
    console.warn('[handlePlaybackError] Handling playback error.');
    const trackInfo = currentTrackIndex !== -1 ? playlistData[currentTrackIndex] : null;
    const trackName = trackInfo ? trackInfo.displayTitle : '文件';
    trackInfoDiv.textContent = `错误: 无法播放 ${trackName}。`;

    if (currentTrackIndex !== -1 && playlistData.length > 1) {
        console.log('[handlePlaybackError] Attempting to play next track.');
        const nextIndex = (currentTrackIndex + 1) % playlistData.length; 
        // 检查下一首是否就是当前出错的这首（如果列表只有一首会发生）
        if (nextIndex === currentTrackIndex) {
            console.warn('[handlePlaybackError] Next track is the same as the erroring one. Stopping.');
            stopPlayback();
        } else {
            playTrack(nextIndex);
        }
    } else {
        console.warn('[handlePlaybackError] Playlist empty or only one track. Stopping.');
        stopPlayback();
    }
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

// --- Initial Load ---
// 应用启动时可以尝试加载上次的播放列表（如果实现了持久化）
// 目前启动时列表为空
console.log('[Initial Load] Calling updatePlaylistUI.');
updatePlaylistUI();
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 定义一个名为 openFile 的函数，它会调用主进程的 'dialog:openFile'
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    // --- 新增：暴露获取专辑封面的函数 ---
    getAlbumArt: (filePath) => ipcRenderer.invoke('get-album-art', filePath),
    // --- 新增：窗口控制功能 ---
    minimizeWindow: () => ipcRenderer.send('window:minimize'),
    maximizeWindow: () => ipcRenderer.send('window:maximize'),
    closeWindow: () => ipcRenderer.send('window:close'),
    // --- 新增：请求主进程打开外部链接 ---
    openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
});
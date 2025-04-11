// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 定义一个名为 openFile 的函数，它会调用主进程的 'dialog:openFile'
    openFile: () => ipcRenderer.invoke('dialog:openFile')
});
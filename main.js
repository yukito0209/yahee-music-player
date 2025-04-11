// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const mm = require('music-metadata');

// 创建浏览器窗口函数
const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            // __dirname 指向当前文件的路径
            // path.join 用于拼接路径
            preload: path.join(__dirname, 'preload.js'),
            // 出于安全考虑，推荐保持 contextIsolation 为 true
            contextIsolation: true,
            // 禁用 nodeIntegration，通过 preload 脚本暴露所需功能
            nodeIntegration: false,
        }
    });

    // 加载 index.html 文件
    mainWindow.loadFile('index.html');

    // 可选：打开开发者工具（用于调试）
    mainWindow.webContents.openDevTools();
};

// Electron 应用已准备好时，创建窗口
app.whenReady().then(() => {
    createWindow();

    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
    // 通常会重新创建一个窗口。
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        }
    });
});

// 当所有窗口都关闭时退出应用（Windows 和 Linux）
// macOS 上通常应用会保持活动状态，直到用户使用 Cmd + Q 显式退出
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- IPC 处理 ---
ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: [
            'openFile',
            'multiSelections' // <-- 允许选择多个文件
        ],
        filters: [
            { name: 'Music Files', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a'] }, // 添加 m4a 等常见格式
            { name: 'All Files', extensions: ['*'] }
        ]
        });
    
    if (!canceled && filePaths.length > 0) {
        // 使用 Promise.all 来并行处理所有文件的元数据解析
        const filesData = await Promise.all(
            filePaths.map(async (filePath) => {
                try {
                    const metadata = await mm.parseFile(filePath);
                    console.log(`Metadata parsed for: ${path.basename(filePath)}`);
                    return {
                        filePath: filePath,
                        metadata: metadata.common
                    };
                } catch (error) {
                    console.error(`Failed to parse metadata for ${path.basename(filePath)}:`, error);
                    // 即使元数据解析失败，也包含文件路径，但 metadata 为 null
                    return {
                        filePath: filePath,
                        metadata: null
                    };
                }
            })
        );
        // 返回包含所有文件信息的数组
        return filesData;
    }
    // 用户取消或未选择文件
    return []; // 返回一个空数组表示没有文件被添加
});
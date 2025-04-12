// main.js
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const mm = require('music-metadata');
const util = require('util'); 

// 创建浏览器窗口函数
const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        // --- 添加 icon 属性 ---
        icon: path.join(__dirname, 'assets/icon.png'), // <-- 指向你的图标文件路径
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

    // --- 添加这行来移除菜单栏 ---
    Menu.setApplicationMenu(null); // 设置应用程序菜单为 null 即可隐藏

    // 可选：打开开发者工具（用于调试）
    // mainWindow.webContents.openDevTools();
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
        console.log('[ipcMain dialog:openFile] Raw filePaths from dialog:', filePaths); // <-- 添加日志
        const filesData = await Promise.all(
            filePaths.map(async (filePath) => {
                console.log(`[ipcMain dialog:openFile] Processing filePath: ${filePath}`); // <-- 添加日志
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
        return filesData;
    }
    // 用户取消或未选择文件
    return []; // 返回一个空数组表示没有文件被添加
});

// --- 新增：处理获取专辑封面的请求 ---
ipcMain.handle('get-album-art', async (event, filePath) => {
    console.log(`[ipcMain] Received request for album art: ${filePath}`);
    if (!filePath) return null;
    try {
        const metadata = await mm.parseFile(filePath);
        if (metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];
            console.log(`[ipcMain] Found picture data. Format: '${picture.format}'`);

            // --- 详细检查 picture.data ---
            console.log(`[ipcMain] Type of picture.data: ${typeof picture.data}`);
            console.log(`[ipcMain] Is picture.data a Buffer? ${Buffer.isBuffer(picture.data)}`);
            if (!picture.data) {
                console.warn('[ipcMain] picture.data is missing!');
                return null;
            }
            // --- 检查结束 ---


            if (typeof picture.format !== 'string' || !picture.format.startsWith('image/')) {
                console.warn('[ipcMain] Invalid or missing picture format.');
                return null;
            }

            console.log(`[ipcMain] Generating Base64 data...`);

            // --- 强制确保我们处理的是 Buffer ---
            let pictureBuffer;
            if (Buffer.isBuffer(picture.data)) {
                console.log('[ipcMain] picture.data is already a Buffer.'); // 添加日志确认
                pictureBuffer = picture.data;
            } else if (picture.data instanceof Uint8Array) { // // <-- 新增：检查是否是 Uint8Array
                console.log('[ipcMain] picture.data is a Uint8Array. Converting to Buffer.');
                try {
                    pictureBuffer = Buffer.from(picture.data); // 直接从 Uint8Array 创建 Buffer
                } catch (conversionError) {
                    console.error('[ipcMain] Error converting Uint8Array data:', conversionError);
                    pictureBuffer = null;
                }
            } else if (typeof picture.data === 'object') { // 当它是对象时
                console.log('[ipcMain] picture.data is an object. Inspecting structure:');
                // 使用 util.inspect 打印对象的结构，深度为 2，不显示隐藏属性，不带颜色
                console.log(util.inspect(picture.data, { showHidden: false, depth: 2, colors: false }));
            
                // 尝试猜测常见的对象结构并转换为 Buffer
                if (picture.data.type === 'Buffer' && Array.isArray(picture.data.data)) {
                    // 情况一：对象结构是 { type: 'Buffer', data: [字节数组] }
                    console.log('[ipcMain] Found { type: "Buffer", data: [...] } structure. Converting array to Buffer.');
                    try {
                        pictureBuffer = Buffer.from(picture.data.data); // 从 data 数组创建 Buffer
                    } catch (conversionError) {
                        console.error('[ipcMain] Error converting array-like Buffer data:', conversionError);
                        pictureBuffer = null; // 转换失败
                    }
                } else if (Array.isArray(picture.data)) {
                    // 情况二：对象本身就是一个字节数组
                    console.log('[ipcMain] picture.data seems to be an Array of bytes. Converting array to Buffer.');
                    try {
                        pictureBuffer = Buffer.from(picture.data); // 直接从数组创建 Buffer
                    } catch (conversionError) {
                        console.error('[ipcMain] Error converting array data:', conversionError);
                        pictureBuffer = null; // 转换失败
                    }
                } else {
                    // 情况三：无法识别的对象结构
                    console.error('[ipcMain] picture.data is an unrecognized object structure.');
                    pictureBuffer = null; // 无法处理，标记为 null
                }
            } else {
                // 如果既不是 Buffer 也不是可识别的对象
                console.error('[ipcMain] picture.data is not a Buffer or a recognized object.');
                pictureBuffer = null; // 无法处理
            }
            // --- Buffer 确认结束 ---
            // 检查 pictureBuffer 是否成功获取或转换
            if (!pictureBuffer) {
                console.error("[ipcMain] Failed to obtain or convert pictureBuffer. Cannot proceed.");
                return null; // 如果没有有效的 Buffer，则返回 null
            }

            // --- 使用 pictureBuffer 继续后续处理 ---
            console.log(`[ipcMain] Generating Base64 data from buffer...`);
            const base64Data = pictureBuffer.toString('base64'); // 使用确认后的 Buffer 进行转换

            // --- 再次检查 Base64 字符串 ---
            console.log(`[ipcMain] Raw base64 string (first 100 chars): ${base64Data.substring(0, 100)}...`);
            if (!base64Data || base64Data.includes(',')) { // 检查是否包含逗号或为空
                console.error('[ipcMain] Generated base64 string seems invalid!');
                return null; // 如果看起来仍然无效，则放弃
            }
            // --- 检查结束 ---

            const dataUrl = `data:${picture.format};base64,${base64Data}`;
            console.log(`[ipcMain] Generated Data URL (first 150 chars): ${dataUrl.substring(0, 150)}...`);
            // ... (log last 50 chars) ...
            return dataUrl;
        } else {
            console.log(`[ipcMain] No album art found in metadata.`);
            return null;
        }
    } catch (error) {
        console.error(`[ipcMain] Error parsing file for album art: ${filePath}`, error);
        return null;
    }
});
# YAHEE MUSIC v1.0.0 - 初次发布! 🎉

YAHEE MUSIC 的第一个版本！这是一款基于 Electron 构建的、注重简洁美观的本地音乐播放器。（个人 Electron 学习用）

## ✨ 主要功能

*   **核心播放:** 支持常见的本地音频文件格式 (MP3, FLAC, WAV 等)。
*   **播放列表:**
    *   支持添加多个文件。
    *   支持拖拽排序列表项。
    *   支持删除单个曲目。
    *   支持清空整个列表。
    *   可切换显示/隐藏播放列表面板。
*   **界面与视觉:**
    *   左右分栏布局。
    *   支持自定义背景图片。
    *   播放器控制栏和按钮采用毛玻璃效果 (Glassmorphism)。
    *   自定义滚动条样式。
    *   自定义应用程序图标。
    *   移除了默认的顶部菜单栏，界面更沉浸。
*   **播放控制:**
    *   显示当前播放歌曲的专辑封面（若元数据包含）。
    *   显示歌曲标题和艺术家信息。
    *   自定义播放控件：
        *   播放/暂停按钮。
        *   上一首/下一首按钮。
        *   可交互的进度条，支持点击/拖拽跳转。
        *   音量控制条和静音按钮。
        *   当前播放时间 / 总时长显示。
*   **播放逻辑:**
    *   歌曲播放结束后自动播放列表中的下一首。

## 🚀 下载与安装

请在 **Releases** 中下载适合你操作系统的文件：

*   **目前仅支持 Windows 用户:**
    *   **推荐:** 下载 `YAHEE-MUSIC-1.0.0-win-portable.zip`。解压后，直接运行文件夹内的 `YAHEE MUSIC.exe` 即可。
    *   `YAHEE MUSIC Setup 1.0.0.exe`: 这是标准的安装包。**注意：** 在某些系统环境下，安装过程中可能会遇到权限或解压错误 (`EMFILE` 或符号链接相关)。如果安装失败，请使用上面的 `.zip` 包。

## 📝 已知问题

*   Windows `.exe` 安装包在部分环境中可能安装失败，建议优先使用 `.zip` 便携版。

## 展望

这只是 YAHEE MUSIC 的开始，未来计划添加更多功能，例如：

*   播放模式切换（循环、随机）。
*   播放列表持久化（记住上次的列表）。
*   键盘快捷键支持。
*   性能优化和 Bug 修复。

感谢你的尝试和使用！欢迎通过 [Issues](https://github.com/yukito0209/yahee-music-player/issues) 提出反馈和建议。

---
**界面展示**

![image](https://github.com/user-attachments/assets/b85b062e-7de8-45df-94a0-753a62602162)

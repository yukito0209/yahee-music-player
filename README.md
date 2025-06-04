# YAHEE MUSIC

🎵 一个基于 Electron 和 TypeScript 构建的现代化本地音乐播放器

## ✨ 功能特性

### 🎶 音频播放
- 支持多种音频格式：MP3、FLAC、WAV、M4A、OGG 等
- 高质量音频解码和播放
- 自动读取音频文件元数据（标题、艺术家、专辑、时长等）
- 专辑封面自动提取和显示

### 📋 播放列表管理
- 支持添加单个或多个音频文件
- 拖拽排序播放列表项
- 删除单个曲目或清空整个列表
- 可折叠的播放列表侧边栏
- 文件拖放支持

### 🎮 播放控制
- 播放/暂停控制
- 上一首/下一首切换
- 可拖拽的进度条，支持精确跳转
- 音量控制和静音功能
- 播放模式切换（列表循环、单曲循环、随机播放）
- 实时显示播放时间和总时长

### 🎨 用户界面
- 现代化的 Glassmorphism（毛玻璃）设计风格
- 响应式左右分栏布局
- 自定义窗口控件（最小化、最大化、关闭）
- 自定义滚动条样式
- 支持自定义背景图片
- 无边框窗口设计，提供沉浸式体验

### ⌨️ 快捷键支持
- 空格键：播放/暂停
- 方向键：上一首/下一首
- 音量控制快捷键

## 🛠️ 技术栈

- **框架**: [Electron](https://www.electronjs.org/) - 跨平台桌面应用开发
- **语言**: [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript
- **构建工具**: [esbuild](https://esbuild.github.io/) - 快速的 JavaScript 打包器
- **音频元数据**: [music-metadata](https://github.com/borewit/music-metadata) - 音频文件元数据解析
- **代码质量**: ESLint + Prettier
- **打包**: [electron-builder](https://www.electron.build/) - 应用打包和分发

## 📦 安装使用

### 下载预编译版本

> ⚠️ **重要提示**: 当前 [Releases](https://github.com/yukito0209/yahee-music-player/releases) 中的预编译版本基于旧版本代码构建，与 main 分支的最新代码存在较大差异。如需体验最新功能，请参考下方的"从源码构建"部分。

在 [Releases](https://github.com/yukito0209/yahee-music-player/releases) 页面下载适合您操作系统的安装包：

#### Windows
- **推荐**: `YAHEE-MUSIC-win-portable.zip` - 便携版，解压即用
- `YAHEE MUSIC Setup.exe` - 安装版

#### macOS
- `YAHEE MUSIC.dmg` - macOS 安装包

#### Linux
- `YAHEE MUSIC.AppImage` - 便携式应用镜像

### 从源码构建

#### 环境要求
- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器

#### 安装依赖
```bash
git clone https://github.com/yukito0209/yahee-music-player.git
cd yahee-music-player
npm install
```

#### 构建应用
```bash
npm run build
```

#### 启动应用
```bash
npm start
```

#### 打包分发
```bash
npm run dist
```

## 🏗️ 项目结构

```
src/
├── main/                 # 主进程代码
│   ├── main.ts          # 应用入口点
│   ├── window-manager.ts # 窗口管理
│   ├── preload.ts       # 预加载脚本
│   ├── ipc/             # IPC 通信处理
│   └── utils/           # 主进程工具类
├── renderer/            # 渲染进程代码
│   ├── app.ts          # 应用主逻辑
│   ├── main.ts         # 渲染进程入口
│   ├── services/       # 业务逻辑服务
│   └── utils/          # 渲染进程工具类
├── types/              # TypeScript 类型定义
├── shared/             # 共享代码
css/                    # 样式文件
├── base.css           # 基础样式
├── layout.css         # 布局样式
├── controls.css       # 控件样式
├── playlist.css       # 播放列表样式
└── effects.css        # 视觉效果
assets/                # 静态资源
├── icon.png          # 应用图标
├── background.png    # 默认背景
└── default-cover.png # 默认专辑封面
```

## 🧩 核心架构

### 主进程 (Main Process)
- **main.ts**: 应用生命周期管理
- **window-manager.ts**: 窗口创建和管理
- **ipc-handlers.ts**: 处理渲染进程通信

### 渲染进程 (Renderer Process)
- **app.ts**: 应用主控制器
- **audio-controller.ts**: 音频播放控制
- **playlist-manager.ts**: 播放列表管理
- **ui-controller.ts**: 用户界面控制
- **playback-controller.ts**: 播放逻辑控制

### 数据流
```
用户操作 → UI Controller → Service Layer → Audio API
                    ↓
              IPC Communication
                    ↓
              Main Process → File System
```

## 🔧 开发指南

### 代码规范
```bash
# 代码检查
npm run lint

# 自动修复代码风格
npm run lint:fix

# 代码格式化
npm run format
```

### 添加新功能
1. 在相应的 Service 类中添加业务逻辑
2. 更新 TypeScript 类型定义
3. 在 UI Controller 中添加界面交互
4. 如需主进程支持，添加 IPC 处理器

### 调试
- 使用 `npm run build && npm start` 构建并启动应用
- 打开开发者工具进行调试
- 查看控制台输出获取详细错误信息

## 🐛 已知问题

- Windows 安装包在部分系统环境下可能遇到权限问题，建议使用便携版
- 某些音频格式的元数据读取可能不完整
- 大型播放列表的性能有待优化

## 🗺️ 开发路线图

- [ ] 播放列表持久化存储
- [ ] 歌词显示和同步
- [ ] 音频均衡器
- [ ] 主题切换功能
- [ ] 播放历史记录
- [ ] 音乐库管理
- [ ] 插件系统支持

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

### 贡献流程
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发环境设置
```bash
# 克隆仓库
git clone https://github.com/yukito0209/yahee-music-player.git

# 安装依赖
npm install

# 构建并启动应用
npm run build
npm start
```

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 👨‍💻 作者

**Kerwin Wang** - [yukitoqaq@gmail.com](mailto:yukitoqaq@gmail.com)

## 🙏 致谢

- [Electron](https://www.electronjs.org/) - 提供跨平台桌面应用开发框架
- [music-metadata](https://github.com/borewit/music-metadata) - 音频元数据解析库
- [esbuild](https://esbuild.github.io/) - 快速的构建工具

---

⭐ 如果这个项目对您有帮助，请给它一个 Star！

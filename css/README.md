# YAHEE MUSIC CSS 模块化结构

为了更好的代码维护和管理，原来的 `styles.css` 文件已被拆分为多个模块化的CSS文件。

## 文件结构

```
css/
├── main.css       # 主文件，导入所有模块
├── base.css       # 基础样式（全局设置、字体、动画）
├── layout.css     # 布局样式（容器、网格、主要结构）
├── playlist.css   # 播放列表相关样式
├── controls.css   # 播放控制组件样式
├── window.css     # 窗口控制样式
├── effects.css    # 特效样式（通知、拖放效果）
└── README.md      # 本说明文件
```

## 各模块说明

### base.css
- 全局样式重置
- 字体设置 (Klee One)
- 基础动画 (fadeIn)
- 全局交互元素设置

### layout.css
- 主要布局容器 (.main-content, #player-controls)
- 专辑封面容器
- 曲目信息样式
- 拖拽区域设置

### playlist.css
- 播放列表容器 (#playlist-container)
- 播放列表项样式 (#playlist li)
- 拖拽排序样式
- 播放列表切换按钮
- 自定义滚动条

### controls.css
- 播放器控制栏 (#player-bar-wrapper)
- 播放控制按钮
- 进度条样式
- 音量控制
- 时间显示

### window.css
- 窗口控制按钮 (.window-controls)
- 拖拽区域设置
- 无边框窗口相关样式

### effects.css
- 拖放效果 (body.drag-over)
- 通知系统样式 (.notification)
- 列表项拖拽效果

## 使用方法

HTML中只需引入主文件：
```html
<link rel="stylesheet" href="css/main.css">
```

或者根据需要单独引入特定模块：
```html
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/layout.css">
<!-- 其他模块... -->
```

## 维护建议

1. **修改样式时**：定位到对应的模块文件进行修改
2. **添加新功能**：根据功能类型选择合适的模块文件
3. **新增模块**：创建新的CSS文件并在main.css中导入
4. **样式冲突**：注意模块间的导入顺序

## 备份

原始的 `styles.css` 文件已备份为 `styles.css.backup`，如需回滚可使用备份文件。 
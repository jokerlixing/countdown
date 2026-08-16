# Desktop Countdown · 桌面倒计时

一款简单、美观、稳定的 Windows 桌面倒计时小工具。

- 版本：v0.1.0
- 支持系统：Windows 10 / 11 64 位

## 项目简介

视觉中心是倒计时数字的极简效率工具。支持快捷预设、自定义时长、任务命名、桌面悬浮窗、极简模式、窗口置顶、透明度调节、系统托盘常驻、开机启动、结束提示音与 Windows 系统通知。所有数据仅保存在本地。

## 技术栈

- Electron 33（主进程 + Preload contextBridge + 渲染进程）
- Vue 3.5（`<script setup lang="ts">` Composition API）
- TypeScript（严格模式）
- Vite 5 + electron-vite 2
- Pinia 3（timerStore / settingsStore / uiStore）
- electron-builder 25（Windows NSIS 安装包 + Portable）

## 安装依赖

```bash
npm install        # 本项目使用 npm（Node.js >= 20）
```

## 开发运行

```bash
npm run dev        # 启动 electron-vite 开发环境（热更新）
```

## 单元测试与类型检查

```bash
npm test           # node --test 运行 tests/ 下的纯逻辑测试
npm run typecheck  # vue-tsc --noEmit 全量类型检查
```

## 构建与打包

```bash
npm run build      # 构建主进程 / Preload / 渲染进程到 out/
npm run dist       # 构建并打包 Windows 安装程序（NSIS + Portable）
```

产物位于 `release/` 目录：

- `桌面倒计时-Setup-0.1.0.exe`（NSIS 安装包，用户可选择安装目录与是否创建桌面快捷方式）
- `桌面倒计时-Portable-0.1.0.exe`（便携版）

安装后无需 Node.js 环境，可独立运行。

## 目录结构

```
├─ electron/
│  ├─ main/            # 主进程：窗口、托盘、IPC、配置、通知、快捷键、日志
│  └─ preload/         # contextBridge 安全暴露白名单 API
├─ src/
│  ├─ assets/          # 全局样式（浅色/深色主题变量）
│  ├─ components/      # TimerDisplay / TimerControls / QuickTimer / FloatingTimer / SettingsPanel 等
│  ├─ composables/     # useShortcuts（窗口内快捷键）
│  ├─ services/        # sound（提示音播放）
│  ├─ stores/          # Pinia：timer / settings / ui
│  ├─ types/           # 共享类型定义
│  ├─ utils/           # 时间格式化纯函数
│  ├─ App.vue
│  └─ main.ts
├─ public/             # finish.wav（渲染进程提示音）
├─ resources/          # 图标（icon.ico / icon.png）与提示音
├─ scripts/            # 资源生成脚本（纯 Node 生成图标与 WAV）
├─ tests/              # 单元测试
├─ electron-builder.yml
└─ electron.vite.config.ts
```

## 功能列表

- 核心倒计时：时/分/秒自定义输入，快捷预设 5/10/15/25/30/60 分钟
- 控制：开始 / 暂停 / 继续 / 重置，清晰状态机防连点异常
- 计时准确性：基于 `endTime - Date.now()` 计算，250ms 仅刷新 UI，后台/降频不产生误差
- 桌面悬浮模式：无边框小窗，可拖拽、可置顶，鼠标移入显示控制按钮
- 极简模式：仅标题 + 时间，鼠标移入显示操作
- 始终置顶、窗口透明度 60%~100%（实时生效并持久化）
- 窗口位置/大小记忆，换屏/分辨率变化自动回到可见区域
- 倒计时标题（学习/工作/健身……），结束系统通知 + 提示音（音量可调）
- 系统托盘常驻：关闭默认最小化到托盘，双击托盘恢复，托盘菜单可开始/暂停/重置/置顶/退出
- 开机自动启动（`app.setLoginItemSettings`）
- 浅色 / 深色 / 跟随系统主题
- 本地 JSON 配置持久化，重启恢复全部设置

## 快捷键

| 按键 | 作用 |
| ---- | ---- |
| Space | 开始 / 暂停（输入框内不触发） |
| R | 重置 |
| Esc | 关闭设置 / 退出极简、悬浮模式 |
| Ctrl+Alt+T（全局） | 显示 / 隐藏窗口 |

## 已知问题

- 图标为脚本生成的临时占位图标（蓝底白色时钟），后续可替换正式品牌图标。
- 悬浮/极简模式下窗口尺寸固定，暂不支持拖拽调整大小。
- Windows 通知在系统开启"专注助手"时可能不显示。

## 路线图（下一版本）

- 多任务倒计时列表
- 倒计时结束前的阶段性提醒（剩余 1 分钟提示）
- 悬浮窗尺寸/字体自定义
- 更多提示音可选
- 白噪声 / 番茄工作法统计

<div align="center">
  <img src="public/logo-icon.svg" alt="QuickNote" width="80" />
  <h1 align="center">QuickNote</h1>
  <p align="center">
    轻量桌面便签 — 灵感来自 Microsoft Sticky Notes
    <br />
    <strong>Tauri 2 · React 19 · TypeScript</strong>
  </p>

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  ![Version](https://img.shields.io/badge/version-0.1.1-blue)
  [![Tauri](https://img.shields.io/badge/Tauri-2-green)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
</div>

---

## 📸 预览

![QuickNote 截图](screenshot.png)

---

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 📝 **便签管理** | 创建、编辑、删除便签，双击任意位置开始编辑 |
| 🎨 **六色主题** | 黄色、薄荷、粉色、薰衣草、天蓝、灰色，一键切换 |
| 📌 **钉选置顶** | 便签级别置顶 + 窗口级别总在最前 |
| 🔍 **实时搜索** | 键入即搜，按内容过滤便签 |
| 💾 **自动保存** | 所有变更实时写入 `localStorage`，无需手动存盘 |
| 🪟 **无边框窗口** | 自定义标题栏、可拖拽、最小化/关闭/置顶控制 |
| ⌨️ **快捷键** | `Ctrl+Enter` 快速添加，`Esc` 取消/退出编辑 |

---

## 🧱 技术栈

| 层 | 技术 |
|---|---|
| **桌面框架** | [Tauri 2](https://tauri.app/) — Rust 运行时 |
| **前端框架** | [React 19](https://react.dev/) |
| **语言** | [TypeScript 5](https://www.typescriptlang.org/) |
| **构建工具** | [Vite 7](https://vite.dev/) |
| **后端语言** | [Rust](https://www.rust-lang.org/) (stable) |

---

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/) (stable)
- 平台构建工具（Windows: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) / macOS: Xcode CLI / Linux: `libgtk-3-dev` 等）

### 安装 & 运行

```bash
# 克隆仓库
git clone https://github.com/your-username/quick-note.git
cd quick-note

# 安装前端依赖
npm install

# 启动开发模式（前端热更新 + Tauri 桌面窗口）
npm run tauri dev
```

### 构建发布包

```bash
npm run tauri build
```

产物位于 `src-tauri/target/release/bundle/`。

---

##  许可证

本项目基于 [MIT](LICENSE) 许可证开源。

Copyright © 2026 SHAO Liming

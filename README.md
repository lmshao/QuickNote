<div align="center">
  <img src="public/logo-icon.svg" alt="QuickNote" width="80" />
  <h1 align="center">QuickNote</h1>
  <p align="center">
    轻量桌面便签 — 灵感来自 Microsoft Sticky Notes
    <br />
    <strong>Tauri 2 · React 19 · TypeScript</strong>
  </p>

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Version](https://img.shields.io/badge/version-0.1.0-blue)]
  [![Tauri](https://img.shields.io/badge/Tauri-2-green)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
</div>

---

## 📸 预览

> 🖼️ 截图待添加 — 运行 `npm run tauri dev` 即可体验

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

## 📁 项目结构

```
quick-note/
├── public/                     # 静态资源（图标、字体等）
│   └── logo-icon.svg
├── scripts/                    # PowerShell 辅助脚本
│   ├── dev.ps1
│   ├── build.ps1
│   └── clean.ps1
├── src/                        # 前端源代码
│   ├── components/
│   │   ├── AddNoteModal.tsx     # 新建便签弹窗
│   │   ├── NoteCard.tsx         # 便签卡片组件
│   │   └── TitleBar.tsx         # 自定义标题栏
│   ├── hooks/
│   │   └── useNotes.ts          # 便签状态管理（CRUD + 排序）
│   ├── types.ts                 # 类型定义 + 配色表
│   ├── App.tsx                  # 主应用布局
│   ├── App.css                  # 全局样式
│   └── main.tsx                 # 入口文件
├── src-tauri/                   # Rust 后端
│   ├── icons/                   # 应用图标
│   ├── src/
│   │   ├── lib.rs               # Tauri 命令（minimize/close/always_on_top）
│   │   └── main.rs              # 程序入口
│   ├── tauri.conf.json          # Tauri 配置
│   └── capabilities/            # 权限声明
├── .gitignore
├── index.html                   # Vite HTML 入口
├── package.json
├── tsconfig.json
├── vite.config.ts
├── LICENSE                      # MIT 许可
└── README.md                    # 👈 就是本文件
```

---

## ⌨️ 快捷键

| 按键 | 作用域 | 操作 |
|------|--------|------|
| `Ctrl+Enter` | 新建弹窗 | 快速添加便签 |
| `Esc` | 弹窗 / 编辑 | 取消 / 退出编辑 |

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/my-feature`
3. 提交变更：`git commit -m "feat: add awesome feature"`
4. 推送分支：`git push origin feat/my-feature`
5. 提交 Pull Request

---

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

Copyright © 2026 SHAO Liming

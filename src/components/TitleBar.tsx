import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState } from "react";
import "./TitleBar.css";

interface TitleBarProps {
  onSearch: (q: string) => void;
  onAdd: () => void;
}

export default function TitleBar({ onSearch, onAdd }: TitleBarProps) {
  const [pinned, setPinned] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  const handleMinimize = () => invoke("minimize_window");
  const handleClose = () => invoke("close_window");

  const handlePin = async () => {
    const next = !pinned;
    setPinned(next);
    await invoke("toggle_always_on_top", { onTop: next });
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    // 只响应左键，且目标元素本身是拖动区域（不是按钮/输入框）
    if (e.button !== 0) return;
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (tag === "button" || tag === "input" || tag === "img") return;
    getCurrentWindow().startDragging();
  };

  return (
    <div className="titlebar" onMouseDown={handleDragStart}>
      <div className="titlebar-left">
        <img className="titlebar-logo" src="/logo-icon.svg" alt="QuickNote" />
        <span className="titlebar-title">QuickNote</span>
      </div>

      <div className="titlebar-actions">
        {searchVisible && (
          <input
            className="titlebar-search"
            autoFocus
            placeholder="搜索便签…"
            onChange={(e) => onSearch(e.target.value)}
            onBlur={() => {
              setSearchVisible(false);
              onSearch("");
            }}
          />
        )}

        <button
          className="titlebar-btn"
          title="搜索"
          onClick={() => setSearchVisible((v) => !v)}
        >
          🔍
        </button>

        <button className="titlebar-btn" title="新建便签" onClick={onAdd}>
          ✚
        </button>

        <button
          className={`titlebar-btn ${pinned ? "active" : ""}`}
          title={pinned ? "取消置顶" : "窗口置顶"}
          onClick={handlePin}
        >
          📌
        </button>

        <div className="titlebar-divider" />

        <button className="titlebar-btn" title="最小化" onClick={handleMinimize}>
          ─
        </button>

        <button className="titlebar-btn close-btn" title="关闭" onClick={handleClose}>
          ✕
        </button>
      </div>
    </div>
  );
}

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState } from "react";
import "./TitleBar.css";

interface TitleBarProps {
  onSearch: (q: string) => void;
  onAdd: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  authDisplayName: string | null;
}

export default function TitleBar({
  onSearch,
  onAdd,
  onOpenAuth,
  onLogout,
  authDisplayName,
}: TitleBarProps) {
  const [pinned, setPinned] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleMinimize = () => invoke("minimize_window");
  const handleClose = () => invoke("close_window");

  const handlePin = async () => {
    const next = !pinned;
    setPinned(next);
    await invoke("toggle_always_on_top", { onTop: next });
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (tag === "button" || tag === "input" || tag === "img") return;
    getCurrentWindow().startDragging();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  const handleSearchBlur = () => {
    // Keep search visible if there's a query
    if (!searchValue) {
      setSearchVisible(false);
    }
  };

  return (
    <div className="titlebar" onMouseDown={handleDragStart}>
      <div className="titlebar-left">
        <span className="titlebar-title">便笺</span>
      </div>

      <div className="titlebar-center">
        {searchVisible && (
          <input
            className="titlebar-search"
            autoFocus
            placeholder="搜索便签…"
            value={searchValue}
            onChange={handleSearchChange}
            onBlur={handleSearchBlur}
          />
        )}
      </div>

      <div className="titlebar-actions">
        <button
          className="titlebar-btn"
          title="搜索"
          onClick={() => {
            setSearchVisible((v) => !v);
            if (searchVisible) {
              setSearchValue("");
              onSearch("");
            }
          }}
        >
          🔍
        </button>

        <button className="titlebar-btn" title="新建便签" onClick={onAdd}>
          ✚
        </button>

        <button
          className={`titlebar-btn ${authDisplayName ? "active" : ""}`}
          title={authDisplayName ? `Signed in as ${authDisplayName}` : "Sign in"}
          onClick={onOpenAuth}
        >
          👤
        </button>

        {authDisplayName && (
          <button className="titlebar-btn" title="Sign out" onClick={onLogout}>
            ⇥
          </button>
        )}

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

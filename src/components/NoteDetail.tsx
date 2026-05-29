import { useState, useRef, useEffect } from "react";
import type { Note, NoteColor } from "../types";
import { NOTE_COLORS } from "../types";
import "./NoteDetail.css";

interface NoteDetailProps {
  note: Note | null;  // null = no selection / new note placeholder
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onChangeColor: (id: string, color: NoteColor) => void;
  isNew?: boolean;                // true when this is a freshly created note
}

function formatDateFull(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const wd = weekdays[d.getDay()];
  if (y === now.getFullYear()) {
    return `${m}月${day}日 星期${wd}`;
  }
  return `${y}年${m}月${day}日 星期${wd}`;
}

export default function NoteDetail({
  note,
  onUpdate,
  onDelete,
  onTogglePin,
  onChangeColor,
  isNew,
}: NoteDetailProps) {
  const [draft, setDraft] = useState(note?.content ?? "");
  const [showColors, setShowColors] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(note?.content ?? "");
    if (isNew) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [note?.id, isNew]);

  // ── Save on blur ──────────────────────────────
  const handleBlur = () => {
    if (!note) return;
    const trimmed = draft.trim();
    if (trimmed !== note.content) {
      onUpdate(note.id, trimmed || note.content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && (e.target as HTMLElement).tagName === "TEXTAREA") {
      (e.target as HTMLTextAreaElement).blur();
    }
  };

  // ── Empty / no-selection placeholder ───────────
  if (!note) {
    return (
      <div className="note-detail-empty">
        <span className="note-detail-empty-icon">📋</span>
        <p>选择一条便签开始查看</p>
      </div>
    );
  }

  const colors = NOTE_COLORS[note.color];

  return (
    <div className="note-detail" style={{ background: colors.bg }}>
      {/* Toolbar */}
      <div className="note-detail-toolbar" style={{ background: colors.header }}>
        <div className="note-detail-toolbar-left">
          <button
            className={`nd-btn ${note.pinned ? "active" : ""}`}
            title={note.pinned ? "取消固定" : "固定便签"}
            onClick={() => onTogglePin(note.id)}
          >
            📌
          </button>

          <div className="nd-color-wrap">
            <button
              className="nd-btn"
              title="更改颜色"
              onClick={() => setShowColors((v) => !v)}
            >
              🎨
            </button>
            {showColors && (
              <div className="nd-color-dropdown">
                {(Object.entries(NOTE_COLORS) as [NoteColor, typeof NOTE_COLORS[NoteColor]][]).map(
                  ([key, val]) => (
                    <button
                      key={key}
                      className={`nd-color-dot ${note.color === key ? "selected" : ""}`}
                      style={{ background: val.header }}
                      title={val.label}
                      onClick={() => { onChangeColor(note.id, key); setShowColors(false); }}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div className="note-detail-toolbar-right">
          <span className="note-detail-date">{formatDateFull(note.updatedAt)}</span>
          <button
            className="nd-btn nd-delete-btn"
            title="删除便签"
            onClick={() => onDelete(note.id)}
          >
            🗑
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        className="note-detail-textarea"
        style={{ background: colors.bg }}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="写点什么…"
      />

      <div className="note-detail-credit">Made by SHAO Liming</div>
    </div>
  );
}

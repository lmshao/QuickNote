import { useState, useRef, useEffect } from "react";
import type { Note, NoteColor } from "../types";
import { NOTE_COLORS } from "../types";
import "./NoteCard.css";

interface NoteCardProps {
  note: Note;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onChangeColor: (id: string, color: NoteColor) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;

  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function NoteCard({
  note,
  onUpdate,
  onDelete,
  onTogglePin,
  onChangeColor,
}: NoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [showColors, setShowColors] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const colors = NOTE_COLORS[note.color];
  const isConflictCopy = note.content.startsWith("⚠ 冲突副本");

  useEffect(() => {
    setDraft(note.content);
  }, [note.content]);

  const handleEditStart = () => {
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleEditEnd = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== note.content) {
      onUpdate(note.id, trimmed || note.content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setDraft(note.content);
      setEditing(false);
    }
  };

  return (
    <div
      className={`note-card ${note.pinned ? "pinned" : ""}`}
      style={{ background: colors.bg, "--header-color": colors.header } as React.CSSProperties}
    >
      <div className="note-header">
        <div className="note-header-actions">
          <button
            className={`note-action-btn pin-btn ${note.pinned ? "active" : ""}`}
            title={note.pinned ? "取消固定" : "固定便签"}
            onClick={() => onTogglePin(note.id)}
          >
            📌
          </button>
          <div className="color-picker-wrap">
            <button
              className="note-action-btn"
              title="更改颜色"
              onClick={() => setShowColors((v) => !v)}
            >
              🎨
            </button>
            {showColors && (
              <div className="color-dropdown">
                {(Object.entries(NOTE_COLORS) as [NoteColor, typeof NOTE_COLORS[NoteColor]][]).map(
                  ([key, val]) => (
                    <button
                      key={key}
                      className={`color-dot ${note.color === key ? "selected" : ""}`}
                      style={{ background: val.header }}
                      title={val.label}
                      onClick={() => {
                        onChangeColor(note.id, key);
                        setShowColors(false);
                      }}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
        <button
          className="note-action-btn delete-btn"
          title="删除便签"
          onClick={() => onDelete(note.id)}
        >
          🗑
        </button>
      </div>

      <div className="note-body" onClick={!editing ? handleEditStart : undefined}>
        {editing ? (
          <textarea
            ref={textareaRef}
            className="note-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleEditEnd}
            onKeyDown={handleKeyDown}
            style={{ background: colors.bg }}
          />
        ) : (
          <p className="note-content">
            {note.content || <span className="note-placeholder">点击编辑便签…</span>}
          </p>
        )}
      </div>

      <div className="note-footer">
        <span className="note-date">{formatDate(note.updatedAt)}</span>
        {note.pinned && <span className="note-pinned-badge">已固定</span>}
        {isConflictCopy && <span className="note-conflict-badge" title="此便签为冲突副本，请检查内容并决定保留或删除">⚠ 冲突</span>}
      </div>
    </div>
  );
}

import { useState, useCallback } from "react";
import type { Note } from "../types";
import { NOTE_COLORS } from "../types";
import ContextMenu, { type ContextMenuAction } from "./ContextMenu";
import "./NoteList.css";

interface NoteListProps {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;

  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function getPreview(content: string): string {
  const firstLine = content.split("\n")[0];
  return firstLine || "空白便签";
}

export default function NoteList({ notes, selectedId, onSelect, onDelete }: NoteListProps) {
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; noteId: string } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, noteId });
  }, []);

  const ctxActions: ContextMenuAction[] = ctxMenu
    ? [{ label: "删除便签", icon: "🗑", danger: true, onClick: () => onDelete(ctxMenu.noteId) }]
    : [];
  if (notes.length === 0) {
    return (
      <div className="note-list-empty">
        <span className="note-list-empty-icon">📝</span>
        <p>暂无便签</p>
        <p className="note-list-empty-hint">点击 + 新建</p>
      </div>
    );
  }

  return (
    <div className="note-list">
      {notes.map((note) => {
        const colors = NOTE_COLORS[note.color];
        return (
          <div
            key={note.id}
            className={`note-list-item ${note.id === selectedId ? "selected" : ""}`}
            style={{ borderLeftColor: colors.header }}
            onClick={() => onSelect(note.id)}
            onContextMenu={(e) => handleContextMenu(e, note.id)}
          >
            <div className="note-list-item-top">
              <span className="note-list-item-title">
                {note.pinned && <span className="note-list-pin">📌</span>}
                {getPreview(note.content)}
              </span>
              <span className="note-list-item-date">{formatDate(note.updatedAt)}</span>
            </div>
            <button
              className="note-list-del-btn"
              title="删除"
              onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
            >
              🗑
            </button>
          </div>
        );
      })}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          actions={ctxActions}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}

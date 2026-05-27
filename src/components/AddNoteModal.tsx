import { useState, useRef, useEffect } from "react";
import type { NoteColor } from "../types";
import { NOTE_COLORS } from "../types";
import "./AddNoteModal.css";

interface AddNoteModalProps {
  onAdd: (content: string, color: NoteColor) => void;
  onClose: () => void;
}

export default function AddNoteModal({ onAdd, onClose }: AddNoteModalProps) {
  const [content, setContent] = useState("");
  const [color, setColor] = useState<NoteColor>("yellow");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (content.trim()) {
      onAdd(content.trim(), color);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit();
  };

  const colorInfo = NOTE_COLORS[color];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal-panel"
        style={{ background: colorInfo.bg, "--header-color": colorInfo.header } as React.CSSProperties}
      >
        <div className="modal-header">
          <span className="modal-title">新建便签</span>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <textarea
          ref={textareaRef}
          className="modal-textarea"
          placeholder="写点什么…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ background: colorInfo.bg }}
        />

        <div className="modal-footer">
          <div className="modal-colors">
            {(Object.entries(NOTE_COLORS) as [NoteColor, typeof NOTE_COLORS[NoteColor]][]).map(
              ([key, val]) => (
                <button
                  key={key}
                  className={`modal-color-dot ${color === key ? "selected" : ""}`}
                  style={{ background: val.header }}
                  title={val.label}
                  onClick={() => setColor(key)}
                />
              )
            )}
          </div>
          <div className="modal-btns">
            <button className="modal-btn cancel" onClick={onClose}>取消</button>
            <button
              className="modal-btn confirm"
              onClick={handleSubmit}
              disabled={!content.trim()}
            >
              添加
            </button>
          </div>
        </div>

        <p className="modal-hint">Ctrl+Enter 快速添加 · Esc 取消</p>
      </div>
    </div>
  );
}

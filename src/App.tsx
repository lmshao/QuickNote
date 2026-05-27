import { useState, useMemo } from "react";
import TitleBar from "./components/TitleBar";
import NoteCard from "./components/NoteCard";
import AddNoteModal from "./components/AddNoteModal";
import { useNotes } from "./hooks/useNotes";
import type { NoteColor } from "./types";
import "./App.css";

export default function App() {
  const { notes, addNote, updateNote, deleteNote, togglePin, changeColor } = useNotes();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter((n) => n.content.toLowerCase().includes(q));
  }, [notes, searchQuery]);

  const handleAdd = (content: string, color: NoteColor) => {
    addNote(content, color);
    setShowModal(false);
  };

  return (
    <div className="app">
      <TitleBar onSearch={setSearchQuery} onAdd={() => setShowModal(true)} />

      <main className="app-body">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <span className="empty-icon">🔍</span>
                <p>没有找到匹配的便签</p>
              </>
            ) : (
              <>
                <span className="empty-icon">📝</span>
                <p>还没有便签</p>
                <button className="empty-add-btn" onClick={() => setShowModal(true)}>
                  ✚ 新建便签
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onTogglePin={togglePin}
                onChangeColor={changeColor}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <span>{notes.length} 条便签</span>
      </footer>

      {showModal && (
        <AddNoteModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

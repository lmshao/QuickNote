import { useState, useMemo, useCallback } from "react";
import TitleBar from "./components/TitleBar";
import NoteList from "./components/NoteList";
import NoteDetail from "./components/NoteDetail";
import { useNotes } from "./hooks/useNotes";
import "./App.css";

export default function App() {
  const { notes, addNote, updateNote, deleteNote, togglePin, changeColor } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newNoteId, setNewNoteId] = useState<string | null>(null);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter((n) => n.content.toLowerCase().includes(q));
  }, [notes, searchQuery]);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId]
  );

  // Sync selection when the selected note is deleted
  const handleDelete = useCallback((id: string) => {
    deleteNote(id);
    setSelectedId((prev) => (prev === id ? null : prev));
    setNewNoteId((prev) => (prev === id ? null : prev));
  }, [deleteNote]);

  // Add a new blank note and open it for editing
  const handleAdd = useCallback(() => {
    const note = addNote("", "yellow");
    setSelectedId(note.id);
    setNewNoteId(note.id);
  }, [addNote]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setNewNoteId(null);
  }, []);

  return (
    <div className="app">
      <TitleBar
        onSearch={setSearchQuery}
        onAdd={handleAdd}
      />

      <div className="app-split">
        {/* Left: note list */}
        <aside className="app-sidebar">
          <NoteList
            notes={filteredNotes}
            selectedId={selectedId}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        </aside>

        {/* Right: note detail */}
        <main className="app-detail">
          <NoteDetail
            note={selectedNote}
            isNew={newNoteId === selectedId}
            onUpdate={updateNote}
            onDelete={handleDelete}
            onTogglePin={togglePin}
            onChangeColor={changeColor}
          />
        </main>
      </div>
    </div>
  );
}

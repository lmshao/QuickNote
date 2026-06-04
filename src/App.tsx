import { useState, useMemo, useCallback } from "react";
import TitleBar from "./components/TitleBar";
import NoteList from "./components/NoteList";
import NoteDetail from "./components/NoteDetail";
import { useNotes } from "./hooks/useNotes";
import { useAuth } from "./hooks/useAuth";
import AuthModal from "./components/AuthModal";
import "./App.css";

export default function App() {
  const { notes, loaded, addNote, updateNote, deleteNote, togglePin, changeColor } = useNotes();
  const auth = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newNoteId, setNewNoteId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
  const handleAdd = useCallback(async () => {
    const note = await addNote("", "yellow");
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
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={auth.logout}
        authDisplayName={auth.user?.nickname ?? null}
      />

      <div className="app-split">
        {!loaded ? (
          <div className="app-loading">
            <span className="app-loading-icon">📝</span>
            <p>加载中…</p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      <AuthModal
        open={authModalOpen}
        providers={auth.providers}
        providersLoading={auth.providersLoading}
        submitting={auth.submitting}
        error={auth.error}
        apiBaseUrl={auth.apiBaseUrl}
        defaultApiBaseUrl={auth.defaultApiBaseUrl}
        currentUsername={auth.user?.nickname ?? null}
        onClose={() => setAuthModalOpen(false)}
        onLogin={auth.login}
        onRegister={auth.register}
        onLogout={auth.logout}
        onUpdateApiBaseUrl={auth.updateApiBaseUrl}
        onUseDefaultApiBaseUrl={auth.useDefaultApiBaseUrl}
        onTestApiBaseUrl={auth.testApiBaseUrl}
        onClearError={auth.clearError}
      />
    </div>
  );
}

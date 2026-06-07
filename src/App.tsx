import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import TitleBar from "./components/TitleBar";
import NoteList from "./components/NoteList";
import NoteDetail from "./components/NoteDetail";
import { useNotes, type UseNotesCallbacks } from "./hooks/useNotes";
import { useAuth } from "./hooks/useAuth";
import { useSync } from "./hooks/useSync";
import AuthModal from "./components/AuthModal";
import "./App.css";

export default function App() {
  // --- Sync push bridge: ref-based to break circular dep between useNotes ↔ useSync ---
  const syncPushRef = useRef<(notes: Array<{
    id: string; content: string; color: string; pinned: boolean;
    updated_at: number; deleted: boolean;
  }>) => void>(() => {});

  const onAfterChange = useCallback((note: import("./types").Note) => {
    // Conflict copies are local-only — never push them to server
    if (note.content.startsWith("⚠ 冲突副本")) return;
    syncPushRef.current([{
      id: note.id,
      content: note.content,
      color: note.color,
      pinned: note.pinned,
      updated_at: note.updatedAt,
      deleted: false,
    }]);
  }, []);

  const callbacks: UseNotesCallbacks = useMemo(() => ({ onAfterChange }), [onAfterChange]);

  const { notes, loaded, addNote, updateNote, deleteNote, togglePin, changeColor, importNote, insertNoteSilent } =
    useNotes(callbacks);
  const auth = useAuth();

  // Ref-based local note lookup for useSync (avoids stale closure on notes array)
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const getLocalNote = useCallback((id: string) => notesRef.current.find((n) => n.id === id), []);

  const { syncStatus, lastSyncAt, pushNow, pushAllNow, pullNow } = useSync(
    auth.token ?? null,
    importNote,
    deleteNote,
    insertNoteSilent,
    getLocalNote,
  );
  syncPushRef.current = pushNow;

  // Push all local notes to server when user logs in
  const prevTokenRef = useRef(auth.token);
  useEffect(() => {
    const prev = prevTokenRef.current;
    prevTokenRef.current = auth.token;
    // Only trigger when token appears (login), not on every change
    if (auth.token && !prev) {
      pushAllNow(notes);
    }
  }, [auth.token]); // eslint-disable-line react-hooks/exhaustive-deps
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
    const note = notes.find((n) => n.id === id);
    // Push deletion to server — skip conflict copies (never on server)
    if (note && !note.content.startsWith("⚠ 冲突副本")) {
      syncPushRef.current([{
        id: note.id,
        content: note.content,
        color: note.color,
        pinned: note.pinned,
        updated_at: Date.now(),
        deleted: true,
      }]);
    }
    deleteNote(id);
    setSelectedId((prev) => (prev === id ? null : prev));
    setNewNoteId((prev) => (prev === id ? null : prev));
  }, [deleteNote, notes]);

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

  const handleSyncNow = useCallback(async () => {
    await pushAllNow(notes);
    await pullNow();
  }, [pushAllNow, pullNow, notes]);

  return (
    <div className="app">
      <TitleBar
        onSearch={setSearchQuery}
        onAdd={handleAdd}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={auth.logout}
        authDisplayName={auth.user?.nickname ?? null}
        syncStatus={syncStatus}
        lastSyncAt={lastSyncAt}
        onSyncNow={handleSyncNow}
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

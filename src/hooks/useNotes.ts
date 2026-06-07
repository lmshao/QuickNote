import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import Database from "@tauri-apps/plugin-sql";
import type { Note, NoteColor } from "../types";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:quicknote.db");
    // Create table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id        TEXT PRIMARY KEY,
        content   TEXT NOT NULL DEFAULT '',
        color     TEXT NOT NULL DEFAULT 'yellow',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        pinned    INTEGER NOT NULL DEFAULT 0
      )
    `);
  }
  return db;
}

function rowToNote(row: any): Note {
  return {
    id: row.id,
    content: row.content,
    color: row.color as NoteColor,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pinned: row.pinned === 1,
  };
}

export interface UseNotesCallbacks {
  onAfterChange: (note: Note) => void;
}

export function useNotes(callbacks?: UseNotesCallbacks) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Load notes from SQLite on mount
  useEffect(() => {
    (async () => {
      const d = await getDb();
      const rows: any[] = await d.select(
        "SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC"
      );
      setNotes(rows.map(rowToNote));
      setLoaded(true);
    })();
  }, []);

  const addNote = useCallback(async (content: string, color: NoteColor) => {
    const now = Date.now();
    const newNote: Note = {
      id: uuidv4(),
      content,
      color,
      createdAt: now,
      updatedAt: now,
      pinned: false,
    };
    const d = await getDb();
    await d.execute(
      "INSERT INTO notes (id, content, color, created_at, updated_at, pinned) VALUES ($1, $2, $3, $4, $5, $6)",
      [newNote.id, newNote.content, newNote.color, newNote.createdAt, newNote.updatedAt, 0]
    );
    setNotes((prev) => [newNote, ...prev]);
    callbacksRef.current?.onAfterChange(newNote);
    return newNote;
  }, []);

  const updateNote = useCallback(async (id: string, content: string) => {
    const now = Date.now();
    const d = await getDb();
    await d.execute(
      "UPDATE notes SET content = $1, updated_at = $2 WHERE id = $3",
      [content, now, id]
    );
    setNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, content, updatedAt: now } : n));
      const found = updated.find((n) => n.id === id);
      if (found) callbacksRef.current?.onAfterChange(found);
      return updated;
    });
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    const d = await getDb();
    await d.execute("DELETE FROM notes WHERE id = $1", [id]);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const togglePin = useCallback(async (id: string) => {
    const d = await getDb();
    const rows: any[] = await d.select("SELECT pinned FROM notes WHERE id = $1", [id]);
    if (rows.length === 0) return;
    const newPinned = rows[0].pinned === 1 ? 0 : 1;
    await d.execute("UPDATE notes SET pinned = $1 WHERE id = $2", [newPinned, id]);
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, pinned: newPinned === 1, updatedAt: Date.now() } : n
      );
      const found = updated.find((n) => n.id === id);
      if (found) callbacksRef.current?.onAfterChange(found);
      return updated;
    });
  }, []);

  const changeColor = useCallback(async (id: string, color: NoteColor) => {
    const d = await getDb();
    await d.execute("UPDATE notes SET color = $1 WHERE id = $2", [color, id]);
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, color, updatedAt: Date.now() } : n
      );
      const found = updated.find((n) => n.id === id);
      if (found) callbacksRef.current?.onAfterChange(found);
      return updated;
    });
  }, []);

  /**
   * Import a note from remote sync — preserves exact timestamps.
   * Inserts or updates; does NOT fire onAfterChange (not a local edit).
   */
  const importNote = useCallback(async (note: Note): Promise<void> => {
    const d = await getDb();
    const existing: any[] = await d.select(
      "SELECT id, updated_at FROM notes WHERE id = $1", [note.id]
    );
    if (existing.length === 0) {
      await d.execute(
        "INSERT INTO notes (id, content, color, created_at, updated_at, pinned) VALUES ($1, $2, $3, $4, $5, $6)",
        [note.id, note.content, note.color, note.createdAt, note.updatedAt, note.pinned ? 1 : 0]
      );
      setNotes((prev) => [...prev, note]);
    } else {
      const localUpdatedAt = existing[0].updated_at as number;
      if (note.updatedAt > localUpdatedAt) {
        await d.execute(
          "UPDATE notes SET content=$1, color=$2, pinned=$3, updated_at=$4 WHERE id=$5",
          [note.content, note.color, note.pinned ? 1 : 0, note.updatedAt, note.id]
        );
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? note : n))
        );
      }
    }
  }, []);

  /**
   * Insert a note directly to DB without triggering onAfterChange.
   * Used for conflict copies — should NOT be pushed back to server.
   */
  const insertNoteSilent = useCallback(async (note: Note): Promise<void> => {
    const d = await getDb();
    await d.execute(
      "INSERT INTO notes (id, content, color, created_at, updated_at, pinned) VALUES ($1, $2, $3, $4, $5, $6)",
      [note.id, note.content, note.color, note.createdAt, note.updatedAt, note.pinned ? 1 : 0]
    );
    setNotes((prev) => [...prev, note]);
  }, []);

  // Keep sorted: pinned first, then by updatedAt desc
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  return { notes: sortedNotes, loaded, addNote, updateNote, deleteNote, togglePin, changeColor, importNote, insertNoteSilent };
}

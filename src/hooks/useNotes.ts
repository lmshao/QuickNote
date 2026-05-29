import { useState, useEffect, useCallback } from "react";
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

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

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
    return newNote;
  }, []);

  const updateNote = useCallback(async (id: string, content: string) => {
    const now = Date.now();
    const d = await getDb();
    await d.execute(
      "UPDATE notes SET content = $1, updated_at = $2 WHERE id = $3",
      [content, now, id]
    );
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content, updatedAt: now } : n))
    );
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    const d = await getDb();
    await d.execute("DELETE FROM notes WHERE id = $1", [id]);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const togglePin = useCallback(async (id: string) => {
    const d = await getDb();
    // Toggle: read current value first
    const rows: any[] = await d.select("SELECT pinned FROM notes WHERE id = $1", [id]);
    if (rows.length === 0) return;
    const newPinned = rows[0].pinned === 1 ? 0 : 1;
    await d.execute("UPDATE notes SET pinned = $1 WHERE id = $2", [newPinned, id]);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: newPinned === 1 } : n))
    );
  }, []);

  const changeColor = useCallback(async (id: string, color: NoteColor) => {
    const d = await getDb();
    await d.execute("UPDATE notes SET color = $1 WHERE id = $2", [color, id]);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, color } : n))
    );
  }, []);

  // Keep sorted: pinned first, then by updatedAt desc
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  return { notes: sortedNotes, loaded, addNote, updateNote, deleteNote, togglePin, changeColor };
}

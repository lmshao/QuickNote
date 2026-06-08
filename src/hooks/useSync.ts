import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { pushNotes, pullNotes, type SyncPushNote } from "../services/syncApi";
import type { Note } from "../types";

const SYNC_SINCE_KEY = "quicknote.sync.since";

export type SyncStatus = "idle" | "pushing" | "pulling" | "error";

export interface UseSyncResult {
  syncStatus: SyncStatus;
  lastSyncAt: number | null;
  pushNow: (notes: SyncPushNote[]) => Promise<void>;
  pushAllNow: (notes: Note[]) => Promise<void>;
  pullNow: () => Promise<void>;
}

function getStoredSince(): number {
  const raw = localStorage.getItem(SYNC_SINCE_KEY);
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 0 : n;
}

function storeSince(since: number): void {
  localStorage.setItem(SYNC_SINCE_KEY, String(since));
}

/**
 * Create a conflict-copy note from a local version that was rejected by server.
 */
function buildConflictNote(localNote: Note): Note {
  const now = Date.now();
  const preview = localNote.content.slice(0, 50) + (localNote.content.length > 50 ? "…" : "");
  return {
    id: uuidv4(),
    content: `⚠ 冲突副本 (${new Date(now).toLocaleString()})\n${preview}`,
    color: "orange" as Note["color"],
    createdAt: now,
    updatedAt: now,
    pinned: false,
  };
}

export function useSync(
  token: string | null,
  importNoteLocal: (note: Note) => Promise<void>,
  deleteNoteLocal: (id: string) => Promise<void>,
  insertNoteSilent: (note: Note) => Promise<void>,
  getLocalNote: (id: string) => Note | undefined,
): UseSyncResult {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // --- push ---
  const pushNow = useCallback(async (notes: SyncPushNote[]) => {
    const t = tokenRef.current;
    if (!t || notes.length === 0) return;
    setSyncStatus("pushing");
    try {
      const result = await pushNotes(t, notes);

      // Generate conflict copies for notes rejected by server
      for (const skippedId of result.skipped) {
        const local = getLocalNote(skippedId);
        if (local && local.content.trim()) {
          const conflict = buildConflictNote(local);
          await insertNoteSilent(conflict);
          console.log("[sync] conflict copy created for:", skippedId);
        }
      }

      // NOTE: Do NOT update since here — only pullNow manages the cursor.
      // Updating since to Date.now() would skip server notes created
      // between the last pull and now (see pushAllNow).
      setLastSyncAt(Date.now());
      setSyncStatus("idle");
    } catch (err) {
      console.error("[sync] push failed:", err);
      setSyncStatus("error");
    }
  }, [getLocalNote, insertNoteSilent]);

  // --- pull ---
  const pullNow = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return;
    setSyncStatus("pulling");
    try {
      const since = getStoredSince();
      let hasMore = true;
      let cursor = since;
      let totalPulled = 0;

      while (hasMore) {
        const result = await pullNotes(t, cursor);
        let pageMaxUpdatedAt = 0;

        for (const remote of result.notes) {
          if (remote.deleted) {
            await deleteNoteLocal(remote.id);
          } else {
            // Pull-side conflict detection: skip on initial sync (since===0)
            const local = getLocalNote(remote.id);
            if (since > 0 && local && local.updatedAt > since && local.content !== remote.content) {
              // Both sides changed — preserve local as conflict copy
              const conflict = buildConflictNote(local);
              await insertNoteSilent(conflict);
              console.log("[sync] pull conflict copy created for:", remote.id);
            }

            await importNoteLocal({
              id: remote.id,
              content: remote.content,
              color: remote.color as Note["color"],
              createdAt: remote.created_at,
              updatedAt: remote.updated_at,
              pinned: remote.pinned,
            });
          }
          if (remote.updated_at > pageMaxUpdatedAt) {
            pageMaxUpdatedAt = remote.updated_at;
          }
        }
        totalPulled += result.notes.length;
        hasMore = result.hasMore;
        // Advance cursor to the max updated_at of this page,
        // avoiding the gap between max(updated_at) and serverTime.
        // Fall back to serverTime when the page is empty (should not happen).
        cursor = pageMaxUpdatedAt > cursor ? pageMaxUpdatedAt : (result.serverTime > cursor ? result.serverTime : cursor);
      }

      // Only advance since if we actually pulled something.
      // Advancing on empty pulls would drift the cursor into the future.
      if (totalPulled > 0) {
        storeSince(cursor);
        console.log(`[sync] pulled ${totalPulled} notes`);
      }
      setLastSyncAt(Date.now());
      setSyncStatus("idle");
    } catch (err) {
      console.error("[sync] pull failed:", err);
      setSyncStatus("error");
    }
  }, [importNoteLocal, deleteNoteLocal, insertNoteSilent, getLocalNote]);

  // --- push all local notes (called once after login) ---
  const pushAllNow = useCallback(async (notes: Note[]) => {
    const t = tokenRef.current;
    if (!t || notes.length === 0) return;
    const payload: SyncPushNote[] = [];
    for (const n of notes) {
      // Skip conflict copies — they are local-only
      if (n.content.startsWith("⚠ 冲突副本")) continue;
      payload.push({
        id: n.id,
        content: n.content,
        color: n.color,
        pinned: n.pinned,
        updated_at: n.updatedAt,
        deleted: false,
      });
    }
    if (payload.length === 0) return;
    setSyncStatus("pushing");
    try {
      const result = await pushNotes(t, payload);
      const skippedCount = result?.skipped?.length ?? 0;
      if (skippedCount > 0) {
        console.log("[sync] pushAll skipped (already in sync):", skippedCount);
      }
      // Reset since to 0 so the subsequent pullNow does a full sync.
      // This also clears any stale since value left by older buggy code.
      storeSince(0);
      setLastSyncAt(Date.now());
      setSyncStatus("idle");
    } catch (err) {
      console.error("[sync] pushAll failed:", err);
      // Even on failure, reset since to 0 so pullNow can do a full sync
      storeSince(0);
      setSyncStatus("error");
    }
  }, []);

  // Periodic pull every 30s when authenticated
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(pullNow, 30_000);
    return () => clearInterval(interval);
  }, [token, pullNow]);

  return { syncStatus, lastSyncAt, pushNow, pushAllNow, pullNow };
}



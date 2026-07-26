import axios from "axios";

export interface PinnedNote {
  id: string;
  title: string;
  content: string;
  source?: string;
  author?: string;
  createdAt: string;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sourcemind_token");
}

export function getPinnedNotes(notebookId: string): PinnedNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`sourcemind_notes_${notebookId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load notes from local cache:", e);
    return [];
  }
}

export async function fetchNotesFromDB(notebookId: string): Promise<PinnedNote[]> {
  if (typeof window === "undefined") return [];
  try {
    const token = getAuthToken();
    if (!token) return getPinnedNotes(notebookId);

    const res = await axios.get(`/api/notebooks/${notebookId}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const dbNotes: PinnedNote[] = (res.data.notes || []).map((n: any) => ({
      id: n.id,
      title: n.title || "Untitled Note",
      content: n.content,
      source: n.source || "Manual",
      author: n.author || "User",
      createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
    }));

    localStorage.setItem(`sourcemind_notes_${notebookId}`, JSON.stringify(dbNotes));
    window.dispatchEvent(new CustomEvent("sourcemind_notes_updated", { detail: { notebookId } }));

    return dbNotes;
  } catch (e) {
    console.error("Failed to fetch notes from DB:", e);
    return getPinnedNotes(notebookId);
  }
}

export function pinNoteToStorage(
  notebookId: string,
  content: string,
  title: string = "Pinned Note",
  source?: string,
  author?: string
): PinnedNote {
  const notes = getPinnedNotes(notebookId);
  const tempId = crypto.randomUUID();
  const newNote: PinnedNote = {
    id: tempId,
    title,
    content,
    source,
    author: author || "AI Assistant",
    createdAt: new Date().toISOString(),
  };

  // Optimistic UI update
  const updated = [newNote, ...notes];
  try {
    localStorage.setItem(`sourcemind_notes_${notebookId}`, JSON.stringify(updated));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sourcemind_notes_updated", { detail: { notebookId } }));
    }
  } catch (e) {
    console.error("Failed to save optimistic note:", e);
  }

  // Persist to backend DB
  const token = getAuthToken();
  if (token) {
    axios
      .post(
        `/api/notebooks/${notebookId}/notes`,
        { id: tempId, title, content, source, author: author || "AI Assistant" },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        if (res.data?.note) {
          const dbNote = res.data.note;
          const currentNotes = getPinnedNotes(notebookId);
          const replaced = currentNotes.map((n) =>
            n.id === tempId
              ? {
                  id: dbNote.id,
                  title: dbNote.title || title,
                  content: dbNote.content,
                  source: dbNote.source || source,
                  author: dbNote.author || author,
                  createdAt: new Date(dbNote.createdAt).toISOString(),
                }
              : n
          );
          localStorage.setItem(`sourcemind_notes_${notebookId}`, JSON.stringify(replaced));
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("sourcemind_notes_updated", { detail: { notebookId } }));
          }
        }
      })
      .catch((err) => console.error("Failed to persist note to DB:", err));
  }

  return newNote;
}

export function updateNoteInStorage(
  notebookId: string,
  noteId: string,
  title: string,
  content: string
): void {
  const notes = getPinnedNotes(notebookId);
  const updated = notes.map((n) => (n.id === noteId ? { ...n, title, content } : n));
  try {
    localStorage.setItem(`sourcemind_notes_${notebookId}`, JSON.stringify(updated));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sourcemind_notes_updated", { detail: { notebookId } }));
    }
  } catch (e) {
    console.error("Failed to update local note:", e);
  }

  const token = getAuthToken();
  if (token) {
    axios
      .patch(
        `/api/notebooks/${notebookId}/notes/${noteId}`,
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .catch((err) => console.error("Failed to update note in DB:", err));
  }
}

export function removeNoteFromStorage(notebookId: string, noteId: string): void {
  const notes = getPinnedNotes(notebookId);
  const updated = notes.filter((n) => n.id !== noteId);
  try {
    localStorage.setItem(`sourcemind_notes_${notebookId}`, JSON.stringify(updated));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sourcemind_notes_updated", { detail: { notebookId } }));
    }
  } catch (e) {
    console.error("Failed to delete note from local storage:", e);
  }

  const token = getAuthToken();
  if (token) {
    axios
      .delete(`/api/notebooks/${notebookId}/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch((err) => console.error("Failed to delete note from DB:", err));
  }
}

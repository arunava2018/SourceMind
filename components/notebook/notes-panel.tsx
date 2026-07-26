"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  BookmarkPlus, Trash2, Edit3, Copy, Check, Sparkles, 
  Plus, FileText, Send, Loader2, CheckSquare, Square, 
  X, AlertCircle, RefreshCw, ArrowRight
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPinnedNotes, pinNoteToStorage, removeNoteFromStorage, updateNoteInStorage, fetchNotesFromDB, PinnedNote } from "@/lib/notes-util";

export function NotesPanel({ notebookId }: { notebookId: string }) {
  const [notes, setNotes] = useState<PinnedNote[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Drafting State
  const [showDrafting, setShowDrafting] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState("Write an engaging blog post summarizing these notes.");
  const [template, setTemplate] = useState<"blog" | "report" | "email" | "custom">("blog");
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftResult, setDraftResult] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  const loadNotes = () => {
    setNotes(getPinnedNotes(notebookId));
  };

  useEffect(() => {
    loadNotes();
    fetchNotesFromDB(notebookId).then(() => loadNotes());
    const handleUpdate = (e: any) => {
      if (e.detail?.notebookId === notebookId || !e.detail) {
        loadNotes();
      }
    };
    window.addEventListener("sourcemind_notes_updated", handleUpdate);
    return () => window.removeEventListener("sourcemind_notes_updated", handleUpdate);
  }, [notebookId]);

  const handleSaveNewNote = () => {
    if (!newContent.trim()) return;
    pinNoteToStorage(notebookId, newContent.trim(), newTitle.trim() || "Custom Note", "User Note");
    setNewTitle("");
    setNewContent("");
    setIsCreating(false);
  };

  const handleUpdateNote = (id: string) => {
    if (!newContent.trim()) return;
    updateNoteInStorage(notebookId, id, newTitle.trim() || "Updated Note", newContent.trim());
    setEditingId(null);
    setNewTitle("");
    setNewContent("");
  };

  const startEdit = (note: PinnedNote) => {
    setEditingId(note.id);
    setNewTitle(note.title);
    setNewContent(note.content);
    setIsCreating(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === notes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notes.map(n => n.id)));
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateDraft = async () => {
    setIsDrafting(true);
    setDraftError(null);
    setDraftResult(null);

    const notesToUse = selectedIds.size > 0 
      ? notes.filter(n => selectedIds.has(n.id))
      : notes;

    try {
      const token = localStorage.getItem("sourcemind_token");
      const res = await axios.post(
        `/api/notebooks/${notebookId}/studio`,
        {
          type: "draft",
          prompt: draftPrompt,
          notes: notesToUse.map(n => `[${n.title}]: ${n.content}`),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setDraftResult(res.data.data);
    } catch (err: any) {
      setDraftError(err.response?.data?.error || err.message || "An error occurred while drafting.");
    } finally {
      setIsDrafting(false);
    }
  };

  const setTemplatePrompt = (t: "blog" | "report" | "email" | "custom") => {
    setTemplate(t);
    if (t === "blog") setDraftPrompt("Write an engaging, insightful blog post summarizing these notes with clear headings and key takeaways.");
    if (t === "report") setDraftPrompt("Write a formal executive summary and analytical report structured around these notes.");
    if (t === "email") setDraftPrompt("Draft a professional update email with bullet points summarizing the key highlights from these notes.");
    if (t === "custom") setDraftPrompt("");
  };

  return (
    <div className="flex h-full flex-col bg-background relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4 bg-card/50">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookmarkPlus className="h-5 w-5 text-primary" />
            Pinned Notes & Scratchpad
          </h2>
          <p className="text-xs text-muted-foreground">
            Save quotes from Chat or Studio, write custom notes, and synthesize new documents with AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsCreating(true);
              setEditingId(null);
              setNewTitle("");
              setNewContent("");
            }}
            className="h-9 rounded-xl text-xs gap-1.5 font-medium"
          >
            <Plus className="h-4 w-4" /> New Note
          </Button>

          <Button
            size="sm"
            disabled={notes.length === 0}
            onClick={() => {
              setShowDrafting(true);
              setDraftResult(null);
            }}
            className="h-9 rounded-xl text-xs gap-1.5 bg-gradient-to-r from-primary to-emerald-600 hover:opacity-90 font-medium shadow-sm"
          >
            <Sparkles className="h-4 w-4" /> AI Draft from Notes ({selectedIds.size > 0 ? selectedIds.size : "All"})
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="mx-auto max-w-4xl pb-20">
          {/* Note Creation / Editing Box */}
          {(isCreating || editingId) && (
            <div className="mb-8 rounded-2xl border-2 border-primary/40 bg-card p-5 shadow-md animate-in fade-in-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {editingId ? "Edit Note" : "Create New Note"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Note Title (optional)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mb-3 font-semibold text-sm rounded-xl"
              />
              <Textarea
                placeholder="Type your notes, ideas, or key takeaways here..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
                className="mb-4 text-sm resize-none rounded-xl"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={editingId ? () => handleUpdateNote(editingId) : handleSaveNewNote}
                  disabled={!newContent.trim()}
                  className="rounded-xl text-xs px-5"
                >
                  {editingId ? "Save Changes" : "Pin Note"}
                </Button>
              </div>
            </div>
          )}

          {/* Notes List */}
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-muted p-5">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No pinned notes yet</h3>
              <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
                You can save favorite quotes from Chat or Study Guides, or click "New Note" above to write down your own ideas.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 pb-2 border-b text-xs text-muted-foreground">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-2 font-medium hover:text-foreground transition-colors"
                >
                  {selectedIds.size === notes.length && notes.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Select All Notes ({notes.length})
                </button>
                <span>{selectedIds.size} selected for AI Drafting</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.map((note) => {
                  const isSelected = selectedIds.has(note.id);
                  return (
                    <div
                      key={note.id}
                      onClick={() => toggleSelect(note.id)}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all cursor-pointer ${
                        isSelected ? "border-primary bg-primary/5 shadow-sm" : "bg-card hover:border-primary/40 hover:shadow-sm"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <h4 className="font-bold text-sm text-foreground line-clamp-1">{note.title}</h4>
                          </div>
                          {note.source && (
                            <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {note.source}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 my-3 font-normal whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50 text-[11px] text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Copy text"
                            onClick={() => handleCopy(note.id, note.content)}
                            className="h-7 w-7 rounded-lg hover:bg-accent"
                          >
                            {copiedId === note.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit note"
                            onClick={() => startEdit(note)}
                            className="h-7 w-7 rounded-lg hover:bg-accent"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete note"
                            onClick={() => removeNoteFromStorage(notebookId, note.id)}
                            className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Drafting Drawer / Modal Overlay */}
      {showDrafting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="flex flex-col h-[90%] w-full max-w-3xl rounded-3xl border bg-card shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
              <div className="flex items-center gap-2 font-bold text-base">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Drafting Assistant
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowDrafting(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!draftResult ? (
                <div className="max-w-xl mx-auto py-4 pb-20">
                  <div className="mb-6 text-center">
                    <h3 className="text-xl font-bold">What would you like to draft?</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      We will synthesize {selectedIds.size > 0 ? `${selectedIds.size} selected notes` : `all ${notes.length} notes`} along with your source documents into a clean draft.
                    </p>
                  </div>

                  {/* Template Picker */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                    <button
                      onClick={() => setTemplatePrompt("blog")}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
                        template === "blog" ? "border-primary bg-primary/10 text-primary" : "bg-muted/30 hover:bg-muted"
                      }`}
                    >
                      📝 Blog Post
                    </button>
                    <button
                      onClick={() => setTemplatePrompt("report")}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
                        template === "report" ? "border-primary bg-primary/10 text-primary" : "bg-muted/30 hover:bg-muted"
                      }`}
                    >
                      📊 Report
                    </button>
                    <button
                      onClick={() => setTemplatePrompt("email")}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
                        template === "email" ? "border-primary bg-primary/10 text-primary" : "bg-muted/30 hover:bg-muted"
                      }`}
                    >
                      📧 Email
                    </button>
                    <button
                      onClick={() => setTemplatePrompt("custom")}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
                        template === "custom" ? "border-primary bg-primary/10 text-primary" : "bg-muted/30 hover:bg-muted"
                      }`}
                    >
                      ✏️ Custom
                    </button>
                  </div>

                  <Textarea
                    value={draftPrompt}
                    onChange={(e) => setDraftPrompt(e.target.value)}
                    placeholder="Describe what you want to write (e.g., 'Draft an outline comparing the key methods described in my notes')..."
                    rows={4}
                    className="mb-4 text-sm rounded-2xl"
                  />

                  {draftError && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{draftError}</span>
                    </div>
                  )}

                  <Button
                    onClick={handleGenerateDraft}
                    disabled={isDrafting || !draftPrompt.trim()}
                    className="w-full h-11 rounded-2xl font-bold bg-gradient-to-r from-primary to-emerald-600 shadow-md"
                  >
                    {isDrafting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Synthesizing Draft...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" /> Generate Draft Now
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto py-2">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Generated Draft</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy("draft", draftResult)}
                        className="h-8 text-xs rounded-xl"
                      >
                        {copiedId === "draft" ? <Check className="mr-1 h-3 w-3 text-emerald-500" /> : <Copy className="mr-1 h-3 w-3" />}
                        {copiedId === "draft" ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          pinNoteToStorage(notebookId, draftResult, `Draft: ${template.toUpperCase()}`, "AI Draft");
                          setShowDrafting(false);
                        }}
                        className="h-8 text-xs rounded-xl"
                      >
                        <BookmarkPlus className="mr-1 h-3 w-3" /> Save as Pinned Note
                      </Button>
                    </div>
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none break-words bg-muted/20 p-6 rounded-2xl border">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {draftResult}
                    </ReactMarkdown>
                  </div>

                  <div className="mt-6 flex justify-end gap-2 pb-10">
                    <Button variant="outline" size="sm" onClick={() => setDraftResult(null)} className="rounded-xl text-xs">
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try Another Prompt
                    </Button>
                    <Button size="sm" onClick={() => setShowDrafting(false)} className="rounded-xl text-xs">
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

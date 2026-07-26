"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookmarkPlus, Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { pinNoteToStorage } from "@/lib/notes-util";

interface DocumentViewerProps {
  title: string;
  content: string;
  notebookId: string;
  onBack: () => void;
}

export function DocumentViewer({ title, content, notebookId, onBack }: DocumentViewerProps) {
  const [copied, setCopied] = useState(false);
  const [pinned, setPinned] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePin = (text: string, docTitle: string) => {
    pinNoteToStorage(notebookId, text, docTitle, "Notebook Studio");
    setPinned(true);
    setTimeout(() => setPinned(false), 2000);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-card/50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 gap-1 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Studio
          </Button>
          <span className="text-xs font-semibold text-muted-foreground">|</span>
          <span className="text-xs font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(content)}
            className="h-8 text-xs rounded-lg gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            size="sm"
            onClick={() => handlePin(content, title)}
            className="h-8 text-xs rounded-lg gap-1.5"
          >
            {pinned ? <Check className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
            {pinned ? "Pinned to Notes" : "Pin to Notes"}
          </Button>
        </div>
      </div>

      {/* Markdown content */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10">
        <div className="mx-auto max-w-3xl prose prose-sm sm:prose dark:prose-invert break-words pb-20">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

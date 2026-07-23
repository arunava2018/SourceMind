"use client"

import { useStore } from "@/lib/store"
import { Source } from "@/lib/types"
import { AddSourceDialog } from "./add-source-dialog"
import { FileText, Globe, PlaySquare, MessageSquare, FileVideo, MoreVertical, RotateCw, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

const SourceIcon = ({ type }: { type: Source['type'] }) => {
  switch (type) {
    case 'pdf': return <FileText className="h-4 w-4" />
    case 'url': return <Globe className="h-4 w-4" />
    case 'youtube': return <PlaySquare className="h-4 w-4" />
    case 'vtt': return <FileVideo className="h-4 w-4" />
    case 'text': return <MessageSquare className="h-4 w-4" />
    default: return <FileText className="h-4 w-4" />
  }
}

const StatusIndicator = ({ status }: { status: Source['status'] }) => {
  switch (status) {
    case 'uploading':
      return (
        <div className="flex items-center gap-1.5 text-xs text-amber-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Uploading</span>
        </div>
      )
    case 'indexing':
      return (
        <div className="flex items-center gap-1.5 text-xs text-blue-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Indexing</span>
        </div>
      )
    case 'ready':
      return (
        <div className="flex items-center gap-1.5 text-xs text-green-500">
          <CheckCircle2 className="h-3 w-3" />
          <span>Ready</span>
        </div>
      )
    case 'error':
      return (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          <span>Error</span>
        </div>
      )
    default: return null
  }
}

export function SourcesPanel({ notebookId }: { notebookId: string }) {
  const { getSourcesForNotebook, removeSource, reindexSource } = useStore()
  const sources = getSourcesForNotebook(notebookId)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold tracking-tight">Sources ({sources.length})</h2>
      </div>
      
      <div className="p-4 pb-2">
        <AddSourceDialog notebookId={notebookId} />
      </div>

      <div className="flex-1 overflow-auto p-4 pt-2">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-10 text-center text-sm text-muted-foreground">
            <div className="mb-3 rounded-full bg-muted p-3">
              <FileText className="h-5 w-5" />
            </div>
            <p>No sources added yet.</p>
            <p className="mt-1 max-w-[200px]">Add documents, links, or videos to start your research.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sources.map((source) => (
              <div 
                key={source.id} 
                className="group relative flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm transition-colors hover:border-border/80"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="mt-0.5 shrink-0 text-muted-foreground">
                      <SourceIcon type={source.type} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium leading-none" title={source.name}>
                        {source.name}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Added {formatDistanceToNow(
                          (() => {
                            try {
                              if (!source.addedAt) return new Date();
                              const d = new Date(source.addedAt);
                              return isNaN(d.getTime()) ? new Date() : d;
                            } catch (e) {
                              return new Date();
                            }
                          })(), 
                          { addSuffix: true }
                        )}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" className="h-6 w-6 shrink-0 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100" />}>
                      <MoreVertical className="h-3 w-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => reindexSource(source.id)}>
                        <RotateCw className="mr-2 h-4 w-4" />
                        Re-index
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                        onClick={() => removeSource(notebookId, source.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <StatusIndicator status={source.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

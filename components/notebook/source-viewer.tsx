"use client"

import { useStore } from "@/lib/store"
import { mockSourceContents } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Globe, PlaySquare, MessageSquare, FileVideo, X, ExternalLink, PlayCircle } from "lucide-react"

export function SourceViewer() {
  const { activeViewerSource, closeViewer } = useStore()
  
  if (!activeViewerSource) return null

  const { source, citation } = activeViewerSource
  
  // Use mock content if available, otherwise fallback
  const content = mockSourceContents[source.id] || "Content is not available for this source in the mock data. Try selecting a different citation."

  const getSourceIcon = () => {
    switch (source.type) {
      case 'pdf': return <FileText className="h-5 w-5" />
      case 'url': return <Globe className="h-5 w-5" />
      case 'youtube': return <PlaySquare className="h-5 w-5" />
      case 'vtt': return <FileVideo className="h-5 w-5" />
      case 'text': return <MessageSquare className="h-5 w-5" />
    }
  }

  // Highlight the cited text within the content
  const renderHighlightedContent = () => {
    if (!citation || !citation.chunkText) {
      return <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
    }

    // A very simple search to highlight the citation chunk
    // In a real app, this would use exact byte offsets or robust fuzzy search
    const searchString = citation.chunkText.slice(0, 50) // Search by first 50 chars to find the approximate location
    const index = content.indexOf(searchString)
    
    if (index === -1) {
      return (
        <>
          <div className="mb-4 rounded-md bg-accent p-3 text-sm border-l-2 border-primary">
            <span className="font-semibold block mb-1">Cited Excerpt:</span>
            "{citation.chunkText}"
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{content}</p>
        </>
      )
    }

    const before = content.slice(0, index)
    const after = content.slice(index + citation.chunkText.length)
    const highlighted = content.slice(index, index + citation.chunkText.length)

    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed">
        <span className="text-muted-foreground">{before}</span>
        <span className="bg-primary/20 text-foreground font-medium px-1 rounded">{highlighted}</span>
        <span className="text-muted-foreground">{after}</span>
      </p>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-muted-foreground shrink-0">
            {getSourceIcon()}
          </div>
          <h2 className="font-semibold text-sm truncate" title={source.name}>
            {source.name}
          </h2>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 ml-2" onClick={closeViewer}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close viewer</span>
        </Button>
      </div>

      {/* Metadata Bar */}
      {(citation?.metadata || source.metadata) && (
        <div className="bg-muted/30 border-b px-4 py-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {citation?.metadata?.pageNumber && (
            <span className="bg-background border rounded px-1.5 py-0.5 font-medium text-foreground">
              Page {citation.metadata.pageNumber}
            </span>
          )}
          {citation?.metadata?.timestamp && (
            <span className="bg-background border rounded px-1.5 py-0.5 font-medium text-foreground flex items-center gap-1">
              <PlayCircle className="h-3 w-3" />
              {citation.metadata.timestamp}
            </span>
          )}
          {(citation?.metadata?.url || source.metadata?.url) && (
            <a 
              href={citation?.metadata?.url || source.metadata?.url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-foreground hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Open Source Link
            </a>
          )}
        </div>
      )}

      <ScrollArea className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          {/* Mock Viewer UI based on source type */}
          {source.type === 'youtube' && (
            <div className="mb-6 aspect-video w-full rounded-md bg-muted flex items-center justify-center border relative overflow-hidden">
              <div className="absolute inset-0 bg-black/5 flex flex-col items-center justify-center">
                <PlaySquare className="h-12 w-12 text-red-500 mb-2 opacity-80" />
                <span className="text-sm font-medium text-muted-foreground">Video Player Placeholder</span>
              </div>
            </div>
          )}
          
          {source.type === 'pdf' && (
            <div className="mb-4 text-xs font-mono text-muted-foreground border-b pb-2">
              Document Viewer — PDF.js Mock
            </div>
          )}
          
          <div className="prose prose-sm dark:prose-invert">
            {renderHighlightedContent()}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

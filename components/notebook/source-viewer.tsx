"use client"

import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  FileText, Globe, PlaySquare, MessageSquare, FileVideo, X, 
  ExternalLink, PlayCircle, Hash, BookOpen, Quote, ChevronRight 
} from "lucide-react"
import type { Source, Citation } from "@/lib/types"

export function SourceViewer() {
  const { activeViewerSource, closeViewer } = useStore()
  
  if (!activeViewerSource) return null

  const { source, citation } = activeViewerSource
  const content = source.originalContent || source.content || "Content is not available for this source."

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <SourceViewerHeader source={source} onClose={closeViewer} />

      {/* Citation highlight card */}
      {citation?.chunkText && (
        <CitationHighlightCard citation={citation} source={source} />
      )}

      {/* Source-specific content area */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="mx-auto max-w-2xl">
            {/* YouTube embed */}
            {source.type === 'youtube' && source.metadata?.url && (
              <YoutubeEmbed url={source.metadata.url} />
            )}

            {/* PDF: Show page number info instead of raw text dump */}
            {source.type === 'pdf' ? (
              <PdfInfo source={source} citation={citation} />
            ) : (
              <SourceContent content={content} citation={citation} sourceType={source.type} />
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

/* ─── Header ────────────────────────────────────────────────────────────────── */

function SourceViewerHeader({ source, onClose }: { source: Source; onClose: () => void }) {
  const iconMap = {
    pdf: { icon: FileText, color: "text-red-400", bg: "bg-red-500/10", label: "PDF Document" },
    url: { icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10", label: "Web Page" },
    youtube: { icon: PlaySquare, color: "text-red-500", bg: "bg-red-500/10", label: "YouTube Video" },
    vtt: { icon: FileVideo, color: "text-purple-400", bg: "bg-purple-500/10", label: "Subtitle File" },
    text: { icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Text Source" },
  }

  const config = iconMap[source.type]
  const Icon = config.icon

  return (
    <div className="border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
            <Icon className={`h-4.5 w-4.5 ${config.color}`} />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm truncate" title={source.name}>
              {source.name}
            </h2>
            <p className="text-xs text-muted-foreground">{config.label}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 ml-2" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close viewer</span>
        </Button>
      </div>

      {/* Source metadata bar */}
      {(source.metadata?.url || source.metadata?.duration || source.metadata?.pageCount) && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3 text-xs text-muted-foreground">
          {source.metadata?.pageCount && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
              <BookOpen className="h-3 w-3" />
              {source.metadata.pageCount} pages
            </span>
          )}
          {source.metadata?.duration && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
              <PlayCircle className="h-3 w-3" />
              {source.metadata.duration}
            </span>
          )}
          {source.metadata?.url && (
            <a
              href={source.metadata.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Open original
            </a>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Citation Highlight Card ────────────────────────────────────────────────── */

function CitationHighlightCard({ citation, source }: { citation: Citation; source: Source }) {
  const typeColorMap: Record<string, string> = {
    pdf: "border-l-red-400",
    url: "border-l-blue-400",
    youtube: "border-l-red-500",
    vtt: "border-l-purple-400",
    text: "border-l-emerald-400",
  }

  return (
    <div className="border-b bg-muted/30 px-4 py-3">
      <div className={`rounded-lg border border-border/50 bg-background p-3 border-l-[3px] ${typeColorMap[source.type] || "border-l-primary"}`}>
        <div className="flex items-center gap-2 mb-2">
          <Quote className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Cited Excerpt</span>
          {citation.chunkIndex !== undefined && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              <Hash className="h-2.5 w-2.5" />
              Chunk {citation.chunkIndex + 1}
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed text-foreground/90 line-clamp-6">
          &ldquo;{citation.chunkText}&rdquo;
        </p>
      </div>
    </div>
  )
}

/* ─── YouTube Embed ──────────────────────────────────────────────────────────── */

function YoutubeEmbed({ url }: { url: string }) {
  // Extract video ID from various YouTube URL formats
  const getVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const videoId = getVideoId(url)

  if (!videoId) {
    return (
      <div className="mb-6 aspect-video w-full rounded-xl bg-muted flex items-center justify-center border overflow-hidden">
        <div className="text-center">
          <PlaySquare className="h-10 w-10 text-red-500 mx-auto mb-2 opacity-60" />
          <span className="text-sm text-muted-foreground">Could not load video</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 aspect-video w-full rounded-xl overflow-hidden border bg-black shadow-lg">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  )
}

/* ─── Source Content ─────────────────────────────────────────────────────────── */

function SourceContent({ content, citation, sourceType }: { content: string; citation?: Citation | null; sourceType: string }) {
  // If no citation or can't find in content, just render content
  if (!citation?.chunkText) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ContentWithLineBreaks text={content} sourceType={sourceType} />
      </div>
    )
  }

  // Try to find and highlight the cited text
  const searchString = citation.chunkText.slice(0, 80)
  const index = content.indexOf(searchString)

  if (index === -1) {
    // Couldn't find exact match — show content as-is (the citation card above already shows the excerpt)
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ContentWithLineBreaks text={content} sourceType={sourceType} />
      </div>
    )
  }

  const before = content.slice(0, index)
  const highlighted = content.slice(index, index + citation.chunkText.length)
  const after = content.slice(index + citation.chunkText.length)

  return (
    <div className="text-sm leading-relaxed">
      {before && (
        <span className="text-muted-foreground/70">{before}</span>
      )}
      <mark className="bg-primary/15 text-foreground rounded px-0.5 py-0.5 ring-1 ring-primary/20">
        {highlighted}
      </mark>
      {after && (
        <span className="text-muted-foreground/70">{after}</span>
      )}
    </div>
  )
}

/* ─── Content Formatter ──────────────────────────────────────────────────────── */

function ContentWithLineBreaks({ text, sourceType }: { text: string; sourceType: string }) {
  // For PDFs and text, split by double newlines to create paragraph structure
  const paragraphs = text.split(/\n{2,}/)

  if (paragraphs.length <= 1) {
    return <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{text}</p>
  }

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
          {paragraph.trim()}
        </p>
      ))}
    </div>
  )
}

/* ─── PDF Info ───────────────────────────────────────────────────────────────── */

function PdfInfo({ source, citation }: { source: Source; citation?: Citation | null }) {
  const pageNumber = citation?.metadata?.pageNumber

  return (
    <div className="space-y-4">
      {/* Page number badge */}
      <div className="flex items-center justify-center">
        <div className="rounded-xl border bg-muted/40 px-8 py-6 text-center">
          <FileText className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1">{source.name}</h3>
          {pageNumber ? (
            <p className="text-sm text-muted-foreground">
              Referenced from <span className="font-semibold text-primary">Page {pageNumber}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">PDF Document</p>
          )}
        </div>
      </div>

      {/* Tip */}
      <p className="text-xs text-center text-muted-foreground/70">
        Open the original PDF to view the full document.
      </p>
    </div>
  )
}


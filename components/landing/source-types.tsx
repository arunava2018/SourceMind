import { FileText, Globe, PlaySquare, MessageSquare, FileVideo } from "lucide-react"

export function SourceTypes() {
  const sources = [
    { icon: FileText, label: "PDF Documents", desc: "Research papers, reports, textbooks" },
    { icon: MessageSquare, label: "Plain Text", desc: "Notes, transcripts, raw text" },
    { icon: Globe, label: "Website URLs", desc: "Articles, docs, blog posts" },
    { icon: PlaySquare, label: "YouTube Videos", desc: "Lectures, tutorials, talks" },
    { icon: FileVideo, label: "VTT / Transcripts", desc: "Subtitle and caption files" },
  ]

  return (
    <section className="border-y bg-muted/20 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Ingest any source type
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {sources.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="group flex flex-col items-center gap-3 rounded-xl border bg-background/80 p-5 text-center transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-sm font-semibold">{label}</span>
                <p className="mt-0.5 text-xs text-muted-foreground hidden sm:block">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import { FileText, Globe, PlaySquare, MessageSquare, FileVideo } from "lucide-react"

export function SourceTypes() {
  return (
    <section className="border-y bg-muted/30 py-12">
      <div className="mx-auto max-w-4xl px-6">
        <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Supported Source Types
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            { icon: FileText, label: "PDF" },
            { icon: MessageSquare, label: "Plain Text" },
            { icon: Globe, label: "Website URL" },
            { icon: PlaySquare, label: "YouTube" },
            { icon: FileVideo, label: "VTT / Transcript" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-lg border bg-background p-4 transition-colors hover:bg-accent"
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

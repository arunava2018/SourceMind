import { BookOpen, RefreshCw, Quote, Eye, Layers, ShieldCheck } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: Layers,
      title: "Isolated Notebooks",
      description:
        "Each notebook maintains its own knowledge base. Keep your research organized and completely separated by topic.",
    },
    {
      icon: RefreshCw,
      title: "Real-time Indexing",
      description:
        "Watch your sources go from uploading to indexed with clear status indicators at every step of the pipeline.",
    },
    {
      icon: Quote,
      title: "Inline Citations",
      description:
        "Every answer comes with numbered citation badges. No answer without attribution — click to verify the source.",
    },
    {
      icon: Eye,
      title: "Source Viewer",
      description:
        "Click a citation to see the original text, PDF page, or YouTube timestamp that produced the answer.",
    },
    {
      icon: BookOpen,
      title: "Re-index Anytime",
      description:
        "Sources can be removed or re-indexed on demand. Your knowledge base always stays current and accurate.",
    },
    {
      icon: ShieldCheck,
      title: "Private & Secure",
      description:
        "Your sources are siloed per notebook. Nothing is shared across notebooks or with other users.",
    },
  ]

  return (
    <section id="features" className="border-t bg-muted/20 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for serious research
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Everything you need to turn scattered sources into structured
            knowledge — all in one clean interface.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-xl border bg-background/80 p-6 transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

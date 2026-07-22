export function Features() {
  return (
    <section className="border-t bg-muted/30 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Built for serious research
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to turn scattered sources into structured
            knowledge.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Isolated Notebooks",
              description:
                "Each notebook maintains its own knowledge base. Keep your research organized and separated.",
            },
            {
              title: "Real-time Indexing",
              description:
                "Watch your sources go from uploading to indexed with clear status indicators at every step.",
            },
            {
              title: "Inline Citations",
              description:
                "Every answer comes with numbered citations. No answer without attribution — ever.",
            },
            {
              title: "Source Viewer",
              description:
                "Click a citation to see the original text, PDF page, or YouTube timestamp that produced the answer.",
            },
            {
              title: "Re-index Anytime",
              description:
                "Sources can be removed or re-indexed on demand. Your knowledge base stays current.",
            },
            {
              title: "Multiple Source Types",
              description:
                "PDFs, web pages, YouTube videos, plain text, and transcripts — all in one place.",
            },
          ].map(({ title, description }) => (
            <div
              key={title}
              className="rounded-lg border bg-background p-6 transition-colors hover:bg-accent/50"
            >
              <h3 className="mb-2 font-semibold">{title}</h3>
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

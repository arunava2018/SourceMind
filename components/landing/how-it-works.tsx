import { Search, Upload, CheckCircle2 } from "lucide-react"

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="mb-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
        <p className="mt-3 text-muted-foreground">
          Three simple steps to get grounded answers from your sources.
        </p>
      </div>
      <div className="grid gap-12 md:grid-cols-3">
        {[
          {
            step: "01",
            icon: Upload,
            title: "Upload Sources",
            description:
              "Add PDFs, paste text, drop in URLs, YouTube links, or transcript files. Each source is chunked and indexed automatically.",
          },
          {
            step: "02",
            icon: Search,
            title: "Ask Questions",
            description:
              "Type natural language questions about your sources. The system retrieves the most relevant chunks to build context.",
          },
          {
            step: "03",
            icon: CheckCircle2,
            title: "Get Cited Answers",
            description:
              "Receive answers grounded in your sources with inline citations. Click any citation to view the original content.",
          },
        ].map(({ step, icon: Icon, title, description }) => (
          <div key={step} className="flex flex-col items-start">
            <span className="mb-4 text-sm font-medium text-muted-foreground">
              {step}
            </span>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

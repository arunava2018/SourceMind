import { Search, Upload, CheckCircle2 } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: Upload,
      title: "Upload Your Sources",
      description:
        "Add PDFs, paste text, drop in URLs, YouTube links, or transcript files. Each source is automatically chunked and indexed into a vector database.",
    },
    {
      step: "02",
      icon: Search,
      title: "Ask Any Question",
      description:
        "Type natural language questions. The system retrieves the most relevant chunks across all your sources to build rich context for the AI.",
    },
    {
      step: "03",
      icon: CheckCircle2,
      title: "Get Cited Answers",
      description:
        "Receive detailed answers grounded in your sources with inline citation badges. Click any citation to jump to the original content.",
    },
  ]

  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Three steps to grounded answers
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            SourceMind turns your scattered research materials into an organized,
            queryable knowledge base in minutes.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3 md:gap-12">
          {/* Connector line (desktop) */}
          <div className="absolute top-14 left-[16.66%] right-[16.66%] hidden h-px bg-border md:block" />

          {steps.map(({ step, icon: Icon, title, description }) => (
            <div key={step} className="relative flex flex-col items-center text-center">
              {/* Step number circle */}
              <div className="relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary/20 bg-background shadow-sm">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <span className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                Step {step}
              </span>
              <h3 className="mb-3 text-lg font-semibold">{title}</h3>
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

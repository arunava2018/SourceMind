import { CheckCircle2, ShieldCheck, Zap } from "lucide-react"

export function TrustMetrics() {
  return (
    <section className="relative overflow-hidden border-y border-border/40 bg-muted/30 py-16">
      {/* Subtle background glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-60">
        <div className="h-[400px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>RAGAS Validated Engine</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Precision you can trust.
          </h2>
          <p className="max-w-[700px] text-muted-foreground text-lg">
            We continuously evaluate our AI retrieval engine using industry-standard benchmarks to ensure you get accurate, hallucination-free answers every single time.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
          {/* Card 1: Faithfulness */}
          <div className="group relative flex flex-col items-center space-y-4 rounded-2xl border bg-background/50 p-8 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="rounded-full bg-primary/10 p-4 ring-8 ring-primary/5">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-5xl font-extrabold tracking-tighter text-foreground">92<span className="text-3xl text-muted-foreground">%</span></h3>
            <p className="text-sm font-bold uppercase tracking-widest text-foreground/80">Faithfulness</p>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Answers are strictly derived from your uploaded documents. We eliminate AI hallucinations.
            </p>
          </div>

          {/* Card 2: Context Recall */}
          <div className="group relative flex flex-col items-center space-y-4 rounded-2xl border bg-background/50 p-8 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="rounded-full bg-primary/10 p-4 ring-8 ring-primary/5">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-5xl font-extrabold tracking-tighter text-foreground">90<span className="text-3xl text-muted-foreground">%</span></h3>
            <p className="text-sm font-bold uppercase tracking-widest text-foreground/80">Context Recall</p>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Deep semantic search. We find the exact needle hidden in your 100-page PDF haystacks.
            </p>
          </div>

          {/* Card 3: Answer Relevancy */}
          <div className="group relative flex flex-col items-center space-y-4 rounded-2xl border bg-background/50 p-8 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="rounded-full bg-primary/10 p-4 ring-8 ring-primary/5">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-5xl font-extrabold tracking-tighter text-foreground">85<span className="text-3xl text-muted-foreground">%</span></h3>
            <p className="text-sm font-bold uppercase tracking-widest text-foreground/80">Answer Relevancy</p>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Direct and concise answers. No dodging the question or useless rambling.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRight, Zap } from "lucide-react"

export function Hero() {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-24 pb-16 text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
        <Zap className="h-3.5 w-3.5" />
        AI-Powered Research Assistant
      </div>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        Your sources.
        <br />
        <span className="text-muted-foreground">Your answers.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
        Upload PDFs, paste URLs, add YouTube videos — then ask questions and
        get answers grounded in your sources, with citations you can verify.
      </p>
      <div className="mt-10 flex gap-4">
        <Link href="/signup" className={buttonVariants({ size: "lg" })}>
          Start Researching
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
        <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
          Log in
        </Link>
      </div>
    </section>
  )
}

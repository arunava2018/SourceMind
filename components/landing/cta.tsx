import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Cta() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h2 className="text-3xl font-bold tracking-tight">
        Ready to start researching?
      </h2>
      <p className="mt-4 text-muted-foreground">
        Create your first notebook, add your sources, and start asking
        questions in minutes.
      </p>
      <Link href="/signup" className={buttonVariants({ size: "lg", className: "mt-8" })}>
        Create Free Account
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Link>
    </section>
  )
}

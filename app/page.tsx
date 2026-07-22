import { Header } from "@/components/layout/header"
import { Hero } from "@/components/landing/hero"
import { SourceTypes } from "@/components/landing/source-types"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Features } from "@/components/landing/features"
import { Cta } from "@/components/landing/cta"
import { Footer } from "@/components/layout/footer"

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <Hero />
      <SourceTypes />
      <HowItWorks />
      <Features />
      <Cta />
      <Footer />
    </div>
  )
}

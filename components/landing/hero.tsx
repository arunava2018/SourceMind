"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRight, Sparkles, FileText, Globe, PlaySquare, MessageSquare, Send } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"

export function Hero() {
  const { user } = useAuth()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true)
    }
  }, [user])

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-20 -right-20 h-[400px] w-[400px] rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute top-40 -left-20 h-[300px] w-[300px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-28 pb-20 text-center sm:pt-36 sm:pb-28">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>AI-Powered Research Assistant</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Research smarter.
          <br />
          <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
            Not harder.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-base text-muted-foreground leading-relaxed sm:text-lg md:text-xl">
          Upload PDFs, paste URLs, add YouTube videos — then ask questions and
          get answers grounded in your sources, with citations you can verify.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          {isLoggedIn ? (
            <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "px-8" })}>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/signup" className={buttonVariants({ size: "lg", className: "px-8" })}>
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline", className: "px-8" })}>
                Log in
              </Link>
            </>
          )}
        </div>

        {/* Social proof */}
        <p className="mt-6 text-sm text-muted-foreground">
          No credit card required · Free forever for personal use
        </p>

        {/* App Preview Mockup */}
        <div className="mt-16 w-full max-w-4xl sm:mt-20">
          <div className="rounded-xl border bg-background/80 shadow-2xl backdrop-blur-sm ring-1 ring-foreground/5">
            {/* Window Chrome */}
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/80" />
                <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                <div className="h-3 w-3 rounded-full bg-green-400/80" />
              </div>
              <div className="mx-auto rounded-md bg-muted px-16 py-1 text-xs text-muted-foreground">
                chaibooklm.app
              </div>
            </div>

            {/* App Content */}
            <div className="flex min-h-[350px] sm:min-h-[420px]">
              {/* Sources Sidebar */}
              <div className="hidden w-56 shrink-0 border-r bg-muted/30 p-4 sm:block">
                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sources</div>
                <div className="space-y-2.5">
                  {[
                    { icon: FileText, label: "Research Paper.pdf", status: "ready" },
                    { icon: PlaySquare, label: "CS229 Lecture", status: "ready" },
                    { icon: Globe, label: "PyTorch Docs", status: "indexing" },
                    { icon: MessageSquare, label: "Study Notes.txt", status: "ready" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 rounded-lg bg-background/80 px-3 py-2 text-xs">
                      <item.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{item.label}</span>
                      <div className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${item.status === "ready" ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex flex-1 flex-col p-4 sm:p-6">
                <div className="flex-1 space-y-4">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm text-primary-foreground max-w-[280px]">
                      What is the transformer architecture?
                    </div>
                  </div>
                  {/* AI response */}
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-md border bg-muted/50 px-4 py-3 text-sm max-w-[340px]">
                      <p className="text-muted-foreground leading-relaxed">
                        The Transformer is a neural network architecture based on self-attention mechanisms
                        <span className="mx-1 inline-flex h-4 w-4 items-center justify-center rounded bg-primary/15 text-[10px] font-semibold text-primary">1</span>
                        that processes sequences in parallel rather than sequentially
                        <span className="mx-1 inline-flex h-4 w-4 items-center justify-center rounded bg-primary/15 text-[10px] font-semibold text-primary">2</span>
                      </p>
                    </div>
                  </div>
                </div>
                {/* Input */}
                <div className="mt-4 flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5">
                  <span className="flex-1 text-sm text-muted-foreground">Ask a question...</span>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

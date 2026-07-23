"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"

export function Cta() {
  const { user } = useAuth()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true)
    }
  }, [user])

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to research smarter?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Create your first notebook, add your sources, and start asking
          questions — all in under a minute.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
        <p className="mt-5 text-sm text-muted-foreground">
          No credit card required · Free forever for personal use
        </p>
      </div>
    </section>
  )
}

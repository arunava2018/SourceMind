"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { BookOpen, ArrowRight, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { useEffect, useState } from "react"

export function Header() {
  const { user, logout } = useAuth()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true)
    }
  }, [user])

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it Works" },
    { href: "#faq", label: "FAQ" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">ChaibookLM</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
                  Dashboard
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => {
                    logout()
                    setIsLoggedIn(false)
                  }}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Log in
                </Link>
                <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                  Get Started
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger render={<button className="flex md:hidden rounded-md p-2 hover:bg-accent" />}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="px-4">
                <Link href="/" className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="font-bold">ChaibookLM</span>
                </Link>
              </div>
              <div className="flex flex-col gap-1 mt-8 px-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-3 mt-8 px-4">
                {isLoggedIn ? (
                  <>
                    <Link href="/dashboard" className={buttonVariants({ className: "w-full justify-center" })}>
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setIsLoggedIn(false)
                      }}
                      className={buttonVariants({ variant: "outline", className: "w-full justify-center" })}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full justify-center" })}>
                      Log in
                    </Link>
                    <Link href="/signup" className={buttonVariants({ className: "w-full justify-center" })}>
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { BookOpen, ArrowRight, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">
              ChaibookLM
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="#features"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How it Works
            </Link>
            <Link
              href="#faq"
              className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Log in
            </Link>
            <Link href="/signup" className={buttonVariants({})}>
              Get Started
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>

          <Sheet>
            <SheetTrigger render={<button className="flex md:hidden rounded-md p-2 hover:bg-muted" />}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="pr-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="px-7">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="font-bold">ChaibookLM</span>
                </Link>
              </div>
              <div className="flex flex-col gap-4 mt-8 px-7">
                <Link
                  href="#features"
                  className="text-lg font-medium text-muted-foreground hover:text-foreground"
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-lg font-medium text-muted-foreground hover:text-foreground"
                >
                  How it Works
                </Link>
                <Link
                  href="#faq"
                  className="text-lg font-medium text-muted-foreground hover:text-foreground"
                >
                  FAQ
                </Link>
              </div>
              <div className="flex flex-col gap-4 mt-8 px-7">
                <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full justify-center" })}>
                  Log in
                </Link>
                <Link href="/signup" className={buttonVariants({ className: "w-full justify-center" })}>
                  Get Started
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

import Link from "next/link"
import { BookOpen, Github, Twitter, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold tracking-tight">ChaibookLM</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Your AI-powered research assistant. Turn scattered PDFs, videos, and websites into an organized, conversational knowledge base.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold">Product</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">Documentation</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">Blog</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">Community</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">Cookie Policy</Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 flex flex-col items-center justify-between border-t pt-8 md:flex-row text-center md:text-left text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ChaibookLM. All rights reserved.</p>
          <p className="mt-4 md:mt-0">Built with ☕ and curiosity.</p>
        </div>
      </div>
    </footer>
  )
}

import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  const footerLinks = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "How it Works", href: "#how-it-works" },
      { label: "Dashboard", href: "/dashboard" },
    ],
    Resources: [
      { label: "Documentation", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Community", href: "#" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  }

  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold tracking-tight">ChaibookLM</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Your AI-powered research assistant. Turn scattered PDFs, videos,
              and websites into an organized, conversational knowledge base.
            </p>
            <div className="mt-6 flex items-center gap-5 text-sm font-medium">
              <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                Twitter
              </Link>
              <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                GitHub
              </Link>
              <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                LinkedIn
              </Link>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-sm font-semibold">{title}</h3>
              <ul className="space-y-3 text-sm">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} ChaibookLM. All rights reserved.</p>
          <p>Built with ☕ and curiosity.</p>
        </div>
      </div>
    </footer>
  )
}

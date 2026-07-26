"use client"

import { useAuth } from "@/lib/auth-context"
import { useStore } from "@/lib/store"
import { notFound, useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { SourcesPanel } from "@/components/notebook/sources-panel"
import { ChatPanel } from "@/components/notebook/chat-panel"
import { StudioPanel } from "@/components/notebook/studio-panel"
import { NotesPanel } from "@/components/notebook/notes-panel"
import { SourceViewer } from "@/components/notebook/source-viewer"
import { BookOpen, LogOut, ChevronLeft, Menu, PanelRightClose, Sparkles, BookmarkPlus, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"

export default function NotebookWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, isLoading: authLoading, logout } = useAuth()
  const { getNotebook, activeViewerSource, closeViewer, loadSources, loadMessages } = useStore()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<"chat" | "studio" | "notes">("chat")

  const notebook = getNotebook(id)

  useEffect(() => {
    setIsMounted(true)
    if (id) {
      loadSources(id)
      loadMessages(id)
    }
  }, [id, loadSources, loadMessages])

  useEffect(() => {
    if (isMounted && !authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router, isMounted])

  if (!isMounted || authLoading || !user) {
    return null
  }

  if (!notebook) {
    notFound()
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Workspace Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-2 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden h-9 w-9" />}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sources menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 sm:w-[350px]">
              <SheetTitle className="sr-only">Sources Panel</SheetTitle>
              <SheetDescription className="sr-only">Manage your sources for this notebook.</SheetDescription>
              <SourcesPanel notebookId={notebook.id} />
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-2 border-l-0 sm:border-l pl-0 sm:pl-4">
            <BookOpen className="h-4 w-4 text-primary" />
            <h1 className="font-semibold text-sm tracking-tight truncate max-w-[150px] sm:max-w-[300px]">
              {notebook.title}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <span className="text-xs text-muted-foreground hidden lg:inline-block border-l pl-4 ml-2">
            {user.name}
          </span>
          <Button variant="ghost" size="sm" className="h-8 text-xs hidden sm:flex" onClick={handleLogout}>
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </header>

      {/* 3-Panel Layout */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Left Panel: Sources (Desktop Only) */}
        <div className="hidden md:block w-[280px] lg:w-[300px] shrink-0 border-r bg-muted/10">
          <SourcesPanel notebookId={notebook.id} />
        </div>

        {/* Center Panel: Chat / Studio / Notes */}
        <div className="flex min-w-0 flex-1 flex-col h-full relative overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center justify-center border-b bg-card/60 px-4 py-2 shrink-0 z-10">
            <div className="flex rounded-xl bg-muted p-1 gap-1 border border-border/50">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "chat" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat Assistant
              </button>
              <button
                onClick={() => setActiveTab("studio")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "studio" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Studio & Generators
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "notes" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                Pinned Notes
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {activeTab === "chat" && <ChatPanel notebookId={notebook.id} />}
            {activeTab === "studio" && <StudioPanel notebookId={notebook.id} />}
            {activeTab === "notes" && <NotesPanel notebookId={notebook.id} />}
          </div>
        </div>

        {/* Right Panel: Source Viewer (Desktop) */}
        {activeViewerSource && (
          <div className="hidden md:block w-[350px] lg:w-[400px] xl:w-[500px] shrink-0 border-l bg-background transition-all duration-300">
            <SourceViewer />
          </div>
        )}

        {/* Mobile Source Viewer Sheet */}
        <Sheet open={!!activeViewerSource && window.innerWidth < 768} onOpenChange={(open) => !open && closeViewer()}>
          <SheetContent side="bottom" className="h-[85vh] p-0 sm:h-[90vh]">
            <SheetTitle className="sr-only">Source Viewer</SheetTitle>
            <SheetDescription className="sr-only">View the source document.</SheetDescription>
            <div className="h-full w-full bg-background rounded-t-xl overflow-hidden">
               <SourceViewer />
            </div>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  )
}

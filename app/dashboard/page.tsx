"use client"

import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { NotebookCard, NotebookCardSkeleton } from "@/components/dashboard/notebook-card"
import { CreateNotebookDialog } from "@/components/dashboard/create-notebook-dialog"
import { BookOpen, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"

export default function DashboardPage() {
  const { notebooks, isLoadingNotebooks, fetchNotebooks } = useStore()
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (user) {
      fetchNotebooks()
    }
  }, [user, isLoading, router, fetchNotebooks])

  if (isLoading || !user) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <Link href='/'>
            <span className="font-semibold tracking-tight">SourceMind</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Welcome, {user.name}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-muted/20 p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Notebooks</h1>
              <p className="text-muted-foreground mt-1">
                Manage your research workspaces and sources.
              </p>
            </div>
            <CreateNotebookDialog />
          </div>

          {isLoadingNotebooks ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <NotebookCardSkeleton />
              <NotebookCardSkeleton />
              <NotebookCardSkeleton />
              <NotebookCardSkeleton />
              <NotebookCardSkeleton />
              <NotebookCardSkeleton />
            </div>
          ) : notebooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No notebooks yet</h3>
              <p className="mb-6 max-w-sm text-muted-foreground">
                Create a notebook to start organizing your sources and generating insights.
              </p>
              <CreateNotebookDialog />
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {notebooks.map((notebook) => (
                <NotebookCard key={notebook.id} notebook={notebook} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

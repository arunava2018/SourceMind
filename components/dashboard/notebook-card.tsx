import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Notebook } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { BookOpen, MoreVertical, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useStore } from "@/lib/store"

interface NotebookCardProps {
  notebook: Notebook;
}

export function NotebookCard({ notebook }: NotebookCardProps) {
  const { deleteNotebook, getSourcesForNotebook } = useStore()
  const sourceCount = getSourcesForNotebook(notebook.id).length

  return (
    <Card className="flex flex-col transition-colors hover:bg-muted/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="line-clamp-1 text-lg">
            <Link href={`/notebook/${notebook.id}`} className="hover:underline">
              {notebook.title}
            </Link>
          </CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
              onClick={() => deleteNotebook(notebook.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <CardDescription className="line-clamp-2 mt-2">
          {notebook.description || "No description provided."}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>{sourceCount}</span> {sourceCount === 1 ? 'source' : 'sources'}
        </div>
        <div>
          Updated {formatDistanceToNow(notebook.updatedAt, { addSuffix: true })}
        </div>
      </CardFooter>
    </Card>
  )
}

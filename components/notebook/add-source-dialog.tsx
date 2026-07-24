"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import * as pdfjsLib from 'pdfjs-dist'

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
}
import { SourceType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Globe, PlaySquare, MessageSquare, FileVideo, Plus, UploadCloud } from "lucide-react"

interface AddSourceDialogProps {
  notebookId: string;
}

export function AddSourceDialog({ notebookId }: AddSourceDialogProps) {
  const [open, setOpen] = useState(false)
  const { addSource } = useStore()

  // State for different source types
  const [url, setUrl] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [textContent, setTextContent] = useState("")
  const [textName, setTextName] = useState("")
  const [activeTab, setActiveTab] = useState<string>("pdf")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError("PDF must be strictly under 10MB")
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      // 1. Client-side parse the PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
         const page = await pdf.getPage(i);
         const content = await page.getTextContent();
         const strings = content.items.map((item: any) => item.str);
         text += `[PAGE:${i}]\n` + strings.join(' ') + '\n';
      }
      
      // 2. Send extracted text to server for indexing
      await addSource(notebookId, file.name, "pdf", { content: text });
      resetAndClose();
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to process PDF.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddVtt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsSubmitting(true)
    setError(null)
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        await addSource(notebookId, file.name, "vtt", { content })
        resetAndClose()
      } catch (err: any) {
        console.error(err)
        setError(err.message || "Failed to add VTT source.")
        setIsSubmitting(false)
      }
    }
    reader.onerror = () => {
      setError("Failed to read the file.")
      setIsSubmitting(false)
    }
    
    reader.readAsText(file)
  }

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    const name = new URL(url).hostname || "Web Page"
    addSource(notebookId, name, "url", { url })
    resetAndClose()
  }

  const handleAddYoutube = (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeUrl) return
    addSource(notebookId, "YouTube Video", "youtube", { url: youtubeUrl, duration: "10:30" })
    resetAndClose()
  }

  const handleAddText = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textContent) return
    setIsSubmitting(true)
    setError(null)
    try {
      await addSource(notebookId, textName || "Pasted Text", "text", { content: textContent })
      resetAndClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to add source. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetAndClose = () => {
    setOpen(false)
    setUrl("")
    setYoutubeUrl("")
    setTextContent("")
    setTextName("")
    setIsSubmitting(false)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full" />}>
        <Plus className="mr-2 h-4 w-4" />
        Add Source
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Source</DialogTitle>
          <DialogDescription>
            Upload files or paste links to add to this notebook's knowledge base.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-5 !h-auto p-1 bg-muted rounded-2xl">
            <TabsTrigger value="pdf" className="flex flex-col gap-1 py-3 !h-auto">
              <FileText className="h-4 w-4" />
              <span className="text-[10px]">PDF</span>
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex flex-col gap-1 py-3 !h-auto">
              <PlaySquare className="h-4 w-4" />
              <span className="text-[10px]">YouTube</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="flex flex-col gap-1 py-3 !h-auto">
              <Globe className="h-4 w-4" />
              <span className="text-[10px]">Web</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex flex-col gap-1 py-3 !h-auto">
              <MessageSquare className="h-4 w-4" />
              <span className="text-[10px]">Text</span>
            </TabsTrigger>
            <TabsTrigger value="vtt" className="flex flex-col gap-1 py-3 !h-auto">
              <FileVideo className="h-4 w-4" />
              <span className="text-[10px]">VTT</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 min-h-[200px]">
            {/* PDF Tab */}
            <TabsContent value="pdf" className="m-0">
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-10 text-center relative">
                <UploadCloud className="mb-4 h-10 w-10 text-muted-foreground" />
                <h3 className="mb-1 font-medium">Click or drag PDF to upload</h3>
                <p className="mb-4 text-xs text-muted-foreground">Up to 10MB per file</p>
                {isSubmitting ? (
                  <Button disabled>Processing...</Button>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleAddPdf}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Select a PDF"
                    />
                    <Button type="button">Select PDF File</Button>
                  </div>
                )}
                {error && (
                  <p className="mt-4 text-sm text-destructive">{error}</p>
                )}
              </div>
            </TabsContent>

            {/* YouTube Tab */}
            <TabsContent value="youtube" className="m-0">
              <form onSubmit={handleAddYoutube} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube-url">YouTube Video URL</Label>
                  <Input 
                    id="youtube-url" 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    We will automatically extract the transcript for indexing.
                  </p>
                </div>
                <Button type="submit" disabled={!youtubeUrl}>Add YouTube Video</Button>
              </form>
            </TabsContent>

            {/* Web URL Tab */}
            <TabsContent value="url" className="m-0">
              <form onSubmit={handleAddUrl} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="web-url">Website URL</Label>
                  <Input 
                    id="web-url" 
                    type="url"
                    placeholder="https://example.com/article" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    We will scrape the readable text content from this page.
                  </p>
                </div>
                <Button type="submit" disabled={!url}>Add Website</Button>
              </form>
            </TabsContent>

            {/* Plain Text Tab */}
            <TabsContent value="text" className="m-0">
              <form onSubmit={handleAddText} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-name">Source Name (optional)</Label>
                  <Input 
                    id="text-name" 
                    placeholder="e.g., Meeting Notes" 
                    value={textName}
                    onChange={(e) => setTextName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text-content">Content</Label>
                  <Textarea 
                    id="text-content" 
                    placeholder="Paste your text here..." 
                    className="min-h-[150px] max-h-[300px] overflow-y-auto"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={!textContent || isSubmitting}>
                  {isSubmitting ? "Adding Source..." : "Add Text Source"}
                </Button>
              </form>
            </TabsContent>

            {/* VTT Tab */}
            <TabsContent value="vtt" className="m-0">
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-10 text-center relative">
                <UploadCloud className="mb-4 h-10 w-10 text-muted-foreground" />
                <h3 className="mb-1 font-medium">Upload Subtitle / Transcript File</h3>
                <p className="mb-4 text-xs text-muted-foreground">Supports .vtt and .srt formats</p>
                {isSubmitting ? (
                  <Button disabled>Uploading...</Button>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".vtt,.srt"
                      onChange={handleAddVtt}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Select a file"
                    />
                    <Button type="button">Select File</Button>
                  </div>
                )}
                {error && (
                  <p className="mt-4 text-sm text-destructive">{error}</p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

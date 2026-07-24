"use client"

import { useState, useRef, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, User, Bot, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function ChatPanel({ notebookId }: { notebookId: string }) {
  const { getMessagesForNotebook, sendMessage, isGenerating, setActiveViewerSource, sources, isLoadingMessages } = useStore()
  const messages = getMessagesForNotebook(notebookId)
  const notebookSources = sources.filter(s => s.notebookId === notebookId)
  
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isGenerating])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating) return

    sendMessage(notebookId, input)
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-full flex-col bg-background relative">
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full px-4" ref={scrollRef}>
          <div className="mx-auto flex max-w-3xl flex-col gap-6 py-8">
            {isLoadingMessages ? (
              // Chat Skeleton
              <div className="flex flex-col gap-6">
                <div className="flex gap-4 flex-row-reverse">
                  <Avatar className="h-8 w-8 shrink-0 border">
                    <AvatarFallback className="bg-muted animate-pulse" />
                  </Avatar>
                  <div className="flex flex-col gap-2 max-w-[85%] items-end">
                    <div className="h-10 w-48 rounded-2xl bg-muted animate-pulse" />
                  </div>
                </div>
                <div className="flex gap-4 flex-row">
                  <Avatar className="h-8 w-8 shrink-0 border">
                    <AvatarFallback className="bg-muted animate-pulse" />
                  </Avatar>
                  <div className="flex flex-col gap-2 max-w-[85%] items-start w-full">
                    <div className="h-24 w-3/4 rounded-2xl bg-muted animate-pulse" />
                  </div>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-[400px] flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Bot className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">How can I help you today?</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Ask me questions about your sources. I'll search through them and provide answers with verifiable citations.
                </p>
                {notebookSources.length === 0 && (
                  <p className="mt-4 text-xs font-medium text-amber-600 dark:text-amber-500 bg-amber-100 dark:bg-amber-950/50 px-3 py-1.5 rounded-full">
                    Please add some sources first to get started.
                  </p>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="h-8 w-8 shrink-0 border">
                    <AvatarFallback className={message.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"}>
                      {message.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col gap-2 max-w-[85%] ${
                      message.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50"
                      }`}
                    >
                      {message.role === "assistant" && !message.content && isGenerating ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Thinking...
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      
                      {/* Inline Citations rendering logic could go here by parsing [1], [2] out of content, 
                          but for simplicity we'll just show them below the message */}
                    </div>

                    {message.citations && message.citations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {message.citations.map((citation, index) => {
                          const source = notebookSources.find(s => s.id === citation.sourceId)
                          return (
                            <button
                              key={citation.id}
                              onClick={() => source && setActiveViewerSource(source, citation)}
                              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary/10 text-[9px] text-primary">
                                {index + 1}
                              </span>
                              <span className="truncate max-w-[150px]">{citation.sourceName}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border bg-card p-2 focus-within:ring-1 focus-within:ring-ring"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={notebookSources.length === 0 ? "Add sources to start chatting..." : "Ask a question about your sources..."}
            className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent p-3 shadow-none focus-visible:ring-0"
            rows={1}
            disabled={notebookSources.length === 0}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isGenerating || notebookSources.length === 0}
            className="h-10 w-10 shrink-0 rounded-lg mb-0.5"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
        <div className="mx-auto mt-2 max-w-3xl text-center">
          <p className="text-xs text-muted-foreground">
            AI can make mistakes. Check the citations to verify answers.
          </p>
        </div>
      </div>
    </div>
  )
}

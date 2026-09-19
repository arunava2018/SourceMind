"use client"

import { useState, useRef, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
} from "@/components/ui/message"
import {
  Send,
  User,
  Bot,
  Loader2,
  FileText,
  Globe,
  PlaySquare,
  MessageSquare,
  FileVideo,
  BookmarkPlus,
  Check,
  BrainCircuit,
  Sparkles,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { pinNoteToStorage } from "@/lib/notes-util"

type LoadingPhase = "thinking" | "preparing"

export function ChatPanel({ notebookId }: { notebookId: string }) {
  const {
    getMessagesForNotebook,
    sendMessage,
    isGenerating,
    setActiveViewerSource,
    sources,
    isLoadingMessages,
  } = useStore()
  const messages = getMessagesForNotebook(notebookId)
  const notebookSources = sources.filter((s) => s.notebookId === notebookId)

  const [input, setInput] = useState("")
  const [pinnedMsgId, setPinnedMsgId] = useState<string | null>(null)
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("thinking")
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Drive the two-phase loading animation
  useEffect(() => {
    if (isGenerating) {
      setLoadingPhase("thinking")
      phaseTimerRef.current = setTimeout(() => {
        setLoadingPhase("preparing")
      }, 2000)
    } else {
      setLoadingPhase("thinking")
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current)
        phaseTimerRef.current = null
      }
    }
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
    }
  }, [isGenerating])

  const scrollToBottom = (behavior: "instant" | "smooth" = "instant") => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior })
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom("instant")
  }, [messages, isGenerating, isLoadingMessages])

  useEffect(() => {
    scrollToBottom("instant")
    const t1 = setTimeout(() => scrollToBottom("instant"), 100)
    const t2 = setTimeout(() => scrollToBottom("instant"), 300)
    const t3 = setTimeout(() => scrollToBottom("instant"), 600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [notebookId])

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
        <div className="h-full overflow-y-auto px-4" ref={scrollRef}>
          <div className="mx-auto flex max-w-3xl flex-col gap-4 py-8">

            {/* ── Loading skeleton while fetching history ── */}
            {isLoadingMessages ? (
              <div className="flex flex-col gap-6">
                <Message align="end">
                  <MessageAvatar>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted animate-pulse" />
                    </Avatar>
                  </MessageAvatar>
                  <MessageContent>
                    <div className="h-10 w-48 rounded-2xl bg-muted animate-pulse" />
                  </MessageContent>
                </Message>
                <Message align="start">
                  <MessageContent>
                    <div className="relative">
                      <div className="absolute -top-2.5 -left-2.5 h-6 w-6 rounded-full bg-muted animate-pulse" />
                      <div className="h-24 w-3/4 rounded-2xl bg-muted animate-pulse pt-4" />
                    </div>
                  </MessageContent>
                </Message>
              </div>
            ) : messages.length === 0 ? (

              /* ── Empty state ── */
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

              /* ── Message list ── */
              messages.map((message, messageIndex) => {
                let displayContent = message.content || ""
                let suggestedQuestions: string[] = []

                if (message.role === "assistant") {
                  const delimiter = "---SUGGESTED_QUESTIONS---"
                  const delimiterIndex = displayContent.indexOf(delimiter)
                  if (delimiterIndex !== -1) {
                    const questionsText = displayContent.slice(
                      delimiterIndex + delimiter.length
                    )
                    displayContent = displayContent.slice(0, delimiterIndex).trim()
                    suggestedQuestions = questionsText
                      .split("\n")
                      .map((q) => q.replace(/^[-\d\.\s*]+/, "").trim())
                      .filter((q) => q.length > 0)
                  } else if (displayContent.includes("---SUGGESTED")) {
                    displayContent = displayContent.split("---SUGGESTED")[0].trim()
                  }
                }

                const isUser = message.role === "user"
                const isLatestAssistant =
                  message.role === "assistant" &&
                  messageIndex === messages.length - 1

                // For the last assistant message that is still streaming (empty content),
                // show the two-phase loader instead
                const isStreamingPlaceholder =
                  isLatestAssistant && !message.content && isGenerating

                return (
                  <Message
                    key={message.id}
                    align={isUser ? "end" : "start"}
                  >
                    {/* User: side avatar. Agent: no side avatar — badge sits inline beside bubble */}
                    {isUser && (
                      <MessageAvatar className="self-start mt-6">
                        <Avatar className="h-8 w-8 border">
                          <AvatarFallback className="bg-muted">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      </MessageAvatar>
                    )}

                    <MessageContent className="w-fit max-w-[85%]">
                      {/* "You" label only for user messages */}
                      {isUser && (
                        <MessageHeader>You</MessageHeader>
                      )}

                      {/* 
                        Agent: badge + bubble in a flex row, footer below.
                        User:  plain bubble, footer below.
                      */}
                      <div className={!isUser ? "flex items-start gap-2" : ""}>
                        {/* Bot badge — inline to the left of the bubble */}
                        {!isUser && (
                          <div className="mt-3 shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-background">
                            <Bot className="h-3.5 w-3.5" />
                          </div>
                        )}

                        {/* Inner column: bubble + footer */}
                        <div className={`flex flex-col gap-2.5 ${!isUser ? "min-w-0" : ""}`}>
                          {/* Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed w-fit ${
                              isUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50"
                            }`}
                          >
                            {isStreamingPlaceholder ? (
                              /* Two-phase loading display */
                              <div className="flex flex-col gap-2">
                                <div
                                  className={`flex items-center gap-2 transition-all duration-500 ${
                                    loadingPhase === "thinking"
                                      ? "text-blue-500 dark:text-blue-400"
                                      : "text-muted-foreground line-through opacity-50"
                                  }`}
                                >
                                  <BrainCircuit className="h-4 w-4 shrink-0" />
                                  <span className="font-medium">Agent is thinking…</span>
                                </div>
                                {loadingPhase === "preparing" && (
                                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                                    <span className="font-medium">Preparing your answer…</span>
                                  </div>
                                )}
                                {loadingPhase === "thinking" && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0ms]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:150ms]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:300ms]" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {displayContent}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>

                          {/* Footer: citations + pin button + suggested questions */}
                          {!isStreamingPlaceholder && (
                            <div className="flex flex-col items-start gap-2">
                              {/* Citations */}
                              {(() => {
                                if (!message.citations || message.citations.length === 0)
                                  return null

                                const lowerContent = displayContent.toLowerCase()
                                const isRefusal =
                                  lowerContent.includes("not have enough information") ||
                                  lowerContent.includes("don't have enough information") ||
                                  lowerContent.includes("not have enough context") ||
                                  lowerContent.includes("don't have enough context") ||
                                  lowerContent.includes("no relevant context") ||
                                  lowerContent.includes("cannot be reasonably deduced") ||
                                  lowerContent.includes("insufficient information") ||
                                  lowerContent.includes("no information found") ||
                                  lowerContent.includes("cannot answer this question") ||
                                  lowerContent.includes("couldn't find any")

                                if (isRefusal) return null

                                const hasBrackets = message.citations.some((_, i) =>
                                  displayContent.includes(`[${i + 1}]`)
                                )
                                const activeCitations = hasBrackets
                                  ? message.citations.filter((_, i) =>
                                      displayContent.includes(`[${i + 1}]`)
                                    )
                                  : message.citations

                                if (activeCitations.length === 0) return null

                                const iconConfig: Record<
                                  string,
                                  { icon: typeof FileText; color: string; bg: string }
                                > = {
                                  pdf: { icon: FileText, color: "text-red-400", bg: "bg-red-500/10" },
                                  url: { icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10" },
                                  youtube: { icon: PlaySquare, color: "text-red-500", bg: "bg-red-500/10" },
                                  vtt: { icon: FileVideo, color: "text-purple-400", bg: "bg-purple-500/10" },
                                  text: { icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                                }

                                return (
                                  <div className="flex flex-wrap gap-1.5">
                                    {activeCitations.map((citation, index) => {
                                      const source = notebookSources.find(
                                        (s) => s.id === citation.sourceId
                                      )
                                      const sourceType =
                                        source?.type || citation.sourceType || "text"
                                      const config = iconConfig[sourceType] || iconConfig.text
                                      const TypeIcon = config.icon
                                      return (
                                        <button
                                          key={citation.id}
                                          onClick={() => {
                                            if (source && (sourceType === "url" || sourceType === "youtube")) {
                                              const targetUrl =
                                                source.url ||
                                                (source.originalContent?.startsWith("http")
                                                  ? source.originalContent
                                                  : null)
                                              if (targetUrl) {
                                                window.open(targetUrl, "_blank")
                                                return
                                              }
                                            }
                                            if (source) setActiveViewerSource(source, citation)
                                          }}
                                          className="group inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground hover:border-border hover:shadow-sm"
                                          title={`View citation from ${citation.sourceName}`}
                                        >
                                          <span className={`flex h-4 w-4 items-center justify-center rounded ${config.bg}`}>
                                            <TypeIcon className={`h-2.5 w-2.5 ${config.color}`} />
                                          </span>
                                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                                            {index + 1}
                                          </span>
                                          <span className="truncate max-w-[140px] group-hover:text-foreground transition-colors">
                                            {citation.sourceName}
                                          </span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )
                              })()}

                              {/* Pin to Notes */}
                              {message.role === "assistant" && displayContent && (
                                <button
                                  onClick={() => {
                                    pinNoteToStorage(notebookId, displayContent, "Chat Response", "AI Assistant")
                                    setPinnedMsgId(message.id)
                                    setTimeout(() => setPinnedMsgId(null), 2000)
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors py-0.5 px-2 rounded hover:bg-muted/50"
                                >
                                  {pinnedMsgId === message.id ? (
                                    <><Check className="h-3 w-3 text-emerald-500" /> Pinned to Notes</>
                                  ) : (
                                    <><BookmarkPlus className="h-3 w-3" /> Pin to Notes</>
                                  )}
                                </button>
                              )}

                              {/* Suggested follow-ups */}
                              {isLatestAssistant && suggestedQuestions.length > 0 && !isGenerating && (
                                <div className="mt-1">
                                  <p className="text-[11px] font-medium text-muted-foreground px-1 mb-2">
                                    Suggested Follow-ups:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {suggestedQuestions.map((q, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => sendMessage(notebookId, q)}
                                        className="text-left text-xs px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                                      >
                                        {q}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </MessageContent>
                  </Message>
                )
              })
            )}

            <div ref={bottomRef} className="h-px shrink-0" />
          </div>
        </div>
      </div>

      {/* ── Input area ── */}
      <div className="p-4 bg-background">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border bg-card p-2 focus-within:ring-1 focus-within:ring-ring"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              notebookSources.length === 0
                ? "Add sources to start chatting..."
                : "Ask a question about your sources..."
            }
            className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent p-3 shadow-none focus-visible:ring-0"
            rows={1}
            disabled={notebookSources.length === 0}
          />
          <Button
            type="submit"
            size="icon"
            disabled={
              !input.trim() || isGenerating || notebookSources.length === 0
            }
            className="h-10 w-10 shrink-0 rounded-lg mb-0.5"
          >
            {isGenerating ? (
              <Sparkles className="h-4 w-4 animate-pulse" />
            ) : (
              <Send className="h-4 w-4" />
            )}
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

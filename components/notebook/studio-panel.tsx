"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, BookOpen, HelpCircle, CheckCircle2, RotateCcw, 
  ChevronLeft, ChevronRight, Copy, BookmarkPlus, Trophy, 
  AlertCircle, Loader2, ArrowLeft, RefreshCw, Layers, FileText, Check
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { pinNoteToStorage } from "@/lib/notes-util";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  source?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface StudioState {
  studyGuide?: string;
  briefing?: string;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
}

export function StudioPanel({ notebookId }: { notebookId: string }) {
  const [activeView, setActiveView] = useState<"hub" | "study-guide" | "briefing" | "flashcards" | "quiz">("hub");
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pinned, setPinned] = useState(false);

  // Stored state for artifacts
  const [studioData, setStudioData] = useState<StudioState>({});

  // Flashcard state
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());

  // Quiz state
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answeredMap, setAnsweredMap] = useState<Record<number, number>>({});

  // Load from localStorage and backend DB on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sourcemind_studio_${notebookId}`);
      if (saved) {
        setStudioData(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load studio state:", e);
    }

    const token = localStorage.getItem("sourcemind_token");
    if (token) {
      axios
        .get(`/api/notebooks/${notebookId}/studio`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data?.artifacts) {
            const fetched = res.data.artifacts;
            setStudioData((prev) => {
              const merged = { ...prev, ...fetched };
              try {
                localStorage.setItem(`sourcemind_studio_${notebookId}`, JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        })
        .catch((err) => console.error("Failed to fetch studio artifacts from DB:", err));
    }
  }, [notebookId]);

  // Save to localStorage when state updates
  const updateStudioData = (updates: Partial<StudioState>) => {
    setStudioData((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(`sourcemind_studio_${notebookId}`, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save studio state:", e);
      }
      return next;
    });
  };

  const generateArtifact = async (type: "flashcards" | "quiz" | "study-guide" | "briefing") => {
    setLoadingType(type);
    setError(null);
    try {
      const token = localStorage.getItem("sourcemind_token");
      const res = await axios.post(
        `/api/notebooks/${notebookId}/studio`,
        { type },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = res.data;

      if (type === "study-guide") {
        updateStudioData({ studyGuide: data.data });
      } else if (type === "briefing") {
        updateStudioData({ briefing: data.data });
      } else if (type === "flashcards") {
        updateStudioData({ flashcards: data.data });
        setCurrentCardIdx(0);
        setIsFlipped(false);
        setMasteredCards(new Set());
      } else if (type === "quiz") {
        updateStudioData({ quiz: data.data });
        setCurrentQuizIdx(0);
        setSelectedOption(null);
        setQuizScore(0);
        setQuizCompleted(false);
        setAnsweredMap({});
      }
      setActiveView(type);
    } catch (err: any) {
      setError(err.message || "An error occurred during generation.");
    } finally {
      setLoadingType(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePin = (content: string, title: string) => {
    pinNoteToStorage(notebookId, content, title, "Notebook Studio");
    setPinned(true);
    setTimeout(() => setPinned(false), 2000);
  };

  // ─── HUB VIEW ─────────────────────────────────────────────────────────────
  if (activeView === "hub") {
    return (
      <div className="h-full overflow-y-auto bg-background/50">
        <div className="mx-auto max-w-4xl p-6 sm:p-8 pb-20">
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              AI Studio & Knowledge Synthesis
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Notebook Studio</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Transform your uploaded sources into structured study assets, executive briefings, and interactive self-assessments with a single click.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Card 1: Study Guide */}
            <div 
              onClick={() => studioData.studyGuide ? setActiveView("study-guide") : generateArtifact("study-guide")}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
            >
              <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20" />
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">Study Guide & FAQ</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Synthesize core concepts, essential definitions, and top frequently asked questions from your sources.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground">
                  {studioData.studyGuide ? "Ready to view" : "Generate new"}
                </span>
                <Button 
                  size="sm" 
                  variant={studioData.studyGuide ? "secondary" : "default"}
                  disabled={loadingType !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    generateArtifact("study-guide");
                  }}
                  className="rounded-lg h-8 text-xs font-medium"
                >
                  {loadingType === "study-guide" ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Synthesizing...
                    </>
                  ) : studioData.studyGuide ? (
                    <><RefreshCw className="mr-1.5 h-3 w-3" /> Regenerate</>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </div>

            {/* Card 2: Flashcards */}
            <div 
              onClick={() => studioData.flashcards ? setActiveView("flashcards") : generateArtifact("flashcards")}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
            >
              <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-purple-500/10 blur-2xl transition-all group-hover:bg-purple-500/20" />
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">Interactive Flashcards</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Test your knowledge with 3D flip-cards. Master key ideas and track your learning progress in real-time.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground">
                  {studioData.flashcards ? `${studioData.flashcards.length} cards deck` : "Generate new deck"}
                </span>
                <Button 
                  size="sm" 
                  variant={studioData.flashcards ? "secondary" : "default"}
                  disabled={loadingType !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    generateArtifact("flashcards");
                  }}
                  className="rounded-lg h-8 text-xs font-medium"
                >
                  {loadingType === "flashcards" ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Building Deck...
                    </>
                  ) : studioData.flashcards ? (
                    <><RefreshCw className="mr-1.5 h-3 w-3" /> New Deck</>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </div>

            {/* Card 3: Quiz */}
            <div 
              onClick={() => studioData.quiz ? setActiveView("quiz") : generateArtifact("quiz")}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
            >
              <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">Self-Assessment Quiz</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Take a multiple-choice quiz with immediate scoring and detailed explanations for every answer.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground">
                  {studioData.quiz ? `${studioData.quiz.length} questions ready` : "Generate quiz"}
                </span>
                <Button 
                  size="sm" 
                  variant={studioData.quiz ? "secondary" : "default"}
                  disabled={loadingType !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    generateArtifact("quiz");
                  }}
                  className="rounded-lg h-8 text-xs font-medium"
                >
                  {loadingType === "quiz" ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Creating Quiz...
                    </>
                  ) : studioData.quiz ? (
                    <><RefreshCw className="mr-1.5 h-3 w-3" /> New Quiz</>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </div>

            {/* Card 4: Executive Briefing */}
            <div 
              onClick={() => studioData.briefing ? setActiveView("briefing") : generateArtifact("briefing")}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
            >
              <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-amber-500/10 blur-2xl transition-all group-hover:bg-amber-500/20" />
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">Executive Briefing Doc</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Generate a high-level briefing with overview, bulleted core takeaways, and strategic action items.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground">
                  {studioData.briefing ? "Ready to view" : "Generate new"}
                </span>
                <Button 
                  size="sm" 
                  variant={studioData.briefing ? "secondary" : "default"}
                  disabled={loadingType !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    generateArtifact("briefing");
                  }}
                  className="rounded-lg h-8 text-xs font-medium"
                >
                  {loadingType === "briefing" ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Synthesizing...
                    </>
                  ) : studioData.briefing ? (
                    <><RefreshCw className="mr-1.5 h-3 w-3" /> Regenerate</>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── FLASHCARDS VIEW ──────────────────────────────────────────────────────
  if (activeView === "flashcards" && studioData.flashcards) {
    const cards = studioData.flashcards;
    const currentCard = cards[currentCardIdx] || cards[0];
    const isMastered = masteredCards.has(currentCard.id);

    const toggleMastered = (e: React.MouseEvent) => {
      e.stopPropagation();
      setMasteredCards((prev) => {
        const next = new Set(prev);
        if (next.has(currentCard.id)) next.delete(currentCard.id);
        else next.add(currentCard.id);
        return next;
      });
    };

    return (
      <div className="flex h-full flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-card/50">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveView("hub")} className="h-8 gap-1 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Studio
            </Button>
            <span className="text-xs font-semibold text-muted-foreground">|</span>
            <span className="text-xs font-medium">Flashcard Deck ({cards.length} cards)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              {masteredCards.size} / {cards.length} Mastered ({Math.round((masteredCards.size / cards.length) * 100)}%)
            </span>
          </div>
        </div>

        {/* Card Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
          <div className="w-full max-w-xl aspect-[4/3] max-h-[400px] perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative h-full w-full rounded-3xl border-2 transition-all duration-500 transform-style-3d shadow-lg ${
              isFlipped ? "rotate-y-180 bg-primary/5 border-primary/30" : "bg-card hover:border-primary/50"
            }`}>
              {/* Front side (Question) */}
              <div className={`absolute inset-0 flex flex-col justify-between p-8 backface-hidden ${isFlipped ? "pointer-events-none opacity-0" : ""}`}>
                <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  <span>Question {currentCardIdx + 1} of {cards.length}</span>
                  <span className="text-primary font-normal">Click to flip 🔄</span>
                </div>
                <div className="my-auto text-center">
                  <h4 className="text-xl sm:text-2xl font-bold leading-snug text-foreground">
                    {currentCard.question}
                  </h4>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
                  <span>Source: {currentCard.source || "Notebook"}</span>
                  <Button
                    size="sm"
                    variant={isMastered ? "default" : "outline"}
                    onClick={toggleMastered}
                    className={`h-8 px-3 rounded-xl text-xs font-medium ${isMastered ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {isMastered ? "Mastered" : "Mark as Mastered"}
                  </Button>
                </div>
              </div>

              {/* Back side (Answer) */}
              <div className={`absolute inset-0 flex flex-col justify-between p-8 backface-hidden rotate-y-180 ${!isFlipped ? "pointer-events-none opacity-0" : ""}`}>
                <div className="flex items-center justify-between text-xs text-primary uppercase tracking-wider font-semibold">
                  <span>Answer & Explanation</span>
                  <span className="text-muted-foreground font-normal">Click to flip back 🔄</span>
                </div>
                <div className="my-auto text-center overflow-y-auto max-h-[220px] pr-2">
                  <p className="text-lg sm:text-xl font-medium leading-relaxed text-foreground">
                    {currentCard.answer}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
                  <span>Source: {currentCard.source || "Notebook"}</span>
                  <Button
                    size="sm"
                    variant={isMastered ? "default" : "outline"}
                    onClick={toggleMastered}
                    className={`h-8 px-3 rounded-xl text-xs font-medium ${isMastered ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {isMastered ? "Mastered" : "Mark as Mastered"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              disabled={currentCardIdx === 0}
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIdx(prev => Math.max(0, prev - 1));
              }}
              className="h-10 w-10 rounded-full shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <span className="text-sm font-semibold min-w-[60px] text-center">
              {currentCardIdx + 1} / {cards.length}
            </span>

            <Button
              variant="outline"
              size="icon"
              disabled={currentCardIdx === cards.length - 1}
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIdx(prev => Math.min(cards.length - 1, prev + 1));
              }}
              className="h-10 w-10 rounded-full shadow-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── QUIZ VIEW ────────────────────────────────────────────────────────────
  if (activeView === "quiz" && studioData.quiz) {
    const questions = studioData.quiz;
    const currentQ = questions[currentQuizIdx] || questions[0];
    const hasAnsweredCurrent = answeredMap[currentQuizIdx] !== undefined;
    const userAnsIdx = answeredMap[currentQuizIdx];

    const handleSelectOption = (idx: number) => {
      if (hasAnsweredCurrent) return;
      setAnsweredMap(prev => ({ ...prev, [currentQuizIdx]: idx }));
      if (idx === currentQ.correctIndex) {
        setQuizScore(prev => prev + 1);
      }
    };

    if (quizCompleted) {
      const percentage = Math.round((quizScore / questions.length) * 100);
      return (
        <div className="flex h-full flex-col items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full rounded-3xl border bg-card p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Trophy className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold">Quiz Completed!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Here is your self-assessment result based on your source documents.
            </p>
            <div className="my-6 rounded-2xl bg-muted/50 p-6">
              <span className="text-4xl font-extrabold text-primary">{percentage}%</span>
              <p className="text-xs font-semibold text-muted-foreground mt-1">
                {quizScore} of {questions.length} correct
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setActiveView("hub")} className="rounded-xl text-xs">
                Back to Studio
              </Button>
              <Button onClick={() => {
                setAnsweredMap({});
                setQuizScore(0);
                setCurrentQuizIdx(0);
                setQuizCompleted(false);
              }} className="rounded-xl text-xs">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retake Quiz
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-card/50">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveView("hub")} className="h-8 gap-1 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Studio
            </Button>
            <span className="text-xs font-semibold text-muted-foreground">|</span>
            <span className="text-xs font-medium">Question {currentQuizIdx + 1} of {questions.length}</span>
          </div>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            Score: {quizScore} / {questions.length}
          </span>
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-2xl py-6 pb-20">
            <h4 className="text-lg sm:text-xl font-bold leading-relaxed text-foreground mb-6">
              {currentQ.question}
            </h4>

            <div className="flex flex-col gap-3">
              {currentQ.options.map((opt, idx) => {
                let btnStyle = "border-border bg-card hover:bg-accent/50 text-foreground";
                if (hasAnsweredCurrent) {
                  if (idx === currentQ.correctIndex) {
                    btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold";
                  } else if (idx === userAnsIdx && idx !== currentQ.correctIndex) {
                    btnStyle = "border-destructive bg-destructive/10 text-destructive font-semibold";
                  } else {
                    btnStyle = "border-border/40 bg-muted/30 text-muted-foreground opacity-60";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={hasAnsweredCurrent}
                    onClick={() => handleSelectOption(idx)}
                    className={`flex items-center justify-between rounded-2xl border p-4 text-left text-sm transition-all shadow-sm ${btnStyle}`}
                  >
                    <span className="flex-1">{opt}</span>
                    {hasAnsweredCurrent && idx === currentQ.correctIndex && (
                      <Check className="h-5 w-5 text-emerald-500 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation box */}
            {hasAnsweredCurrent && (
              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm animate-in fade-in-50 duration-300">
                <div className="font-semibold text-primary text-xs uppercase tracking-wider mb-1">
                  Explanation & Context
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Next Button */}
            {hasAnsweredCurrent && (
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={() => {
                    if (currentQuizIdx < questions.length - 1) {
                      setCurrentQuizIdx(prev => prev + 1);
                    } else {
                      setQuizCompleted(true);
                    }
                  }}
                  className="rounded-xl px-6"
                >
                  {currentQuizIdx < questions.length - 1 ? "Next Question" : "View Results"}
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── MARKDOWN ARTIFACT VIEW (Study Guide / Briefing) ──────────────────────
  const activeMarkdown = activeView === "study-guide" ? studioData.studyGuide : studioData.briefing;
  const title = activeView === "study-guide" ? "Study Guide & FAQ" : "Executive Briefing Doc";

  if (activeMarkdown) {
    return (
      <div className="flex h-full flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-card/50">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveView("hub")} className="h-8 gap-1 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Studio
            </Button>
            <span className="text-xs font-semibold text-muted-foreground">|</span>
            <span className="text-xs font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(activeMarkdown)}
              className="h-8 text-xs rounded-lg gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              size="sm"
              onClick={() => handlePin(activeMarkdown, title)}
              className="h-8 text-xs rounded-lg gap-1.5"
            >
              {pinned ? <Check className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
              {pinned ? "Pinned to Notes" : "Pin to Notes"}
            </Button>
          </div>
        </div>

        {/* Markdown content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10">
          <div className="mx-auto max-w-3xl prose prose-sm sm:prose dark:prose-invert break-words pb-20">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {activeMarkdown}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to Hub
  return null;
}

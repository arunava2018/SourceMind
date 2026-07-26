"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, HelpCircle, AlertCircle, Loader2, RefreshCw, Layers, FileText } from "lucide-react";
import { StudioState, StudioViewType } from "./types";

interface StudioHubProps {
  studioData: StudioState;
  loadingType: string | null;
  error: string | null;
  onSelectView: (view: StudioViewType) => void;
  onGenerate: (type: "flashcards" | "quiz" | "study-guide" | "briefing") => void;
}

export function StudioHub({
  studioData,
  loadingType,
  error,
  onSelectView,
  onGenerate,
}: StudioHubProps) {
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
            onClick={() => studioData.studyGuide ? onSelectView("study-guide") : onGenerate("study-guide")}
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
                  onGenerate("study-guide");
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
            onClick={() => studioData.flashcards ? onSelectView("flashcards") : onGenerate("flashcards")}
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
                  onGenerate("flashcards");
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
            onClick={() => studioData.quiz ? onSelectView("quiz") : onGenerate("quiz")}
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
                  onGenerate("quiz");
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
            onClick={() => studioData.briefing ? onSelectView("briefing") : onGenerate("briefing")}
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
                  onGenerate("briefing");
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

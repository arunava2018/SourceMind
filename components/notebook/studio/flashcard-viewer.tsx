"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Flashcard } from "./types";

interface FlashcardViewerProps {
  cards: Flashcard[];
  onBack: () => void;
}

export function FlashcardViewer({ cards, onBack }: FlashcardViewerProps) {
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());

  const currentCard = cards[currentCardIdx] || cards[0];
  const isMastered = masteredCards.has(currentCard.id);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        if (currentCardIdx > 0) {
          setIsFlipped(false);
          setCurrentCardIdx((prev) => prev - 1);
        }
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        if (currentCardIdx < cards.length - 1) {
          setIsFlipped(false);
          setCurrentCardIdx((prev) => prev + 1);
        }
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCardIdx, cards.length]);

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
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 gap-1 text-xs">
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
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-lg h-[240px] sm:h-[270px] perspective-1000 cursor-pointer shrink-0" onClick={() => setIsFlipped(!isFlipped)}>
          <div className={`relative h-full w-full rounded-3xl border-2 transition-all duration-500 transform-style-3d shadow-lg ${
            isFlipped ? "rotate-y-180 bg-primary/5 border-primary/30" : "bg-card hover:border-primary/50"
          }`}>
            {/* Front side (Question) */}
            <div className={`absolute inset-0 flex flex-col justify-between p-5 sm:p-6 backface-hidden ${isFlipped ? "pointer-events-none opacity-0" : ""}`}>
              <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                <span>Question {currentCardIdx + 1} of {cards.length}</span>
                <span className="text-primary font-normal">Click to flip 🔄</span>
              </div>
              <div className="my-auto text-center px-2">
                <h4 className="text-lg sm:text-xl font-bold leading-snug text-foreground">
                  {currentCard.question}
                </h4>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
                <span className="truncate max-w-[180px] sm:max-w-[220px]">Source: {currentCard.source || "Notebook"}</span>
                <Button
                  size="sm"
                  variant={isMastered ? "default" : "outline"}
                  onClick={toggleMastered}
                  className={`h-8 px-3 rounded-xl text-xs font-medium shrink-0 ${isMastered ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {isMastered ? "Mastered" : "Mark as Mastered"}
                </Button>
              </div>
            </div>

            {/* Back side (Answer) */}
            <div className={`absolute inset-0 flex flex-col justify-between p-5 sm:p-6 backface-hidden rotate-y-180 ${!isFlipped ? "pointer-events-none opacity-0" : ""}`}>
              <div className="flex items-center justify-between text-xs text-primary uppercase tracking-wider font-semibold">
                <span>Answer & Explanation</span>
                <span className="text-muted-foreground font-normal">Click to flip back 🔄</span>
              </div>
              <div className="my-auto text-center overflow-y-auto max-h-[140px] px-2">
                <p className="text-base sm:text-lg font-medium leading-relaxed text-foreground">
                  {currentCard.answer}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
                <span className="truncate max-w-[180px] sm:max-w-[220px]">Source: {currentCard.source || "Notebook"}</span>
                <Button
                  size="sm"
                  variant={isMastered ? "default" : "outline"}
                  onClick={toggleMastered}
                  className={`h-8 px-3 rounded-xl text-xs font-medium shrink-0 ${isMastered ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {isMastered ? "Mastered" : "Mark as Mastered"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 sm:mt-6 flex flex-col items-center gap-2 shrink-0 pb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentCardIdx === 0}
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIdx(prev => Math.max(0, prev - 1));
              }}
              className="h-10 px-4 rounded-xl font-medium shadow-sm gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            
            <span className="text-sm font-bold px-3 py-1 bg-muted/60 rounded-lg text-center min-w-[70px]">
              {currentCardIdx + 1} / {cards.length}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentCardIdx === cards.length - 1}
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIdx(prev => Math.min(cards.length - 1, prev + 1));
              }}
              className="h-10 px-4 rounded-xl font-medium shadow-sm gap-1.5"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-[11px] text-muted-foreground text-center hidden sm:block">
            💡 <span className="font-semibold">Tip:</span> Use <kbd className="px-1 py-0.5 bg-muted rounded border text-[10px]">←</kbd> <kbd className="px-1 py-0.5 bg-muted rounded border text-[10px]">→</kbd> arrow keys to navigate, <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Space</kbd> to flip
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import { QuizQuestion } from "./types";

interface QuizViewerProps {
  questions: QuizQuestion[];
  onBack: () => void;
}

export function QuizViewer({ questions, onBack }: QuizViewerProps) {
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answeredMap, setAnsweredMap] = useState<Record<number, number>>({});

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
            <Button variant="outline" onClick={onBack} className="rounded-xl text-xs">
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
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 gap-1 text-xs">
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

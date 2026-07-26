"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { StudioState, StudioViewType } from "./studio/types";
import { StudioHub } from "./studio/studio-hub";
import { FlashcardViewer } from "./studio/flashcard-viewer";
import { QuizViewer } from "./studio/quiz-viewer";
import { DocumentViewer } from "./studio/document-viewer";

export function StudioPanel({ notebookId }: { notebookId: string }) {
  const [activeView, setActiveView] = useState<StudioViewType>("hub");
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stored state for artifacts
  const [studioData, setStudioData] = useState<StudioState>({});

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
      } else if (type === "quiz") {
        updateStudioData({ quiz: data.data });
      }
      setActiveView(type);
    } catch (err: any) {
      setError(err.message || "An error occurred during generation.");
    } finally {
      setLoadingType(null);
    }
  };

  if (activeView === "hub") {
    return (
      <StudioHub
        studioData={studioData}
        loadingType={loadingType}
        error={error}
        onSelectView={setActiveView}
        onGenerate={generateArtifact}
      />
    );
  }

  if (activeView === "flashcards" && studioData.flashcards) {
    return (
      <FlashcardViewer
        cards={studioData.flashcards}
        onBack={() => setActiveView("hub")}
      />
    );
  }

  if (activeView === "quiz" && studioData.quiz) {
    return (
      <QuizViewer
        questions={studioData.quiz}
        onBack={() => setActiveView("hub")}
      />
    );
  }

  const activeMarkdown = activeView === "study-guide" ? studioData.studyGuide : studioData.briefing;
  const title = activeView === "study-guide" ? "Study Guide & FAQ" : "Executive Briefing Doc";

  if (activeMarkdown) {
    return (
      <DocumentViewer
        title={title}
        content={activeMarkdown}
        notebookId={notebookId}
        onBack={() => setActiveView("hub")}
      />
    );
  }

  return (
    <StudioHub
      studioData={studioData}
      loadingType={loadingType}
      error={error}
      onSelectView={setActiveView}
      onGenerate={generateArtifact}
    />
  );
}

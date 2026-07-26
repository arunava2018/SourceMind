export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  source?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudioState {
  studyGuide?: string;
  briefing?: string;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
}

export type StudioViewType = "hub" | "study-guide" | "briefing" | "flashcards" | "quiz";

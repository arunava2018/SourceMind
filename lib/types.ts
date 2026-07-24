export type SourceType = 'pdf' | 'text' | 'url' | 'youtube' | 'vtt';
export type SourceStatus = 'uploading' | 'indexing' | 'ready' | 'error';

export interface Notebook {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Source {
  id: string;
  notebookId: string;
  name: string;
  type: SourceType;
  status: SourceStatus;
  content?: string;
  originalContent?: string;
  metadata?: SourceMetadata;
  addedAt: Date;
}

export interface SourceMetadata {
  url?: string;
  thumbnailUrl?: string;
  duration?: string;
  pageCount?: number;
  fileSize?: number;
  mimeType?: string;
  content?: string;
}

export interface Citation {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  chunkText: string;
  chunkIndex: number;
  metadata?: CitationMetadata;
}

export interface CitationMetadata {
  pageNumber?: number;
  timestamp?: string;
  lineRange?: { start: number; end: number };
  url?: string;
}

export interface Message {
  id: string;
  notebookId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

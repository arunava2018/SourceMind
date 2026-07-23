'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Notebook, Source, SourceType, SourceMetadata, SourceStatus, Message, Citation } from './types';
import { mockSources, mockMessages } from './mock-data';

interface StoreContextType {
  notebooks: Notebook[];
  createNotebook: (title: string, description: string) => Promise<Notebook>;
  deleteNotebook: (id: string) => Promise<void>;
  getNotebook: (id: string) => Notebook | undefined;

  sources: Source[];
  getSourcesForNotebook: (notebookId: string) => Source[];
  addSource: (notebookId: string, name: string, type: SourceType, metadata?: SourceMetadata) => void;
  removeSource: (id: string) => void;
  reindexSource: (id: string) => void;

  messages: Message[];
  getMessagesForNotebook: (notebookId: string) => Message[];
  sendMessage: (notebookId: string, content: string) => void;
  isGenerating: boolean;

  activeViewerSource: { source: Source; citation?: Citation } | null;
  setActiveViewerSource: (source: Source, citation?: Citation) => void;
  closeViewer: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const generateMockResponse = (query: string, sources: Source[]): { content: string; citations: Citation[] } => {
  const readySources = sources.filter(s => s.status === 'ready');
  
  if (readySources.length === 0) {
    return {
      content: `I couldn't find any ready sources to answer your query about "${query}". Please ensure sources are uploaded and indexed.`,
      citations: []
    };
  }
  
  const numCitations = Math.min(Math.floor(Math.random() * 3) + 1, readySources.length);
  const citations: Citation[] = [];
  const selectedSources = readySources.sort(() => 0.5 - Math.random()).slice(0, numCitations);

  for (let i = 0; i < selectedSources.length; i++) {
    const source = selectedSources[i];
    const metadata = {
      pageNumber: source.type === 'pdf' ? Math.floor(Math.random() * 20) + 1 : undefined,
      timestamp: source.type === 'youtube' || source.type === 'vtt' ? `${Math.floor(Math.random() * 10)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : undefined,
      url: source.type === 'url' ? 'https://example.com/reference' : undefined
    };
    citations.push({
      id: crypto.randomUUID(),
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.type,
      chunkIndex: Math.floor(Math.random() * 50),
      chunkText: `This is a simulated excerpt from the source document related to "${query}". It contains relevant information about the topic.`,
      metadata
    });
  }

  let content = `Based on the sources provided, here is an analysis regarding "${query}".\n\n`;
  content += `The documents indicate that this topic is highly relevant in current discussions. As noted in the texts, there are several key factors at play. ${citations.length > 0 ? `[1]` : ''}\n\n`;
  content += `Furthermore, the context suggests that understanding these underlying principles is crucial for a comprehensive overview. ${citations.length > 1 ? `[2]` : ''} This correlates with the broader themes identified in the provided materials. ${citations.length > 2 ? `[3]` : ''}`;

  return { content, citations };
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [sources, setSources] = useState<Source[]>(mockSources);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeViewerSource, setActiveViewerSource] = useState<{ source: Source; citation?: Citation } | null>(null);

  // Fetch notebooks on mount
  useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        const token = localStorage.getItem('chaibooklm_token');
        if (!token) return;
        
        const res = await axios.get('/api/notebooks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Ensure dates are parsed back to Date objects
        const fetchedNotebooks = res.data.notebooks.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt)
        }));
        
        setNotebooks(fetchedNotebooks);
      } catch (error) {
        console.error("Failed to fetch notebooks", error);
      }
    };
    fetchNotebooks();
  }, []);

  const getNotebook = useCallback((id: string) => {
    return notebooks.find(n => n.id === id);
  }, [notebooks]);

  const createNotebook = useCallback(async (title: string, description: string) => {
    try {
      const token = localStorage.getItem('chaibooklm_token');
      const res = await axios.post('/api/notebooks', { title, description }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newNotebook = {
        ...res.data.notebook,
        createdAt: new Date(res.data.notebook.createdAt),
        updatedAt: new Date(res.data.notebook.updatedAt)
      };
      
      setNotebooks(prev => [newNotebook, ...prev]);
      return newNotebook;
    } catch (error) {
      console.error("Failed to create notebook", error);
      throw error;
    }
  }, []);

  const deleteNotebook = useCallback(async (id: string) => {
    try {
      // Optimistic delete
      setNotebooks(prev => prev.filter(n => n.id !== id));
      setSources(prev => prev.filter(s => s.notebookId !== id));
      setMessages(prev => prev.filter(m => m.notebookId !== id));

      const token = localStorage.getItem('chaibooklm_token');
      await axios.delete(`/api/notebooks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Failed to delete notebook", error);
    }
  }, []);

  const getSourcesForNotebook = useCallback((notebookId: string) => {
    return sources.filter(s => s.notebookId === notebookId).sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }, [sources]);

  const addSource = useCallback((notebookId: string, name: string, type: SourceType, metadata?: SourceMetadata) => {
    const newSource: Source = {
      id: crypto.randomUUID(),
      notebookId,
      name,
      type,
      status: 'uploading',
      metadata: metadata || {},
      addedAt: new Date()
    };
    
    setSources(prev => [newSource, ...prev]);

    setTimeout(() => {
      setSources(prev => prev.map(s => s.id === newSource.id ? { ...s, status: 'indexing' as SourceStatus } : s));
      
      setTimeout(() => {
        setSources(prev => prev.map(s => s.id === newSource.id ? { ...s, status: 'ready' as SourceStatus } : s));
      }, 2000);
    }, 1500);
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  }, []);

  const reindexSource = useCallback((id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, status: 'indexing' as SourceStatus } : s));
    setTimeout(() => {
      setSources(prev => prev.map(s => s.id === id ? { ...s, status: 'ready' as SourceStatus } : s));
    }, 2000);
  }, []);

  const getMessagesForNotebook = useCallback((notebookId: string) => {
    return messages.filter(m => m.notebookId === notebookId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [messages]);

  const sendMessage = useCallback((notebookId: string, content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      notebookId,
      role: 'user',
      content,
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    setTimeout(() => {
      // Use state callback to ensure we get the latest sources when the timeout resolves, or capture them now.
      // Capturing them from scope might be stale if sources changed, but for our mock it's usually fine.
      setSources(currentSources => {
        const notebookSources = currentSources.filter(s => s.notebookId === notebookId);
        const { content: aiContent, citations } = generateMockResponse(content, notebookSources);
        
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          notebookId,
          role: 'assistant',
          content: aiContent,
          citations,
          createdAt: new Date()
        };
        
        setMessages(prevMsgs => [...prevMsgs, aiMessage]);
        setIsGenerating(false);
        return currentSources;
      });
    }, 1500);
  }, []);

  const setActiveViewerSourceWrapper = useCallback((source: Source, citation?: Citation) => {
    setActiveViewerSource({ source, citation });
  }, []);

  const closeViewer = useCallback(() => {
    setActiveViewerSource(null);
  }, []);

  return (
    <StoreContext.Provider value={{
      notebooks,
      createNotebook,
      deleteNotebook,
      getNotebook,
      sources,
      getSourcesForNotebook,
      addSource,
      removeSource,
      reindexSource,
      messages,
      getMessagesForNotebook,
      sendMessage,
      isGenerating,
      activeViewerSource,
      setActiveViewerSource: setActiveViewerSourceWrapper,
      closeViewer
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

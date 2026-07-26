'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Notebook, Source, SourceType, SourceMetadata, SourceStatus, Message, Citation } from './types';
import { mockSources, mockMessages } from './mock-data';
import { useAuth } from './auth-context';

interface StoreContextType {
  notebooks: Notebook[];
  isLoadingNotebooks: boolean;
  fetchNotebooks: (force?: boolean) => Promise<void>;
  createNotebook: (title: string, description: string) => Promise<Notebook>;
  deleteNotebook: (id: string) => Promise<void>;
  getNotebook: (id: string) => Notebook | undefined;

  sources: Source[];
  isLoadingSources: boolean;
  loadSources: (notebookId: string) => Promise<void>;
  getSourcesForNotebook: (notebookId: string) => Source[];
  addSource: (notebookId: string, name: string, type: SourceType, metadata?: SourceMetadata) => void;
  removeSource: (notebookId: string, id: string) => void;
  reindexSource: (notebookId: string, id: string) => void;

  messages: Message[];
  isLoadingMessages: boolean;
  loadMessages: (notebookId: string) => Promise<void>;
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
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [sources, setSources] = useState<Source[]>(mockSources);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(true);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [activeViewerSource, setActiveViewerSource] = useState<{ source: Source; citation?: Citation } | null>(null);
  const isFetchingNotebooksRef = useRef(false);

  const fetchNotebooks = useCallback(async (force = false) => {
    const token = localStorage.getItem('sourcemind_token');
    if (!token || !user) {
      setNotebooks([]);
      setIsLoadingNotebooks(false);
      return;
    }
    if (isFetchingNotebooksRef.current && !force) {
      return;
    }
    isFetchingNotebooksRef.current = true;
    setIsLoadingNotebooks(true);
    try {
      const res = await axios.get('/api/notebooks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fetchedNotebooks = res.data.notebooks.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt)
      }));
      
      setNotebooks(fetchedNotebooks);
    } catch (error) {
      console.error("Failed to fetch notebooks", error);
    } finally {
      setIsLoadingNotebooks(false);
      isFetchingNotebooksRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotebooks();
    } else {
      setNotebooks([]);
      setIsLoadingNotebooks(false);
    }
  }, [user, fetchNotebooks]);

  const getNotebook = useCallback((id: string) => {
    return notebooks.find(n => n.id === id);
  }, [notebooks]);

  const createNotebook = useCallback(async (title: string, description: string) => {
    try {
      const token = localStorage.getItem('sourcemind_token');
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

      const token = localStorage.getItem('sourcemind_token');
      await axios.delete(`/api/notebooks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Failed to delete notebook", error);
    }
  }, []);

  const touchNotebook = useCallback((notebookId: string) => {
    setNotebooks(prev => prev.map(n => n.id === notebookId ? { ...n, updatedAt: new Date() } : n));
  }, []);

  const loadMessages = useCallback(async (notebookId: string) => {
    setIsLoadingMessages(true);
    try {
      const token = localStorage.getItem('sourcemind_token');
      if (!token) return;
      const res = await axios.get(`/api/notebooks/${notebookId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const dbMessages = res.data.messages.map((dbMessage: any) => ({
        ...dbMessage,
        role: dbMessage.role.toLowerCase() as 'user' | 'assistant',
        createdAt: new Date(dbMessage.createdAt),
        citations: dbMessage.citations?.map((c: any) => ({
          ...c,
          sourceName: c.source?.name || c.sourceName || "Unknown Source",
          sourceType: c.source?.type?.toLowerCase() || c.sourceType || "text",
        }))
      }));
      
      setMessages(prev => {
        // Remove old messages for this notebook to avoid duplicates
        const filtered = prev.filter(m => m.notebookId !== notebookId);
        return [...dbMessages, ...filtered];
      });
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const loadSources = useCallback(async (notebookId: string) => {
    setIsLoadingSources(true);
    try {
      const token = localStorage.getItem('sourcemind_token');
      if (!token) return;
      const res = await axios.get(`/api/notebooks/${notebookId}/sources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dbSources = res.data.sources.map((dbSource: any) => ({
        ...dbSource,
        type: dbSource.type.toLowerCase() as SourceType,
        addedAt: new Date(dbSource.uploadedAt || dbSource.createdAt || new Date())
      }));
      
      setSources(prev => {
        // Remove old sources for this notebook to avoid duplicates
        const filtered = prev.filter(s => s.notebookId !== notebookId);
        return [...dbSources, ...filtered];
      });
    } catch (error) {
      console.error("Failed to load sources:", error);
    } finally {
      setIsLoadingSources(false);
    }
  }, []);

  const getSourcesForNotebook = useCallback((notebookId: string) => {
    return sources.filter(s => s.notebookId === notebookId).sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }, [sources]);

  const addSource = useCallback(async (notebookId: string, name: string, type: SourceType, metadata?: any) => {
    try {
      const isApiSupportedType = type === 'text' || type === 'youtube' || type === 'url' || type === 'vtt' || type === 'pdf';
      
      if (isApiSupportedType) {
        const token = localStorage.getItem('sourcemind_token');
        
        // Optimistic UI: Add a temporary source to show indexing status
        const tempId = crypto.randomUUID();
        const optimisticSource: Source = {
          id: tempId,
          notebookId,
          name: name || "Adding...",
          type,
          status: 'indexing',
          metadata: metadata || {},
          addedAt: new Date()
        };
        setSources(prev => [optimisticSource, ...prev]);

        let payload: any = { name, type: type.toUpperCase() };
        if (type === 'text' || type === 'vtt' || type === 'pdf') {
           payload.content = metadata?.content;
        } else {
           payload.url = metadata?.url;
        }

        try {
          const res = await axios.post(`/api/notebooks/${notebookId}/sources`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Replace the temporary source with the real one from the DB
          const dbSource = res.data.source;
          const newSource: Source = {
            ...dbSource,
            type: dbSource.type.toLowerCase() as SourceType,
            addedAt: new Date(dbSource.uploadedAt || dbSource.createdAt || new Date())
          };
          
          setSources(prev => prev.map(s => s.id === tempId ? newSource : s));
          touchNotebook(notebookId);
        } catch (err: any) {
          // On error, mark the temporary source as error
          setSources(prev => prev.map(s => s.id === tempId ? { ...s, status: 'error' as SourceStatus } : s));
          
          // Extract backend error message if available
          if (err.response?.data?.error) {
            throw new Error(err.response.data.error);
          }
          throw err;
        }
        return;
      }

      // Mock for other unsupported types
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
    } catch (error) {
      console.error("Failed to add source:", error);
    }
  }, []);

  const removeSource = useCallback(async (notebookId: string, sourceId: string) => {
    try {
      const token = localStorage.getItem('sourcemind_token');
      if (!token) return;
      
      // Optimistically remove from UI
      setSources(prev => prev.filter(s => s.id !== sourceId));
      touchNotebook(notebookId);

      await axios.delete(`/api/notebooks/${notebookId}/sources/${sourceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Failed to delete source:", error);
      // Revert the deletion by reloading sources
      loadSources(notebookId);
    }
  }, [loadSources]);

  const reindexSource = useCallback((notebookId: string, id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, status: 'indexing' as SourceStatus } : s));
    touchNotebook(notebookId);
    setTimeout(() => {
      setSources(prev => prev.map(s => s.id === id ? { ...s, status: 'ready' as SourceStatus } : s));
    }, 2000);
  }, [touchNotebook]);

  const getMessagesForNotebook = useCallback((notebookId: string) => {
    return messages.filter(m => m.notebookId === notebookId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [messages]);

  const sendMessage = useCallback(async (notebookId: string, content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      notebookId,
      role: 'user',
      content,
      createdAt: new Date()
    };
    
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      notebookId,
      role: 'assistant',
      content: '',
      createdAt: new Date()
    };

    // Pre-calculate message history to send to API
    // We capture current state from store, but because of closures we might need to rely on the current `messages` array in scope
    // Ideally we'd use a ref or functional update, but since this is bound to the latest render it should be fine.
    const history = messages.filter(m => m.notebookId === notebookId).map(m => ({
      role: m.role,
      content: m.content
    }));
    history.push({ role: 'user', content });

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    touchNotebook(notebookId);
    setIsGenerating(true);

    try {
      const token = localStorage.getItem('sourcemind_token');
      const response = await fetch(`/api/notebooks/${notebookId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: history })
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Extract custom citations header
      const citationsHeader = response.headers.get('x-citations');
      let citations: Citation[] = [];
      if (citationsHeader) {
         try {
           citations = JSON.parse(atob(citationsHeader));
         } catch (e) {
           console.error("Failed to parse citations", e);
         }
      }

      // Attach citations to the assistant message
      if (citations.length > 0) {
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId ? { ...m, citations } : m
        ));
      }

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let aiContent = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          aiContent += chunk;
          
          // Update the message in state with the new chunk
          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId ? { ...m, content: aiContent } : m
          ));
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Optional: Add error message to UI
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId ? { ...m, content: "Sorry, I encountered an error while processing your request." } : m
      ));
    } finally {
      setIsGenerating(false);
    }
  }, [messages]);

  const setActiveViewerSourceWrapper = useCallback((source: Source, citation?: Citation) => {
    setActiveViewerSource({ source, citation });
  }, []);

  const closeViewer = useCallback(() => {
    setActiveViewerSource(null);
  }, []);

  return (
    <StoreContext.Provider value={{
      notebooks,
      isLoadingNotebooks,
      fetchNotebooks,
      createNotebook,
      deleteNotebook,
      getNotebook,
      sources,
      isLoadingSources,
      loadSources,
      getSourcesForNotebook,
      addSource,
      removeSource,
      reindexSource,
      messages,
      isLoadingMessages,
      loadMessages,
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

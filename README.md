# SourceMind (ChaibookLM)

SourceMind is an AI-powered personal knowledge base and chat assistant built heavily inspired by Google's NotebookLM. It allows users to upload various forms of unstructured data (PDFs, YouTube videos, web pages, plain text, and VTT transcripts), index them using a RAG (Retrieval-Augmented Generation) pipeline, and query them naturally using large language models.

## 🚀 Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4 & [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown Rendering**: `react-markdown` with `remark-gfm`

### Backend & Database
- **Database**: [Neon Postgres Serverless](https://neon.tech/) with `pgvector` extension
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: JWT-based custom auth (bcryptjs, jsonwebtoken)

### AI & RAG Pipeline
- **Generative AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/docs) (`ai`, `@ai-sdk/openai`, `@ai-sdk/google`)
- **Embeddings**: OpenAI's `text-embedding-3-small` (1536 dimensions)
- **Chunking**: `@langchain/textsplitters` (`TokenTextSplitter` with `cl100k_base` encoding)
- **Data Loaders**:
  - `pdfjs-dist` (PDF parsing with page-level metadata tracking)
  - `youtube-transcript` (YouTube video transcripts)
  - `cheerio` (Web page scraping)

---

## 🧠 RAG Pipeline Strategy

The system uses an advanced Retrieval-Augmented Generation strategy to ground AI responses in the user's specific source materials:

```mermaid
flowchart TB
    %% Definitions
    User([User])
    UI[Frontend Client\nNext.js React]
    API[Backend API\nNext.js Routes]
    LLM[Large Language Model\nGemini 1.5 / OpenAI]
    Embedder[OpenAI Embeddings\ntext-embedding-3-small]
    DB[(Neon Postgres\npgvector 1536-dim)]

    %% Source Ingestion Flow
    subgraph "Ingestion & Extraction Phase"
        direction TB
        Upload[Add Source]
        PDF[PDF Document]
        YT[YouTube Video]
        Web[Web URL]
        Text[Plain Text / VTT]

        Upload --> PDF
        Upload --> YT
        Upload --> Web
        Upload --> Text

        PDF -- "Client-side PDF.js\nExtracts Text &\nInjects [PAGE:N]" --> ExtractedText((Unified Text\nStream))
        YT -- "youtube-transcript\nAPI Scraper" --> ExtractedText
        Web -- "Cheerio Scraper\nStrips HTML" --> ExtractedText
        Text -- "Raw Text" --> ExtractedText
    end

    %% Processing Flow
    subgraph "Processing & Indexing Phase"
        direction TB
        Splitter[LangChain TokenTextSplitter\nChunk size: 512, Overlap: 50]
        PDFChunker[PDF Specific Chunker\nRespects Page Boundaries]
        Vectorization[Vectorization]

        ExtractedText --> |If PDF| PDFChunker
        ExtractedText --> |Other Sources| Splitter
        
        PDFChunker --> Vectorization
        Splitter --> Vectorization
        
        Vectorization <--> |"Generate Embeddings"| Embedder
    end

    %% Storage Flow
    subgraph "Storage Phase"
        direction TB
        Insert[Drizzle ORM Insert]
        TableSources[sources Table\nMetadata & URLs]
        TableChunks[source_chunks Table\nVectors & Page Numbers]
        
        Insert --> TableSources
        Insert --> TableChunks
    end

    %% Connect Ingestion -> Storage
    Vectorization --> Insert
    TableChunks <--> DB

    %% Chat Flow
    subgraph "Chat & Retrieval Phase"
        direction TB
        ChatInput[User Question]
        QueryEmbed[Embed Question]
        SimilaritySearch[Cosine Similarity Search\nFind Top K Chunks]
        PromptGen[Prompt Formulation\nInject Context + Question]
        Generation[LLM Generation]
        
        ChatInput --> QueryEmbed
        QueryEmbed <--> |"Generate Embedding"| Embedder
        QueryEmbed --> SimilaritySearch
        SimilaritySearch <--> |"Vector Match"| DB
        SimilaritySearch --> |"Relevant Chunks + Metadata"| PromptGen
        PromptGen --> Generation
        Generation <--> |"Stream Response"| LLM
    end

    %% Main interactions
    User --> |"1. Uploads Data"| Upload
    Insert --> |"2. Saves to DB"| DB
    User --> |"3. Asks Question"| ChatInput
    Generation --> |"4. Streams Answer\nWith Citations"| UI
    UI --> User

    classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef highlight fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px;
    classDef db fill:#e8f5e9,stroke:#4caf50,stroke-width:2px;
    classDef ai fill:#fff3e0,stroke:#ff9800,stroke-width:2px;

    class UI,API default;
    class DB,TableSources,TableChunks db;
    class LLM,Embedder,Vectorization,QueryEmbed,SimilaritySearch,PromptGen,Generation ai;
    class PDF,YT,Web,Text,PDFChunker,Splitter highlight;
```

### 1. Ingestion & Extraction
When a user adds a new source, the backend extracts the raw text content depending on the format. For PDFs, the frontend injects `[PAGE:N]` markers to preserve exact pagination metadata during the text extraction phase.

### 2. Chunking
Using Langchain's `TokenTextSplitter`, the extracted text is intelligently chunked into overlapping segments (e.g., 512 tokens with 50-token overlap) to preserve context. For PDFs, chunks are strictly bounded by page markers so that every chunk belongs to exactly one page, enabling accurate citation metrics.

### 3. Vector Embeddings
Each chunk is run through OpenAI's `text-embedding-3-small` model to generate a high-dimensional vector representation (1536 dimensions) of its semantic meaning.

### 4. Storage
Chunks, metadata (e.g., page numbers), and vector embeddings are stored in Neon Postgres. A vector index (HNSW) is applied over the `embedding` column using cosine similarity (`vector_cosine_ops`) to optimize semantic search performance.

### 5. Retrieval & Generation
When a user asks a question in a notebook, the question is transformed into a vector and searched against the database. The top *K* most relevant chunks are retrieved and injected into the LLM's system prompt. The model streams back its response and accurately cites the relevant chunks using inline markers (e.g., `[1]`, `[2]`), which the frontend resolves into interactive citation badges.

---

## 🗄️ Database Schema & Dependencies

```mermaid
erDiagram
    users ||--o{ notebooks : "creates"
    users ||--o{ messages : "sends"
    notebooks ||--o{ sources : "contains"
    notebooks ||--o{ messages : "has"
    sources ||--o{ source_chunks : "split into"
    sources ||--o{ message_citations : "cited in"
    messages ||--o{ message_citations : "includes"
    source_chunks ||--o{ message_citations : "referenced by"

    users {
        uuid id PK
        varchar name
        varchar email
        text passwordHash
    }
    notebooks {
        uuid id PK
        uuid user_id FK
        varchar title
    }
    sources {
        uuid id PK
        uuid notebook_id FK
        source_type type
        text originalContent
        varchar url
    }
    source_chunks {
        uuid id PK
        uuid source_id FK
        vector embedding
        text content
        json metadata
    }
    messages {
        uuid id PK
        uuid notebook_id FK
        uuid user_id FK
        message_role role
        text content
    }
    message_citations {
        uuid id PK
        uuid message_id FK
        uuid source_id FK
        uuid source_chunk_id FK
        text chunkText
    }
```

---

## 📂 Folder Structure

```
.
├── app/
│   ├── api/                  # Next.js API Route Handlers (Backend)
│   │   ├── auth/             # Login, Signup, and Me routes
│   │   └── notebooks/        # Notebook CRUD, Sources, and Chat endpoints
│   ├── dashboard/            # Dashboard UI for managing notebooks
│   ├── login/                # Authentication pages
│   ├── signup/               # Authentication pages
│   └── notebook/[id]/        # Main workspace (Chat interface & Source Viewer)
├── components/
│   ├── notebook/             # Complex UI features (ChatPanel, SourceViewer, AddSourceDialog)
│   └── ui/                   # Reusable shadcn components
├── lib/
│   ├── ai/                   # RAG logic (chunker.ts, embedding.ts, loaders.ts)
│   ├── db/                   # Database connection and Drizzle schema (schema.ts)
│   ├── auth.ts               # JWT utilities
│   ├── store.tsx             # React Context for global state management
│   └── types.ts              # Global TypeScript interfaces
└── public/                   # Static assets (including pdf.worker.min.mjs)
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Authenticate and receive a JWT
- `GET /api/auth/me` - Validate token and get current user details

### Notebooks
- `GET /api/notebooks` - List all notebooks for the authenticated user
- `POST /api/notebooks` - Create a new notebook
- `GET /api/notebooks/[id]` - Get notebook details
- `DELETE /api/notebooks/[id]` - Delete a notebook

### Sources
- `GET /api/notebooks/[id]/sources` - List all uploaded sources in a notebook
- `POST /api/notebooks/[id]/sources` - Upload/Ingest a new source (Rate-limited to 5 per 24 hours). This triggers extraction, chunking, and vector indexing.

### Chat & Messaging
- `GET /api/notebooks/[id]/messages` - Fetch chat history for a notebook
- `POST /api/notebooks/[id]/chat` - Submit a user query, run vector similarity search, and stream back the LLM response with citations

---

## 🛠️ Setup & Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file with the following variables:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[neon-host]/[dbname]?sslmode=require"
   JWT_SECRET="your-secret-key"
   OPENAI_API_KEY="sk-..."
   GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
   ```

3. **Database Migration**
   ```bash
   npm run db:push
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the application.

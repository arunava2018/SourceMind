import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export interface ChatMessageSummary {
  role: string;
  content: string;
}

export interface RewriterInput {
  userQuery: string;
  chatHistory?: ChatMessageSummary[];
  sourceNames?: string[];
}

export interface RewrittenQueryPlan {
  originalQuery: string;
  isVagueOrConversational: boolean;
  standaloneQuery: string;
  searchQueries: string[];
  reasoning?: string;
}

const rewriterSchema = z.object({
  isVagueOrConversational: z.boolean().describe(
    "True if the query uses pronouns, references previous messages, or is vague/underspecified."
  ),
  standaloneQuery: z.string().describe(
    "A self-contained version of the user query with all pronouns and vague references resolved."
  ),
  searchQueries: z.array(z.string()).min(1).max(3).describe(
    "1 to 3 distinct, highly targeted search queries optimized for vector semantic retrieval. Decompose multi-part questions into separate queries."
  ),
  reasoning: z.string().describe(
    "Brief explanation of how the query was rewritten or decomposed."
  ),
});

const REWRITER_SYSTEM_PROMPT = `You are an expert Query Intelligence Engine for a Retrieval-Augmented Generation (RAG) system.
Your job is to rewrite and optimize incoming user queries to maximize vector semantic search precision across indexed documents.

### YOUR RESPONSIBILITIES:
1. **ANAPHORA & CONTEXT RESOLUTION (Multi-turn Chat)**:
   - If the user uses pronouns ("it", "they", "she", "his findings", "that method"), replace them with the exact nouns from the chat history.
   - If the user asks follow-up questions ("Why?", "What else happened?", "Can you elaborate?"), formulate a full, standalone question that makes complete sense on its own.

2. **VAGUE & UNDERSPECIFIED QUERIES (Turn 1 or Generic)**:
   - If the query is vague (e.g., "summarize it", "what does this document say?", "key takeaways", "explain the findings"):
     - Look at the provided [AVAILABLE NOTEBOOK SOURCES].
     - Anchor the query to the specific document titles and themes.
     - Expand into 2 to 3 targeted queries covering structural facets (e.g., executive summary, core methodology, main conclusions/metrics).

3. **QUERY DECOMPOSITION (Multi-part & Comparative Questions)**:
   - If the user asks to compare two or more subjects (e.g., "Compare X and Y in terms of performance"), decompose into separate search queries:
     - Query 1: "X performance metrics and characteristics"
     - Query 2: "Y performance metrics and characteristics"

4. **ALREADY SPECIFIC QUERIES**:
   - If the user query is already clear, direct, and self-contained (e.g., "What is the formula for cosine similarity in vector spaces?"), keep it as the primary search query without unnecessary alterations.

5. **CONSTRAINTS**:
   - Return at most 3 search queries (1 for simple/specific queries, 2-3 for comparative, vague, or multi-faceted queries).
   - Never answer the user question; only output the search query plan.
   - Strip conversational pleasantries ("hello", "please", "can you tell me").`;

/**
 * Rewrites and expands a user query into optimal standalone search queries
 * for vector similarity retrieval.
 */
export async function rewriteContextualQuery(input: RewriterInput): Promise<RewrittenQueryPlan> {
  const { userQuery, chatHistory = [], sourceNames = [] } = input;
  const trimmedQuery = userQuery.trim();

  // If query is empty, return immediate fallback
  if (!trimmedQuery) {
    return {
      originalQuery: userQuery,
      isVagueOrConversational: false,
      standaloneQuery: userQuery,
      searchQueries: [userQuery],
    };
  }

  // Quick heuristic: If no chat history, no sources provided, and the query is reasonably specific
  // and has no pronouns, we can optionally pass through. But with gpt-4o-mini latency being ~150ms,
  // running through the engine ensures consistent query cleanliness and expansion.
  try {
    const formattedHistory = chatHistory
      .slice(-6) // Keep last 6 messages to focus on immediate context
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n");

    const formattedSources = sourceNames.length > 0
      ? sourceNames.map((name, i) => `${i + 1}. ${name}`).join("\n")
      : "No document titles available.";

    const userPrompt = `[AVAILABLE NOTEBOOK SOURCES]
${formattedSources}

[RECENT CHAT HISTORY]
${formattedHistory || "None (First turn)"}

[CURRENT USER QUERY]
"${trimmedQuery}"

Produce the optimal search query plan.`;

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      system: REWRITER_SYSTEM_PROMPT,
      prompt: userPrompt,
      schema: rewriterSchema,
      temperature: 0.0, // Deterministic for predictable retrieval
    });

    return {
      originalQuery: trimmedQuery,
      isVagueOrConversational: object.isVagueOrConversational,
      standaloneQuery: object.standaloneQuery || trimmedQuery,
      searchQueries: object.searchQueries.length > 0 ? object.searchQueries : [trimmedQuery],
      reasoning: object.reasoning,
    };
  } catch (error) {
    console.error("Contextual query rewriting failed, falling back to raw query:", error);
    // Graceful fallback to avoid blocking the user request
    return {
      originalQuery: trimmedQuery,
      isVagueOrConversational: false,
      standaloneQuery: trimmedQuery,
      searchQueries: [trimmedQuery],
    };
  }
}

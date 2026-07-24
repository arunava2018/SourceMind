import { TokenTextSplitter } from "@langchain/textsplitters";

const CHUNK_SIZE = 512;
const CHUNK_OVERLAP = 50;

export async function chunkText(text: string) {
  const splitter = new TokenTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    encodingName: "cl100k_base",
  });

  const output = await splitter.createDocuments([text]);
  
  return output.map((doc) => doc.pageContent);
}

/**
 * Chunks PDF text that contains [PAGE:N] markers.
 * Returns chunks with their corresponding page number metadata.
 */
export async function chunkPdfText(text: string): Promise<{ content: string; pageNumber: number }[]> {
  // Split the text by page markers to get per-page content
  const pageRegex = /\[PAGE:(\d+)\]\n/g;
  const pages: { pageNumber: number; text: string }[] = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = pageRegex.exec(text)) !== null) {
    if (pages.length > 0) {
      pages[pages.length - 1].text = text.slice(lastIndex, match.index).trim();
    }
    pages.push({ pageNumber: parseInt(match[1], 10), text: "" });
    lastIndex = match.index + match[0].length;
  }
  // Capture last page's text
  if (pages.length > 0) {
    pages[pages.length - 1].text = text.slice(lastIndex).trim();
  }
  
  // If no page markers found, fall back to normal chunking
  if (pages.length === 0) {
    const chunks = await chunkText(text);
    return chunks.map(c => ({ content: c, pageNumber: 1 }));
  }

  // Chunk each page separately so we know exactly which page a chunk belongs to
  const splitter = new TokenTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    encodingName: "cl100k_base",
  });

  const result: { content: string; pageNumber: number }[] = [];

  for (const page of pages) {
    if (!page.text.trim()) continue;
    const docs = await splitter.createDocuments([page.text]);
    for (const doc of docs) {
      result.push({ content: doc.pageContent, pageNumber: page.pageNumber });
    }
  }

  return result;
}


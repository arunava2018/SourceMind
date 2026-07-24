import { openai } from "@ai-sdk/openai";
import { embedMany, embed } from "ai";

const embeddingModel = openai.textEmbeddingModel("text-embedding-3-small");

export async function generateEmbeddings(chunks: string[]) {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  
  return embeddings;
}

export async function generateEmbedding(text: string) {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}

import { google } from "@ai-sdk/google";
import { embedMany, embed } from "ai";

const embeddingModel = google.textEmbeddingModel("gemini-embedding-001");

export async function generateEmbeddings(chunks: string[]) {
  // Use Promise.all to call single embed instead of batchEmbedContents
  // to avoid V1Beta API 404 errors for the batch endpoint on text-embedding-004
  const embeddings = await Promise.all(
    chunks.map(async (chunk) => {
      const { embedding } = await embed({
        model: embeddingModel,
        value: chunk,
        providerOptions: {
          google: { outputDimensionality: 768 },
        },
      });
      return embedding;
    })
  );
  
  return embeddings;
}

export async function generateEmbedding(text: string) {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
    providerOptions: {
      google: { outputDimensionality: 768 },
    },
  });
  return embedding;
}

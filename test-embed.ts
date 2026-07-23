import "dotenv/config";
import { generateEmbedding, generateEmbeddings } from "./lib/ai/embedding";

async function main() {
  console.log("Testing single embed...");
  const e1 = await generateEmbedding("Hello world");
  console.log("Single embed size:", e1.length);
  
  console.log("Testing batch embed...");
  const e2 = await generateEmbeddings(["Chunk 1", "Chunk 2"]);
  console.log("Batch embed size:", e2.length);
}

main().catch(console.error);

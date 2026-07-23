import "dotenv/config";

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  
  const generateModels = data.models.filter((m: any) => m.supportedGenerationMethods.includes("generateContent"));
  console.log("Supported Generation Models:", generateModels.map((m: any) => m.name));
}

main().catch(console.error);

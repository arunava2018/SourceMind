import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sources, sourceChunks, notebooks, studioArtifacts, studioUsageLogs } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { and, eq, inArray, gte } from "drizzle-orm";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getStudioSystemPrompt, getStudioUserPrompt } from "@/lib/ai/studio-prompts";

async function getDailyGenerationCount(userId: string): Promise<number> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  try {
    const logs = await db.query.studioUsageLogs.findMany({
      where: and(
        eq(studioUsageLogs.userId, userId),
        gte(studioUsageLogs.createdAt, todayStart)
      ),
    });
    return logs.length;
  } catch {
    try {
      const artifactsToday = await db.query.studioArtifacts.findMany({
        where: and(
          eq(studioArtifacts.userId, userId),
          gte(studioArtifacts.updatedAt, todayStart)
        ),
      });
      return artifactsToday.length;
    } catch {
      return 0;
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPayload = getAuthFromHeader(request.headers.get("Authorization"));
    if (!authPayload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: notebookId } = await params;

    const notebook = await db.query.notebooks.findFirst({
      where: and(eq(notebooks.id, notebookId), eq(notebooks.userId, authPayload.userId)),
    });

    if (!notebook) {
      return Response.json({ error: "Notebook not found" }, { status: 404 });
    }

    const artifacts = await db.query.studioArtifacts.findMany({
      where: and(eq(studioArtifacts.notebookId, notebookId), eq(studioArtifacts.userId, authPayload.userId)),
    });

    const result: Record<string, any> = {};
    artifacts.forEach((art) => {
      try {
        if (art.type === "flashcards" || art.type === "quiz") {
          result[art.type] = JSON.parse(art.content);
        } else {
          result[art.type] = art.content;
        }
      } catch {
        result[art.type] = art.content;
      }
    });

    const todayCount = await getDailyGenerationCount(authPayload.userId);

    return Response.json({ 
      artifacts: result,
      usage: { used: todayCount, limit: 10 }
    });
  } catch (error) {
    console.error("Error fetching studio artifacts:", error);
    return Response.json({ error: "Failed to fetch studio artifacts" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPayload = getAuthFromHeader(request.headers.get("Authorization"));
    if (!authPayload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: notebookId } = await params;

    // Verify notebook belongs to user
    const notebook = await db.query.notebooks.findFirst({
      where: and(eq(notebooks.id, notebookId), eq(notebooks.userId, authPayload.userId)),
    });

    if (!notebook) {
      return Response.json({ error: "Notebook not found" }, { status: 404 });
    }

    const body = await request.json();
    const { type, prompt, notes } = body;

    if (!type || !["flashcards", "quiz", "study-guide", "briefing", "draft"].includes(type)) {
      return Response.json({ error: "Invalid studio generation type" }, { status: 400 });
    }

    // Check rate limit (10 generations per day per user)
    const todayCount = await getDailyGenerationCount(authPayload.userId);
    if (todayCount >= 10) {
      return Response.json({
        error: "Daily AI generation limit reached (10/10 artifacts per day). This rate limit helps conserve OpenAI credits. Please try again tomorrow!",
        usage: { used: todayCount, limit: 10 }
      }, { status: 429 });
    }

    // Retrieve active sources
    const notebookSources = await db.query.sources.findMany({
      where: and(eq(sources.notebookId, notebookId), eq(sources.status, "READY")),
    });

    if (notebookSources.length === 0 && type !== "draft") {
      return Response.json({ 
        error: "No indexed sources found in this notebook. Please add and index sources first." 
      }, { status: 400 });
    }

    let contextString = "No source context available.";
    if (notebookSources.length > 0) {
      const sourceIds = notebookSources.map(s => s.id);
      const chunks = await db.query.sourceChunks.findMany({
        where: inArray(sourceChunks.sourceId, sourceIds),
        limit: 30, // Get up to 30 chunks for comprehensive coverage across sources
      });

      if (chunks.length > 0) {
        contextString = chunks.map((c, i) => {
          const src = notebookSources.find(s => s.id === c.sourceId);
          return `--- Chunk [${i + 1}] (Source: ${src?.name || "Unknown"}) ---\n${c.content}`;
        }).join("\n\n");
      }
    }

    const systemInstruction = getStudioSystemPrompt(type);
    const userPrompt = getStudioUserPrompt(type, contextString, { prompt, notes });

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemInstruction,
      prompt: userPrompt,
    });

    let returnData: any = text;

    if (type === "flashcards" || type === "quiz") {
      // Clean up any potential backticks if the LLM wrapped JSON in ```json ... ```
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```/, "").replace(/```$/, "").trim();
      }

      try {
        returnData = JSON.parse(cleanedText);
      } catch (e) {
        console.error("Failed to parse JSON from AI studio generation:", cleanedText, e);
        return Response.json({ 
          error: "Failed to generate structured JSON output from AI. Please try again." 
        }, { status: 500 });
      }
    }

    // Persist artifact in database for cross-device synchronization
    if (type !== "draft") {
      try {
        const existing = await db.query.studioArtifacts.findFirst({
          where: and(
            eq(studioArtifacts.notebookId, notebookId),
            eq(studioArtifacts.userId, authPayload.userId),
            eq(studioArtifacts.type, type)
          ),
        });

        const contentToSave = (type === "flashcards" || type === "quiz") ? JSON.stringify(returnData) : text;

        if (existing) {
          await db.update(studioArtifacts)
            .set({ content: contentToSave })
            .where(eq(studioArtifacts.id, existing.id));
        } else {
          await db.insert(studioArtifacts).values({
            notebookId,
            userId: authPayload.userId,
            type,
            content: contentToSave,
          });
        }
      } catch (dbErr) {
        console.error("Failed to persist studio artifact to DB:", dbErr);
      }
    }

    try {
      await db.insert(studioUsageLogs).values({ userId: authPayload.userId });
    } catch {
      // Silently ignore if studioUsageLogs table has not been migrated yet
    }
    const updatedCount = todayCount + 1;

    return Response.json({ 
      data: returnData, 
      type,
      usage: { used: updatedCount, limit: 10 }
    });

  } catch (error) {
    console.error("Studio generation error:", error);
    return Response.json({ error: "Internal server error during studio generation" }, { status: 500 });
  }
}

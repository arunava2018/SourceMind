import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sources, sourceChunks, notebooks, studioArtifacts, studioUsageLogs } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { and, eq, inArray, gte } from "drizzle-orm";
import { generateText, generateObject } from "ai";
import { z } from "zod";
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
      // Stratified / Uniform sampling across sources so all uploaded chapters/documents are represented equally
      const perSourceLimit = Math.max(1, Math.ceil(30 / sourceIds.length));
      let chunks: any[] = [];
      for (const srcId of sourceIds) {
        const srcChunks = await db.query.sourceChunks.findMany({
          where: eq(sourceChunks.sourceId, srcId),
          limit: perSourceLimit,
        });
        chunks.push(...srcChunks);
      }
      chunks = chunks.slice(0, 30);

      if (chunks.length > 0) {
        contextString = chunks.map((c, i) => {
          const src = notebookSources.find(s => s.id === c.sourceId);
          return `--- Chunk [${i + 1}] (Source: ${src?.name || "Unknown"}) ---\n${c.content}`;
        }).join("\n\n");
      }
    }

    const systemInstruction = getStudioSystemPrompt(type);
    const userPrompt = getStudioUserPrompt(type, contextString, { prompt, notes });
    const temperature = type === "draft" ? 0.7 : 0.2; // 0.2 for factual study aids, 0.7 for creative drafting

    let returnData: any;

    if (type === "flashcards") {
      const { object } = await generateObject({
        model: openai("gpt-4o"),
        system: systemInstruction,
        prompt: userPrompt,
        temperature,
        schema: z.object({
          flashcards: z.array(
            z.object({
              id: z.string(),
              question: z.string(),
              answer: z.string(),
              source: z.string(),
            })
          ),
        }),
      });
      returnData = object.flashcards;
    } else if (type === "quiz") {
      const { object } = await generateObject({
        model: openai("gpt-4o"),
        system: systemInstruction,
        prompt: userPrompt,
        temperature,
        schema: z.object({
          questions: z.array(
            z.object({
              id: z.string(),
              question: z.string(),
              options: z.array(z.string()),
              correctIndex: z.number(),
              explanation: z.string(),
            })
          ),
        }),
      });
      returnData = object.questions;
    } else {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: systemInstruction,
        prompt: userPrompt,
        temperature,
      });
      returnData = text;
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

        const contentToSave = (typeof returnData === "string") ? returnData : JSON.stringify(returnData);

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

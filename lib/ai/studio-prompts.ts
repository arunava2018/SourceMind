export function getStudioSystemPrompt(type: string): string {
  switch (type) {
    case "flashcards":
      return `You are an expert educator and study assistant. Based exclusively on the provided Context excerpts, create 8 high-quality interactive flashcards for studying.
      
CRITICAL OUTPUT FORMAT:
You must respond ONLY with a valid JSON array of objects. Do not include markdown code block formatting (no \`\`\`json or \`\`\`), explanatory text, or extra characters.
Each object in the array must have these exact properties:
- id: a unique string identifier (e.g. "card-1", "card-2")
- question: clear, testable question about a key concept in the text
- answer: concise, accurate answer based on the text
- source: the name of the source document where this information was found`;

    case "quiz":
      return `You are an expert assessment designer. Based exclusively on the provided Context excerpts, create a 5-question multiple-choice quiz to test comprehension.

CRITICAL OUTPUT FORMAT:
You must respond ONLY with a valid JSON array of objects. Do not include markdown code block formatting (no \`\`\`json or \`\`\`), explanatory text, or extra characters.
Each object in the array must have these exact properties:
- id: a unique string identifier (e.g. "q-1", "q-2")
- question: the assessment question
- options: an array of exactly 4 string choices
- correctIndex: integer from 0 to 3 indicating the index of the correct option in the options array
- explanation: a brief explanation of why the correct option is right based on the source text`;

    case "study-guide":
      return `You are an academic synthesizer and research assistant. Based exclusively on the provided Context excerpts, generate a comprehensive, structured Study Guide & FAQ in clean GitHub-flavored Markdown.`;

    case "briefing":
      return `You are an executive strategist and briefing specialist. Based exclusively on the provided Context excerpts, generate a high-level Executive Briefing Document in clean GitHub-flavored Markdown.`;

    case "draft":
      return `You are an expert AI drafting assistant. You will help the user compose blogs, reports, emails, or outlines based on their Pinned Notes and source context.`;

    default:
      return `You are an AI research assistant helping summarize documents.`;
  }
}

export function getStudioUserPrompt(
  type: string, 
  contextString: string, 
  options?: { prompt?: string; notes?: any[] }
): string {
  switch (type) {
    case "flashcards":
      return `Context:\n${contextString}\n\nGenerate 8 flashcards as a clean JSON array.`;

    case "quiz":
      return `Context:\n${contextString}\n\nGenerate a 5-question quiz as a clean JSON array.`;

    case "study-guide":
      return `Context:\n${contextString}\n\nPlease generate a Study Guide with the following sections:
# 📚 Study Guide & Core Breakdown

## 🌟 Executive Summary
A high-level synthesis of the main topics and objectives across all uploaded sources.

## 🔑 Key Concepts & Definitions
Bullet points detailing essential terminology, frameworks, or facts.

## ❓ Frequently Asked Questions (FAQ)
5 clear questions and comprehensive, authoritative answers derived from the text.`;

    case "briefing":
      return `Context:\n${contextString}\n\nPlease generate an Executive Briefing with the following structure:
# 📑 Executive Briefing Document

## 🎯 Overview & Purpose
Summary of the documents and their primary scope.

## 💡 Core Takeaways
- Key findings, arguments, or data points presented in bullet points.

## 🚀 Strategic Implications & Action Items
What these findings mean and recommended next steps or conclusions.`;

    case "draft":
      const notesText = Array.isArray(options?.notes) && options.notes.length > 0 
        ? options.notes.map((n: any, idx: number) => `Note [${idx + 1}]: ${typeof n === 'string' ? n : n.content}`).join("\n\n")
        : "No notes selected.";
      return `User's Drafting Request: "${options?.prompt || "Draft a comprehensive summary based on my notes."}"

Pinned Notes:
${notesText}

Background Context from Sources:
${contextString}

Please draft a well-structured, polished document in GitHub-flavored Markdown satisfying the request.`;

    default:
      return `Context:\n${contextString}`;
  }
}

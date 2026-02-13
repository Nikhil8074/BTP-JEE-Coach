"use server";

import { model } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionType = "MCQ" | "NUMERICAL";

interface GenerateQuestionParams {
    subject: string;
    topic: string;
    subtopic: string;
    difficulty: Difficulty;
    type: QuestionType;
}

export async function generateQuestion(params: GenerateQuestionParams) {
    const { subject, topic, subtopic, difficulty, type } = params;
    console.log("----- GENERATE REQUEST -----");
    console.log("Received params:", { subject, topic, subtopic, difficulty });

    // Fetch recent questions to avoid duplicates (context injection)
    const recentQuestions = await prisma.question.findMany({
        where: {
            topic: { name: topic },
            subtopic: { name: subtopic },
            difficulty: difficulty,
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { questionText: true },
    });

    const recentContext = recentQuestions
        .map((q) => `- ${q.questionText.substring(0, 50)}...`)
        .join("\n");

    // Difficulty specific instructions
    const difficultyGuide = {
        "EASY": "Level: JEE Main (Easy). Direct formula application or single concept. Simple calculation.",
        "MEDIUM": "Level: JEE Main (Moderate). Requires connecting 2 concepts or moderate calculation. Standard exam level.",
        "HARD": "Level: JEE Advanced. Complex, multi-step problem. Requires deep conceptual understanding, combining 3+ concepts, or tricky edge cases."
    };

    const prompt = `
    You are an expert JEE (Joint Entrance Examination) Coach.
    Subject: ${subject}
    Topic: ${topic}
    Subtopic: ${subtopic}
    Difficulty: ${difficulty}
    ${difficultyGuide[difficulty]}
    Question Type: ${type}

    Task: Generate a unique, high-quality JEE-level question.
    
    Constraints:
    1. **Format**: Output MUST be a valid JSON object.
    2. **Math**: ALL math expressions (even simple variables like x, y) MUST be wrapped in '$' delimiters (e.g., $x^2$, $\sqrt{13}$, $10 \text{ cm/s}$). Do not use bare LaTeX without dollars.
    3. **Diagrams**: If a diagram is helpful (especially for Physics/Geometry), generate clear, simple SVG code for it. If not needed, set schema field to null.
    4. **Uniqueness**: Do NOT generate questions similar to these recent ones:
    ${recentContext}
    5. **Accuracy**: Solve the problem step-by-step internally before generating the final JSON to ensure the content is 100% correct.
    6. **Options**: For MCQ, provide 4 distinct options.
    7. **Correct Answer**: For MCQ, provide the Option Label ("A", "B", "C", or "D") matching the correct option. For Numerical, provide the exact numeric value string.

    JSON Schema:
    {
      "questionText": "string (with LaTeX and markdown)",
      "options": ["string", "string", "string", "string"] (null if Numerical),
      "correctAnswer": "string ('A', 'B', 'C', 'D' for MCQ, or value for Numerical)",
      "solution": "string (Use Markdown! Use bullet points, bold headings like **Step 1**, and double newlines for breaks. Detailed step-by-step logic with LaTeX)",
      "diagramSVG": "string (valid SVG code starting with <svg>... or null)"
    }
  `;

    try {
        let text = "";
        let retryCount = 0;
        const MAX_RETRIES = 3;

        while (retryCount < MAX_RETRIES) {
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                text = response.text();
                break; // Success, exit loop
            } catch (genError: any) {
                if (genError.message.includes("503") || genError.message.includes("429")) {
                    console.warn(`Attempt ${retryCount + 1} failed with ${genError.message}. Retrying...`);
                    retryCount++;
                    await new Promise(res => setTimeout(res, 2000 * retryCount)); // Exponential backoff
                } else {
                    throw genError; // Fatal error
                }
            }
        }

        if (!text) throw new Error("Failed to generate content after retries");

        // Clean up potential markdown blocks from response if present
        // Robust JSON extraction
        let cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const firstBrace = cleanedText.indexOf("{");
        const lastBrace = cleanedText.lastIndexOf("}");

        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
        }

        let data;
        try {
            data = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            console.log("Raw AI Response:", text); // Log for debugging
            throw new Error("AI returned invalid JSON");
        }

        // Generate specific hash for uniqueness check
        const promptHash = createHash("md5").update(data.questionText).digest("hex");

        // Check if this specific question already exists
        const existing = await prisma.question.findUnique({
            where: { promptHash },
        });

        if (existing) {
            console.log("Duplicate question generated, retrying...");
            // In production, we'd have a retry loop. For now, we'll return existing or error.
            // But actually, let's just create a new one since we have the data.
            // We will skip saving if it exists and just return it.
            return { ...existing, options: JSON.parse(existing.options || "null") };
        }

        // Save to DB
        // First, verify topic/subtopic exist or find them. 
        // Ideally we pass IDs, but for now we look up by name.

        const topicRecord = await prisma.topic.findFirst({
            where: { name: topic },
        })

        if (!topicRecord) throw new Error("Topic not found");

        const subtopicRecord = await prisma.subtopic.findFirst({
            where: { name: subtopic, topicId: topicRecord.id },
        });


        const savedQuestion = await prisma.question.create({
            data: {
                type,
                difficulty,
                questionText: data.questionText,
                options: data.options ? JSON.stringify(data.options) : null,
                correctAnswer: data.correctAnswer,
                solution: data.solution,
                diagrams: data.diagramSVG,
                promptHash,
                topic: { connect: { id: topicRecord.id } },
                subtopic: subtopicRecord ? { connect: { id: subtopicRecord.id } } : undefined,
            },
        });

        return { ...savedQuestion, options: data.options }; // Return parsed options

    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new Error("Failed to generate question");
    }
}

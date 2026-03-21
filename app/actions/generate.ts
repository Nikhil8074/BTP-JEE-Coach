"use server";

import { groq } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionType = "MCQ" | "NUMERICAL";

interface GenerateQuestionParams {
    subject: string;
    topic: string;
    subtopic: string;
    difficulty: Difficulty;
}

export async function generateQuestion(params: GenerateQuestionParams) {
    const { subject, topic, subtopic, difficulty } = params;
    console.log("----- GENERATE REQUEST -----");
    console.log("Received params:", { subject, topic, subtopic, difficulty });

    const questionTypes = ["SINGLE_MCQ", "MULTI_MCQ", "INTEGER", "DECIMAL"] as const;
    const generatedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];


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
        "EASY": "Level: JEE Main Standard. Direct application of 1-2 formulas. Avoid overly complex calculations. Testing basic concept memory and straightforward derivation.",
        "MEDIUM": "Level: JEE Main Hard / JEE Advanced Easy. Requires connecting 2-3 distinct concepts. Involves moderate cognitive load and non-obvious steps. Time-consuming but solvable with standard rigorous methods.",
        "HARD": "Level: JEE Advanced Tough. Highly profound, multi-step problem. Requires mastering 3+ interconnected concepts or tricky edge cases. Must test deep analytical skills."
    };

    const typeInstructions: Record<string, string> = {
        "SINGLE_MCQ": "Provide exactly 4 distinct options in the 'options' array. Exactly ONE option is correct. The 'correctAnswer' must be the letter 'A', 'B', 'C', or 'D'.",
        "MULTI_MCQ": "Provide exactly 4 distinct options in the 'options' array. ONE OR MORE options can be correct. The 'correctAnswer' must be a comma-separated list of the correct letters in alphabetical order (e.g., 'A,C' or 'A,B,D').",
        "INTEGER": "The 'options' array MUST be explicitly set to null. The 'correctAnswer' must be a single positive or negative integer string (e.g., '42' or '-5').",
        "DECIMAL": "The 'options' array MUST be explicitly set to null. The 'correctAnswer' must be a decimal value rounded to exactly two decimal places as a string (e.g., '3.14' or '-0.50')."
    };

    const prompt = `
    You are an expert JEE (Joint Entrance Examination) Coach.
    Subject: ${subject}
    Topic: ${topic}
    Subtopic: ${subtopic}
    Difficulty: ${difficulty}
    ${difficultyGuide[difficulty]}
    
    Format Type Required: ${generatedType}
    ${typeInstructions[generatedType]}

    Task: Generate a unique, high-quality JEE-level question.
    
    Constraints:
    1. **Format**: Output MUST be a valid JSON object.
    2. **Math Expressions (CRITICAL)**: ALL math expressions MUST be wrapped in '$' delimiters for inline math (e.g., $x^2$, $\\sqrt{13}$) or '$$' for block math. DO NOT use '\\[ ... \\]', '\\( ... \\)', or bare '[' / ']' for equations under any circumstances.
    3. **Content Strictness**: Do NOT include options (e.g., A., B., C., D.) inside the 'questionText'. The 'questionText' should ONLY contain the problem statement itself without listing choices.
    4. **Type Adherence**: Strictly follow the Format Type Required instructions for options and correctAnswer. Do not prefix the options array items with "A.", "B.", etc. Just provide the mathematical values. 
    5. **Uniqueness**: Do NOT generate questions similar to these recent ones:
    ${recentContext}
    6. **Accuracy**: Solve the problem step-by-step internally before generating the final JSON to ensure 100% correctness.
    7. **Diagrams**: If a diagram is helpful, generate clear, simple SVG code for it. If not needed, set diagramSVG to null.

    JSON Schema:
    {
      "questionText": "string (ONLY the question statement, no options)",
      "options": ["string", "string", "string", "string"] (null if INTEGER or DECIMAL),
      "correctAnswer": "string (Matches Format Type Required rules)",
      "solution": "string (Detailed step-by-step logic using Markdown, format math strictly with $ or $$)",
      "diagramSVG": "string (valid SVG code starting with <svg>... or null)"
    }
  `;

    try {
        let text = "";
        let retryCount = 0;
        const MAX_RETRIES = 3;

        while (retryCount < MAX_RETRIES) {
            try {
                const completion = await groq.chat.completions.create({
                    model: "openai/gpt-oss-120b",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 1,
                    max_completion_tokens: 8192,
                    top_p: 1,
                    reasoning_effort: "medium",
                    stream: false
                });
                text = completion.choices[0]?.message?.content || "";
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
                type: generatedType,
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

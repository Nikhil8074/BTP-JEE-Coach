"use server";

import { groq } from "@/lib/groq";
import dbConnect from "@/lib/mongodb";
import { Concept } from "@/models/Concept";
import { Topic } from "@/models/Topic";
import { Subtopic } from "@/models/Subtopic";
import { createHash } from "crypto";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface GenerateConceptParams {
    subject: string;
    topic: string;
    subtopic: string;
    difficulty: Difficulty;
}

// NextJS Server Actions must return plain serialized objects
function serializeDoc(doc: any) {
    if (!doc) return null;
    const serialized = {
        ...doc,
        id: doc._id.toString(),
        topicId: doc.topicId.toString(),
        subtopicId: doc.subtopicId ? doc.subtopicId.toString() : null,
        createdAt: doc.createdAt.toISOString()
    };
    delete serialized._id;
    delete serialized.__v;
    return serialized;
}

export async function generateConcept(params: GenerateConceptParams) {
    const { subject, topic, subtopic, difficulty } = params;
    console.log("----- GENERATE CONCEPT REQUEST -----");
    console.log("Received params:", { subject, topic, subtopic, difficulty });

    await dbConnect();

    const topicRecord = await Topic.findOne({ name: topic }).lean();
    if (!topicRecord) throw new Error("Topic not found");

    const subtopicRecord = await Subtopic.findOne({ name: subtopic, topicId: topicRecord._id }).lean();

    const promptText = `Generate a clear, comprehensive, and neat explanation for the JEE concept: Subject: ${subject}, Topic: ${topic}, Subtopic: ${subtopic}, Difficulty: ${difficulty}.`;
    const promptHash = createHash("md5").update(promptText).digest("hex");

    const existing = await Concept.findOne({ promptHash }).lean();

    if (existing) {
        console.log("Duplicate concept generated, returning cached version.");
        return serializeDoc(existing);
    }

    const difficultyGuide = {
        "EASY": "Level: Core Foundations. Keep it very basic and accessible, focusing on fundamental definitions and simple derivations.",
        "MEDIUM": "Level: JEE Main Standard. Cover the standard concepts, important formulas, and typical problem-solving approaches.",
        "HARD": "Level: JEE Advanced. Dive deep into edge cases, complex derivations, exceptional scenarios, and advanced applications."
    };

    const prompt = `
    You are an expert JEE (Joint Entrance Examination) Coach and Teacher.
    Subject: ${subject}
    Topic: ${topic}
    Subtopic: ${subtopic}
    Difficulty Focus: ${difficultyGuide[difficulty]}

    Task: Generate a clear, structured, and highly detailed conceptual explanation of this topic for a JEE aspirant.
    
    Constraints:
    1. **Format**: Output MUST be a valid JSON object.
    2. **Content Structure**: The explanation should be in Markdown format. Use headers, bullet points, and bold text to make it readable and engaging. Provide clear definitions, core formulas, and intuitive explanations.
    3. **Math Expressions (CRITICAL FORMATTING)**: 
       - You MUST use standard Markdown mathematical delimiters: '$' for inline math, and '$$' for block math.
       - For INLINE math (within sentences), use a single '$' on each side (e.g., $x^2$).
       - For BLOCK math (standalone or multiline equations), use '$$' on each side (e.g., $$ \\frac{1}{2} $$).
       - DO NOT use '\\(' or '\\['.
       - ABSOLUTE STRICT RULE: DO NOT wrap equations in markdown code blocks or backticks (\`). Backticks break the LaTeX renderer completely! Let the '$' delimiters handle it.
       - CHEMISTRY INSTRUCTION: NEVER use \\ce{} or mhchem packages as they are NOT supported by our renderer. You MUST use standard LaTeX math (e.g. \\mathrm{H_2O} or regular subscripts/superscripts) for all chemical equations.
    4. **Diagrams**: 
       - If the subject is Chemistry and the concept requires drawing a molecular structure or functional group, set "diagramType" to "SMILES" and provide the 1D SMILES string in "diagramContent".
       - If the subject is Physics or Maths and the concept requires a geometry, graph, circuit, or free-body diagram, set "diagramType" to "TIKZ" and provide the raw LaTeX TikZ code inside "diagramContent" (e.g. \\begin{tikzpicture}...\\end{tikzpicture}).
       - If no structural diagram is needed, set BOTH strictly to null. Do NOT attempt to build SVGs.
    5. **JSON Escaping (CRITICAL)**: Because the output is JSON, you MUST double-escape all backslashes in your LaTeX, TikZ, and math formulas so the JSON parser does not crash. For example, write \\\\frac instead of \\frac, and \\\\begin{tikzpicture} instead of \\begin{tikzpicture}.
    6. **Tone**: Encouraging, analytical, and highly precise.

    JSON Schema:
    {
      "content": "string (Pure Markdown explanation. Format math strictly with $ and $$. DOUBLE-ESCAPE ALL BACKSLASHES!)",
      "diagramType": "string ('SMILES', 'TIKZ', or null)",
      "diagramContent": "string (the raw SMILES or TIKZ string, or null. DOUBLE-ESCAPE ALL BACKSLASHES!)"
    }
  `;

    try {
        let text = "";
        let retryCount = 0;
        const MAX_RETRIES = 3;

        while (retryCount < MAX_RETRIES) {
            try {
                // Ensure the groq call wraps messages properly. Note: groq SDK uses string literal model identifiers.
                const completion = await groq.chat.completions.create({
                    model: "openai/gpt-oss-120b",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                    max_completion_tokens: 8192,
                    top_p: 1,
                    reasoning_effort: "medium",
                    stream: false
                });
                text = completion.choices[0]?.message?.content || "";
                
                // robust handling for errors like 401 when API keys fail
                // is typically hoisted upwards via throw genError.
                break;
            } catch (genError: any) {
                if (genError.message && (genError.message.includes("503") || genError.message.includes("429"))) {
                    console.warn(`Attempt ${retryCount + 1} failed with ${genError.message}. Retrying...`);
                    retryCount++;
                    await new Promise(res => setTimeout(res, 2000 * retryCount));
                } else {
                    throw genError;
                }
            }
        }

        if (!text) throw new Error("Failed to generate content after retries");

        let cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const firstBrace = cleanedText.indexOf("{");
        const lastBrace = cleanedText.lastIndexOf("}");

        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
        }

        let data;
        try {
            let sanitizedText = "";
            for (let i = 0; i < cleanedText.length; i++) {
                if (cleanedText[i] === '\\') {
                    if (i + 1 < cleanedText.length) {
                        const next = cleanedText[i + 1];
                        if (next === '\\') {
                            sanitizedText += '\\\\';
                            i++;
                        } else if ('"/bfnrtu'.includes(next)) {
                            sanitizedText += '\\' + next;
                            i++;
                        } else {
                            sanitizedText += '\\\\' + next;
                            i++;
                        }
                    } else {
                        sanitizedText += '\\\\';
                    }
                } else {
                    sanitizedText += cleanedText[i];
                }
            }
            data = JSON.parse(sanitizedText);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "\\nRaw text:", text);
            throw new Error("AI returned invalid JSON");
        }

        const savedConcept = await Concept.create({
            content: data.content,
            difficulty,
            diagramType: data.diagramType,
            diagramContent: data.diagramContent,
            promptHash,
            topicId: topicRecord._id,
            subtopicId: subtopicRecord ? subtopicRecord._id : undefined,
        });

        return serializeDoc(savedConcept.toObject());

    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new Error("Failed to generate concept");
    }
}

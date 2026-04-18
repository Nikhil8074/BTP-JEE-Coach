"use server";

import { groq } from "@/lib/groq";
import dbConnect from "@/lib/mongodb";
import { Question } from "@/models/Question";
import { Topic } from "@/models/Topic";
import { Subtopic } from "@/models/Subtopic";
import { createHash } from "crypto";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionType = "MCQ" | "NUMERICAL";

interface GenerateQuestionParams {
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

export async function generateQuestion(params: GenerateQuestionParams) {
    const { subject, topic, subtopic, difficulty } = params;
    console.log("----- GENERATE REQUEST -----");
    console.log("Received params:", { subject, topic, subtopic, difficulty });

    await dbConnect();

    const topicRecord = await Topic.findOne({ name: topic }).lean();
    if (!topicRecord) throw new Error("Topic not found");

    const subtopicRecord = await Subtopic.findOne({ name: subtopic, topicId: topicRecord._id }).lean();

    const questionTypes = ["SINGLE_MCQ", "MULTI_MCQ", "INTEGER", "DECIMAL"] as const;
    const generatedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

    // Fetch recent questions to avoid duplicates (context injection)
    const recentQuestions = await Question.find({
        topicId: topicRecord._id,
        subtopicId: subtopicRecord ? subtopicRecord._id : null,
        difficulty: difficulty,
    }).sort({ createdAt: -1 }).limit(5).select("questionText").lean();

    const recentContext = recentQuestions
        .map((q: any) => `- ${q.questionText.substring(0, 50)}...`)
        .join("\n");

    // Difficulty specific instructions
    const difficultyGuide = {
        "EASY": "Level: JEE Main Standard. Direct application of 1-2 formulas. Avoid overly complex calculations. Testing basic concept memory and straightforward derivation.",
        "MEDIUM": "Level: JEE Main Hard / JEE Advanced Easy. Requires connecting 2-3 distinct concepts. Involves moderate cognitive load and non-obvious steps. Time-consuming but solvable with standard rigorous methods.",
        "HARD": "Level: Extremely Tough JEE Advanced. This MUST be a brutal, multi-step problem combining at least 3 distinct conceptual layers (e.g., involving calculus alongside core topics, or strict mathematical edge-case analysis). The solution must require intense, non-obvious analytical leaps, sophisticated mathematical mechanics, and careful handling of tricky constraints. Avoid standard textbook examples entirely. The distractors (wrong options) must realistically represent common student calculation or conceptual errors."
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
    2. **Math Expressions (CRITICAL FORMATTING)**: 
       - You MUST use standard ChatGPT mathematical delimiters.
       - For INLINE math (within sentences), strictly use '\\\(' and '\\\)' (e.g., \\\( x^2 \\\)).
       - For BLOCK math (standalone or multiline equations), strictly use '\\\[' and '\\\]' (e.g., \\\[ \\frac{1}{2} \\\]).
       - DO NOT EVER use '$' or '$$' for any math.
       - BAD: $x^2$ or $$x^2$$
       - GOOD: \\\(x^2\\\) or \\\[x^2\\\]
       - ABSOLUTE STRICT RULE: DO NOT wrap equations in markdown backticks (\`). Backticks will break the LaTeX renderer completely!
       - CHEMISTRY INSTRUCTION: NEVER use \\ce{} or mhchem packages as they are NOT supported by our renderer. You MUST use standard LaTeX math (e.g. \\mathrm{H_2O} or regular subscripts/superscripts) for all chemical equations.
    3. **Content Strictness**: Do NOT include options (e.g., A., B., C., D.) inside the 'questionText'. The 'questionText' should ONLY contain the problem statement itself without listing choices.
    4. **Type Adherence**: Strictly follow the Format Type Required instructions for options and correctAnswer. Do not prefix the options array items with "A.", "B.", etc. Just provide the mathematical values. 
    5. **Uniqueness**: Do NOT generate questions similar to these recent ones:
    ${recentContext}
    6. **Accuracy**: Solve the problem step-by-step internally before generating the final JSON to ensure 100% correctness.
    7. **Diagrams**: 
       - If the subject is Chemistry and the problem requires drawing a molecular structure or functional group, set "diagramType" to "SMILES" and provide the 1D SMILES string in "diagramContent".
       - If the subject is Physics or Maths and the problem requires a geometry, graph, circuit, or free-body diagram, set "diagramType" to "TIKZ" and provide the raw LaTeX TikZ code inside "diagramContent" (e.g. \\begin{tikzpicture}...\\end{tikzpicture}).
       - If no structural diagram is needed, set BOTH strictly to null. Do NOT attempt to build SVGs.
    8. **Difficulty Strictness**: If the Difficulty is HARD, the problem MUST NOT be a standard plug-and-chug question. It must require synthesis of multiple subtopics and contain a non-obvious "trick" or edge case that makes it challenging for a top percentile student.
    9. **JSON Escaping (CRITICAL)**: Because the output is JSON, you MUST double-escape all backslashes in your LaTeX, TikZ, and math formulas so the JSON parser does not crash. For example, write \\\\frac instead of \\frac, and \\\\begin{tikzpicture} instead of \\begin{tikzpicture}.

    JSON Schema:
    {
      "questionText": "string (ONLY the question statement, no options)",
      "options": ["string", "string", "string", "string"] (null if INTEGER or DECIMAL),
      "correctAnswer": "string (Matches Format Type Required rules)",
      "solution": "string (Detailed step-by-step logic using Markdown, format math strictly with \\\\( or \\\\[. DOUBLE-ESCAPE ALL BACKSLASHES!)",
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
                    temperature: 1,
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

        const promptHash = createHash("md5").update(data.questionText).digest("hex");

        const existing = await Question.findOne({ promptHash }).lean();

        if (existing) {
            console.log("Duplicate question generated, returning cached version.");
            return serializeDoc(existing);
        }

        const savedQuestion = await Question.create({
            type: generatedType,
            difficulty,
            questionText: data.questionText,
            options: data.options || undefined, // Array of strings inside MongoDB
            correctAnswer: data.correctAnswer,
            solution: data.solution,
            diagramType: data.diagramType,
            diagramContent: data.diagramContent,
            promptHash,
            topicId: topicRecord._id,
            subtopicId: subtopicRecord ? subtopicRecord._id : undefined,
        });

        return serializeDoc(savedQuestion.toObject());

    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new Error("Failed to generate question");
    }
}

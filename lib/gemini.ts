import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
        temperature: 0.7, // Balances creativity with accuracy
        maxOutputTokens: 65536,
        responseMimeType: "application/json",
    },
});

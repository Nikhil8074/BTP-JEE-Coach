import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API Key found in .env");
        return;
    }
    console.log("Using API Key:", apiKey.substring(0, 10) + "...");

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Fetching available models...");
        // For listing models, we can't use the client directly to list? 
        // Actually the SDK doesn't expose listModels in the generic client easily in all versions?
        // Let's try to just generate content with a known fallback like 'gemini-pro' to check connectivity first,
        // Or actually check if we can get the model.
        // Wait, the SDK has a ModelManager? No.
        // Let's try to just run a simple generation with 'gemini-1.5-flash' and see the error in isolation.
        // Better: use the REST API manually to list models if SDK doesn't support it easily?
        // The SDK *does* support getGenerativeModel, but listing?
        // Let's look at the node_modules or docs? I'll assume standard fetch for listing if SDK fails.

        // Attempting generation with current config
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Attempting to generate content with gemini-1.5-flash...");
        const result = await model.generateContent("Hello, are you there?");
        console.log("Success! Response:", result.response.text());

    } catch (error: any) {
        console.error("Error with SDK:", error.message);

        // Fallback: Check models via REST API
        console.log("Checking available models via REST API...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            console.error(`REST API Error: ${response.status} ${response.statusText}`);
            const body = await response.text();
            console.error("Body:", body);
        } else {
            const data = await response.json();
            console.log("Available Models:");
            // @ts-ignore
            data.models?.forEach((m: any) => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods})`);
            });
        }
    }
}

main();

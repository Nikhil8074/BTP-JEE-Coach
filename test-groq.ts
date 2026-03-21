import { groq } from "./lib/groq";

async function main() {
    console.log("Testing Groq Cloud API with model openai/gpt-oss-120b...");
    try {
        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                {
                    role: "user",
                    content: "Hello, are you there? Please answer in one sentence."
                }
            ],
            temperature: 1,
            max_completion_tokens: 8192,
            top_p: 1,
            reasoning_effort: "medium",
            stream: true,
            stop: null
        });

        process.stdout.write("Success! Response: ");
        for await (const chunk of completion) {
            process.stdout.write(chunk.choices[0]?.delta?.content || "");
        }
        console.log();
    } catch (error: any) {
        console.error("Error with SDK:", error.message);
    }
}

main();

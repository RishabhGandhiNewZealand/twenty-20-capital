import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";
import { calculateUsage } from "@/lib/gemini-service";

const CHAT_MODEL = "gemini-3.1-pro-preview";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_INSTRUCTION = `You are a senior investment analyst assistant. You have been given the FULL analysis context from a multi-agent research pipeline that just ran. This includes:
- Fundamental analysis reports for every holding in the portfolio and for the target stock
- Hamilton Helmer 7 Powers strategic analysis for each company
- The current portfolio composition and allocations
- The Complexity Investing Portfolio Manager's trade decision

Your job is to answer the user's follow-up questions about ANY of this data. Be precise, cite numbers from the reports, and be concise. If the user asks something not covered by the provided context, say so honestly — but you may use Google Search to supplement if needed.

Format your responses in clean Markdown. Use bold, bullet points, and tables where appropriate.`;

interface ChatMessage {
    role: "user" | "model";
    text: string;
}

interface ChatRequestBody {
    message: string;
    history: ChatMessage[];
    context: string;
}

export async function POST(req: NextRequest) {
    try {
        const body: ChatRequestBody = await req.json();
        const { message, history, context } = body;

        if (!message || !context) {
            return new Response(JSON.stringify({ error: "Missing message or context" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        const model = genAI.getGenerativeModel(
            { model: CHAT_MODEL },
            { apiVersion: "v1beta" }
        );

        const fullSystemInstruction = `${SYSTEM_INSTRUCTION}

--- BEGIN ANALYSIS CONTEXT ---
${context}
--- END ANALYSIS CONTEXT ---`;

        const chatHistory = history.map((msg) => ({
            role: msg.role,
            parts: [{ text: msg.text }],
        }));

        const chat = model.startChat({
            systemInstruction: { role: "system", parts: [{ text: fullSystemInstruction }] },
            history: chatHistory,
            tools: [{ googleSearch: {} }] as any[],
        });

        // Stream the response
        const result = await chat.sendMessageStream(message);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        if (text) {
                            controller.enqueue(encoder.encode(text));
                        }
                    }

                    // After stream completes, get the aggregated response for usage metadata
                    const aggregated = await result.response;
                    const usage = calculateUsage(CHAT_MODEL, aggregated.usageMetadata);

                    // Send usage as a special JSON line at the end, delimited by a marker
                    const usageLine = `\n<!--USAGE:${JSON.stringify(usage)}-->`;
                    controller.enqueue(encoder.encode(usageLine));

                    controller.close();
                } catch (err: any) {
                    console.error("[agent-chat] Stream error:", err);
                    controller.enqueue(encoder.encode(`\n\n[Error: ${err.message}]`));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
                "Cache-Control": "no-cache",
            },
        });
    } catch (err: any) {
        console.error("[agent-chat] Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

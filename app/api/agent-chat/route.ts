import { createOpenAI } from "@ai-sdk/openai";
import { generateText, gateway } from "ai";
import { NextRequest } from "next/server";
import { list } from "@vercel/blob";
import {
    calculateUsage,
    analyzeEquity,
    analyzeSevenPowers,
    makeComplexityDecision,
    EquityAnalysis,
    PortfolioItem,
} from "@/lib/gemini-service";

export const maxDuration = 300; // 5 min timeout for long tool calls

const CHAT_MODEL = "deepseek/deepseek-v4-pro";

const aiClient = createOpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN,
    baseURL: "https://ai-gateway.vercel.sh/v1",
});

const TOOL_MARKER_REGEX = /<<TOOL:(\w+):(.*?)>>/s;

const SYSTEM_INSTRUCTION = `You are a senior investment analyst assistant. You have been given the FULL analysis context from a multi-agent research pipeline that just ran. This includes:
- Fundamental analysis reports for every holding in the portfolio and for the target stock
- Hamilton Helmer 7 Powers strategic analysis for each company
- The current portfolio composition and allocations
- The Complexity Investing Portfolio Manager's trade decision

Your job is to answer the user's follow-up questions about ANY of this data. Be precise, cite numbers from the reports, and be concise. You also have Google/Perplexity Search available for supplementary lookups.

## TOOL SYSTEM
You have access to powerful research tools. To use a tool, output EXACTLY this marker format on its own line at the END of your message:

<<TOOL:tool_name:{"param":"value"}>>

Available tools:
1. **run_equity_analysis** - Run a full fundamental + 7 Powers equity analysis on any ticker. Use when the user asks to analyze a company not in the existing context, or wants a fresh analysis.
   Format: <<TOOL:run_equity_analysis:{"ticker":"ASML"}>>

2. **run_seven_powers_analysis** - Run a Hamilton Helmer 7 Powers strategic analysis. Use when asking specifically about competitive moats or strategic positioning.
   Format: <<TOOL:run_seven_powers_analysis:{"ticker":"TSMC","companyName":"Taiwan Semiconductor"}>>

3. **run_portfolio_decision** - Run the Complexity PM to decide BUY/SELL/HOLD. The target must have been analyzed first (either in existing context or via run_equity_analysis).
   Format: <<TOOL:run_portfolio_decision:{"targetTicker":"ASML"}>>

4. **get_stock_price** - Quick real-time stock price lookup.
   Format: <<TOOL:get_stock_price:{"ticker":"AAPL"}>>

5. **get_cached_analysis** - Retrieve a previously cached analysis for a ticker. Use this FIRST when the user asks about a company listed under "Other Cached Analyses Available" in the context. This is much faster and cheaper than running a fresh analysis.
   Format: <<TOOL:get_cached_analysis:{"ticker":"ASML"}>>

RULES:
- Output AT MOST ONE tool call per message.
- Place the tool marker on its own line at the very end of your text.
- Before the marker, write a brief message to the user (e.g., "Let me pull up the cached analysis for ASML...").
- If the user asks to analyze a company AND make a portfolio decision, use run_equity_analysis first. The portfolio decision can be run in a follow-up.
- PREFER cached data: if a company is listed under "Other Cached Analyses Available", use get_cached_analysis FIRST rather than running a new analysis.
- Only use run_equity_analysis when the user explicitly asks for a FRESH/NEW analysis, or when no cached analysis exists at all.
- Do NOT use a tool if the answer is already available in the provided analysis context, even if the data is from a prior session.
- For simple questions about existing analyses, just answer directly — no tool needed.

Format all responses in clean Markdown. Use bold, bullet points, and tables where appropriate.`;


interface ChatMessage {
    role: "user" | "model";
    text: string;
}

interface ChatRequestBody {
    message: string;
    history: ChatMessage[];
    context: string;
    portfolio: PortfolioItem[];
    analyses: EquityAnalysis[];
}

async function executeTool(
    name: string,
    args: any,
    portfolio: PortfolioItem[],
    existingAnalyses: EquityAnalysis[]
): Promise<{ result: string; usage?: { tokens: number; cost: number } }> {

    if (name === "get_stock_price") {
        try {
            const YahooFinance = (await import("yahoo-finance2")).default;
            const yahooFinance = new YahooFinance();
            const quote: any = await yahooFinance.quoteSummary(args.ticker, {
                modules: ["price", "summaryDetail"],
            });
            const data = {
                ticker: args.ticker,
                price: quote.price?.regularMarketPrice,
                currency: quote.price?.currency,
                marketCap: quote.price?.marketCap,
                peRatio: quote.summaryDetail?.trailingPE,
                fiftyTwoWeekHigh: quote.summaryDetail?.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: quote.summaryDetail?.fiftyTwoWeekLow,
            };
            return { result: JSON.stringify(data, null, 2) };
        } catch (e: any) {
            return { result: `Error: Failed to fetch price for ${args.ticker}: ${e.message}` };
        }
    }

    if (name === "run_equity_analysis") {
        try {
            const analysis = await analyzeEquity(args.ticker, false);
            const summary = [
                `# Equity Analysis: ${analysis.ticker}`,
                `**Sentiment:** ${analysis.sentiment}`,
                `**CAGR:** ${analysis.cagr}`,
                '',
                '## Fundamental Analysis',
                analysis.summary,
                '',
                analysis.sevenPowers ? `## 7 Powers Strategic Analysis\n${analysis.sevenPowers}` : '',
            ].join('\n');
            return { result: summary, usage: analysis.usage };
        } catch (e: any) {
            return { result: `Error: Failed to analyze ${args.ticker}: ${e.message}` };
        }
    }

    if (name === "run_seven_powers_analysis") {
        try {
            const result = await analyzeSevenPowers(args.ticker, args.companyName || args.ticker, false);
            return {
                result: `# 7 Powers Analysis: ${args.ticker}\n\n${result.text}`,
                usage: result.usage,
            };
        } catch (e: any) {
            return { result: `Error: Failed to run 7 Powers for ${args.ticker}: ${e.message}` };
        }
    }

    if (name === "run_portfolio_decision") {
        try {
            const targetAnalysis = existingAnalyses.find((a) => a.ticker === args.targetTicker);
            if (!targetAnalysis) {
                return {
                    result: `Error: No analysis found for ${args.targetTicker}. Run run_equity_analysis on it first.`,
                };
            }
            const portfolioAnalyses = existingAnalyses.filter((a) => a.ticker !== args.targetTicker);
            const decision = await makeComplexityDecision(targetAnalysis, portfolioAnalyses, portfolio);
            const summary = [
                `# Portfolio Decision: ${args.targetTicker}`,
                `**Decision:** ${decision.decision}`,
                `**Classification:** ${decision.analysis.classification}`,
                `**S-Curve Status:** ${decision.analysis.s_curve_status}`,
                `**NZS Score:** ${decision.analysis.nzs_score}`,
                '',
                '## Action Details',
                `- **Target Allocation:** ${decision.action_details.target_allocation}`,
                `- **Weighting:** ${decision.action_details.weighting_assessment}`,
                `- **Funding Source:** ${decision.action_details.funding_source}`,
                `- **Reasoning:** ${decision.action_details.reasoning}`,
            ].join('\n');
            return { result: summary, usage: decision.usage };
        } catch (e: any) {
            return { result: `Error: PM decision failed for ${args.targetTicker}: ${e.message}` };
        }
    }

    if (name === "get_cached_analysis") {
        try {
            const ticker = (args.ticker || "").toUpperCase();
            const { blobs } = await list({ prefix: `equity-cache/${ticker}/fundamental/` });
            if (blobs.length === 0) {
                return { result: `No cached analysis found for ${ticker}. You may need to run a fresh analysis using run_equity_analysis.` };
            }
            // Fetch the cached blob
            const response = await fetch(blobs[0].url);
            if (!response.ok) {
                return { result: `Failed to retrieve cached analysis for ${ticker}.` };
            }
            const cached = await response.json();
            const analysis = cached.data;
            const cachedDate = cached.createdAt ? new Date(cached.createdAt).toLocaleDateString() : 'unknown date';
            const summary = [
                `# Cached Analysis: ${analysis.ticker} (from ${cachedDate})`,
                `**Sentiment:** ${analysis.sentiment}`,
                `**CAGR:** ${analysis.cagr}`,
                '',
                '## Fundamental Analysis',
                analysis.summary,
                '',
                analysis.sevenPowers ? `## 7 Powers Strategic Analysis\n${analysis.sevenPowers}` : '',
            ].join('\n');
            return { result: summary };
        } catch (e: any) {
            return { result: `Error retrieving cached analysis for ${args.ticker}: ${e.message}` };
        }
    }

    return { result: `Error: Unknown tool "${name}"` };
}

export async function POST(req: NextRequest) {
    try {
        const body: ChatRequestBody = await req.json();
        const { message, history, context, portfolio = [], analyses = [] } = body;

        if (!message || !context) {
            return new Response(JSON.stringify({ error: "Missing message or context" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: "AI_GATEWAY_API_KEY or GEMINI_API_KEY not configured" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        const fullSystemInstruction = `${SYSTEM_INSTRUCTION}

--- BEGIN ANALYSIS CONTEXT ---
${context}
--- END ANALYSIS CONTEXT ---`;

        // Build chat history
        const currentMessages: any[] = [
            { role: "system", content: fullSystemInstruction },
            ...history.map((msg) => ({
                role: msg.role === "model" ? "assistant" : "user",
                content: msg.text,
            })),
            { role: "user", content: message }
        ];

        const encoder = new TextEncoder();
        let cumulativeUsage = { tokens: 0, cost: 0 };

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send the user message via generateText
                    let result = await generateText({
                        model: aiClient(CHAT_MODEL),
                        messages: currentMessages,
                        tools: {
                            perplexity_search: gateway.tools.perplexitySearch({
                                maxResults: 10,
                            }),
                        },
                    });

                    let responseText = result.text;
                    let chatUsage = calculateUsage(CHAT_MODEL, result.usage);
                    cumulativeUsage.tokens += chatUsage.tokens;
                    cumulativeUsage.cost += chatUsage.cost;

                    // Check for tool marker in the response
                    let toolMatch = responseText.match(TOOL_MARKER_REGEX);
                    let loops = 0;

                    while (toolMatch && loops < 3) {
                        loops++;
                        const toolName = toolMatch[1];
                        let toolArgs: any = {};
                        try {
                            toolArgs = JSON.parse(toolMatch[2]);
                        } catch {
                            // If JSON parsing fails, try to extract ticker from raw text
                            const tickerMatch = toolMatch[2].match(/ticker['":\s]+['"]?(\w+)/i);
                            if (tickerMatch) toolArgs = { ticker: tickerMatch[1] };
                        }

                        // Emit the text before the marker (the model's message to the user)
                        const preToolText = responseText.substring(0, toolMatch.index).trim();
                        if (preToolText) {
                            controller.enqueue(encoder.encode(preToolText + '\n\n'));
                        }

                        // Emit tool start marker
                        const ticker = toolArgs.ticker || toolArgs.targetTicker || '';
                        controller.enqueue(encoder.encode(
                            `<!--TOOL_START:${JSON.stringify({ name: toolName, args: toolArgs })}-->\n`
                        ));

                        // Execute the tool
                        const toolResult = await executeTool(toolName, toolArgs, portfolio, analyses);

                        if (toolResult.usage) {
                            cumulativeUsage.tokens += toolResult.usage.tokens;
                            cumulativeUsage.cost += toolResult.usage.cost;
                        }

                        // Emit tool done marker
                        controller.enqueue(encoder.encode(
                            `<!--TOOL_DONE:${JSON.stringify({ name: toolName, ticker, cost: toolResult.usage?.cost || 0 })}-->\n`
                        ));

                        // Append response and tool output to history
                        currentMessages.push({ role: "assistant", content: responseText });
                        
                        const toolResponsePrompt = `The tool "${toolName}" has completed. Here are the results:\n\n${toolResult.result}\n\nPlease now provide a comprehensive response to the user based on these results. Do NOT call another tool unless absolutely necessary for a different analysis.`;
                        currentMessages.push({ role: "user", content: toolResponsePrompt });

                        result = await generateText({
                            model: aiClient(CHAT_MODEL),
                            messages: currentMessages,
                            tools: {
                                perplexity_search: gateway.tools.perplexitySearch({
                                    maxResults: 10,
                                }),
                            },
                        });

                        responseText = result.text;
                        chatUsage = calculateUsage(CHAT_MODEL, result.usage);
                        cumulativeUsage.tokens += chatUsage.tokens;
                        cumulativeUsage.cost += chatUsage.cost;

                        // Check for another tool call
                        toolMatch = responseText.match(TOOL_MARKER_REGEX);
                    }

                    // Emit the final response text (stripped of any remaining markers)
                    const finalText = responseText.replace(TOOL_MARKER_REGEX, '').trim();
                    if (finalText) {
                        controller.enqueue(encoder.encode(finalText));
                    }

                    // Emit usage
                    controller.enqueue(encoder.encode(
                        `\n<!--USAGE:${JSON.stringify(cumulativeUsage)}-->`
                    ));

                    controller.close();
                } catch (err: any) {
                    console.error("[agent-chat] Error:", err);
                    controller.enqueue(encoder.encode(`\n\n⚠️ Error: ${err.message}`));
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

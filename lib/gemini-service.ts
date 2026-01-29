import { GoogleGenerativeAI, SchemaType, GenerateContentResponse, GenerateContentResult, Part } from "@google/generative-ai";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
import { FUNDAMENTAL_ANALYST_PROMPT, HAMILTON_HELMER_PROMPT, COMPLEXITY_PM_PROMPT } from './agents/prompts';
import { getCache, putCache } from './blob-cache';

// Types definition (ported from source)
export interface PortfolioItem {
    symbol: string;
    name: string;
    shares: number;
    value: number;
    currency: string;
}

export interface EquityAnalysis {
    ticker: string;
    summary: string;
    sentiment: 'Bullish' | 'Bearish' | 'Neutral';
    cagr?: string;
    sevenPowers?: string;
    sources: { uri: string; title: string }[];
    timestamp: number;
    isTarget: boolean;
    usage?: { tokens: number; cost: number };
    subRuns?: { summary: string; sevenPowers?: string; usage: { tokens: number; cost: number } }[];
}

export interface ComplexityDecision {
    analysis: {
        classification: string;
        s_curve_status: string;
        nzs_score: string;
        narrow_prediction_risk: string;
    };
    decision: "BUY" | "SELL" | "HOLD";
    action_details: {
        target_allocation: string;
        weighting_assessment: string;
        funding_source: string;
        reasoning: string;
    };
    usage?: { tokens: number; cost: number };
    subRuns?: { decision: string; reasoning: string; usage: { tokens: number; cost: number } }[];
}

/**
 * JSON Schemas for Agent Outputs
 */
const FUNDAMENTAL_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        companyName: { type: SchemaType.STRING },
        ticker: { type: SchemaType.STRING },
        currentPrice: { type: SchemaType.STRING },
        rating: { type: SchemaType.STRING },
        cagr: { type: SchemaType.STRING },
        oneLiner: { type: SchemaType.STRING },
        pillars: {
            type: SchemaType.OBJECT,
            properties: {
                moat: { type: SchemaType.STRING },
                operatingLeverage: { type: SchemaType.STRING },
                organicGrowth: { type: SchemaType.STRING },
                capitalLight: { type: SchemaType.STRING },
                predictability: { type: SchemaType.STRING },
                management: { type: SchemaType.STRING }
            },
            required: ['moat', 'operatingLeverage', 'organicGrowth', 'capitalLight', 'predictability', 'management']
        },
        financials: {
            type: SchemaType.OBJECT,
            properties: {
                growth: { type: SchemaType.STRING },
                health: { type: SchemaType.STRING },
                profitability: { type: SchemaType.STRING }
            },
            required: ['growth', 'health', 'profitability']
        },
        valuation: {
            type: SchemaType.OBJECT,
            properties: {
                current: { type: SchemaType.STRING },
                bullCase: { type: SchemaType.STRING },
                bearCase: { type: SchemaType.STRING },
                baseCase: {
                    type: SchemaType.OBJECT,
                    properties: {
                        revenueGrowth: { type: SchemaType.STRING },
                        netMargin: { type: SchemaType.STRING },
                        exitMultiple: { type: SchemaType.STRING },
                        shareCountReduction: { type: SchemaType.STRING },
                        futureSharePrice: { type: SchemaType.STRING },
                        cagrCalculation: { type: SchemaType.STRING }
                    },
                    required: ['revenueGrowth', 'netMargin', 'exitMultiple', 'shareCountReduction', 'futureSharePrice', 'cagrCalculation']
                }
            },
            required: ['current', 'bullCase', 'bearCase', 'baseCase']
        },
        risks: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
        },
        conclusion: { type: SchemaType.STRING }
    },
    required: ['companyName', 'ticker', 'currentPrice', 'rating', 'cagr', 'oneLiner', 'pillars', 'financials', 'valuation', 'risks', 'conclusion']
};

const COMPLEXITY_DECISION_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        analysis: {
            type: SchemaType.OBJECT,
            properties: {
                classification: { type: SchemaType.STRING },
                s_curve_status: { type: SchemaType.STRING },
                nzs_score: { type: SchemaType.STRING },
                narrow_prediction_risk: { type: SchemaType.STRING }
            },
            required: ['classification', 's_curve_status', 'nzs_score', 'narrow_prediction_risk']
        },
        decision: {
            type: SchemaType.STRING,
            enum: ['BUY', 'SELL', 'HOLD'],
            format: 'enum'
        },
        action_details: {
            type: SchemaType.OBJECT,
            properties: {
                target_allocation: { type: SchemaType.STRING },
                weighting_assessment: { type: SchemaType.STRING },
                funding_source: { type: SchemaType.STRING },
                reasoning: { type: SchemaType.STRING }
            },
            required: ['target_allocation', 'weighting_assessment', 'funding_source', 'reasoning']
        }
    },
    required: ['analysis', 'decision', 'action_details']
};


// Configuration
const ANALYSIS_MODEL = 'gemini-3-flash-preview';
const DECISION_MODEL = 'gemini-3-pro-preview';

// Initialize Gemini Client
// WARNING: Ensure GEMINI_API_KEY is in your .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');


// Pricing (USD per 1M tokens) - Gemini 2.0 Flash / 1.5 Flash
// Input: $0.075 / 1M, Output: $0.30 / 1M (for prompts < 128k)

// Cast to any to avoid strict Schema validation recursion issues in TS
// Cast to any to avoid strict Schema validation recursion issues in TS
const SEARCH_TOOLS: any[] = [
    { googleSearch: {} }
];

const FUNCTION_TOOLS: any[] = [
    {
        functionDeclarations: [
            {
                name: "get_stock_price",
                description: "Get the real-time stock price and basic market data for a given ticker or symbol.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        ticker: {
                            type: SchemaType.STRING,
                            description: "The stock ticker symbol (e.g., AAPL, TSLA, BTC-USD)",
                        },
                    },
                    required: ["ticker"],
                },
            },
            {
                name: "get_portfolio_allocation",
                description: "Get the current portfolio allocation, total value, and list of holdings.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        dummy: { type: SchemaType.STRING, description: "Unused parameter to satisfy schema" }
                    },
                },
            },
        ],
    },
];

/**
 * TOOL EXECUTOR
 */
async function executeFinancialTools(name: string, args: any, currentPortfolio: PortfolioItem[] = [], portfolioScan: EquityAnalysis[] = []) {
    if (name === "get_stock_price") {
        try {
            const quote: any = await yahooFinance.quoteSummary(args.ticker, { modules: ['price', 'summaryDetail'] });
            return {
                ticker: args.ticker,
                price: quote.price?.regularMarketPrice,
                currency: quote.price?.currency,
                marketCap: quote.price?.marketCap,
                peRatio: quote.summaryDetail?.trailingPE,
                fiftyTwoWeekHigh: quote.summaryDetail?.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: quote.summaryDetail?.fiftyTwoWeekLow
            };
        } catch (e: any) {
            console.error("Yahoo Finance Error:", e);
            return { error: `Failed to fetch price for ${args.ticker}: ${e.message}` };
        }
    }

    if (name === "get_portfolio_allocation") {
        const totalValue = currentPortfolio.reduce((sum, item) => sum + item.value, 0);
        return {
            totalValue,
            holdings: currentPortfolio.map(item => ({
                symbol: item.symbol,
                value: item.value,
                allocation: totalValue > 0 ? (item.value / totalValue * 100).toFixed(2) + '%' : '0%'
            }))
        };
    }

    return { error: "Unknown tool" };
}

/**
 * Tool Aware Generator
 * Handles the multi-turn loop for function calling
 */
async function generateWithTools<T>(
    model: any,
    prompt: string,
    systemInstruction: string,
    toolConfig: any[],
    responseSchema?: any,
    currentPortfolio: PortfolioItem[] = [],
    portfolioScan: EquityAnalysis[] = []
): Promise<{ data: T, usage: { tokens: number, cost: number } }> {
    let chat = model.startChat({
        systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
        tools: toolConfig,
        generationConfig: responseSchema ? { responseMimeType: "application/json", responseSchema: responseSchema } : undefined
    });

    let result = await withRetry<GenerateContentResult>(() => chat.sendMessage(prompt));
    let functionCalls = result.response.functionCalls();

    // Limits loop to 5 turns to prevent infinite loops
    let loops = 0;
    while (functionCalls && functionCalls.length > 0 && loops < 5) {
        loops++;
        const parts: Part[] = [];
        for (const call of functionCalls) {
            const toolResult = await executeFinancialTools(call.name, call.args, currentPortfolio, portfolioScan);
            parts.push({
                functionResponse: {
                    name: call.name,
                    response: { result: toolResult }
                }
            });
        }
        result = await withRetry<GenerateContentResult>(() => chat.sendMessage(parts));
        functionCalls = result.response.functionCalls();
    }

    // Final Generation enforced JSON
    // If the last response was free-text (after tools), we might need to coerce it to JSON if it's not.
    // However, Gemini usually adheres to schema if provided in generationConfig even during chat.
    // But startChat doesn't support responseSchema in all SDK versions effectively on the final turn if mixed.
    // Strategy: Take the chat history and make a final "conversion" call if strictly needed,
    // OR just trust the model if we pass generationConfig to sendMessage.
    // Let's try passing the schema to the initial startChat or the final sendMessage? 
    // The SDK allows generationConfig in startChat.

    // Re-instantiate chat with schema for final output if needed, or simply parse.
    // Issue: Function calling mode often fights with JSON mode.
    // Best practice: Let the loop finish. Then ask for the final JSON.

    // Let's optimize: We passed the schema? No, we didn't pass schema to startChat yet.
    // Let's try to ask for JSON in the final turn.

    // Actually, simple valid JSON enforcement:
    // Actually, simple valid JSON enforcement:
    const text = result.response.text();
    try {
        const json = JSON.parse(text);
        return {
            data: json as T,
            usage: calculateUsage(model.model, result.response.usageMetadata)
        };
    } catch (e) {
        // Fallback: If JSON parse fails, ask specifically for JSON
        console.warn(`[Gemini] JSON parse failed, retrying with correction prompt...`);
        const finalResult = await withRetry<GenerateContentResult>(() => chat.sendMessage(
            "You returned invalid JSON. Please fix it and output strictly valid JSON matching the schema."
        ));
        try {
            return {
                data: JSON.parse(finalResult.response.text()) as T,
                usage: calculateUsage(model.model, finalResult.response.usageMetadata)
            };
        } catch (finalError) {
            console.error(`[Gemini] Critical JSON failure after retry: ${finalError}`);
            throw new Error("Failed to parse Gemini response as JSON even after retry.");
        }
    }
}

/**
 * Robust retry helper for API instability
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        const isOverloaded = error.message?.includes('503') || error.message?.includes('overloaded');
        if (isOverloaded && retries > 0) {
            console.log(`[Gemini] Model overloaded. Retrying in ${delay}ms... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

const calculateUsage = (modelName: string, usage: any) => {
    if (!usage) return { tokens: 0, cost: 0 };

    const tokenCount = usage.promptTokenCount;
    const isPro = modelName.includes('pro');

    let inputRate = 0;
    let outputRate = 0;

    if (isPro) {
        if (tokenCount <= 200_000) {
            inputRate = 2.00;
            outputRate = 12.00;
        } else {
            inputRate = 4.00;
            outputRate = 18.00;
        }
    } else {
        inputRate = 0.50; // Gemini 3 Flash rates
        outputRate = 3.00;
    }

    const inputCost = (usage.promptTokenCount / 1_000_000) * inputRate;
    const outputCost = (usage.candidatesTokenCount / 1_000_000) * outputRate;
    const totalCost = inputCost + outputCost;

    return {
        tokens: usage.totalTokenCount,
        cost: totalCost
    };
};

/**
 * Agent 1: Fundamental Analyst
 */
export const analyzeEquity = async (ticker: string, isTarget: boolean = false): Promise<EquityAnalysis> => {
    // Basic API Key validation
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY in your .env.local");
    }

    // 0. CHECK BLOB CACHE (24 Hours, persistent across devices)
    const cached = await getCache<EquityAnalysis>(ticker, 'fundamental');

    if (cached) {
        console.log(`[BlobCache] Hit for fundamental/${ticker}`);

        // Check if 7 Powers is missing or empty (backfill for old cache entries)
        if (!cached.sevenPowers || cached.sevenPowers.trim().length === 0) {
            console.log(`[BlobCache] Backfilling 7 Powers for ${ticker}...`);
            const spResult = await analyzeSevenPowers(ticker, ticker, isTarget);

            if (spResult.text) {
                console.log(`[BlobCache] Backfill successful for ${ticker}. Length: ${spResult.text.length}`);
                cached.sevenPowers = spResult.text;

                // Update cache with new complete record
                await putCache(ticker, 'fundamental', cached);

                return {
                    ...cached,
                    usage: spResult.usage, // Charge for the backfill run
                };
            } else {
                console.warn(`[BlobCache] Backfill failed (empty result) for ${ticker}`);
            }
        }

        // Zero out cost so the UI doesn't add stale costs to the session total
        const zeroUsage = { tokens: 0, cost: 0 };
        return {
            ...cached,
            usage: zeroUsage,
            subRuns: cached.subRuns?.map(r => ({ ...r, usage: zeroUsage }))
        };
    }

    const model = genAI.getGenerativeModel({ model: ANALYSIS_MODEL }, { apiVersion: 'v1beta' });

    // 1. Pre-fetch Live Data (Code-side)
    const priceData = await executeFinancialTools('get_stock_price', { ticker });

    const systemInstruction = FUNDAMENTAL_ANALYST_PROMPT.replace('__TICKER_SYMBOL__', ticker);
    const taskPrompt = `Today's Date: ${new Date().toISOString().split('T')[0]}
Perform a high-fidelity fundamental analysis for strictly: ${ticker}.

*** PROVIDED LIVE MARKET DATA (DO NOT SEARCH FOR THIS) ***
${JSON.stringify(priceData, null, 2)}
********************************************************

INSTRUCTIONS:
1. Use the PROVIDED LIVE DATA above for all price, market cap, and PE metrics.
2. OUTSIDE of these numbers, you MUST use Google Search for 10-K, Revenues, and qualitative research.
Output strictly valid JSON.`;

    // 2. Use Model -> ONLY SEARCH TOOLS (No collision)
    const result = await withRetry(() => model.generateContent({
        contents: [{ role: 'user', parts: [{ text: taskPrompt }] }],
        systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
        tools: SEARCH_TOOLS,
        generationConfig: { responseMimeType: "application/json", responseSchema: FUNDAMENTAL_SCHEMA as any }
    }));

    let responseText = "";
    try {
        responseText = result.response.text();
    } catch (e: any) {
        console.error("Gemini text() retrieval failed:", e);
        console.log("Full Response:", JSON.stringify(result.response, null, 2));
        throw new Error(`Gemini response error: ${e.message}`);
    }

    if (!responseText) {
        console.error("Gemini returned empty text. Full Response:", JSON.stringify(result.response, null, 2));
        // Retry logic for empty text could be here, but usually indicates a filter block
        throw new Error("Gemini returned empty text response (likely safety filter).");
    }

    let parsedData;
    try {
        parsedData = JSON.parse(responseText);
    } catch (e: any) {
        console.error("JSON Parse Error:", e);
        // Simple cleanup fallback
        const cleanText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        try {
            parsedData = JSON.parse(cleanText);
        } catch (e2) {
            throw new Error(`Failed to parse Gemini response as JSON: ${e.message}`);
        }
    }

    const usage = calculateUsage(ANALYSIS_MODEL, result.response.usageMetadata);
    const formattedText = renderAnalysisMarkdown(parsedData);
    const cagr = parsedData.cagr || parsedData.valuation?.baseCase?.cagrCalculation || 'N/A';

    // Determine sentiment
    let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
    const textLower = formattedText.toLowerCase();
    if (textLower.includes('strong buy') || textLower.includes('**buy**')) sentiment = 'Bullish';
    else if (textLower.includes('**sell**')) sentiment = 'Bearish';
    else if (textLower.includes('**hold**')) sentiment = 'Neutral';

    // Step 2: Strategic Analysis (7 Powers)
    console.log(`[Analysis] Starting 7 Powers for ${ticker}...`);
    const spResult = await analyzeSevenPowers(ticker, ticker, isTarget);
    console.log(`[Analysis] 7 Powers Size for ${ticker}: ${spResult.text.length} chars`);

    const totalUsage = {
        tokens: usage.tokens + spResult.usage.tokens,
        cost: usage.cost + spResult.usage.cost
    };

    const finalAnalysis: EquityAnalysis = {
        ticker,
        summary: formattedText,
        sentiment,
        cagr: cagr.toString().replace('%', '') + '%',
        sevenPowers: spResult.text,
        sources: [], // Sources tracking could be added if needed from metadata
        timestamp: Date.now(),
        isTarget,
        usage: totalUsage
    };

    // CACHE RESULT (24 Hours) in Vercel Blob
    await putCache(ticker, 'fundamental', finalAnalysis);

    return finalAnalysis;
};

/**
 * Agent 2: Strategic Analyst (Hamilton Helmer / 7 Powers)
 */
export const analyzeSevenPowers = async (ticker: string, companyName: string, isTarget: boolean = false): Promise<{ text: string, usage: { tokens: number, cost: number } }> => {
    // 0. CHECK BLOB CACHE (24 Hours, persistent across devices)
    const cached = await getCache<{ text: string, usage: { tokens: number, cost: number } }>(ticker, 'sevenPowers');
    if (cached) {
        console.log(`[BlobCache] Hit for sevenPowers/${ticker}`);
        // Zero out cost for cached results
        return {
            text: cached.text,
            usage: { tokens: 0, cost: 0 }
        };
    }

    const model = genAI.getGenerativeModel({ model: ANALYSIS_MODEL }, { apiVersion: 'v1beta' });

    // 1. Pre-fetch Live Data
    const priceData = await executeFinancialTools('get_stock_price', { ticker });

    const systemInstruction = HAMILTON_HELMER_PROMPT
        .replace('{{TICKER}}', ticker)
        .replace('{{COMPANY_NAME}}', companyName);

    const taskPrompt = `Today's Date: ${new Date().toISOString().split('T')[0]}
Conduct a forensic strategic analysis of ${companyName} (${ticker}) using the 7 Powers framework.

*** PROVIDED LIVE MARKET DATA ***
${JSON.stringify(priceData, null, 2)}
*********************************

1. Use the provided market cap data.
2. Use Google Search to find "Financial Proxies" (Margins, Churn).
Output a structured Markdown report.`;

    // 2. Use Model -> ONLY SEARCH TOOLS
    const result = await withRetry(() => model.generateContent({
        contents: [{ role: 'user', parts: [{ text: taskPrompt }] }],
        systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
        tools: SEARCH_TOOLS
    }));

    let responseText = "";
    try {
        responseText = result.response.text();
    } catch (e: any) {
        console.error("7 Powers Core Analysis text() failed:", e);
        responseText = "An internal error occurred while generating this report segment.";
    }

    if (!responseText) {
        responseText = "The model returned an empty response for this segment.";
    }

    const analysisResult = {
        text: responseText,
        usage: calculateUsage(ANALYSIS_MODEL, result.response.usageMetadata)
    };

    // CACHE RESULT (24 Hours) in Vercel Blob
    await putCache(ticker, 'sevenPowers', analysisResult);

    return analysisResult;
};

/**
};

/**
 * Agent 4: Complexity Portfolio Manager
 */
export const makeComplexityDecision = async (
    targetAnalysis: EquityAnalysis,
    portfolioScan: EquityAnalysis[],
    currentPortfolio: PortfolioItem[]
): Promise<ComplexityDecision> => {
    const model = genAI.getGenerativeModel({
        model: DECISION_MODEL,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: COMPLEXITY_DECISION_SCHEMA as any
        },
    }, { apiVersion: 'v1beta' });

    // 1. Pre-fetch Portfolio Allocation
    const allocationData = await executeFinancialTools('get_portfolio_allocation', {}, currentPortfolio);

    const totalPortfolioValue = currentPortfolio.reduce((sum, item) => sum + item.value, 0);
    const portfolioContext = currentPortfolio.map((item) => {
        const allocation = totalPortfolioValue > 0 ? ((item.value / totalPortfolioValue) * 100).toFixed(1) : "0.0";
        const analysis = portfolioScan.find(a => a.ticker === item.symbol);
        return `### HOLDING: ${item.name} (${item.symbol})\nShares: ${item.shares}\nValue: ${item.value.toLocaleString()} USD (${allocation}%)\n\n#### FUNDAMENTAL REPORT:\n${analysis?.summary || 'N/A'}\n\n#### STRATEGIC REPORT (7 POWERS):\n${analysis?.sevenPowers || 'N/A'}`;
    }).join("\n\n---\n\n");

    const existingHolding = currentPortfolio.find(p => p.symbol === targetAnalysis.ticker);
    const existingHoldingAllocation = existingHolding && totalPortfolioValue > 0 ? ((existingHolding.value / totalPortfolioValue) * 100).toFixed(1) : "0.0";
    const existingHoldingContext = existingHolding
        ? `\n*** ATTENTION: ${targetAnalysis.ticker} IS ALREADY IN THE PORTFOLIO ***\nCurrent Holding: ${existingHolding.shares} shares. Value: ${existingHolding.value.toLocaleString()} USD (${existingHoldingAllocation}%).\nEvaluate if this position should be INCREASED, DECREASED, or MAINTAINED based on its classification.`
        : "";

    const userPrompt = `Today's Date: ${new Date().toISOString().split('T')[0]}
COMPLEXITY INVESTING DECISION SESSION: ${targetAnalysis.ticker}
${existingHoldingContext}

*** PROVIDED LIVE PORTFOLIO STATUS ***
${JSON.stringify(allocationData, null, 2)}
**************************************

TARGET RESEARCH REPORTS:
${targetAnalysis.summary}

STRATEGIC ANALYSIS:
${targetAnalysis.sevenPowers}

---
FULL PORTFOLIO CONTEXT (${currentPortfolio.length} Holdings):
${portfolioContext}

FINAL TASK:
Apply the Complexity Investing framework to decide on ${targetAnalysis.ticker}. Return the required JSON object.`;

    // 2. Use Model -> ONLY SEARCH TOOLS
    const result = await withRetry(() => model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { role: 'system', parts: [{ text: COMPLEXITY_PM_PROMPT }] },
        tools: SEARCH_TOOLS,
        generationConfig: { responseMimeType: "application/json", responseSchema: COMPLEXITY_DECISION_SCHEMA as any }
    }));

    return {
        ...JSON.parse(result.response.text()),
        usage: calculateUsage(DECISION_MODEL, result.response.usageMetadata)
    };
};

/**
 * Formatter Script: Deterministic Markdown Generation
 */
const renderAnalysisMarkdown = (data: any): string => {
    return `# ${data.companyName || 'Unknown Company'} (${data.ticker || 'N/A'})
## Executive Summary
**Current Price:** ${data.currentPrice || 'N/A'}
**Rating:** ${data.rating || 'N/A'}
**Expected 10-Year CAGR:** ${data.cagr || 'N/A'}%

**Thesis:** ${data.oneLiner || 'N/A'}

---

## Business Quality & Moat (6 Pillars)
* **Wide Moat:** ${data.pillars?.moat || 'N/A'}
* **Operating Leverage:** ${data.pillars?.operatingLeverage || 'N/A'}
* **Organic Growth:** ${data.pillars?.organicGrowth || 'N/A'}
* **Capital Light:** ${data.pillars?.capitalLight || 'N/A'}
* **Predictability:** ${data.pillars?.predictability || 'N/A'}
* **Smart Management:** ${data.pillars?.management || 'N/A'}

---

## Financial Deep Dive
* **Growth:** ${data.financials?.growth || 'N/A'}
* **Health:** ${data.financials?.health || 'N/A'}
* **Profitability:** ${data.financials?.profitability || 'N/A'}

---

## Valuation & Return Scenarios
**Current Valuation:**
${data.valuation?.current || 'N/A'}

### Scenarios
* **Bull Case:** ${data.valuation?.bullCase || 'N/A'}
* **Bear Case:** ${data.valuation?.bearCase || 'N/A'}

### Base Case Return Model (10-Year View)
* **Assumed Revenue Growth:** ${data.valuation?.baseCase?.revenueGrowth || 'N/A'}
* **Assumed Net Margin:** ${data.valuation?.baseCase?.netMargin || 'N/A'}
* **Assumed Exit Multiple:** ${data.valuation?.baseCase?.exitMultiple || 'N/A'}
* **Share Count Reduction:** ${data.valuation?.baseCase?.shareCountReduction || 'N/A'}
* **Resulting Share Price:** ${data.valuation?.baseCase?.futureSharePrice || 'N/A'}
* **Expected CAGR:** ${data.valuation?.baseCase?.cagrCalculation || 'N/A'}

---

## Key Risks
* ${data.risks?.[0] || 'N/A'}
* ${data.risks?.[1] || 'N/A'}
* ${data.risks?.[2] || 'N/A'}

---

## Conclusion
${data.conclusion || 'N/A'}
`;
}


import { generateText, tool, Output } from "ai";
import type { GatewayProviderOptions } from '@ai-sdk/gateway';
import { google } from "@ai-sdk/google";
import { z } from "zod";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
import { FUNDAMENTAL_ANALYST_PROMPT, HAMILTON_HELMER_PROMPT, COMPLEXITY_PM_PROMPT } from './agents/prompts';
import cacheManager, { CacheKey } from './cache-manager';

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
 * Zod Schemas for Structured Outputs
 */
const FUNDAMENTAL_SCHEMA = z.object({
    companyName: z.string(),
    ticker: z.string(),
    currentPrice: z.string(),
    rating: z.string(),
    cagr: z.string(),
    oneLiner: z.string(),
    pillars: z.object({
        moat: z.string(),
        operatingLeverage: z.string(),
        organicGrowth: z.string(),
        capitalLight: z.string(),
        predictability: z.string(),
        management: z.string()
    }),
    financials: z.object({
        growth: z.string(),
        health: z.string(),
        profitability: z.string()
    }),
    valuation: z.object({
        current: z.string(),
        bullCase: z.string(),
        bearCase: z.string(),
        baseCase: z.object({
            revenueGrowth: z.string(),
            netMargin: z.string(),
            exitMultiple: z.string(),
            shareCountReduction: z.string(),
            futureSharePrice: z.string(),
            cagrCalculation: z.string()
        })
    }),
    risks: z.array(z.string()),
    conclusion: z.string()
});

const COMPLEXITY_DECISION_SCHEMA = z.object({
    analysis: z.object({
        classification: z.string(),
        s_curve_status: z.string(),
        nzs_score: z.string(),
        narrow_prediction_risk: z.string()
    }),
    decision: z.enum(['BUY', 'SELL', 'HOLD']),
    action_details: z.object({
        target_allocation: z.string(),
        weighting_assessment: z.string(),
        funding_source: z.string(),
        reasoning: z.string()
    })
});

// Configuration - Vercel AI Gateway model strings with Google Search grounding
const ANALYSIS_MODEL = 'google/gemini-3-flash';
const DECISION_MODEL = 'google/gemini-3-pro-preview';

// Pricing (USD per 1M tokens)
const calculateUsage = (modelName: string, usage: any) => {
    if (!usage) return { tokens: 0, cost: 0 };

    const tokenCount = usage.promptTokens || 0;
    const completionTokens = usage.completionTokens || 0;
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
        inputRate = 0.50; // Flash rates
        outputRate = 3.00;
    }

    const inputCost = (tokenCount / 1_000_000) * inputRate;
    const outputCost = (completionTokens / 1_000_000) * outputRate;
    const totalCost = inputCost + outputCost;

    return {
        tokens: tokenCount + completionTokens,
        cost: totalCost
    };
};

/**
 * Tool Definitions for Vercel AI SDK
 */
const getStockPriceTool = tool({
    description: "Get the real-time stock price and basic market data for a given ticker or symbol.",
    parameters: z.object({
        ticker: z.string().describe("The stock ticker symbol (e.g., AAPL, TSLA, BTC-USD)")
    }),
    execute: async ({ ticker }) => {
        try {
            const quote: any = await yahooFinance.quoteSummary(ticker, { modules: ['price', 'summaryDetail'] });
            return {
                ticker,
                price: quote.price?.regularMarketPrice,
                currency: quote.price?.currency,
                marketCap: quote.price?.marketCap,
                peRatio: quote.summaryDetail?.trailingPE,
                fiftyTwoWeekHigh: quote.summaryDetail?.fiftyTwoWeekHigh,
                fiftyTwoWeekLow: quote.summaryDetail?.fiftyTwoWeekLow
            };
        } catch (e: any) {
            console.error("Yahoo Finance Error:", e);
            return { error: `Failed to fetch price for ${ticker}: ${e.message}` };
        }
    }
});

const createPortfolioAllocationTool = (currentPortfolio: PortfolioItem[]) => tool({
    description: "Get the current portfolio allocation, total value, and list of holdings.",
    parameters: z.object({}),
    execute: async () => {
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
});

/**
 * Helper: Pre-fetch stock data (for flows that don't use tools)
 */
async function fetchStockData(ticker: string) {
    try {
        const quote: any = await yahooFinance.quoteSummary(ticker, { modules: ['price', 'summaryDetail'] });
        return {
            ticker,
            price: quote.price?.regularMarketPrice,
            currency: quote.price?.currency,
            marketCap: quote.price?.marketCap,
            peRatio: quote.summaryDetail?.trailingPE,
            fiftyTwoWeekHigh: quote.summaryDetail?.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.summaryDetail?.fiftyTwoWeekLow
        };
    } catch (e: any) {
        console.error("Yahoo Finance Error:", e);
        return { error: `Failed to fetch price for ${ticker}: ${e.message}` };
    }
}

/**
 * Agent 1: Fundamental Analyst
 */
export const analyzeEquity = async (ticker: string, isTarget: boolean = false): Promise<EquityAnalysis> => {
    // Basic API Key validation
    if (!process.env.AI_GATEWAY_API_KEY) {
        throw new Error("AI Gateway API Key is missing. Please set AI_GATEWAY_API_KEY in your environment.");
    }

    // 0. CHECK CACHE (24 Hours)
    const cacheKey = `${CacheKey.EQUITY_ANALYSIS}:${ticker}`;
    const cached = await cacheManager.get<EquityAnalysis>(cacheKey);

    if (cached) {
        console.log(`[Cache] Hit for ${ticker} (v${cached.version})`);

        // Check if 7 Powers is missing or empty (backfill for old cache entries)
        if (!cached.data.sevenPowers || cached.data.sevenPowers.trim().length === 0) {
            console.log(`[Cache] Backfilling 7 Powers for ${ticker}...`);
            const spResult = await analyzeSevenPowers(ticker, ticker, isTarget);

            if (spResult.text) {
                console.log(`[Cache] Backfill successful for ${ticker}. Length: ${spResult.text.length}`);
                cached.data.sevenPowers = spResult.text;

                // Update cache with new complete record
                await cacheManager.set(cacheKey, cached.data, 86400);

                return {
                    ...cached.data,
                    usage: spResult.usage, // Charge for the backfill run
                };
            } else {
                console.warn(`[Cache] Backfill failed (empty result) for ${ticker}`);
            }
        }

        // Zero out cost so the UI doesn't add stale costs to the session total
        const zeroUsage = { tokens: 0, cost: 0 };
        return {
            ...cached.data,
            usage: zeroUsage,
            subRuns: cached.data.subRuns?.map(r => ({ ...r, usage: zeroUsage }))
        };
    }

    // 1. Pre-fetch Live Data (Code-side)
    const priceData = await fetchStockData(ticker);

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

    // 2. Use Vercel AI Gateway with Google Search grounding and BYOK
    const result = await generateText({
        model: ANALYSIS_MODEL,
        system: systemInstruction,
        prompt: taskPrompt,
        tools: {
            google_search: google.tools.googleSearch({}),
        },
        experimental_output: Output.object({ schema: FUNDAMENTAL_SCHEMA }),
        providerOptions: {
            gateway: {
                byok: {
                    google: [{ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY }],
                },
            } satisfies GatewayProviderOptions,
        },
    });

    let parsedData: z.infer<typeof FUNDAMENTAL_SCHEMA>;
    try {
        // experimental_output provides structured data via result.experimental_output
        parsedData = result.experimental_output as z.infer<typeof FUNDAMENTAL_SCHEMA>;
        if (!parsedData) {
            // Fallback to parsing text if structured output failed
            parsedData = JSON.parse(result.text);
        }
    } catch (e: any) {
        console.error("JSON Parse Error:", e);
        // Simple cleanup fallback
        const cleanText = result.text.replace(/```json\n?|\n?```/g, '').trim();
        try {
            parsedData = JSON.parse(cleanText);
        } catch (e2) {
            throw new Error(`Failed to parse Gemini response as JSON: ${e.message}`);
        }
    }

    const usage = calculateUsage(ANALYSIS_MODEL, result.usage);
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

    // CACHE RESULT (24 Hours)
    await cacheManager.set(cacheKey, finalAnalysis, 86400);

    return finalAnalysis;
};

/**
 * Agent 2: Strategic Analyst (Hamilton Helmer / 7 Powers)
 */
export const analyzeSevenPowers = async (ticker: string, companyName: string, isTarget: boolean = false): Promise<{ text: string, usage: { tokens: number, cost: number } }> => {
    // 1. Pre-fetch Live Data
    const priceData = await fetchStockData(ticker);

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

    // 2. Use Vercel AI Gateway with Google Search grounding and BYOK
    const result = await generateText({
        model: ANALYSIS_MODEL,
        system: systemInstruction,
        prompt: taskPrompt,
        tools: {
            google_search: google.tools.googleSearch({}),
        },
        providerOptions: {
            gateway: {
                byok: {
                    google: [{ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY }],
                },
            } satisfies GatewayProviderOptions,
        },
    });

    let responseText = "";
    try {
        responseText = result.text;
    } catch (e: any) {
        console.error("7 Powers Core Analysis text() failed:", e);
        responseText = "An internal error occurred while generating this report segment.";
    }

    if (!responseText) {
        responseText = "The model returned an empty response for this segment.";
    }

    return {
        text: responseText,
        usage: calculateUsage(ANALYSIS_MODEL, result.usage)
    };
};

/**
 * Agent 4: Complexity Portfolio Manager
 */
export const makeComplexityDecision = async (
    targetAnalysis: EquityAnalysis,
    portfolioScan: EquityAnalysis[],
    currentPortfolio: PortfolioItem[]
): Promise<ComplexityDecision> => {
    // 1. Pre-fetch Portfolio Allocation
    const totalPortfolioValue = currentPortfolio.reduce((sum, item) => sum + item.value, 0);
    const allocationData = {
        totalValue: totalPortfolioValue,
        holdings: currentPortfolio.map(item => ({
            symbol: item.symbol,
            value: item.value,
            allocation: totalPortfolioValue > 0 ? (item.value / totalPortfolioValue * 100).toFixed(2) + '%' : '0%'
        }))
    };

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

    // 2. Use Vercel AI Gateway with Google Search grounding and BYOK
    const result = await generateText({
        model: DECISION_MODEL,
        system: COMPLEXITY_PM_PROMPT,
        prompt: userPrompt,
        tools: {
            google_search: google.tools.googleSearch({}),
        },
        experimental_output: Output.object({ schema: COMPLEXITY_DECISION_SCHEMA }),
        providerOptions: {
            gateway: {
                byok: {
                    google: [{ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY }],
                },
            } satisfies GatewayProviderOptions,
        },
    });

    let parsedDecision: z.infer<typeof COMPLEXITY_DECISION_SCHEMA>;
    try {
        parsedDecision = result.experimental_output as z.infer<typeof COMPLEXITY_DECISION_SCHEMA>;
        if (!parsedDecision) {
            parsedDecision = JSON.parse(result.text);
        }
    } catch (e: any) {
        console.error("Decision Parse Error:", e);
        const cleanText = result.text.replace(/```json\n?|\n?```/g, '').trim();
        parsedDecision = JSON.parse(cleanText);
    }

    return {
        ...parsedDecision,
        usage: calculateUsage(DECISION_MODEL, result.usage)
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

import { createOpenAI } from '@ai-sdk/openai';
import { generateText, gateway } from 'ai';
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

// Configuration
const ANALYSIS_MODEL = 'deepseek/deepseek-v4-flash';
const DECISION_MODEL = 'deepseek/deepseek-v4-pro';

// Initialize Vercel AI Gateway OpenAI Client
// WARNING: Ensure AI_GATEWAY_API_KEY is in your environment variables
const aiClient = createOpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN,
    baseURL: 'https://ai-gateway.vercel.sh/v1',
});

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
        const isOverloaded = error.message?.includes('503') || error.message?.includes('overloaded') || error.message?.includes('rate limit') || error.status === 429;
        if (isOverloaded && retries > 0) {
            console.log(`[AI-Gateway] Model overloaded or rate-limited. Retrying in ${delay}ms... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

export const calculateUsage = (modelName: string, usage: any) => {
    if (!usage) return { tokens: 0, cost: 0 };

    const promptTokens = usage.promptTokenCount ?? usage.promptTokens ?? usage.prompt_tokens ?? 0;
    const completionTokens = usage.candidatesTokenCount ?? usage.completionTokens ?? usage.completion_tokens ?? 0;
    const totalTokens = usage.totalTokenCount ?? usage.totalTokens ?? usage.total_tokens ?? 0;

    let inputRate = 0.14; // Default: deepseek-v4-flash ($0.14 per 1M tokens)
    let outputRate = 0.28; // Default: deepseek-v4-flash ($0.28 per 1M tokens)

    if (modelName.includes('pro')) {
        inputRate = 0.435; // deepseek-v4-pro ($0.435 per 1M tokens)
        outputRate = 0.87; // deepseek-v4-pro ($0.87 per 1M tokens)
    }

    const inputCost = (promptTokens / 1_000_000) * inputRate;
    const outputCost = (completionTokens / 1_000_000) * outputRate;
    const totalCost = inputCost + outputCost;

    return {
        tokens: totalTokens,
        cost: totalCost
    };
};

/**
 * Agent 1: Fundamental Analyst
 */
export const analyzeEquity = async (ticker: string, isTarget: boolean = false): Promise<EquityAnalysis> => {
    // Basic API Key validation
    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    if (!apiKey) {
        throw new Error("Vercel AI Gateway API Key is missing. Please set AI_GATEWAY_API_KEY in your environment.");
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
                    isTarget, // Always use the caller's current value, not the cached one
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
            isTarget, // Always use the caller's current value, not the cached one
            usage: zeroUsage,
            subRuns: cached.subRuns?.map(r => ({ ...r, usage: zeroUsage }))
        };
    }

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
2. OUTSIDE of these numbers, you MUST use web search for 10-K, Revenues, and qualitative research.
Output strictly valid JSON matching the required schema.`;

    // 2. Use Model with Perplexity Web Search
    const result = await withRetry(async () => {
        return generateText({
            model: aiClient(ANALYSIS_MODEL),
            system: systemInstruction,
            prompt: taskPrompt,
            tools: {
                perplexity_search: gateway.tools.perplexitySearch({
                    maxResults: 10,
                }),
            },
            responseFormat: {
                type: 'json'
            },
        });
    });

    const responseText = result.text;
    if (!responseText) {
        throw new Error("Model returned empty text response.");
    }

    let parsedData = JSON.parse(responseText);
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
        sources: [],
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
        return {
            text: cached.text,
            usage: { tokens: 0, cost: 0 }
        };
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    if (!apiKey) {
        throw new Error("Vercel AI Gateway API Key is missing.");
    }

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
2. Use web search to find "Financial Proxies" (Margins, Churn).
Output a structured Markdown report.`;

    // 2. Use Model with Perplexity Web Search
    const result = await withRetry(async () => {
        return generateText({
            model: aiClient(ANALYSIS_MODEL),
            system: systemInstruction,
            prompt: taskPrompt,
            tools: {
                perplexity_search: gateway.tools.perplexitySearch({
                    maxResults: 10,
                }),
            },
        });
    });

    let responseText = result.text;
    if (!responseText) {
        responseText = "The model returned an empty response for this segment.";
    }

    const analysisResult = {
        text: responseText,
        usage: calculateUsage(ANALYSIS_MODEL, result.usage)
    };

    // CACHE RESULT (24 Hours) in Vercel Blob
    await putCache(ticker, 'sevenPowers', analysisResult);

    return analysisResult;
};

/**
 * Agent 4: Complexity Portfolio Manager
 */
export const makeComplexityDecision = async (
    targetAnalysis: EquityAnalysis,
    portfolioScan: EquityAnalysis[],
    currentPortfolio: PortfolioItem[]
): Promise<ComplexityDecision> => {
    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    if (!apiKey) {
        throw new Error("Vercel AI Gateway API Key is missing.");
    }

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

    const result = await withRetry(async () => {
        return generateText({
            model: aiClient(DECISION_MODEL),
            system: COMPLEXITY_PM_PROMPT,
            prompt: userPrompt,
            responseFormat: {
                type: 'json'
            }
        });
    });

    const responseText = result.text;
    return {
        ...JSON.parse(responseText),
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

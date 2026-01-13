import { GoogleGenerativeAI, SchemaType, GenerateContentResponse } from "@google/generative-ai";
import { FUNDAMENTAL_ANALYST_PROMPT, PORTFOLIO_MANAGER_PROMPT, HAMILTON_HELMER_PROMPT, COMPLEXITY_PM_PROMPT } from './agents/prompts';

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
}

export interface TradeDecision {
    action: 'BUY' | 'SELL' | 'TRIM' | 'HOLD';
    ticker: string;
    amount: number;
    rationale: string;
    fundingSource: string;
    portfolioImpact: string;
    usage?: { tokens: number; cost: number };
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
}


// Configuration
const ANALYSIS_MODEL = 'gemini-3-flash-preview';
const DECISION_MODEL = 'gemini-3-flash-preview';

// Initialize Gemini Client
// WARNING: Ensure GEMINI_API_KEY is in your .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');


// Pricing (USD per 1M tokens) - Gemini 2.0 Flash / 1.5 Flash
// Input: $0.075 / 1M, Output: $0.30 / 1M (for prompts < 128k)

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

    const model = genAI.getGenerativeModel({ model: ANALYSIS_MODEL }, { apiVersion: 'v1beta' });

    // Load system instruction
    const systemInstruction = FUNDAMENTAL_ANALYST_PROMPT.replace('__TICKER_SYMBOL__', ticker);

    const taskPrompt = `Perform a high-fidelity fundamental analysis for strictly: ${ticker}. Use Google Search to get current market data and reports. Output strictly valid JSON.`;

    try {
        const result = await withRetry(() => model.generateContent({
            contents: [{ role: 'user', parts: [{ text: taskPrompt }] }],
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
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
                }
            }
        }));

        const response = result.response;
        const usage = calculateUsage(ANALYSIS_MODEL, response.usageMetadata);
        let text = response.text();

        // Extract sources if available
        const sources: { uri: string; title: string }[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web) {
                    sources.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
                }
            });
        }

        let data: any = null;
        let formattedText = "";
        let cagr = 'N/A';

        try {
            if (!text || text.trim() === "") {
                throw new Error("Model returned an empty response.");
            }
            // Clean markdown if present (though schema should prevent it)
            if (text.includes("```json")) {
                text = text.replace(/```json/g, '').replace(/```/g, '');
            }
            data = JSON.parse(text);
            formattedText = renderAnalysisMarkdown(data);
            cagr = data.cagr || data.valuation?.baseCase?.cagrCalculation || 'N/A';
        } catch (e) {
            console.error("Failed to parse analysis JSON:", e);
            formattedText = `# Analysis Generation Error\n\nWe encountered an issue parsing the analysis data.\n\n### Raw Data Output:\n\`\`\`json\n${text}\n\`\`\``;
            cagr = "Error";
        }

        // Determine sentiment
        let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
        const textLower = formattedText.toLowerCase();
        if (textLower.includes('strong buy') || textLower.includes('**buy**')) sentiment = 'Bullish';
        else if (textLower.includes('**sell**')) sentiment = 'Bearish';
        else if (textLower.includes('**hold**')) sentiment = 'Neutral';

        // Step 2: Strategic Analysis (7 Powers)
        let sevenPowers = "";
        try {
            const spResult = await analyzeSevenPowers(ticker, (data && data.companyName) || ticker);
            sevenPowers = spResult.text;
            // Accumulate usage
            usage.tokens += spResult.usage.tokens;
            usage.cost += spResult.usage.cost;
        } catch (e) {
            console.error("7 Powers analysis failed:", e);
            sevenPowers = "Failed to generate strategic analysis.";
        }

        return {
            ticker,
            summary: formattedText,
            sentiment,
            cagr: cagr.toString().replace('%', '') + '%',
            sevenPowers,
            sources,
            timestamp: Date.now(),
            isTarget,
            usage
        };

    } catch (error) {
        console.error("Gemini Analysis Failed:", error);
        throw new Error("Failed to generate equity analysis.");
    }
};

/**
 * Agent 2: Strategic Analyst (Hamilton Helmer / 7 Powers)
 */
export const analyzeSevenPowers = async (ticker: string, companyName: string): Promise<{ text: string, usage: { tokens: number, cost: number } }> => {
    const model = genAI.getGenerativeModel({ model: ANALYSIS_MODEL }, { apiVersion: 'v1beta' });

    const systemInstruction = HAMILTON_HELMER_PROMPT
        .replace('{{TICKER}}', ticker)
        .replace('{{COMPANY_NAME}}', companyName);

    const taskPrompt = `Conduct a forensic strategic analysis of ${companyName} (${ticker}) using the 7 Powers framework. Use Google Search for the specific financial proxies and market data. Output a structured Markdown report.`;

    try {
        const result = await withRetry(() => model.generateContent({
            contents: [{ role: 'user', parts: [{ text: taskPrompt }] }],
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
            tools: [{ googleSearch: {} } as any]
        }));

        return {
            text: result.response.text(),
            usage: calculateUsage(ANALYSIS_MODEL, result.response.usageMetadata)
        };
    } catch (error) {
        console.error("7 Powers Analysis Failed:", error);
        return {
            text: "Insufficient Evidence to complete strategic analysis.",
            usage: { tokens: 0, cost: 0 }
        };
    }
};

/**
 * Agent 3: Portfolio Manager
 */
export const makeTradeDecision = async (
    targetAnalysis: EquityAnalysis,
    portfolioScan: EquityAnalysis[],
    currentPortfolio: PortfolioItem[]
): Promise<TradeDecision> => {

    const model = genAI.getGenerativeModel({
        model: DECISION_MODEL,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    action: {
                        type: SchemaType.STRING,
                        description: 'BUY, SELL, TRIM, or HOLD',
                        enum: ['BUY', 'SELL', 'TRIM', 'HOLD'],
                        format: 'enum'
                    },
                    ticker: { type: SchemaType.STRING, description: 'The ticker being acted upon' },
                    amount: { type: SchemaType.NUMBER, description: 'Share quantity or allocation percentage change' },
                    rationale: { type: SchemaType.STRING, description: 'Detailed PM reasoning' },
                    fundingSource: { type: SchemaType.STRING, description: 'Source of funds' },
                    portfolioImpact: { type: SchemaType.STRING, description: 'Impact on portfolio quality/concentration' }
                },
                required: ['action', 'ticker', 'amount', 'rationale', 'fundingSource', 'portfolioImpact']
            }
        }
    }, { apiVersion: 'v1beta' });

    // Prepare context
    const totalPortfolioValue = currentPortfolio.reduce((sum, item) => sum + item.value, 0);
    const portfolioContext = currentPortfolio.map((item) => {
        const allocation = totalPortfolioValue > 0 ? ((item.value / totalPortfolioValue) * 100).toFixed(1) : "0.0";
        const analysis = portfolioScan.find(a => a.ticker === item.symbol);
        return `### HOLDING: ${item.name} (${item.symbol})\nShares: ${item.shares}\nValue: ${item.value.toLocaleString()} USD (${allocation}%)\n\n#### FUNDAMENTAL REPORT:\n${analysis?.summary || 'N/A'}\n\n#### STRATEGIC REPORT (7 POWERS):\n${analysis?.sevenPowers || 'N/A'}`;
    }).join("\n\n---\n\n");

    const systemInstruction = PORTFOLIO_MANAGER_PROMPT;

    // Check if systemInstruction loaded (should be fine now)
    if (!systemInstruction) {
        throw new Error("Portfolio Manager prompt is missing.");
    }

    // Check if target is in portfolio
    const existingHolding = currentPortfolio.find(p => p.symbol === targetAnalysis.ticker);
    const existingHoldingAllocation = existingHolding && totalPortfolioValue > 0 ? ((existingHolding.value / totalPortfolioValue) * 100).toFixed(1) : "0.0";
    const existingHoldingContext = existingHolding
        ? `\n*** ATTENTION: ${targetAnalysis.ticker} IS ALREADY IN THE PORTFOLIO ***\nCurrent Holding: ${existingHolding.shares} shares. Value: ${existingHolding.value.toLocaleString()} USD (${existingHoldingAllocation}%).\nEvaluate if this position should be INCREASED, DECREASED, or MAINTAINED.`
        : "";

    const userPrompt = `STRATEGIC DECISION SESSION: ${targetAnalysis.ticker}
${existingHoldingContext}

TARGET RESEARCH REPORTS:

#### FUNDAMENTAL ANALYSIS:
${targetAnalysis.summary}

#### STRATEGIC ANALYSIS (7 POWERS):
${targetAnalysis.sevenPowers}

---
FULL PORTFOLIO CONTEXT (${currentPortfolio.length} Holdings):
${portfolioContext}

FINAL TASK:
Based on the fundamental and strategic reports above, decide if ${targetAnalysis.ticker} earns a spot in the fund.
Analyze every portfolio company's quality and competitive durability (powers) before making the swap.`;

    try {
        const result = await withRetry(() => model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }
        }));

        const usage = calculateUsage(DECISION_MODEL, result.response.usageMetadata);
        const text = result.response.text();
        if (!text || text.trim() === "") {
            throw new Error("Model returned an empty response.");
        }
        const data = JSON.parse(text) as TradeDecision;
        data.usage = usage;
        return data;

    } catch (error) {
        console.error("Gemini PM Decision Failed:", error);
        throw new Error("Portfolio Manager failed to make a decision.");
    }
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
            responseSchema: {
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
            }
        },
    }, { apiVersion: 'v1beta' });

    const totalPortfolioValue = currentPortfolio.reduce((sum, item) => sum + item.value, 0);
    const portfolioContext = currentPortfolio.map((item) => {
        const allocation = totalPortfolioValue > 0 ? ((item.value / totalPortfolioValue) * 100).toFixed(1) : "0.0";
        const analysis = portfolioScan.find(a => a.ticker === item.symbol);
        return `### HOLDING: ${item.name} (${item.symbol})\nShares: ${item.shares}\nValue: ${item.value.toLocaleString()} USD (${allocation}%)\n\n#### FUNDAMENTAL REPORT:\n${analysis?.summary || 'N/A'}\n\n#### STRATEGIC REPORT (7 POWERS):\n${analysis?.sevenPowers || 'N/A'}`;
    }).join("\n\n---\n\n");

    const systemInstruction = COMPLEXITY_PM_PROMPT;

    // Check if target is in portfolio
    const existingHolding = currentPortfolio.find(p => p.symbol === targetAnalysis.ticker);
    const existingHoldingAllocation = existingHolding && totalPortfolioValue > 0 ? ((existingHolding.value / totalPortfolioValue) * 100).toFixed(1) : "0.0";
    const existingHoldingContext = existingHolding
        ? `\n*** ATTENTION: ${targetAnalysis.ticker} IS ALREADY IN THE PORTFOLIO ***\nCurrent Holding: ${existingHolding.shares} shares. Value: ${existingHolding.value.toLocaleString()} USD (${existingHoldingAllocation}%).\nEvaluate if this position should be INCREASED, DECREASED, or MAINTAINED based on its classification.`
        : "";

    const userPrompt = `COMPLEXITY INVESTING DECISION SESSION: ${targetAnalysis.ticker}
${existingHoldingContext}

TARGET RESEARCH REPORTS:
${targetAnalysis.summary}

STRATEGIC ANALYSIS:
${targetAnalysis.sevenPowers}

---
FULL PORTFOLIO CONTEXT:
${portfolioContext}

FINAL TASK:
Apply the Complexity Investing framework to decide on ${targetAnalysis.ticker}. Return the required JSON object.`;

    try {
        const result = await withRetry(() => model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }
        }));

        const usage = calculateUsage(DECISION_MODEL, result.response.usageMetadata);
        const text = result.response.text();
        if (!text || text.trim() === "") {
            throw new Error("Model returned an empty response.");
        }
        const data = JSON.parse(text) as ComplexityDecision;
        data.usage = usage;
        return data;
    } catch (error) {
        console.error("Gemini Complexity PM Decision Failed:", error);
        throw new Error("Complexity Portfolio Manager failed to make a decision.");
    }
};

/**
 * Formatter Script: Deterministic Markdown Generation
 */
const renderAnalysisMarkdown = (data: any): string => {
    return `# ${data.companyName} (${data.ticker})
## Executive Summary
**Current Price:** ${data.currentPrice}
**Rating:** ${data.rating}
**Expected 10-Year CAGR:** ${data.cagr}%

**Thesis:** ${data.oneLiner}

---

## Business Quality & Moat (6 Pillars)
* **Wide Moat:** ${data.pillars.moat}
* **Operating Leverage:** ${data.pillars.operatingLeverage}
* **Organic Growth:** ${data.pillars.organicGrowth}
* **Capital Light:** ${data.pillars.capitalLight}
* **Predictability:** ${data.pillars.predictability}
* **Smart Management:** ${data.pillars.management}

---

## Financial Deep Dive
* **Growth:** ${data.financials.growth}
* **Health:** ${data.financials.health}
* **Profitability:** ${data.financials.profitability}

---

## Valuation & Return Scenarios
**Current Valuation:**
${data.valuation.current}

### Scenarios
* **Bull Case:** ${data.valuation.bullCase}
* **Bear Case:** ${data.valuation.bearCase}

### Base Case Return Model (10-Year View)
* **Assumed Revenue Growth:** ${data.valuation.baseCase.revenueGrowth}
* **Assumed Net Margin:** ${data.valuation.baseCase.netMargin}
* **Assumed Exit Multiple:** ${data.valuation.baseCase.exitMultiple}
* **Share Count Reduction:** ${data.valuation.baseCase.shareCountReduction}
* **Resulting Share Price:** ${data.valuation.baseCase.futureSharePrice}
* **Expected CAGR:** ${data.valuation.baseCase.cagrCalculation}

---

## Key Risks
* ${data.risks[0]}
* ${data.risks[1]}
* ${data.risks[2]}

---

## Conclusion
${data.conclusion}
`;
}


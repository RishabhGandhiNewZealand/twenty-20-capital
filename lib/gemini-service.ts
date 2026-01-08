import { GoogleGenerativeAI, SchemaType, GenerateContentResponse } from "@google/generative-ai";
import { FUNDAMENTAL_ANALYST_PROMPT, PORTFOLIO_MANAGER_PROMPT } from './agents/prompts';

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
    sources: { uri: string; title: string }[];
    timestamp: number;
    isTarget: boolean;
}

export interface TradeDecision {
    action: 'BUY' | 'SELL' | 'TRIM' | 'HOLD';
    ticker: string;
    amount: number;
    rationale: string;
    fundingSource: string;
    portfolioImpact: string;
}


// Configuration
const ANALYSIS_MODEL = 'gemini-3-pro-preview';
const DECISION_MODEL = 'gemini-3-pro-preview';

// Initialize Gemini Client
// WARNING: Ensure GEMINI_API_KEY is in your .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');


// Pricing (USD per 1M tokens) - Gemini 2.0 Flash / 1.5 Flash
// Input: $0.075 / 1M, Output: $0.30 / 1M (for prompts < 128k)
const logUsage = (modelName: string, usage: any) => {
    if (!usage) return;

    const isPro = modelName.includes('pro');
    const tokenCount = usage.promptTokenCount;

    let inputRate = 0;
    let outputRate = 0;

    if (isPro) {
        // Gemini 3 Pro Tiered Pricing
        if (tokenCount <= 200_000) {
            inputRate = 2.00;
            outputRate = 12.00;
        } else {
            inputRate = 4.00;
            outputRate = 18.00;
        }
    } else {
        // Gemini 3 Flash Fixed Pricing
        inputRate = 0.50;
        outputRate = 3.00;
    }

    const inputCost = (usage.promptTokenCount / 1_000_000) * inputRate;
    const outputCost = (usage.candidatesTokenCount / 1_000_000) * outputRate;
    const totalCost = inputCost + outputCost;

    console.log(`\n[GEMINI 3 USAGE - ${modelName}]`);
    console.log(`Tokens: ${usage.promptTokenCount} (in) / ${usage.candidatesTokenCount} (out) / ${usage.totalTokenCount} (total)`);
    console.log(`Estimated Cost: $${totalCost.toFixed(6)} USD`);
    if (isPro) console.log(`Pricing Tier: ${tokenCount <= 200_000 ? '<= 200k' : '> 200k'}`);
    console.log("");
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
        const result = await model.generateContent({
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
                    required: ['companyName', 'ticker', 'currentPrice', 'rating', 'oneLiner', 'pillars', 'financials', 'valuation', 'risks', 'conclusion']
                }
            },
            tools: [{ googleSearch: {} } as any]
        });

        const response = result.response;
        logUsage(ANALYSIS_MODEL, response.usageMetadata);
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

        // --- Improved Parsing Logic ---
        let formattedText = "";
        let cagr = 'N/A';

        // 1. Clean markdown code blocks if present
        if (text.includes("```json")) {
            text = text.replace(/```json/g, '').replace(/```/g, '');
        }

        try {
            // 2. Parse JSON
            const data = JSON.parse(text);

            // 3. Render Markdown
            formattedText = renderAnalysisMarkdown(data);
            cagr = data.cagr || data.valuation?.baseCase?.cagrCalculation || 'N/A';

        } catch (e) {
            console.error("Failed to parse analysis JSON:", e);
            console.log("Raw Text:", text);

            // Fallback: Return a friendly error message and the raw text in a code block
            formattedText = `# Analysis Generation Error\n\nWe encountered an issue parsing the analysis data.\n\n### Raw Data Output:\n\`\`\`json\n${text}\n\`\`\``;
            cagr = "Error";
        }

        // Determine sentiment
        let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
        const textLower = formattedText.toLowerCase();
        if (textLower.includes('strong buy') || textLower.includes('**buy**')) sentiment = 'Bullish';
        else if (textLower.includes('**sell**')) sentiment = 'Bearish';
        else if (textLower.includes('**hold**')) sentiment = 'Neutral';

        return {
            ticker,
            summary: formattedText,
            sentiment,
            cagr: cagr.toString().replace('%', '') + '%', // canonicalize
            sources,
            timestamp: Date.now(),
            isTarget
        };

    } catch (error) {
        console.error("Gemini Analysis Failed:", error);
        throw new Error("Failed to generate equity analysis.");
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
    const portfolioContext = currentPortfolio.map((item) => {
        const analysis = portfolioScan.find(a => a.ticker === item.symbol);
        return `### HOLDING: ${item.symbol}\nShares: ${item.shares}\nReport: ${analysis?.summary || 'N/A'}`;
    }).join("\n\n---\n\n");

    const systemInstruction = PORTFOLIO_MANAGER_PROMPT;

    // Check if systemInstruction loaded (should be fine now)
    if (!systemInstruction) {
        throw new Error("Portfolio Manager prompt is missing.");
    }

    const userPrompt = `STRATEGIC DECISION SESSION: ${targetAnalysis.ticker}

TARGET RESEARCH REPORT:
${targetAnalysis.summary}

---
FULL PORTFOLIO CONTEXT (${currentPortfolio.length} Holdings):
${portfolioContext}

FINAL TASK:
Based on the reports above, decide if ${targetAnalysis.ticker} earns a spot in the fund.
Analyze every portfolio company's quality before making the swap.`;

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }
        });

        logUsage(DECISION_MODEL, result.response.usageMetadata);
        const text = result.response.text();
        return JSON.parse(text) as TradeDecision;

    } catch (error) {
        console.error("Gemini PM Decision Failed:", error);
        throw new Error("Portfolio Manager failed to make a decision.");
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


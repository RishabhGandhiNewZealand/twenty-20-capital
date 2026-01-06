import { GoogleGenerativeAI, SchemaType, GenerateContentResponse } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

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
const ANALYSIS_MODEL = 'gemini-3-flash-preview';
const DECISION_MODEL = 'gemini-3-flash-preview';

// Initialize Gemini Client
// WARNING: Ensure GEMINI_API_KEY is in your .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Utility: Load and template prompt files
 */
const loadPrompt = (filename: string, variables: Record<string, string> = {}): string => {
    try {
        const filePath = path.join(process.cwd(), 'lib', 'agents', 'prompts', filename);
        let content = fs.readFileSync(filePath, 'utf-8');

        // Simple templating: {{key}} -> value
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, value);
        });

        return content;
    } catch (error) {
        console.error(`Error loading prompt file: ${filename}`, error);
        throw new Error(`Failed to load system instruction: ${filename}`);
    }
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

    // Load static system instruction
    const systemInstruction = loadPrompt('fundamental-analyst.txt');

    const taskPrompt = `Perform a high-fidelity fundamental analysis for strictly: ${ticker}. Use Google Search to get current market data and reports. Output exactly following the structure provided.`;

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: taskPrompt }] }],
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
            tools: [{ googleSearch: {} } as any] // Using googleSearch for Gemini 2.0/3 grounding
        });

        const response = result.response;
        const text = response.text();

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

        // Determine sentiment
        let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
        const textLower = text.toLowerCase();
        if (textLower.includes('strong buy') || textLower.includes('**buy**')) sentiment = 'Bullish';
        else if (textLower.includes('**sell**')) sentiment = 'Bearish';
        else if (textLower.includes('**hold**')) sentiment = 'Neutral';

        return {
            ticker,
            summary: text,
            sentiment,
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
        const analysis = portfolioScan.find(a => a.ticker === item.symbol); // Note: using symbol/ticker mapping
        return `### HOLDING: ${item.symbol}\nShares: ${item.shares}\nReport: ${analysis?.summary || 'N/A'}`;
    }).join("\n\n---\n\n");

    // Load and template the prompt
    // Note: The original prompt didn't need much templating other than context, 
    // but we can inject dynamic rules here if we wanted. 
    // For now, we'll keep the system instruction static and pass context in the user prompt.
    const systemInstruction = loadPrompt('portfolio-manager.txt');

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

        const text = result.response.text();
        return JSON.parse(text) as TradeDecision;

    } catch (error) {
        console.error("Gemini PM Decision Failed:", error);
        throw new Error("Portfolio Manager failed to make a decision.");
    }
};

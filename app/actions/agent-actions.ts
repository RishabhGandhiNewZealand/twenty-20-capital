'use server';

import { analyzeEquity, makeTradeDecision, EquityAnalysis, PortfolioItem } from '@/lib/gemini-service';

export async function runFundamentalAnalysis(ticker: string, isTarget: boolean = false) {
    try {
        const analysis = await analyzeEquity(ticker, isTarget);
        return { success: true, data: analysis };
    } catch (error) {
        console.error('Fundamental Analysis Error:', error);
        return { success: false, error: 'Failed to analyze equity.' };
    }
}

export async function runPortfolioManagerDecision(
    targetAnalysis: EquityAnalysis,
    portfolioScan: EquityAnalysis[],
    currentPortfolio: PortfolioItem[]
) {
    try {
        const decision = await makeTradeDecision(targetAnalysis, portfolioScan, currentPortfolio);
        return { success: true, data: decision };
    } catch (error) {
        console.error('PM Decision Error:', error);
        return { success: false, error: 'Failed to make trade decision.' };
    }
}

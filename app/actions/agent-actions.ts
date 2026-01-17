'use server';

import { analyzeEquity, makeComplexityDecision, EquityAnalysis, PortfolioItem } from '@/lib/gemini-service';

export async function runFundamentalAnalysis(ticker: string, isTarget: boolean = false) {
    try {
        const analysis = await analyzeEquity(ticker, isTarget);
        return { success: true, data: analysis };
    } catch (error) {
        console.error('Fundamental Analysis Error:', error);
        return { success: false, error: `Failed to analyze ${ticker}` };
    }
}

export async function runBatchFundamentalAnalysis(items: { ticker: string, isTarget: boolean }[]) {
    // Fire all analyst calls in parallel on the server
    const promises = items.map(item => runFundamentalAnalysis(item.ticker, item.isTarget));
    return Promise.all(promises);
}

export async function runPortfolioManagerDecision(
    targetAnalysis: EquityAnalysis,
    portfolioScan: EquityAnalysis[],
    currentPortfolio: PortfolioItem[]
) {
    try {
        const complexity = await makeComplexityDecision(targetAnalysis, portfolioScan, currentPortfolio);

        return {
            success: true,
            data: { complexity }
        };
    } catch (error) {
        console.error('PM Decision Error:', error);
        return { success: false, error: 'Failed to make trade decision.' };
    }
}

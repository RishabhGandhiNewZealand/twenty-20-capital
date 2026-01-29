import { NextRequest, NextResponse } from 'next/server';
import { analyzeEquity, analyzeSevenPowers, makeComplexityDecision, EquityAnalysis, PortfolioItem } from '@/lib/gemini-service';
import { deleteCache } from '@/lib/blob-cache';

export const maxDuration = 300; // 5 minutes timeout

/**
 * Refresh analysis for a specific ticker
 * Clears cache and reruns the specified analysis type
 */
export async function POST(req: NextRequest) {
    const body = await req.json();
    const { ticker, type, isTarget = false, portfolioData } = body as {
        ticker: string;
        type: 'fundamental' | 'sevenPowers' | 'decision';
        isTarget?: boolean;
        portfolioData?: {
            targetAnalysis: EquityAnalysis;
            portfolioScan: EquityAnalysis[];
            currentPortfolio: PortfolioItem[];
        };
    };

    if (!ticker || !type) {
        return NextResponse.json({ error: 'Missing ticker or type' }, { status: 400 });
    }

    try {
        // Handle different refresh types
        if (type === 'fundamental') {
            // Clear both caches for this ticker (fundamental includes 7 powers)
            await deleteCache(ticker, 'fundamental');
            await deleteCache(ticker, 'sevenPowers');

            // Rerun full analysis
            const result = await analyzeEquity(ticker, isTarget);
            return NextResponse.json({ success: true, data: result });
        }

        if (type === 'sevenPowers') {
            // Clear only 7 powers cache
            await deleteCache(ticker, 'sevenPowers');

            // Rerun 7 powers analysis
            const result = await analyzeSevenPowers(ticker, ticker, isTarget);
            return NextResponse.json({ success: true, data: result });
        }

        if (type === 'decision') {
            // Decision doesn't have cache, just rerun
            if (!portfolioData) {
                return NextResponse.json({ error: 'Decision refresh requires portfolioData' }, { status: 400 });
            }

            const result = await makeComplexityDecision(
                portfolioData.targetAnalysis,
                portfolioData.portfolioScan,
                portfolioData.currentPortfolio
            );
            return NextResponse.json({ success: true, data: result });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error: any) {
        console.error(`Refresh failed for ${ticker}/${type}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

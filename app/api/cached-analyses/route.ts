import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

const BLOB_PREFIX = 'equity-cache';

export async function GET() {
    try {
        const { blobs } = await list({ prefix: BLOB_PREFIX });

        // Fetch fundamental analyses (full EquityAnalysis)
        const fundamentalBlobs = blobs.filter(b => b.pathname.includes('/fundamental/'));
        // Fetch decision blobs
        const decisionBlobs = blobs.filter(b => b.pathname.includes('/decision/'));

        const [analyses, decisions] = await Promise.all([
            // Fetch all fundamental analyses
            Promise.all(
                fundamentalBlobs.map(async (blob) => {
                    try {
                        const response = await fetch(blob.url);
                        if (!response.ok) return null;
                        const cached = await response.json();
                        if (Date.now() > cached.expiresAt) return null;
                        return {
                            ...cached.data,
                            cachedAt: cached.createdAt,
                            expiresAt: cached.expiresAt,
                        };
                    } catch {
                        return null;
                    }
                })
            ),
            // Fetch all decisions
            Promise.all(
                decisionBlobs.map(async (blob) => {
                    try {
                        const response = await fetch(blob.url);
                        if (!response.ok) return null;
                        const cached = await response.json();
                        if (Date.now() > cached.expiresAt) return null;
                        return {
                            ...cached.data,
                            cachedAt: cached.createdAt,
                            expiresAt: cached.expiresAt,
                        };
                    } catch {
                        return null;
                    }
                })
            ),
        ]);

        return NextResponse.json({
            analyses: analyses.filter(Boolean),
            decisions: decisions.filter(Boolean),
        });
    } catch (error: any) {
        console.error('[CachedAnalyses] Failed to list cache:', error);
        return NextResponse.json({ analyses: [], decisions: [], error: error.message }, { status: 500 });
    }
}

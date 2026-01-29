import { NextRequest, NextResponse } from 'next/server';
import { analyzeEquity } from '@/lib/gemini-service';

export const maxDuration = 300; // 5 minutes timeout for long running agents

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { tasks } = body as { tasks: { ticker: string, isTarget: boolean }[] };

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return NextResponse.json({ error: 'Invalid tasks payload' }, { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (data: any) => {
                const json = JSON.stringify(data);
                controller.enqueue(new TextEncoder().encode(json + '\n'));
            };

            // Process all tasks in parallel (no concurrency limit)
            const analysisPromises = tasks.map(task => (async () => {
                try {
                    const result = await analyzeEquity(task.ticker, task.isTarget);
                    sendEvent({ success: true, data: result });
                } catch (error: any) {
                    console.error(`Analysis failed for ${task.ticker}:`, error);
                    sendEvent({ success: false, ticker: task.ticker, error: error.message });
                }
            })());

            // Wait for all analyses to complete
            await Promise.all(analysisPromises);
            controller.close();
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'application/x-ndjson',
            'Transfer-Encoding': 'chunked',
        },
    });
}

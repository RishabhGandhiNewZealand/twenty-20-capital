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

            // Create an array of promises for each analysis task
            // Custom Concurrency Limiter (Limit 5)
            const CONCURRENCY_LIMIT = 5;
            const STAGGER_MS = 200; // Stagger start by 200ms to avoid thundering herd

            const activePromises = new Set<Promise<void>>();

            // Process tasks with concurrency limit
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];

                // Wait if we hit the limit
                if (activePromises.size >= CONCURRENCY_LIMIT) {
                    await Promise.race(activePromises);
                }

                // Stagger delay for smoother api usage
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, STAGGER_MS));
                }

                const promise = (async () => {
                    try {
                        const result = await analyzeEquity(task.ticker, task.isTarget);
                        sendEvent({ success: true, data: result });
                    } catch (error: any) {
                        console.error(`Analysis failed for ${task.ticker}:`, error);
                        sendEvent({ success: false, ticker: task.ticker, error: error.message });
                    }
                })();

                activePromises.add(promise);
                // Remove self from active set when done
                promise.finally(() => activePromises.delete(promise));
            }

            // Wait for all remaining active promises to finish
            await Promise.all(activePromises);
            controller.close();

            // Wait for all analyses to complete then close the stream

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

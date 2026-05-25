'use client';

import React, { useReducer, useEffect, useState } from 'react';
import { useUser } from '@stackframe/stack';

import { BrainCircuit, Loader2, PieChart, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AnalysisDashboard, { AgentStatus, AnalysisLog } from './components/analysis-dashboard';
import AnalysisChat from './components/analysis-chat';
import type { EquityAnalysis, PortfolioItem, ComplexityDecision } from '@/lib/gemini-service';
import { runFundamentalAnalysis, runBatchFundamentalAnalysis, runPortfolioManagerDecision } from '@/app/actions/agent-actions';
import { TickerStatus } from './components/analysis-dashboard';
import { getLogoUrl } from '@/lib/company-utils';

// State Definition
interface State {
    status: AgentStatus;
    logs: AnalysisLog[];
    analyses: EquityAnalysis[];
    previousAnalyses: EquityAnalysis[];
    previousDecisions: { complexity: ComplexityDecision; targetTicker: string; timestamp: number }[];
    tradeDecision: { complexity: ComplexityDecision } | null;
    error: string | null;
    portfolio: PortfolioItem[];
    targetTicker: string;
    tickerStatuses: TickerStatus[];
    totalCost: number;
}

// Actions
type Action =
    | { type: 'SET_STATUS'; payload: AgentStatus }
    | { type: 'ADD_LOG'; payload: AnalysisLog }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'SET_PORTFOLIO'; payload: PortfolioItem[] }
    | { type: 'SET_TARGET_TICKER'; payload: string }
    | { type: 'ADD_ANALYSIS'; payload: EquityAnalysis }
    | { type: 'UPDATE_ANALYSIS'; payload: EquityAnalysis }
    | { type: 'RESET_ANALYSES' }
    | { type: 'SET_TICKER_STATUSES'; payload: TickerStatus[] }
    | { type: 'UPDATE_TICKER_STATUS'; payload: { ticker: string, state: TickerStatus['state'] } }
    | { type: 'SET_DECISION'; payload: { complexity: ComplexityDecision } }
    | { type: 'SET_PREVIOUS_ANALYSES'; payload: EquityAnalysis[] }
    | { type: 'SET_PREVIOUS_DECISIONS'; payload: { complexity: ComplexityDecision; targetTicker: string; timestamp: number }[] };

const initialState: State = {
    status: AgentStatus.IDLE,
    logs: [],
    analyses: [],
    previousAnalyses: [],
    previousDecisions: [],
    tradeDecision: null,
    error: null,
    portfolio: [],
    targetTicker: 'NVDA',
    tickerStatuses: [],
    totalCost: 0,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_STATUS':
            return { ...state, status: action.payload };
        case 'ADD_LOG':
            return { ...state, logs: [action.payload, ...state.logs] };
        case 'SET_ERROR':
            return { ...state, error: action.payload, status: AgentStatus.ERROR };
        case 'SET_PORTFOLIO':
            return { ...state, portfolio: action.payload };
        case 'SET_TARGET_TICKER':
            return { ...state, targetTicker: action.payload };
        case 'ADD_ANALYSIS':
            return {
                ...state,
                analyses: [...state.analyses, action.payload],
                totalCost: state.totalCost + (action.payload.usage?.cost || 0)
            };
        case 'UPDATE_ANALYSIS':
            return {
                ...state,
                analyses: state.analyses.map(a =>
                    a.ticker === action.payload.ticker && a.isTarget === action.payload.isTarget
                        ? action.payload
                        : a
                ),
                totalCost: state.totalCost + (action.payload.usage?.cost || 0)
            };
        case 'RESET_ANALYSES':
            return { ...state, analyses: [], tradeDecision: null, logs: [], error: null, tickerStatuses: [], totalCost: 0 };
        case 'SET_TICKER_STATUSES':
            return { ...state, tickerStatuses: action.payload };
        case 'UPDATE_TICKER_STATUS':
            return {
                ...state,
                tickerStatuses: state.tickerStatuses.map(ts =>
                    ts.ticker === action.payload.ticker ? { ...ts, state: action.payload.state } : ts
                )
            };
        case 'SET_DECISION':
            const decisionCost = action.payload.complexity.usage?.cost || 0;
            return { ...state, tradeDecision: action.payload, totalCost: state.totalCost + decisionCost };
        case 'SET_PREVIOUS_ANALYSES':
            return { ...state, previousAnalyses: action.payload };
        case 'SET_PREVIOUS_DECISIONS':
            return { ...state, previousDecisions: action.payload };
        default:
            return state;
    }
}

export default function MultiAgentPMPage() {

    const user = useUser();
    const [state, dispatch] = useReducer(reducer, initialState);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    // Auth Check — page is publicly accessible, but actions are admin-only
    useEffect(() => {
        if (user === undefined) {
            // Still loading auth state
            return;
        }

        if (user) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }

        // Load data for ALL users (cached results are public)
        setLoading(false);
        initPortfolio();
        loadCachedAnalyses();
    }, [user]);


    const addLog = (agent: string, message: string, isCacheHit: boolean = false) => {
        dispatch({
            type: 'ADD_LOG',
            payload: { agent, message, timestamp: new Date(), isCacheHit }
        });
    };

    const initPortfolio = async () => {
        dispatch({ type: 'SET_STATUS', payload: AgentStatus.RETRIEVING_PORTFOLIO });
        addLog("Coordinator", "Syncing with Appreciation Fund state...");

        try {
            const res = await fetch('/api/portfolio/composition');
            if (!res.ok) throw new Error('Failed to fetch portfolio');
            const data = await res.json();

            const items: PortfolioItem[] = data.holdings.map((h: any) => ({
                symbol: h.symbol,
                name: h.name,
                shares: h.shares,
                value: h.value,
                currency: h.currency
            }));

            dispatch({ type: 'SET_PORTFOLIO', payload: items });
            addLog("Coordinator", `Synced ${items.length} fund positions.`);
            dispatch({ type: 'SET_STATUS', payload: AgentStatus.IDLE });
        } catch (err: any) {
            addLog("Coordinator", `Sync Failed: ${err.message}`);
            dispatch({ type: 'SET_ERROR', payload: `Sync Error: ${err.message}` });
        }
    };

    const loadCachedAnalyses = async () => {
        try {
            const res = await fetch('/api/cached-analyses');
            if (!res.ok) return;
            const data = await res.json();

            if (data.analyses && data.analyses.length > 0) {
                dispatch({ type: 'SET_PREVIOUS_ANALYSES', payload: data.analyses });
                addLog("Coordinator", `Loaded ${data.analyses.length} cached analyses from archive.`);
            }
            if (data.decisions && data.decisions.length > 0) {
                dispatch({ type: 'SET_PREVIOUS_DECISIONS', payload: data.decisions });
                addLog("Coordinator", `Loaded ${data.decisions.length} cached decisions from archive.`);
            }
        } catch (err: any) {
            console.error('Failed to load cached analyses:', err);
        }
    };

    const handleRunAnalysis = async () => {
        if (!state.targetTicker || state.portfolio.length === 0) return;

        dispatch({ type: 'RESET_ANALYSES' });
        dispatch({ type: 'SET_STATUS', payload: AgentStatus.ANALYZING_TARGET });

        try {
            addLog("Coordinator", `Initiating parallel swarm: Researching ${state.targetTicker} and scanning ${state.portfolio.length} holdings...`);

            // Initialize Status Board
            const tickerList = [
                { symbol: state.targetTicker, isTarget: true },
                ...state.portfolio
                    .filter(p => p.symbol !== state.targetTicker) // Deduplicate: Don't analyze target twice
                    .map(p => ({ symbol: p.symbol, isTarget: false }))
            ];

            const initialStatuses: TickerStatus[] = tickerList.map(t => ({
                ticker: t.symbol,
                isTarget: t.isTarget,
                state: 'RESEARCHING' // All start as researching
            }));
            dispatch({ type: 'SET_TICKER_STATUSES', payload: initialStatuses });

            const tasks = tickerList.map(t => ({ ticker: t.symbol, isTarget: t.isTarget }));

            // Step 1: Streaming Request
            const response = await fetch('/api/stream-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks })
            });

            if (!response.body) throw new Error("No response body received from stream API");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let resultBuffer: EquityAnalysis[] = [];
            let pendingChunk = ''; // Buffer for incomplete lines split across stream chunks

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    // Process any remaining buffered data
                    if (pendingChunk.trim()) {
                        try {
                            const res = JSON.parse(pendingChunk);
                            if (res.success && res.data) {
                                const analysis = res.data as EquityAnalysis;
                                dispatch({ type: 'ADD_ANALYSIS', payload: analysis });
                                dispatch({ type: 'UPDATE_TICKER_STATUS', payload: { ticker: analysis.ticker, state: 'COMPLETED' } });
                                addLog("Analyst", `Intelligence captured for ${analysis.ticker} (Cost: $${(analysis.usage?.cost || 0).toFixed(4)}).`);
                                resultBuffer.push(analysis);
                            } else {
                                const failedTicker = res.ticker || "Unknown";
                                dispatch({ type: 'UPDATE_TICKER_STATUS', payload: { ticker: failedTicker, state: 'ERROR' } });
                                addLog("Analyst", `Warning: Failed to scan ${failedTicker}: ${res.error}`);
                            }
                        } catch (e) {
                            console.error("Failed to parse final JSON chunk", e);
                        }
                    }
                    break;
                }

                // Accumulate raw text and split on newline boundaries
                pendingChunk += decoder.decode(value, { stream: true });
                const lines = pendingChunk.split('\n');

                // The last element may be an incomplete line — keep it in the buffer
                pendingChunk = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const res = JSON.parse(line);

                        if (res.success && res.data) {
                            const analysis = res.data as EquityAnalysis;
                            dispatch({ type: 'ADD_ANALYSIS', payload: analysis });
                            dispatch({ type: 'UPDATE_TICKER_STATUS', payload: { ticker: analysis.ticker, state: 'COMPLETED' } });
                            addLog("Analyst", `Intelligence captured for ${analysis.ticker} (Cost: $${(analysis.usage?.cost || 0).toFixed(4)}).`);
                            resultBuffer.push(analysis);
                        } else {
                            const failedTicker = res.ticker || "Unknown";
                            dispatch({ type: 'UPDATE_TICKER_STATUS', payload: { ticker: failedTicker, state: 'ERROR' } });
                            addLog("Analyst", `Warning: Failed to scan ${failedTicker}: ${res.error}`);
                        }
                    } catch (e) {
                        console.error("Failed to parse JSON chunk", e);
                    }
                }
            }

            // Step 2: Ensure we have the target analysis before proceeding
            // Use ticker match (source of truth) instead of isTarget flag (may be stale from cache)
            const targetAnalysis = resultBuffer.find(r => r.ticker === state.targetTicker);
            const portfolioAnalyses = resultBuffer.filter(r => r.ticker !== state.targetTicker);

            if (!targetAnalysis) {
                throw new Error(`Failed to generate critical research for target: ${state.targetTicker}`);
            }

            addLog("Coordinator", `Stream complete. Full intelligence payload received. Synchronizing Portfolio Manager...`);

            // Step 3: Portfolio Manager Decision
            dispatch({ type: 'SET_STATUS', payload: AgentStatus.MAKING_DECISION });
            addLog("Portfolio Manager", "Synthesizing Investment Strategy based on full swarm intelligence...");

            const decisionRes = await runPortfolioManagerDecision(targetAnalysis, portfolioAnalyses, state.portfolio);

            if (!decisionRes.success || !decisionRes.data) throw new Error(decisionRes.error);

            dispatch({ type: 'SET_DECISION', payload: decisionRes.data });
            const pmCost = decisionRes.data.complexity.usage?.cost || 0;
            addLog("Portfolio Manager", `Strategic Decisions Finalized (Cost: $${pmCost.toFixed(4)}). Complexity[${decisionRes.data.complexity.decision}]`);

            dispatch({ type: 'SET_STATUS', payload: AgentStatus.COMPLETED });

        } catch (err: any) {
            dispatch({ type: 'SET_ERROR', payload: err.message || "Agent execution failure." });
        }
    };

    // Refresh handlers for individual analysis sections
    const handleRefreshAnalysis = async (ticker: string, type: 'fundamental' | 'sevenPowers') => {
        const existingAnalysis = state.analyses.find(a => a.ticker === ticker);
        const isTarget = existingAnalysis?.isTarget || false;

        addLog("Refresh", `Refreshing ${type} analysis for ${ticker}...`);

        try {
            const response = await fetch('/api/refresh-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker, type, isTarget })
            });

            const result = await response.json();

            if (result.success) {
                if (type === 'fundamental') {
                    // Full analysis refreshed
                    dispatch({ type: 'UPDATE_ANALYSIS', payload: result.data });
                    addLog("Refresh", `${ticker} fundamental analysis refreshed (Cost: $${(result.data.usage?.cost || 0).toFixed(4)})`);
                } else {
                    // Just 7 Powers refreshed - update the existing analysis
                    if (existingAnalysis) {
                        const updatedAnalysis = {
                            ...existingAnalysis,
                            sevenPowers: result.data.text,
                            usage: {
                                tokens: (existingAnalysis.usage?.tokens || 0) + (result.data.usage?.tokens || 0),
                                cost: result.data.usage?.cost || 0
                            }
                        };
                        dispatch({ type: 'UPDATE_ANALYSIS', payload: updatedAnalysis });
                        addLog("Refresh", `${ticker} 7 Powers refreshed (Cost: $${(result.data.usage?.cost || 0).toFixed(4)})`);
                    }
                }
            } else {
                addLog("Refresh", `Failed to refresh ${ticker}: ${result.error}`);
            }
        } catch (error: any) {
            addLog("Refresh", `Error refreshing ${ticker}: ${error.message}`);
        }
    };

    const handleRefreshDecision = async () => {
        const targetAnalysis = state.analyses.find(a => a.isTarget);
        if (!targetAnalysis) {
            addLog("Refresh", "Cannot refresh decision: No target analysis found");
            return;
        }

        const portfolioAnalyses = state.analyses.filter(a => !a.isTarget);

        addLog("Portfolio Manager", "Re-running portfolio decision...");

        try {
            const decisionRes = await runPortfolioManagerDecision(targetAnalysis, portfolioAnalyses, state.portfolio);

            if (decisionRes.success && decisionRes.data) {
                dispatch({ type: 'SET_DECISION', payload: decisionRes.data });
                const pmCost = decisionRes.data.complexity.usage?.cost || 0;
                addLog("Portfolio Manager", `Decision refreshed (Cost: $${pmCost.toFixed(4)}). Complexity[${decisionRes.data.complexity.decision}]`);
            } else {
                addLog("Portfolio Manager", `Failed to refresh decision: ${decisionRes.error}`);
            }
        } catch (error: any) {
            addLog("Portfolio Manager", `Error refreshing decision: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500 h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            <div className="max-w-7xl w-full space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-3 rounded-2xl shadow-xl shadow-emerald-500/20">
                            <BrainCircuit className="text-white" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase italic text-gray-900 dark:text-white">Rish Agentic Insights</h1>
                            <p className="text-gray-500 dark:text-slate-400 font-bold text-[10px] tracking-[0.4em] uppercase opacity-70">Agentic Portfolio Manager (powered by DeepSeek v4 via Vercel AI Gateway)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Input
                            type="text"
                            placeholder="TICKER"
                            className="bg-slate-900 border-slate-700 rounded-xl px-4 py-6 text-slate-100 focus:ring-blue-500 font-black uppercase text-center tracking-widest text-lg w-full md:w-40"
                            value={state.targetTicker}
                            onChange={(e) => dispatch({ type: 'SET_TARGET_TICKER', payload: e.target.value.toUpperCase() })}
                        />
                        <Button
                            onClick={handleRunAnalysis}
                            disabled={!isAdmin || (state.status !== AgentStatus.IDLE && state.status !== AgentStatus.COMPLETED && state.status !== AgentStatus.ERROR)}
                            className="bg-emerald-600 hover:bg-emerald-500 h-auto py-4 px-8 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {state.status === AgentStatus.IDLE || state.status === AgentStatus.COMPLETED || state.status === AgentStatus.ERROR ? 'Analyze' : (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4" /> Running
                                </span>
                            )}
                        </Button>
                    </div>
                </header>

                {state.error && (
                    <div className="bg-red-950/20 border border-red-500/40 rounded-xl p-4 text-red-400 font-bold text-sm">
                        {state.error}
                    </div>
                )}

                {/* Main Content */}
                <main className="grid grid-cols-1 gap-12">

                    <AnalysisDashboard
                        status={state.status}
                        logs={state.logs}
                        analyses={state.analyses}
                        previousAnalyses={state.previousAnalyses}
                        previousDecisions={state.previousDecisions}
                        tradeDecision={state.tradeDecision}
                        tickerStatuses={state.tickerStatuses}
                        portfolio={state.portfolio}
                        totalCost={state.totalCost}
                        onRefreshAnalysis={handleRefreshAnalysis}
                        onRefreshDecision={handleRefreshDecision}
                    />

                    {/* Simple Portfolio Table included directly or componentized */}
                    <div className="bg-slate-800/20 rounded-xl border border-slate-700/50 p-6 shadow-xl backdrop-blur-sm">
                        {(() => {
                            const totalFundValue = state.portfolio.reduce((sum, item) => sum + item.value, 0);
                            return (
                                <>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3 text-slate-100">
                                            <PieChart className="text-blue-400" />
                                            <h2 className="text-xl font-bold uppercase tracking-tight">Live Allocation</h2>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right mr-4">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Assets</p>
                                                <p className="text-lg font-black text-slate-100 tracking-tighter">${totalFundValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] text-slate-500 uppercase">USD</span></p>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={initPortfolio} className="text-slate-400 hover:text-white">
                                                <RefreshCw size={16} className={state.status === AgentStatus.RETRIEVING_PORTFOLIO ? 'animate-spin' : ''} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="border-b border-slate-700/50">
                                                <tr>
                                                    <th className="py-3 px-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest">Ticker</th>
                                                    <th className="py-3 px-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest text-right">Shares</th>
                                                    <th className="py-3 px-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest text-right">Fund Weight</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {state.portfolio.map((item, idx) => {
                                                    const weight = (item.value / totalFundValue) * 100;
                                                    return (
                                                        <tr key={idx} className="border-b border-gray-200 dark:border-slate-800/30 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                                                            <td className="py-3 px-4 font-black text-blue-600 dark:text-blue-400 tracking-wider uppercase flex items-center gap-2">
                                                                <img
                                                                    src={getLogoUrl(item.symbol)}
                                                                    alt={item.symbol}
                                                                    className="w-6 h-6 object-contain rounded-full bg-white"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                    }}
                                                                />
                                                                {item.symbol}
                                                            </td>
                                                            <td className="py-3 px-4 text-slate-300 font-mono text-sm text-right">{item.shares.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                            <td className="py-3 px-4 text-right">
                                                                <div className="flex items-center justify-end gap-3 text-slate-100 font-mono text-sm">
                                                                    <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden md:block">
                                                                        <div className="bg-blue-500 h-full" style={{ width: `${weight}%` }}></div>
                                                                    </div>
                                                                    {weight.toFixed(2)}%
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {state.portfolio.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="py-8 text-center text-slate-600 text-xs uppercase tracking-widest">No Active Holdings</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                </main>

                {/* Chat Panel — visible to all, disabled for non-admin */}
                <AnalysisChat
                    analyses={state.analyses}
                    previousAnalyses={state.previousAnalyses}
                    previousDecisions={state.previousDecisions}
                    portfolio={state.portfolio}
                    tradeDecision={state.tradeDecision}
                    targetTicker={state.targetTicker}
                    disabled={!isAdmin}
                />
            </div>
        </div>
    );
}

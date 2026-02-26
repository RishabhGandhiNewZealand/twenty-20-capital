'use client';

import React, { useState, useMemo } from 'react';
import { Activity, ShieldCheck, TrendingUp, Link as LinkIcon, Download, Clock, Database, Coins, Briefcase, ChevronDown, ChevronUp, RefreshCw, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { EquityAnalysis, PortfolioItem, ComplexityDecision } from '@/lib/gemini-service';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getLogoUrl } from '@/lib/company-utils';

// Define Log Interface here as it's UI specific
export interface AnalysisLog {
    agent: string;
    message: string;
    timestamp: Date;
    isCacheHit: boolean;
}

export enum AgentStatus {
    IDLE = 'IDLE',
    RETRIEVING_PORTFOLIO = 'RETRIEVING_PORTFOLIO',
    ANALYZING_TARGET = 'ANALYZING_TARGET',
    SCANNING_PORTFOLIO = 'SCANNING_PORTFOLIO',
    MAKING_DECISION = 'MAKING_DECISION',
    COMPLETED = 'COMPLETED',
    ERROR = 'ERROR'
}

export interface TickerStatus {
    ticker: string;
    state: 'PENDING' | 'RESEARCHING' | 'COMPLETED' | 'ERROR';
    isTarget: boolean;
    usage?: { tokens: number; cost: number };
    subRuns?: { summary: string; sevenPowers?: string; usage: { tokens: number; cost: number } }[];
}

interface Props {
    status: AgentStatus;
    logs: AnalysisLog[];
    analyses: EquityAnalysis[];
    previousAnalyses: EquityAnalysis[];
    previousDecisions: { complexity: ComplexityDecision; targetTicker: string; timestamp: number }[];
    tradeDecision: { complexity: ComplexityDecision } | null;
    tickerStatuses: TickerStatus[];
    portfolio: PortfolioItem[];
    totalCost: number;
    onRefreshAnalysis?: (ticker: string, type: 'fundamental' | 'sevenPowers') => Promise<void>;
    onRefreshDecision?: () => Promise<void>;
}

const CollapsibleAnalysisCard = ({ analysis, onRefresh }: { analysis: EquityAnalysis; onRefresh?: (ticker: string, type: 'fundamental' | 'sevenPowers') => Promise<void> }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSubRuns, setShowSubRuns] = useState(false);
    const [isRefreshingFundamental, setIsRefreshingFundamental] = useState(false);
    const [isRefreshingSevenPowers, setIsRefreshingSevenPowers] = useState(false);

    const downloadMarkdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        const blob = new Blob([analysis.summary], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${analysis.ticker}_Analysis_${new Date(analysis.timestamp).toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className={cn(
            "group rounded-xl border transition-all duration-500 overflow-hidden",
            analysis.isTarget ? "bg-slate-900 border-blue-500/40 shadow-blue-500/10 shadow-lg" : "bg-slate-900/40 border-slate-800"
        )}>
            <div
                className="flex justify-between items-center p-6 cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-6">
                    {/* Ticker & Logo */}
                    <div className="flex items-center gap-3">
                        <img
                            src={getLogoUrl(analysis.ticker)}
                            alt={analysis.ticker}
                            className="w-10 h-10 object-contain rounded-full bg-white/10 p-1"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <div className="space-y-0.5">
                            <span className="font-black text-2xl text-white tracking-tighter flex items-center gap-2">
                                {analysis.ticker}
                                {analysis.isTarget && <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-[9px] h-5">Target</Badge>}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                <Clock size={10} />
                                {new Date(analysis.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats (Sentiment & CAGR) - Visible when collapsed */}
                    <div className="hidden md:flex items-center gap-4 border-l border-slate-800 pl-6 h-10">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Signal</span>
                            <span className={cn("text-sm font-black uppercase tracking-tight",
                                analysis.sentiment === 'Bullish' ? "text-emerald-400" :
                                    analysis.sentiment === 'Bearish' ? "text-red-400" :
                                        "text-slate-400"
                            )}>
                                {analysis.sentiment}
                            </span>
                        </div>
                        {analysis.cagr && (
                            <div className="flex flex-col">
                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Est. CAGR</span>
                                <span className="text-sm font-black text-white tracking-tight">
                                    {analysis.cagr}
                                </span>
                            </div>
                        )}
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] uppercase font-black tracking-[0.2em] h-5">
                            Single Shot
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white"
                    >
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                        onClick={downloadMarkdown}
                        title="Save as Markdown File"
                    >
                        <Download size={14} />
                    </Button>
                </div>
            </div>

            {isOpen && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                    <div className={cn(
                        "grid grid-cols-1 gap-8 mb-6 lg:grid-cols-2 lg:divide-x lg:divide-slate-800"
                    )}>
                        {/* Left Column: Fundamental Analysis */}
                        <div className="text-sm pr-2 max-h-[600px] overflow-y-auto text-slate-300">
                            <div className="flex items-center justify-between mb-4 border-b border-emerald-500/20 pb-2">
                                <div className="flex items-center gap-2 text-emerald-400 font-black uppercase text-[10px] tracking-[0.2em]">
                                    <Database size={12} />
                                    Fundamental Analyst
                                </div>
                                {onRefresh && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-slate-500 hover:text-emerald-400"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsRefreshingFundamental(true);
                                            onRefresh(analysis.ticker, 'fundamental').finally(() => setIsRefreshingFundamental(false));
                                        }}
                                        disabled={isRefreshingFundamental}
                                        title="Refresh Fundamental Analysis"
                                    >
                                        <RefreshCw size={12} className={isRefreshingFundamental ? 'animate-spin' : ''} />
                                    </Button>
                                )}
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-slate-100 prose-a:text-blue-400 prose-strong:text-white prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ node, ...props }: any) => <h1 className="text-2xl font-black text-white border-b border-white/10 pb-2 mb-4 uppercase tracking-tighter" {...props} />,
                                        h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold text-slate-100 mt-6 mb-2" {...props} />,
                                        h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold text-slate-200 mt-4 mb-2" {...props} />,
                                        ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 space-y-1 my-2 marker:text-emerald-500" {...props} />,
                                        li: ({ node, ...props }: any) => <li className="text-slate-300 pl-1" {...props} />,
                                        strong: ({ node, ...props }: any) => <strong className="text-white font-black" {...props} />,
                                        hr: ({ node, ...props }: any) => <hr className="my-6 border-slate-700" {...props} />,
                                        table: ({ node, ...props }: any) => <table className="w-full text-left border-collapse my-4" {...props} />,
                                        th: ({ node, ...props }: any) => <th className="border-b border-slate-700 p-2 text-slate-100 font-bold" {...props} />,
                                        td: ({ node, ...props }: any) => <td className="border-b border-slate-800 p-2 text-slate-400" {...props} />
                                    }}
                                >
                                    {analysis.summary}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Always show this section, but display placeholder if data is missing */}
                        <div className={cn("text-sm lg:pl-8 max-h-[600px] overflow-y-auto text-slate-300 border-t lg:border-t-0 border-slate-800 pt-6 lg:pt-0", !analysis.sevenPowers && "hidden lg:block")}>
                            <div className="flex items-center justify-between mb-4 border-b border-blue-500/20 pb-2">
                                <div className="flex items-center gap-2 text-blue-400 font-black uppercase text-[10px] tracking-[0.2em]">
                                    <ShieldCheck size={12} />
                                    Strategic Analyst (7 Powers)
                                </div>
                                {onRefresh && analysis.sevenPowers && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-slate-500 hover:text-blue-400"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsRefreshingSevenPowers(true);
                                            onRefresh(analysis.ticker, 'sevenPowers').finally(() => setIsRefreshingSevenPowers(false));
                                        }}
                                        disabled={isRefreshingSevenPowers}
                                        title="Refresh 7 Powers Analysis"
                                    >
                                        <RefreshCw size={12} className={isRefreshingSevenPowers ? 'animate-spin' : ''} />
                                    </Button>
                                )}
                            </div>
                            {analysis.sevenPowers ? (
                                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-slate-100 prose-a:text-blue-400 prose-strong:text-white prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ node, ...props }: any) => <h1 className="text-2xl font-black text-white border-b border-white/10 pb-2 mb-4 uppercase tracking-tighter" {...props} />,
                                            h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold text-slate-100 mt-6 mb-2" {...props} />,
                                            h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold text-slate-200 mt-4 mb-2" {...props} />,
                                            ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 space-y-1 my-2 marker:text-blue-500" {...props} />,
                                            li: ({ node, ...props }: any) => <li className="text-slate-300 pl-1" {...props} />,
                                            strong: ({ node, ...props }: any) => <strong className="text-white font-black" {...props} />,
                                            hr: ({ node, ...props }: any) => <hr className="my-6 border-slate-700" {...props} />,
                                            table: ({ node, ...props }: any) => <table className="w-full text-left border-collapse my-4" {...props} />,
                                            th: ({ node, ...props }: any) => <th className="border-b border-slate-700 p-2 text-slate-100 font-bold" {...props} />,
                                            td: ({ node, ...props }: any) => <td className="border-b border-slate-800 p-2 text-slate-400" {...props} />
                                        }}
                                    >
                                        {analysis.sevenPowers}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center text-slate-600 space-y-2 border-2 border-dashed border-slate-800 rounded-lg opacity-50">
                                    <ShieldCheck size={24} className="opacity-20 mb-2" />
                                    <p className="text-[10px] font-medium uppercase tracking-widest opacity-50 text-center px-4">Analysis Pending or Unavailable</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Parallel Runs (Sub-Runs) for Target Holding */}
                    {analysis.isTarget && analysis.subRuns && (
                        <div className="mt-8 border-t border-slate-800/60 pt-6">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setShowSubRuns(!showSubRuns); }}
                                className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 hover:bg-blue-500/5 transition-all p-0 h-auto gap-2"
                            >
                                <Database size={12} />
                                {showSubRuns ? 'Hide Parallel Runs' : 'Explore 3 Parallel Intelligence Runs'}
                                {showSubRuns ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </Button>

                            {showSubRuns && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                    {analysis.subRuns.map((run, i) => (
                                        <div key={i} className="bg-black/40 border border-slate-800 rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Run #{i + 1}</span>
                                                <span className="text-[9px] font-bold text-emerald-500">${run.usage.cost.toFixed(4)}</span>
                                            </div>
                                            <ScrollArea className="h-40 text-[10px] text-slate-400 leading-relaxed font-mono italic">
                                                <div className="prose prose-invert prose-xs">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {run.summary}
                                                    </ReactMarkdown>
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-800/60 flex flex-wrap gap-4">
                        {analysis.sources.slice(0, 3).map((source, i) => (
                            <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer"
                                className="text-[9px] text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1 font-bold bg-slate-950/40 px-2 py-1 rounded border border-slate-800 uppercase tracking-tighter">
                                <LinkIcon size={10} /> {source.title.length > 20 ? source.title.substring(0, 20) + '...' : source.title}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const AnalysisDashboard: React.FC<Props> = ({ status, logs, analyses, previousAnalyses, previousDecisions, tradeDecision, tickerStatuses, portfolio, totalCost, onRefreshAnalysis, onRefreshDecision }) => {
    const [showComplexitySubRuns, setShowComplexitySubRuns] = useState(false);
    const [isRefreshingDecision, setIsRefreshingDecision] = useState(false);

    // Merge current analyses with cached portfolio holding analyses (that aren't already in current run)
    const mergedArchiveAnalyses = useMemo(() => {
        const currentTickers = new Set(analyses.map(a => a.ticker));
        const portfolioTickers = new Set(portfolio.map(p => p.symbol));

        // Cached portfolio analyses not in current run
        const cachedPortfolioAnalyses = previousAnalyses
            .filter(a => portfolioTickers.has(a.ticker) && !currentTickers.has(a.ticker));

        // Combine: current analyses + cached portfolio analyses, deduplicate by ticker
        const seen = new Set<string>();
        const all: EquityAnalysis[] = [];
        for (const a of [...analyses, ...cachedPortfolioAnalyses]) {
            if (!seen.has(a.ticker)) {
                seen.add(a.ticker);
                all.push(a);
            }
        }

        // Separate targets from holdings
        const targets = all.filter(a => a.isTarget);
        const holdings = all.filter(a => !a.isTarget);

        // Sort holdings by portfolio value descending
        holdings.sort((a, b) => {
            const valA = portfolio.find(p => p.symbol === a.ticker)?.value || 0;
            const valB = portfolio.find(p => p.symbol === b.ticker)?.value || 0;
            return valB - valA;
        });

        return [...targets, ...holdings];
    }, [analyses, previousAnalyses, portfolio]);

    // Previous analyses: only non-portfolio tickers not in current run  
    const filteredPrevious = useMemo(() => {
        const currentTickers = new Set(analyses.map(a => a.ticker));
        const portfolioTickers = new Set(portfolio.map(p => p.symbol));

        // Only "other targets" — not portfolio holdings and not in current run
        const prevOther = previousAnalyses.filter(
            a => !portfolioTickers.has(a.ticker) && !currentTickers.has(a.ticker)
        );

        // Sort by timestamp descending (most recent first)
        prevOther.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        return prevOther;
    }, [previousAnalyses, analyses, portfolio]);

    return (
        <div className="space-y-6">
            {/* Agent Command Center Log */}
            <Card className="bg-slate-900 border-slate-800 text-slate-100 overflow-hidden shadow-2xl">
                <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agent Command Center</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Coins size={12} className="text-yellow-400" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-none">
                                Total Cost: <span className="text-emerald-400">${totalCost.toFixed(4)}</span>
                            </span>
                        </div>
                        <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
                        <div className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", status === AgentStatus.IDLE ? "bg-slate-500" : status === AgentStatus.ERROR ? "bg-red-500" : "bg-emerald-500 animate-pulse")}></span>
                            <span className="text-[10px] uppercase font-mono text-slate-500">{status}</span>
                        </div>
                    </div>
                </div>
                <ScrollArea className="h-40 bg-black/40 p-4 font-mono text-[11px]">
                    <div className="space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-4 items-start">
                                <span className="text-slate-600 whitespace-nowrap opacity-50">{log.timestamp.toLocaleTimeString()}</span>
                                <span className="text-indigo-400 font-bold whitespace-nowrap">[{log.agent}]:</span>
                                <span className={log.isCacheHit ? 'text-emerald-400/80' : 'text-slate-300'}>
                                    {log.message}
                                    {log.isCacheHit && <span className="ml-2 text-[9px] bg-emerald-500/10 px-1 rounded border border-emerald-500/20 italic">Archive Hit</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* Intelligence Swarm Status Board */}
            {tickerStatuses.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {tickerStatuses.map((ts) => (
                        <div key={ts.ticker} className={cn(
                            "p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-300",
                            ts.state === 'COMPLETED' ? "bg-emerald-950/20 border-emerald-500/30" :
                                ts.state === 'RESEARCHING' ? "bg-blue-950/20 border-blue-500/50 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.2)]" :
                                    ts.state === 'ERROR' ? "bg-red-950/20 border-red-500/30" :
                                        "bg-slate-900 border-slate-800 opacity-50"
                        )}>
                            <div className="flex items-center gap-1.5 w-full justify-between">
                                <span className="font-black text-xs tracking-tighter text-white flex items-center gap-1.5">
                                    <img
                                        src={getLogoUrl(ts.ticker)}
                                        alt={ts.ticker}
                                        className="w-4 h-4 object-contain rounded-full bg-white/10"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                    {ts.ticker}
                                </span>
                                {ts.isTarget && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>}
                            </div>
                            <div className="flex items-center gap-2 w-full">
                                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={cn(
                                        "h-full transition-all duration-500",
                                        ts.state === 'COMPLETED' ? "w-full bg-emerald-500" :
                                            ts.state === 'RESEARCHING' ? "w-1/2 bg-blue-500" :
                                                ts.state === 'ERROR' ? "w-full bg-red-500" :
                                                    "w-0"
                                    )}></div>
                                </div>
                                <span className="text-[8px] font-black uppercase text-slate-500 whitespace-nowrap">
                                    {ts.state === 'COMPLETED' ? (
                                        <span className="text-emerald-400">
                                            ${(analyses.find(a => a.ticker === ts.ticker)?.usage?.cost || 0).toFixed(4)}
                                        </span>
                                    ) : ts.state === 'RESEARCHING' ? (
                                        'Analysing'
                                    ) : (
                                        ts.state.toLowerCase()
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Intelligence Archive (Analyses) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-800/20 border-slate-700/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-xl uppercase tracking-tight text-slate-100">
                                <Database className="text-blue-400" size={20} />
                                Intelligence Archive
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mergedArchiveAnalyses.length === 0 ? (
                                    <div className="h-48 flex flex-col items-center justify-center text-slate-600 space-y-2">
                                        <ShieldCheck size={48} className="opacity-10 mb-2" />
                                        <p className="text-sm font-medium uppercase tracking-widest opacity-50">Archive Empty</p>
                                    </div>
                                ) : (
                                    mergedArchiveAnalyses.map((analysis) => {
                                        const cachedDecision = previousDecisions.find(d => d.targetTicker === analysis.ticker);
                                        return (
                                            <div key={`${analysis.ticker}-${analysis.isTarget}`} className="space-y-2">
                                                <CollapsibleAnalysisCard analysis={analysis} onRefresh={onRefreshAnalysis} />
                                                {cachedDecision && !tradeDecision && (
                                                    <div className="ml-4 p-3 bg-purple-950/10 rounded-xl border border-purple-500/20">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 font-mono text-[9px] uppercase tracking-widest">Cached Decision</Badge>
                                                            <span className="text-[9px] text-slate-500 font-bold uppercase">
                                                                {new Date(cachedDecision.timestamp).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className={cn("text-2xl font-black italic",
                                                                cachedDecision.complexity.decision === 'BUY' ? "text-purple-400" :
                                                                    cachedDecision.complexity.decision === 'SELL' ? "text-red-400" :
                                                                        "text-slate-500"
                                                            )}>
                                                                {cachedDecision.complexity.decision}
                                                            </span>
                                                            <div className="flex-1 space-y-1">
                                                                <div className="text-[9px] text-slate-500 uppercase tracking-widest">
                                                                    {cachedDecision.complexity.analysis.classification.split(':')[0]}
                                                                </div>
                                                                <div className="text-xs text-slate-400">
                                                                    {cachedDecision.complexity.action_details.target_allocation}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 italic">
                                                                    &quot;{cachedDecision.complexity.action_details.reasoning.length > 120
                                                                        ? cachedDecision.complexity.action_details.reasoning.substring(0, 120) + '...'
                                                                        : cachedDecision.complexity.action_details.reasoning}&quot;
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Executive Strategy (PM Decision) */}
                <div className="lg:col-span-1">
                    <Card className="bg-slate-800/20 border-slate-700/50 backdrop-blur-sm sticky top-8">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-xl uppercase tracking-tight text-slate-100">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="text-emerald-400" />
                                    Portfolio Manager
                                </div>
                                {tradeDecision && onRefreshDecision && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-500 hover:text-purple-400"
                                        onClick={() => {
                                            setIsRefreshingDecision(true);
                                            onRefreshDecision().finally(() => setIsRefreshingDecision(false));
                                        }}
                                        disabled={isRefreshingDecision}
                                        title="Re-run Portfolio Decision"
                                    >
                                        <RefreshCw size={14} className={isRefreshingDecision ? 'animate-spin' : ''} />
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tradeDecision ? (
                                <div className="space-y-8">
                                    {/* Complexity PM */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 font-mono text-[9px] uppercase tracking-widest">Complexity Manager</Badge>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                Cost: <span className="text-purple-400">${(tradeDecision.complexity.usage?.cost || 0).toFixed(4)}</span>
                                            </span>
                                        </div>

                                        <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-xl border-2 border-purple-500/20 text-center shadow-inner">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase mb-2 tracking-widest bg-slate-900 px-2 py-1 rounded">
                                                {tradeDecision.complexity.analysis.classification.split(':')[0]}
                                            </span>
                                            <span className={cn("text-5xl font-black mb-3 italic",
                                                tradeDecision.complexity.decision === 'BUY' ? "text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]" :
                                                    tradeDecision.complexity.decision === 'SELL' ? "text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]" :
                                                        "text-slate-500"
                                            )}>
                                                {tradeDecision.complexity.decision}
                                            </span>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">NZS Score</span>
                                                <span className="text-xs font-bold text-slate-200">{tradeDecision.complexity.analysis.nzs_score}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-4 bg-purple-950/20 rounded-xl border border-purple-500/20 flex flex-col gap-2">
                                                <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Allocation Strategy</h3>
                                                <div className="flex justify-between items-center text-sm font-bold text-slate-200">
                                                    <span>{tradeDecision.complexity.action_details.target_allocation}</span>
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">
                                                    Using: <span className="text-white">{tradeDecision.complexity.action_details.funding_source}</span>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300 text-sm italic leading-relaxed">
                                                "{tradeDecision.complexity.action_details.reasoning}"
                                            </div>

                                            {/* Sub-runs for Complexity PM */}
                                            {tradeDecision.complexity.subRuns && (
                                                <div className="mt-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowComplexitySubRuns(!showComplexitySubRuns)}
                                                        className="text-[9px] font-black uppercase text-purple-400 p-0 h-auto hover:bg-transparent"
                                                    >
                                                        {showComplexitySubRuns ? 'Hide Details' : 'View 3 Parallel Complexity Paths'}
                                                    </Button>
                                                    {showComplexitySubRuns && (
                                                        <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-2">
                                                            {tradeDecision.complexity.subRuns.map((run, i) => (
                                                                <div key={i} className="p-2 bg-black/40 rounded border border-slate-800 text-[10px] space-y-1">
                                                                    <div className="flex justify-between font-black text-slate-500 uppercase">
                                                                        <span>Run #{i + 1}: {run.decision}</span>
                                                                        <span className="text-purple-500/70">${run.usage.cost.toFixed(4)}</span>
                                                                    </div>
                                                                    <p className="text-slate-400 italic">"{run.reasoning}"</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-600 space-y-4 border-2 border-dashed border-slate-800 rounded-xl opacity-30">
                                    <Briefcase size={40} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Strategy Pending Data</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Previous Analyses Section — Other Targets only (portfolio holdings are in Intelligence Archive) */}
            {filteredPrevious.length > 0 && (
                <div className="space-y-6 mt-8">
                    <div className="flex items-center gap-3 border-b border-slate-700/50 pb-4">
                        <div className="bg-gradient-to-br from-amber-600 to-orange-700 p-2 rounded-xl">
                            <History className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-slate-100">Previous Analyses</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{filteredPrevious.length} previous target{filteredPrevious.length !== 1 ? 's' : ''} from prior sessions</p>
                        </div>
                    </div>

                    {filteredPrevious.map(analysis => {
                        // Find the cached decision for this target
                        const cachedDecision = previousDecisions.find(d => d.targetTicker === analysis.ticker);
                        return (
                            <div key={`prev-other-${analysis.ticker}`} className="space-y-3">
                                <CollapsibleAnalysisCard analysis={analysis} />
                                {cachedDecision && (
                                    <div className="ml-4 p-4 bg-purple-950/10 rounded-xl border border-purple-500/20">
                                        <div className="flex items-center justify-between mb-3">
                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 font-mono text-[9px] uppercase tracking-widest">Cached Decision</Badge>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase">
                                                {new Date(cachedDecision.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn("text-3xl font-black italic",
                                                cachedDecision.complexity.decision === 'BUY' ? "text-purple-400" :
                                                    cachedDecision.complexity.decision === 'SELL' ? "text-red-400" :
                                                        "text-slate-500"
                                            )}>
                                                {cachedDecision.complexity.decision}
                                            </span>
                                            <div className="flex-1 space-y-1">
                                                <div className="text-[9px] text-slate-500 uppercase tracking-widest">
                                                    {cachedDecision.complexity.analysis.classification.split(':')[0]}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {cachedDecision.complexity.action_details.target_allocation}
                                                </div>
                                                <div className="text-[10px] text-slate-500 italic">
                                                    "{cachedDecision.complexity.action_details.reasoning.length > 150
                                                        ? cachedDecision.complexity.action_details.reasoning.substring(0, 150) + '...'
                                                        : cachedDecision.complexity.action_details.reasoning}"
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AnalysisDashboard;

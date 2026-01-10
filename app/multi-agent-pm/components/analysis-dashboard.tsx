'use client';

import React, { useState, useMemo } from 'react';
import { Activity, ShieldCheck, TrendingUp, Link as LinkIcon, Download, Clock, Database, Coins, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { EquityAnalysis, TradeDecision, PortfolioItem, ComplexityDecision } from '@/lib/gemini-service';
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
}

interface Props {
    status: AgentStatus;
    logs: AnalysisLog[];
    analyses: EquityAnalysis[];
    tradeDecision: { standard: TradeDecision, complexity: ComplexityDecision } | null;
    tickerStatuses: TickerStatus[];
    portfolio: PortfolioItem[];
}

const CollapsibleAnalysisCard = ({ analysis }: { analysis: EquityAnalysis }) => {
    const [isOpen, setIsOpen] = useState(false);

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
                        "grid grid-cols-1 gap-8 mb-6",
                        analysis.sevenPowers ? "lg:grid-cols-2 lg:divide-x lg:divide-slate-800" : ""
                    )}>
                        {/* Left Column: Fundamental Analysis */}
                        <div className="text-sm pr-2 max-h-[600px] overflow-y-auto text-slate-300">
                            {analysis.sevenPowers && (
                                <div className="flex items-center gap-2 mb-4 text-emerald-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-emerald-500/20 pb-2">
                                    <Database size={12} />
                                    Fundamental Analyst
                                </div>
                            )}
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

                        {/* Right Column: 7 Powers (Strategic Analysis) */}
                        {analysis.sevenPowers && (
                            <div className="text-sm lg:pl-8 max-h-[600px] overflow-y-auto text-slate-300 border-t lg:border-t-0 border-slate-800 pt-6 lg:pt-0">
                                <div className="flex items-center gap-2 mb-4 text-blue-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-blue-500/20 pb-2">
                                    <ShieldCheck size={12} />
                                    Strategic Analyst (7 Powers)
                                </div>
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
                            </div>
                        )}
                    </div>

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

const AnalysisDashboard: React.FC<Props> = ({ status, logs, analyses, tradeDecision, tickerStatuses, portfolio }) => {

    const sortedAnalyses = useMemo(() => {
        // 1. Separate Target(s)
        const targets = analyses.filter(a => a.isTarget);
        // 2. Separate Portfolio Holdings
        const holdings = analyses.filter(a => !a.isTarget);

        // 3. Sort Holdings by Portfolio Value (Descending)
        // We look up the value in the portfolio prop
        holdings.sort((a, b) => {
            const valA = portfolio.find(p => p.symbol === a.ticker)?.value || 0;
            const valB = portfolio.find(p => p.symbol === b.ticker)?.value || 0;
            return valB - valA;
        });

        // 4. Combine: Target first, then sorted holdings
        return [...targets, ...holdings];
    }, [analyses, portfolio]);

    return (
        <div className="space-y-6">
            {/* Agent Command Center Log */}
            <Card className="bg-slate-900 border-slate-800 text-slate-100 overflow-hidden shadow-2xl">
                <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agent Command Center</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", status === AgentStatus.IDLE ? "bg-slate-500" : status === AgentStatus.ERROR ? "bg-red-500" : "bg-emerald-500 animate-pulse")}></span>
                        <span className="text-[10px] uppercase font-mono text-slate-500">{status}</span>
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
                                    {ts.state === 'RESEARCHING' ? 'Analysing' : ts.state.toLowerCase()}
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
                                {analyses.length === 0 ? (
                                    <div className="h-48 flex flex-col items-center justify-center text-slate-600 space-y-2">
                                        <ShieldCheck size={48} className="opacity-10 mb-2" />
                                        <p className="text-sm font-medium uppercase tracking-widest opacity-50">Archive Empty</p>
                                    </div>
                                ) : (
                                    sortedAnalyses.map((analysis) => (
                                        <CollapsibleAnalysisCard key={`${analysis.ticker}-${analysis.isTarget}`} analysis={analysis} />
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Executive Strategy (PM Decision) */}
                <div className="lg:col-span-1">
                    <Card className="bg-slate-800/20 border-slate-700/50 backdrop-blur-sm sticky top-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-xl uppercase tracking-tight text-slate-100">
                                <TrendingUp className="text-emerald-400" />
                                Executive Strategy
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tradeDecision ? (
                                <div className="space-y-8">
                                    {/* Standard PM */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono text-[9px] uppercase tracking-widest">Standard Manager</Badge>
                                        </div>

                                        <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-xl border-2 border-emerald-500/20 text-center shadow-inner">
                                            <span className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Recommended Action</span>
                                            <span className={cn("text-5xl font-black mb-3 italic",
                                                tradeDecision.standard.action === 'BUY' ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]" :
                                                    tradeDecision.standard.action === 'SELL' ? "text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]" :
                                                        tradeDecision.standard.action === 'TRIM' ? "text-orange-400" :
                                                            "text-slate-500"
                                            )}>
                                                {tradeDecision.standard.action}
                                            </span>
                                            <span className="text-xl font-black text-slate-100 tracking-tighter">{tradeDecision.standard.ticker}</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-4 bg-blue-950/30 rounded-xl border border-blue-500/20 flex items-center gap-4">
                                                <Coins className="text-blue-400" size={20} />
                                                <div>
                                                    <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Funding</h3>
                                                    <p className="text-slate-100 text-sm font-bold">{tradeDecision.standard.fundingSource}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300 text-sm italic leading-relaxed">
                                                "{tradeDecision.standard.rationale}"
                                            </div>
                                        </div>
                                    </div>

                                    {/* Complexity PM */}
                                    <div className="space-y-6 border-t-2 border-dashed border-slate-800 pt-8">
                                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 font-mono text-[9px] uppercase tracking-widest">Complexity Manager</Badge>
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
        </div>
    );
};

export default AnalysisDashboard;

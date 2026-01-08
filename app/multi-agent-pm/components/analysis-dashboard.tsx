'use client';

import React from 'react';
import { Activity, ShieldCheck, TrendingUp, Link as LinkIcon, Download, Clock, Database, Coins, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { EquityAnalysis, TradeDecision } from '@/lib/gemini-service';
import { MarkdownLite } from '@/components/markdown-lite';
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
    tradeDecision: TradeDecision | null;
    tickerStatuses: TickerStatus[];
}

const AnalysisDashboard: React.FC<Props> = ({ status, logs, analyses, tradeDecision, tickerStatuses }) => {

    const downloadMarkdown = (analysis: EquityAnalysis) => {
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
                            <div className="space-y-8">
                                {analyses.length === 0 ? (
                                    <div className="h-48 flex flex-col items-center justify-center text-slate-600 space-y-2">
                                        <ShieldCheck size={48} className="opacity-10 mb-2" />
                                        <p className="text-sm font-medium uppercase tracking-widest opacity-50">Archive Empty</p>
                                    </div>
                                ) : (
                                    analyses.map((analysis) => (
                                        <div key={`${analysis.ticker}-${analysis.isTarget}`} className={cn(
                                            "group p-6 rounded-xl border transition-all duration-500",
                                            analysis.isTarget ? "bg-slate-900 border-blue-500/40 shadow-blue-500/10 shadow-lg" : "bg-slate-900/40 border-slate-800"
                                        )}>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={getLogoUrl(analysis.ticker)}
                                                            alt={analysis.ticker}
                                                            className="w-8 h-8 object-contain rounded-full bg-white/10"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                        <span className="font-black text-3xl text-white tracking-tighter">{analysis.ticker}</span>
                                                        {analysis.isTarget && <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-[9px]">Strategic Target</Badge>}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                        <Clock size={10} />
                                                        Freshness: {new Date(analysis.timestamp).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                                                        onClick={() => downloadMarkdown(analysis)}
                                                        title="Save as Markdown File"
                                                    >
                                                        <Download size={14} />
                                                    </Button>
                                                    <Badge variant="outline" className={cn("uppercase text-[10px] font-black",
                                                        analysis.sentiment === 'Bullish' ? "bg-emerald-950/50 text-emerald-400 border-emerald-500/30" :
                                                            analysis.sentiment === 'Bearish' ? "bg-red-950/50 text-red-400 border-red-500/30" :
                                                                "bg-slate-800 text-slate-400 border-slate-700"
                                                    )}>
                                                        {analysis.sentiment} Signal
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="text-sm pr-2 mb-6 max-h-[500px] overflow-y-auto text-slate-300">
                                                <MarkdownLite content={analysis.summary} />
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
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-xl border-2 border-emerald-500/20 text-center shadow-inner">
                                        <span className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Recommended Action</span>
                                        <span className={cn("text-5xl font-black mb-3 italic",
                                            tradeDecision.action === 'BUY' ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]" :
                                                tradeDecision.action === 'SELL' ? "text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]" :
                                                    tradeDecision.action === 'TRIM' ? "text-orange-400" :
                                                        "text-slate-500"
                                        )}>
                                            {tradeDecision.action}
                                        </span>
                                        <span className="text-xl font-black text-slate-100 tracking-tighter">{tradeDecision.ticker}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-950/30 rounded-xl border border-blue-500/20 flex items-center gap-4">
                                            <Coins className="text-blue-400" size={20} />
                                            <div>
                                                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Funding</h3>
                                                <p className="text-slate-100 text-sm font-bold">{tradeDecision.fundingSource}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300 text-sm italic leading-relaxed">
                                            "{tradeDecision.rationale}"
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

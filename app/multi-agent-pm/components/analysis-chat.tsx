'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Loader2, ChevronDown, Sparkles, User, X, DollarSign, Wrench, GripVertical } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { EquityAnalysis, PortfolioItem, ComplexityDecision } from '@/lib/gemini-service';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

interface ChatUsage {
    tokens: number;
    cost: number;
}

interface ActiveTool {
    name: string;
    ticker?: string;
}

interface AnalysisChatProps {
    analyses: EquityAnalysis[];
    previousAnalyses?: EquityAnalysis[];
    previousDecisions?: { complexity: ComplexityDecision; targetTicker: string; timestamp: number }[];
    portfolio: PortfolioItem[];
    tradeDecision: { complexity: ComplexityDecision } | null;
    targetTicker: string;
    disabled?: boolean;
}

const USAGE_MARKER = '<!--USAGE:';
const TOOL_START_MARKER = '<!--TOOL_START:';
const TOOL_DONE_MARKER = '<!--TOOL_DONE:';

const TOOL_LABELS: Record<string, string> = {
    run_equity_analysis: 'Equity Analysis',
    run_seven_powers_analysis: '7 Powers Analysis',
    run_portfolio_decision: 'PM Decision',
    get_stock_price: 'Price Lookup',
    get_cached_analysis: 'Cache Lookup',
};

function stripMarkers(text: string): string {
    // Remove all tool and usage markers from displayed text
    return text
        .replace(/<!--TOOL_START:.*?-->\n?/g, '')
        .replace(/<!--TOOL_DONE:.*?-->\n?/g, '')
        .replace(/\n?<!--USAGE:.*?-->/g, '');
}

function extractUsageFromText(text: string): { cleanText: string; usage: ChatUsage | null } {
    const cleanText = stripMarkers(text);
    const markerIndex = text.lastIndexOf(USAGE_MARKER);
    if (markerIndex === -1) return { cleanText, usage: null };

    const jsonStart = markerIndex + USAGE_MARKER.length;
    const jsonEnd = text.indexOf('-->', jsonStart);
    if (jsonEnd === -1) return { cleanText, usage: null };

    try {
        const usage = JSON.parse(text.substring(jsonStart, jsonEnd));
        return { cleanText, usage };
    } catch {
        return { cleanText, usage: null };
    }
}

function parseActiveTools(text: string): ActiveTool | null {
    // Find tools that have started but not finished
    const starts: { name: string; ticker?: string; index: number }[] = [];
    const doneNames = new Set<string>();

    let idx = 0;
    while (true) {
        const startIdx = text.indexOf(TOOL_START_MARKER, idx);
        if (startIdx === -1) break;
        const endIdx = text.indexOf('-->', startIdx);
        if (endIdx === -1) break;
        try {
            const json = JSON.parse(text.substring(startIdx + TOOL_START_MARKER.length, endIdx));
            starts.push({ name: json.name, ticker: json.args?.ticker || json.args?.targetTicker, index: startIdx });
        } catch { }
        idx = endIdx + 3;
    }

    idx = 0;
    while (true) {
        const doneIdx = text.indexOf(TOOL_DONE_MARKER, idx);
        if (doneIdx === -1) break;
        const endIdx = text.indexOf('-->', doneIdx);
        if (endIdx === -1) break;
        try {
            const json = JSON.parse(text.substring(doneIdx + TOOL_DONE_MARKER.length, endIdx));
            doneNames.add(json.name);
        } catch { }
        idx = endIdx + 3;
    }

    // Find last started tool that isn't done
    for (let i = starts.length - 1; i >= 0; i--) {
        if (!doneNames.has(starts[i].name)) {
            return starts[i];
        }
    }
    return null;
}

function buildContext(props: AnalysisChatProps): string {
    const { analyses, previousAnalyses = [], previousDecisions = [], portfolio, tradeDecision, targetTicker } = props;

    // Merge: current-run analyses take priority, then fill in from cache
    const currentTickers = new Set(analyses.map(a => a.ticker));
    const cachedExtras = previousAnalyses.filter(a => !currentTickers.has(a.ticker));
    const allAnalyses = [...analyses, ...cachedExtras];

    // Only include portfolio holdings + target in full context
    const portfolioTickers = new Set(portfolio.map(p => p.symbol));
    const contextAnalyses = allAnalyses.filter(
        a => a.ticker === targetTicker || portfolioTickers.has(a.ticker)
    );

    const targetAnalysis = contextAnalyses.find(a => a.ticker === targetTicker);
    const holdingAnalyses = contextAnalyses.filter(a => a.ticker !== targetTicker);

    // Track non-portfolio cached tickers that are available via tool
    const availableCachedTickers = allAnalyses
        .filter(a => a.ticker !== targetTicker && !portfolioTickers.has(a.ticker))
        .map(a => ({ ticker: a.ticker, date: a.timestamp ? new Date(a.timestamp).toLocaleDateString() : 'unknown' }));

    const totalValue = portfolio.reduce((sum, p) => sum + p.value, 0);

    let ctx = `# Analysis Session: ${targetTicker}\n\n`;

    ctx += `## Current Portfolio (${portfolio.length} holdings, $${totalValue.toLocaleString()} total)\n`;
    portfolio.forEach(p => {
        const weight = totalValue > 0 ? ((p.value / totalValue) * 100).toFixed(1) : '0.0';
        ctx += `- **${p.symbol}**: ${p.shares} shares, $${p.value.toLocaleString()} (${weight}%)\n`;
    });
    ctx += '\n';

    if (targetAnalysis) {
        const age = targetAnalysis.timestamp ? ` (analysed ${new Date(targetAnalysis.timestamp).toLocaleDateString()})` : '';
        ctx += `## TARGET: ${targetAnalysis.ticker}${age}\n`;
        ctx += `### Fundamental Analysis\n${targetAnalysis.summary}\n\n`;
        if (targetAnalysis.sevenPowers) {
            ctx += `### 7 Powers Strategic Analysis\n${targetAnalysis.sevenPowers}\n\n`;
        }
    }

    if (holdingAnalyses.length > 0) {
        ctx += `## Portfolio Holdings Analysis (${holdingAnalyses.length} companies)\n`;
        holdingAnalyses.forEach(a => {
            const age = a.timestamp ? ` (analysed ${new Date(a.timestamp).toLocaleDateString()})` : '';
            ctx += `### ${a.ticker}${age}\n`;
            ctx += `${a.summary}\n\n`;
            if (a.sevenPowers) {
                ctx += `#### 7 Powers\n${a.sevenPowers}\n\n`;
            }
        });
    }

    if (tradeDecision?.complexity) {
        const d = tradeDecision.complexity;
        ctx += `## Portfolio Manager Decision (Current Session)\n`;
        ctx += `- **Decision:** ${d.decision}\n`;
        ctx += `- **Classification:** ${d.analysis.classification}\n`;
        ctx += `- **S-Curve Status:** ${d.analysis.s_curve_status}\n`;
        ctx += `- **NZS Score:** ${d.analysis.nzs_score}\n`;
        ctx += `- **Target Allocation:** ${d.action_details.target_allocation}\n`;
        ctx += `- **Weighting Assessment:** ${d.action_details.weighting_assessment}\n`;
        ctx += `- **Funding Source:** ${d.action_details.funding_source}\n`;
        ctx += `- **Reasoning:** ${d.action_details.reasoning}\n`;
    }

    // Include previous PM decisions for context
    if (previousDecisions.length > 0) {
        ctx += `\n## Historical PM Decisions\n`;
        previousDecisions.forEach(d => {
            const date = new Date(d.timestamp).toLocaleDateString();
            ctx += `### ${d.targetTicker} (${date})\n`;
            ctx += `- **Decision:** ${d.complexity.decision}\n`;
            ctx += `- **Classification:** ${d.complexity.analysis.classification}\n`;
            ctx += `- **NZS Score:** ${d.complexity.analysis.nzs_score}\n`;
            ctx += `- **Target Allocation:** ${d.complexity.action_details.target_allocation}\n`;
            ctx += `- **Reasoning:** ${d.complexity.action_details.reasoning}\n\n`;
        });
    }

    // List other available cached analyses (retrievable via get_cached_analysis tool)
    if (availableCachedTickers.length > 0) {
        ctx += `\n## Other Cached Analyses Available (use get_cached_analysis tool to retrieve)\n`;
        availableCachedTickers.forEach(t => {
            ctx += `- ${t.ticker} (cached ${t.date})\n`;
        });
    }

    return ctx;
}

export default function AnalysisChat(props: AnalysisChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [totalUsage, setTotalUsage] = useState<ChatUsage>({ tokens: 0, cost: 0 });
    const [turnCount, setTurnCount] = useState(0);
    const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const contextRef = useRef<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Resize state
    const [size, setSize] = useState({ width: 440, height: 520 });
    const isResizing = useRef(false);
    const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

    const MIN_W = 360;
    const MAX_W = 800;
    const MIN_H = 380;
    const MAX_H = 900;

    const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
    }, [size]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const dx = resizeStart.current.x - e.clientX; // dragging left = bigger
            const dy = resizeStart.current.y - e.clientY; // dragging up = bigger
            setSize({
                width: Math.min(MAX_W, Math.max(MIN_W, resizeStart.current.w + dx)),
                height: Math.min(MAX_H, Math.max(MIN_H, resizeStart.current.h + dy)),
            });
        };
        const onMouseUp = () => { isResizing.current = false; };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    const getContext = () => {
        if (!contextRef.current) {
            contextRef.current = buildContext(props);
        }
        return contextRef.current;
    };

    useEffect(() => {
        contextRef.current = null;
    }, [props.analyses, props.previousAnalyses, props.previousDecisions, props.tradeDecision]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeTool]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: trimmed };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);
        setActiveTool(null);

        const assistantPlaceholder: ChatMessage = { role: 'model', text: '' };
        setMessages([...updatedMessages, assistantPlaceholder]);

        try {
            const response = await fetch('/api/agent-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: trimmed,
                    history: messages,
                    context: getContext(),
                    portfolio: props.portfolio,
                    analyses: props.analyses,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                // Check for active tool execution
                const tool = parseActiveTools(fullText);
                setActiveTool(tool);

                // Display clean text (stripped of markers)
                const cleanText = stripMarkers(fullText);
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: cleanText };
                    return newMessages;
                });
            }

            // Final extraction
            const { cleanText, usage } = extractUsageFromText(fullText);
            setActiveTool(null);

            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', text: cleanText };
                return newMessages;
            });

            if (usage) {
                setTotalUsage(prev => ({
                    tokens: prev.tokens + usage.tokens,
                    cost: prev.cost + usage.cost,
                }));
                setTurnCount(prev => prev + 1);
            }
        } catch (err: any) {
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                    role: 'model',
                    text: `⚠️ Error: ${err.message}`,
                };
                return newMessages;
            });
            setActiveTool(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearChat = () => {
        setMessages([]);
        setTotalUsage({ tokens: 0, cost: 0 });
        setTurnCount(0);
        setActiveTool(null);
        contextRef.current = null;
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-emerald-500/30 transition-all duration-300 hover:scale-105 font-bold text-sm uppercase tracking-wider"
            >
                <Sparkles size={18} />
                Ask about this analysis
            </button>
        );
    }

    return (
        <div
            ref={containerRef}
            className="fixed bottom-6 right-6 z-50 flex flex-col bg-gray-950 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl"
            style={{ width: size.width, height: size.height }}
        >
            {/* Resize handle — top-left corner */}
            <div
                onMouseDown={onResizeMouseDown}
                className="absolute top-0 left-0 w-6 h-6 cursor-nwse-resize z-10 flex items-end justify-end opacity-40 hover:opacity-100 transition-opacity"
                title="Drag to resize"
            >
                <GripVertical size={12} className="text-slate-500 -rotate-45 mb-0.5 mr-0.5" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-900/60 to-teal-900/40 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-400" />
                    <span className="font-bold text-sm text-slate-100 uppercase tracking-wider">Analysis Chat</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">{props.targetTicker}</span>
                </div>
                <div className="flex items-center gap-2">
                    {totalUsage.cost > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400/80 bg-amber-950/30 border border-amber-800/30 px-2 py-0.5 rounded-full" title={`${turnCount} turn${turnCount !== 1 ? 's' : ''}, ${totalUsage.tokens.toLocaleString()} tokens`}>
                            <DollarSign size={10} />
                            {totalUsage.cost.toFixed(4)}
                        </div>
                    )}
                    {messages.length > 0 && (
                        <button
                            onClick={handleClearChat}
                            className="text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"
                            title="Clear chat"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"
                    >
                        <ChevronDown size={16} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <MessageSquare className="text-slate-700 mb-3" size={28} />
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Ask anything</p>
                        <p className="text-slate-600 text-[11px] mt-1 max-w-[280px]">
                            I have full context on all {props.analyses.length} analyses, your portfolio, and the PM decision. I can also run new research on demand.
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-4 max-w-[320px] justify-center">
                            {[
                                `What's the CAGR estimate for ${props.targetTicker}?`,
                                'Analyze ASML for me',
                                'Should we add TSMC to the portfolio?',
                                'Compare the top 3 holdings by moat',
                            ].map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setInput(suggestion);
                                        setTimeout(() => inputRef.current?.focus(), 50);
                                    }}
                                    className="text-[10px] text-emerald-400/80 bg-emerald-950/30 border border-emerald-800/30 rounded-lg px-2.5 py-1.5 hover:bg-emerald-900/40 hover:border-emerald-700/40 transition-colors text-left"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'model' && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center mt-0.5">
                                <Sparkles size={12} className="text-white" />
                            </div>
                        )}
                        <div
                            className={`max-w-[340px] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100'
                                : 'bg-slate-800/60 border border-slate-700/40 text-slate-200'
                                }`}
                        >
                            {msg.role === 'model' ? (
                                <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700/50 prose-table:text-xs">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.text || (isLoading && i === messages.length - 1 ? '...' : '')}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <p>{msg.text}</p>
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center mt-0.5">
                                <User size={12} className="text-blue-300" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Tool execution indicator */}
                {activeTool && (
                    <div className="flex items-center gap-2.5 pl-9">
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-violet-300 bg-violet-950/40 border border-violet-800/30 rounded-lg px-3 py-2 animate-pulse">
                            <Wrench size={13} className="text-violet-400 animate-spin" style={{ animationDuration: '3s' }} />
                            <span>
                                Running {TOOL_LABELS[activeTool.name] || activeTool.name}
                                {activeTool.ticker && <span className="text-violet-400 font-mono ml-1">{activeTool.ticker}</span>}
                                ...
                            </span>
                        </div>
                    </div>
                )}

                {isLoading && !activeTool && messages[messages.length - 1]?.text === '' && (
                    <div className="flex items-center gap-2 text-slate-500 text-xs pl-9">
                        <Loader2 size={12} className="animate-spin" />
                        <span className="animate-pulse">Thinking...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-slate-800/50 bg-gray-950/80">
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question or request analysis..."
                        disabled={isLoading || props.disabled}
                        className="flex-1 bg-slate-900/80 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 disabled:opacity-50 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim() || props.disabled}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2.5 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Send size={16} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

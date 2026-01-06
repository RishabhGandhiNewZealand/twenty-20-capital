'use client';

import React from 'react';

interface Props {
    content: string;
}

/**
 * A lightweight, zero-dependency Markdown renderer for basic formatting.
 * Handles headers, bold text, bullet points, and paragraphs.
 */
export const MarkdownLite: React.FC<Props> = ({ content }) => {
    if (!content) return null;

    // Split into blocks by double newlines
    const blocks = content.split(/\n\n+/);

    return (
        <div className="space-y-4">
            {blocks.map((block, i) => {
                const trimmedBlock = block.trim();

                // 1. Headers
                if (trimmedBlock.startsWith('#')) {
                    const level = trimmedBlock.match(/^#+/)?.[0].length || 1;
                    const text = trimmedBlock.replace(/^#+\s*/, '');

                    const headerClasses = {
                        1: "text-2xl font-black text-white border-b border-white/10 pb-2 mb-4 uppercase tracking-tighter",
                        2: "text-xl font-bold text-slate-100 mt-6 mb-2",
                        3: "text-lg font-bold text-slate-200 mt-4 mb-2",
                        4: "text-md font-bold text-slate-300 mt-3 mb-1"
                    }[level as 1 | 2 | 3 | 4] || "text-lg font-bold";

                    if (level === 1) return <h1 key={i} className={headerClasses}>{renderInline(text)}</h1>;
                    if (level === 2) return <h2 key={i} className={headerClasses}>{renderInline(text)}</h2>;
                    if (level === 3) return <h3 key={i} className={headerClasses}>{renderInline(text)}</h3>;
                    return <h4 key={i} className={headerClasses}>{renderInline(text)}</h4>;
                }

                // 2. Lists
                if (trimmedBlock.startsWith('- ') || trimmedBlock.startsWith('* ') || /^\d+\.\s/.test(trimmedBlock)) {
                    const items = trimmedBlock.split('\n');
                    return (
                        <ul key={i} className="list-disc pl-5 space-y-2 marker:text-blue-500">
                            {items.map((item, j) => {
                                const text = item.replace(/^([-*]|\d+\.)\s*/, '');
                                return <li key={j} className="text-slate-300">{renderInline(text)}</li>;
                            })}
                        </ul>
                    );
                }

                // 3. Normal Paragraph
                return (
                    <p key={i} className="text-slate-300 leading-relaxed">
                        {renderInline(trimmedBlock)}
                    </p>
                );
            })}
        </div>
    );
};

/**
 * Simple inline formatter for bold and italic
 */
function renderInline(text: string) {
    // Bold: **text** or __text__
    const parts = text.split(/(\*\*.*?\*\*|__.*?__)/g);

    return parts.map((part, i) => {
        if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
            const boldText = part.slice(2, -2);
            return <strong key={i} className="text-white font-black">{boldText}</strong>;
        }

        // Italic fallback (very simple)
        const italicParts = part.split(/(\*.*?\*|_.*?_)/g);
        return italicParts.map((ip, j) => {
            if ((ip.startsWith('*') && ip.endsWith('*')) || (ip.startsWith('_') && ip.endsWith('_'))) {
                return <em key={`${i}-${j}`} className="italic text-slate-100">{ip.slice(1, -1)}</em>;
            }
            return ip;
        });
    });
}

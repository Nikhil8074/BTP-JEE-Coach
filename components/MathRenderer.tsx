"use client";

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
    content: string;
}

const preprocessLaTeX = (text: string) => {
    if (!text) return "";
    let processed = text;
    // Replace standard LaTeX delimiters
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`);
    processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`);
    // Heuristic capture for bare bracket block equations e.g. [ \Delta = 4 ] often spit out by some models
    processed = processed.replace(/\[\s*([\s\S]*?)\s*\]/g, (match, inner) => {
        const hasMath = inner.includes('\\') || inner.includes('^') || inner.includes('=') || inner.match(/[0-9][-+*\/]/) || inner.includes('_');
        const isCommonWord = /^[a-zA-Z\s]+$/.test(inner); // Pure words shouldn't be math
        if (hasMath && !isCommonWord) {
            return `$$${inner}$$`;
        }
        return match;
    });
    return processed;
};

const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
    const processedContent = useMemo(() => preprocessLaTeX(content), [content]);

    // Check if content contains LaTeX delimiters. If not, just render text to save perf.
    const hasMath = useMemo(() => /\$|\\|\[/.test(processedContent), [processedContent]);

    if (!hasMath) {
        return <span className="whitespace-pre-wrap">{processedContent}</span>;
    }

    return (
        <div className="math-content prose dark:prose-invert max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    // Override paragraph to avoid extra wrapping if needed
                    p: ({ node, ...props }) => <p className="mb-2" {...props} />
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};

export default MathRenderer;

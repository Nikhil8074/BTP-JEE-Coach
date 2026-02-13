"use client";

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
    content: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
    // Check if content contains LaTeX delimiters. If not, just render text to save perf.
    const hasMath = useMemo(() => /\$|\\/.test(content), [content]);

    if (!hasMath) {
        return <span className="whitespace-pre-wrap">{content}</span>;
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
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MathRenderer;

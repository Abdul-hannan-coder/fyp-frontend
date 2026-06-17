"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function normalizeLlmMarkdown(text: string): string {
  return text
    .replace(/\s*\*\*([^*]+?:)\*\*\s*/g, "\n\n**$1**\n")
    .replace(/\s+-\s+/g, "\n- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function MarkdownBase({ children }: { children: string }) {
  return (
    <div className="space-y-2 text-[13px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="whitespace-pre-line">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          h1: ({ children }) => <h3 className="font-bold text-foreground text-sm">{children}</h3>,
          h2: ({ children }) => <h4 className="font-bold text-foreground text-sm">{children}</h4>,
          h3: ({ children }) => <h5 className="font-bold text-foreground text-[13px]">{children}</h5>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-primary font-semibold underline">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">{children}</code>
          ),
        }}
      >
        {normalizeLlmMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}

const Markdown = memo(MarkdownBase);
export default Markdown;

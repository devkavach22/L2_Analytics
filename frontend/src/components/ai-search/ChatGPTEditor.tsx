// ============================================
// CHATGPT-STYLE EDITOR - Formatted Output Display
// ============================================

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Sparkles, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';


interface ChatGPTEditorProps {
  content?: string;
  isGenerating?: boolean;
  className?: string;
}

// Static demo content
const DEMO_CONTENT = `## Executive Summary

Based on the analysis of **Target Entity**, here are the key findings:

### Key Metrics
- Market Position: **Strong** (Top 15%)
- Risk Level: Low to Medium
- Growth Potential: High
- Compliance Status: Verified

### Financial Overview

\`\`\`
Revenue:        $2.4M (+18%)
Profit Margin:  12.5%
Operating Cost: -5.2%
ROI:            24.7%
\`\`\`

### Risk Assessment

| Category | Status | Priority |
|----------|--------|----------|
| Operational | ✓ Clear | Low |
| Financial | ⚠ Monitor | Medium |
| Compliance | ✓ Clear | Low |

### Recommendations

1. **Expand digital presence** to capture emerging market segments
2. **Implement monitoring** for financial risk indicators  
3. **Optimize operations** through automation

---

*Analysis confidence: 94.2%*`;

export const ChatGPTEditor = ({
  content,
  isGenerating = false,
  className,
}: ChatGPTEditorProps) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const finalContent = content;

  
  useEffect(() => {
    if (!content && !isGenerating) {
      setIsTyping(true);
      let index = 0;
      const interval = setInterval(() => {
        if (index <= finalContent.length) {
          setDisplayedContent(finalContent.slice(0, index));
          index += 3; // Speed up typing
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 10);
      return () => clearInterval(interval);
    } else {
      setDisplayedContent(finalContent);
    }
  }, [content, finalContent, isGenerating]);

  // Auto-scroll
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayedContent]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finalContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render markdown to JSX
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const processInline = (str: string) => {
      return str
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-slate-700 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-orange-400 hover:text-orange-300 underline">$1</a>');
    };

    lines.forEach((line, i) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLines = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <pre key={`code-${i}`} className="bg-slate-900/80 border border-slate-700 rounded-lg p-3 my-3 overflow-x-auto">
              <code className="text-xs font-mono text-emerald-400 whitespace-pre">
                {codeLines.join('\n')}
              </code>
            </pre>
          );
        }
        return;
      }
      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      // Tables
      if (line.includes('|') && line.trim().startsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        const cells = line.split('|').filter(c => c.trim());
        if (!cells.every(c => c.trim().match(/^[-:]+$/))) {
          tableRows.push(cells.map(c => c.trim()));
        }
        return;
      } else if (inTable) {
        inTable = false;
        elements.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  {tableRows[0]?.map((cell, j) => (
                    <th key={j} className="px-3 py-2 text-left text-slate-400 font-semibold">{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b border-slate-800">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-slate-300">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }

      // Headers
      if (line.startsWith('# ') && !line.startsWith('## ')) {
        elements.push(
          <h1 key={i} className="text-lg font-bold text-white mt-2 mb-3 flex items-center gap-2 border-b border-slate-700 pb-2">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-base font-bold text-white mt-4 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-500 rounded-full" />
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-sm font-semibold text-slate-200 mt-3 mb-1.5">{line.slice(4)}</h3>
        );
      }
      // HR
      else if (line.trim() === '---') {
        elements.push(<hr key={i} className="border-slate-700 my-4" />);
      }
      // Bullet list
      else if (line.trim().startsWith('- ')) {
        elements.push(
          <div key={i} className="flex items-start gap-2 my-1 ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
            <span 
              className="text-sm text-slate-300"
              dangerouslySetInnerHTML={{ __html: processInline(line.slice(2)) }}
            />
          </div>
        );
      }
      // Numbered list
      else if (/^\d+\.\s/.test(line.trim())) {
        const match = line.match(/^(\d+)\.\s(.*)$/);
        if (match) {
          elements.push(
            <div key={i} className="flex items-start gap-2 my-1.5">
              <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center shrink-0">
                {match[1]}
              </span>
              <span 
                className="text-sm text-slate-300"
                dangerouslySetInnerHTML={{ __html: processInline(match[2]) }}
              />
            </div>
          );
        }
      }
      // Italic line
      else if (line.trim().startsWith('*') && line.trim().endsWith('*') && !line.includes('**')) {
        elements.push(
          <p key={i} className="text-xs text-slate-500 italic mt-2">{line.trim().slice(1, -1)}</p>
        );
      }
      // Empty
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-1" />);
      }
      // Paragraph
      else {
        elements.push(
          <p 
            key={i} 
            className="text-sm text-slate-300 my-1"
            dangerouslySetInnerHTML={{ __html: processInline(line) }}
          />
        );
      }
    });

    return elements;
  };

  // Empty state
  if (!displayedContent && !isGenerating) {
    return (
      <div className={cn("h-full flex flex-col items-center justify-center text-center p-6", className)}>
        <div className="w-14 h-14 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
          <Bot className="text-slate-500" size={28} />
        </div>
        <p className="text-slate-500 text-sm font-medium">Ready to generate report</p>
        <p className="text-slate-600 text-xs mt-1">Configure parameters and click Generate</p>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col")}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-400">Kavach AI</span>
          {(isGenerating || isTyping) && (
            <span className="flex items-center gap-1 text-xs text-orange-400">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              generating...
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Content */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar"
      >
        <div className="space-y-0.5">
          {renderContent(displayedContent)}
        </div>
        
        {/* Typing cursor */}
        {(isGenerating || isTyping) && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-orange-500 ml-1"
          />
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};

export default ChatGPTEditor;

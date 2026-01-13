// ============================================
// REPORT EDITOR - DISPLAY GENERATED REPORT
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Download, Copy, Check, Maximize2, Minimize2, 
  RefreshCw, Edit3, Eye, Code 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReportEditorProps {
  content: string;
  title?: string;
  format?: 'markdown' | 'html' | 'text';
  isLoading?: boolean;
  downloadUrl?: string;
  onDownload?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export const ReportEditor = ({
  content,
  title = 'Generated Report',
  format = 'markdown',
  isLoading = false,
  downloadUrl,
  onDownload,
  onRefresh,
  className,
}: ReportEditorProps) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    } else if (onDownload) {
      onDownload();
    }
  };

  // Render markdown/html content
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-slate-500 font-medium">Generating report...</p>
          </div>
        </div>
      );
    }

    if (!content) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <FileText className="w-12 h-12 text-slate-300" />
            <div>
              <p className="text-slate-500 font-medium">No report generated yet</p>
              <p className="text-slate-400 text-sm">Configure parameters and click Generate</p>
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === 'source') {
      return (
        <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono p-4">
          {content}
        </pre>
      );
    }

    // Preview mode - render as HTML or markdown
    if (format === 'html') {
      return (
        <div 
          className="prose prose-slate prose-sm max-w-none p-6"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    // Simple markdown rendering
    return (
      <div className="prose prose-slate prose-sm max-w-none p-6">
        {content.split('\n').map((line, i) => {
          if (line.startsWith('# ')) {
            return <h1 key={i} className="text-2xl font-bold text-slate-900 mt-6 mb-4">{line.slice(2)}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={i} className="text-xl font-bold text-slate-800 mt-5 mb-3">{line.slice(3)}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={i} className="text-lg font-bold text-slate-700 mt-4 mb-2">{line.slice(4)}</h3>;
          }
          if (line.startsWith('- ')) {
            return <li key={i} className="text-slate-600 ml-4">{line.slice(2)}</li>;
          }
          if (line.startsWith('**') && line.endsWith('**')) {
            return <p key={i} className="font-bold text-slate-800">{line.slice(2, -2)}</p>;
          }
          if (line.trim() === '') {
            return <br key={i} />;
          }
          return <p key={i} className="text-slate-600 leading-relaxed">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <motion.div
      layout
      className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col',
        isFullscreen && 'fixed inset-4 z-50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-lg">
            <FileText className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
            <p className="text-xs text-slate-400">
              {content ? `${content.length} characters` : 'Empty'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-lg flex">
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5',
                viewMode === 'preview' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
              )}
            >
              <Eye size={12} /> Preview
            </button>
            <button
              onClick={() => setViewMode('source')}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5',
                viewMode === 'source' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
              )}
            >
              <Code size={12} /> Source
            </button>
          </div>

          {/* Actions */}
          <button
            onClick={handleCopy}
            disabled={!content}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
            title="Copy to clipboard"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>

          {(downloadUrl || onDownload) && (
            <button
              onClick={handleDownload}
              disabled={!content}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
              title="Download report"
            >
              <Download size={16} />
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
              title="Regenerate"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1 overflow-auto',
        viewMode === 'source' ? 'bg-slate-900' : 'bg-white'
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ReportEditor;

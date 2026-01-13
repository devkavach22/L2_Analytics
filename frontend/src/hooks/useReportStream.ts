// ============================================
// USE REPORT STREAM - SSE STREAMING HOOK
// ============================================

import { useState, useCallback, useRef } from 'react';
import CONFIG from '@/config';

interface StreamEvent {
  event: 'status' | 'text' | 'result' | 'related' | 'error' | 'done' | 'ping';
  data: any;
}

interface ReportResult {
  success: boolean;
  summary?: string;
  keywords?: string[];
  trends?: string;
  decisions?: string;
  risks?: string;
  sentiment?: string;
  final_report_text?: string;
  download_link?: string;
  collection_insight?: {
    context_desc?: string;
  };
}

export const useReportStream = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = useCallback(async (params: {
    userId: string;
    reportType: string;
    keyword?: string;
    fileText?: string;
  }) => {
    // Reset state
    setIsStreaming(true);
    setStreamedText('');
    setReportResult(null);
    setError(null);

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const now = () => new Date().toLocaleTimeString();
    
    // Initial message
    setStreamedText(`[${now()}] 🚀 Starting ${params.reportType} generation...\n`);

    try {
      // For SSE, we need to use fetch with POST then EventSource for GET
      // Since EventSource only supports GET, we'll use fetch with streaming
      const response = await fetch(`${CONFIG.FASTAPI_URL}/agentic-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          user_id: params.userId,
          report_type: params.reportType,
          keyword: params.keyword || null,
          new_file_text: params.fileText || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          setIsStreaming(false);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove 'data: '
              const event: StreamEvent = JSON.parse(jsonStr);
              
              handleStreamEvent(event, now);
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Stream error:', err);
      setError(err.message || 'Stream connection failed');
      setStreamedText(prev => prev + `\n[${now()}] ❌ Error: ${err.message}\n`);
      setIsStreaming(false);
    }
  }, []);

  const handleStreamEvent = useCallback((event: StreamEvent, now: () => string) => {
    switch (event.event) {
      case 'status':
        if (event.data === 'started') {
          setStreamedText(prev => prev + `[${now()}] ⚡ AI Pipeline initialized...\n`);
        } else if (event.data === 'completed') {
          setStreamedText(prev => prev + `[${now()}] ✅ Analysis complete!\n`);
        } else if (event.data === 'failed') {
          setStreamedText(prev => prev + `[${now()}] ❌ Analysis failed\n`);
        }
        break;

      case 'text':
        setStreamedText(prev => prev + `[${now()}] ${event.data}\n`);
        break;

      case 'result':
        setReportResult(event.data);
        // Format and display the result
        const formatted = formatReportResult(event.data);
        setStreamedText(prev => prev + '\n' + formatted);
        break;

      case 'related':
        if (Array.isArray(event.data)) {
          setStreamedText(prev => prev + `\n📎 Related insights:\n${event.data.map(r => `  • ${r}`).join('\n')}\n`);
        }
        break;

      case 'error':
        setError(event.data);
        setStreamedText(prev => prev + `\n❌ Error: ${event.data}\n`);
        break;

      case 'done':
        setIsStreaming(false);
        break;

      case 'ping':
        // Keep-alive, ignore
        break;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const clearStream = useCallback(() => {
    setStreamedText('');
    setReportResult(null);
    setError(null);
  }, []);

  return {
    isStreaming,
    streamedText,
    reportResult,
    error,
    startStream,
    stopStream,
    clearStream,
  };
};

// Helper to format report result as markdown
function formatReportResult(result: ReportResult): string {
  if (!result || !result.success) {
    return '❌ Report generation failed';
  }

  let content = '';
  
  content += `# 📊 Analysis Report\n\n`;
  content += `---\n\n`;

  // Context
  if (result.collection_insight?.context_desc) {
    content += `## 🔍 Document Context\n\n`;
    content += `${result.collection_insight.context_desc}\n\n`;
  }

  // Summary
  if (result.summary) {
    content += `## 📝 Executive Summary\n\n`;
    content += `${result.summary}\n\n`;
  }

  // Keywords
  if (result.keywords && result.keywords.length > 0) {
    content += `## 🏷️ Key Terms\n\n`;
    content += result.keywords.map(k => `\`${k}\``).join(' • ') + '\n\n';
  }

  // Trends
  if (result.trends && result.trends !== 'Not requested.') {
    content += `## 📈 Trends & Patterns\n\n`;
    content += `${result.trends}\n\n`;
  }

  // Risks
  if (result.risks && result.risks !== 'Not requested.') {
    content += `## ⚠️ Risk Analysis\n\n`;
    content += `${result.risks}\n\n`;
  }

  // Sentiment
  if (result.sentiment && result.sentiment !== 'Not requested.') {
    content += `## 💭 Sentiment Analysis\n\n`;
    content += `${result.sentiment}\n\n`;
  }

  // Decisions
  if (result.decisions && result.decisions !== 'Not requested.') {
    content += `## 💡 Recommendations\n\n`;
    content += `${result.decisions}\n\n`;
  }

  // Full Report
  if (result.final_report_text) {
    content += `## 📄 Detailed Analysis\n\n`;
    content += `${result.final_report_text}\n\n`;
  }

  // Download Link
  if (result.download_link) {
    content += `---\n\n`;
    content += `📥 **[Download Full Report (PDF)](${result.download_link})**\n`;
  }

  return content;
}

export default useReportStream;

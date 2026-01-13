// ============================================
// USE REPORT HOOK - REPORT GENERATION WITH SSE
// ============================================

import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store';
import {
  setInputType,
  setTopic,
  setSelectedFileId,
  setReportType,
  setStreamedText,
  appendStreamedText,
  clearStreamedText,
  setIsGenerating,
  setShowChatInterface,
  setShowSuccessModal,
  addReport,
  clearReports,
  addChatMessage,
  setChatMessages,
  resetForm,
  sendChatMessage,
} from '@/store/slices/reportSlice';
import { TBSelector } from '@/store/slices/TBSlice';
import CONFIG from '@/config';
import { message } from 'antd';
import type { ReportItem } from '@/types';

// Set to true to use dummy data, false for real API
const USE_DUMMY_DATA = true;

// Dummy report content for different report types
const DUMMY_REPORTS: Record<string, string> = {
  'Master Criminal Profile': `# 📊 Master Criminal Profile Analysis

---

## 🔍 Document Context

Criminal Intelligence Report - Subject identified from uploaded documents. Analysis based on FIR records, witness statements, and surveillance data.

## 📝 Executive Summary

Based on comprehensive analysis of the provided documents, the subject **Rajesh Kumar Singh** (Age: 34) has been identified as a key figure in organized financial fraud operations spanning multiple states. The investigation reveals a sophisticated network involving shell companies, forged documents, and money laundering channels.

## 🏷️ Key Terms

\`Financial Fraud\` • \`Money Laundering\` • \`Shell Companies\` • \`Identity Theft\` • \`Bank Fraud\` • \`Forgery\` • \`Criminal Network\`

## 📈 Criminal History & Patterns

1. **2019** - First recorded offense: Check bouncing case (Section 138 NI Act)
2. **2020** - Identity theft complaint filed in Mumbai
3. **2021** - Multiple FIRs for financial fraud across Gujarat & Maharashtra
4. **2022** - Arrested for operating fake loan company
5. **2023** - Currently under investigation for ₹4.2 Cr bank fraud

## ⚠️ Risk Assessment

| Category | Level | Notes |
|----------|-------|-------|
| Flight Risk | **HIGH** | Multiple passports, foreign contacts |
| Violence | LOW | No history of violent crimes |
| Recidivism | **HIGH** | Pattern of repeat offenses |
| Network Influence | MEDIUM | Connected to 12+ associates |

## 💭 Behavioral Analysis

- **Modus Operandi**: Creates shell companies, obtains loans using forged documents, diverts funds through multiple accounts
- **Target Profile**: Small businesses, elderly individuals, rural bank branches
- **Communication**: Uses encrypted messaging, frequently changes phone numbers
- **Financial Pattern**: Transactions always below ₹10L to avoid scrutiny

## 💡 Recommendations

1. **Immediate Action**: Issue lookout circular at all airports
2. **Asset Freeze**: Identify and freeze all linked bank accounts
3. **Surveillance**: Monitor known associates listed in Annexure-B
4. **Inter-state Coordination**: Alert Maharashtra, Gujarat, and Rajasthan police
5. **Digital Forensics**: Analyze seized devices for additional evidence

## 📄 Known Associates

| Name | Role | Status |
|------|------|--------|
| Amit Sharma | Financial Handler | Absconding |
| Priya Verma | Document Forger | Arrested |
| Suresh Patel | Bank Insider | Under Investigation |
| Unknown Female | Courier | Unidentified |

---

📥 **[Download Full Report (PDF)](/reports/criminal_profile_12345.pdf)**`,

  'Security Report': `# 📊 Security Assessment Report

---

## 🔍 Document Context

Comprehensive security analysis based on uploaded infrastructure documents and network logs.

## 📝 Executive Summary

The security assessment reveals **3 critical vulnerabilities** and **7 medium-risk issues** in the analyzed infrastructure. Immediate remediation is recommended for the critical findings to prevent potential data breaches.

## 🏷️ Key Terms

\`CVE-2024-1234\` • \`SQL Injection\` • \`XSS\` • \`Authentication Bypass\` • \`Data Exposure\` • \`Firewall Misconfiguration\`

## ⚠️ Critical Findings

### 1. SQL Injection Vulnerability
\`\`\`
Location: /api/users/search
Risk Level: CRITICAL
CVSS Score: 9.8
\`\`\`
Unparameterized queries allow direct database manipulation.

### 2. Authentication Bypass
\`\`\`
Location: /admin/dashboard
Risk Level: CRITICAL  
CVSS Score: 9.1
\`\`\`
JWT token validation can be bypassed using null algorithm.

### 3. Exposed API Keys
\`\`\`
Location: /config/settings.js
Risk Level: CRITICAL
CVSS Score: 8.5
\`\`\`
Production API keys hardcoded in client-side code.

## 📈 Risk Distribution

| Severity | Count | Percentage |
|----------|-------|------------|
| Critical | 3 | 15% |
| High | 5 | 25% |
| Medium | 7 | 35% |
| Low | 5 | 25% |

## 💡 Recommendations

1. **Immediate**: Patch SQL injection vulnerabilities
2. **24 Hours**: Rotate all exposed API keys
3. **1 Week**: Implement proper JWT validation
4. **1 Month**: Complete security audit of all endpoints

---

📥 **[Download Full Report (PDF)](/reports/security_assessment.pdf)**`,

  'Executive Report': `# 📊 Executive Summary Report

---

## 🔍 Document Context

Business intelligence analysis based on Q4 2024 financial documents and market data.

## 📝 Executive Summary

The organization has shown **18% YoY growth** with strong performance in digital services. Key metrics indicate healthy financial position with opportunities for expansion in emerging markets.

## 🏷️ Key Terms

\`Revenue Growth\` • \`Market Share\` • \`Digital Transformation\` • \`Cost Optimization\` • \`Customer Acquisition\`

## 📈 Financial Highlights

\`\`\`
Revenue:        ₹24.5 Cr (+18% YoY)
Net Profit:     ₹3.2 Cr (+22% YoY)
EBITDA Margin:  15.4%
Customer Base:  45,000+ active users
\`\`\`

## 💹 Key Performance Indicators

| Metric | Q3 2024 | Q4 2024 | Change |
|--------|---------|---------|--------|
| Revenue | ₹20.8 Cr | ₹24.5 Cr | +17.8% |
| Users | 38,000 | 45,000 | +18.4% |
| Churn Rate | 4.2% | 3.1% | -26.2% |
| NPS Score | 72 | 78 | +8.3% |

## 💡 Strategic Recommendations

1. **Expand** digital product offerings
2. **Invest** in AI/ML capabilities
3. **Target** tier-2 city markets
4. **Optimize** customer acquisition costs

---

📥 **[Download Full Report (PDF)](/reports/executive_summary.pdf)**`,

  'default': `# 📊 Analysis Report

---

## 🔍 Document Context

Comprehensive analysis based on the provided documents and data sources.

## 📝 Executive Summary

The analysis has been completed successfully. Key findings and insights have been extracted from the uploaded documents. The report includes detailed breakdowns, trend analysis, and actionable recommendations.

## 🏷️ Key Terms

\`Analysis\` • \`Insights\` • \`Trends\` • \`Recommendations\` • \`Data Points\`

## 📈 Key Findings

1. **Primary Finding**: Document analysis reveals consistent patterns
2. **Secondary Finding**: Data quality is high with 95% completeness
3. **Tertiary Finding**: Actionable insights identified in 3 key areas

## 📊 Data Summary

| Category | Count | Percentage |
|----------|-------|------------|
| Processed | 150 | 75% |
| Flagged | 30 | 15% |
| Pending | 20 | 10% |

## 💡 Recommendations

1. Review flagged items for accuracy
2. Implement automated validation
3. Schedule follow-up analysis in 30 days

---

📥 **[Download Full Report (PDF)](/reports/analysis_report.pdf)**`
};

// Simulated streaming messages
const STREAM_MESSAGES = [
  '⚡ AI Pipeline initialized...',
  '📂 Fetching documents from database...',
  '🔍 Extracting text content...',
  '🧠 Running NLP analysis...',
  '📊 Generating insights...',
  '✍️ Formatting report...',
  '✅ Analysis complete!'
];

export const useReport = () => {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector((s: any) => s.report);
  const { isError, errorMessage } = useSelector(TBSelector);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Calculate stats
  const stats = {
    totalReports: state.reports.length,
    successRate: state.reports.length === 0
      ? 100
      : Math.round((state.reports.filter((r: ReportItem) => r.status === 'Ready').length / state.reports.length) * 100),
    timeSaved: Number((state.reports.length * 0.4).toFixed(1)),
  };

  // Handle report completion
  const handleCompletion = useCallback((reportData: any) => {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newReport: ReportItem = {
      id: reportData.id || Date.now(),
      title: reportData.title,
      type: reportData.type || state.reportType,
      format: 'PDF',
      date: formattedDate,
      timestamp: new Date().toISOString(),
      status: 'Ready',
      downloadUrl: reportData.downloadUrl,
    };

    dispatch(addReport(newReport));
    dispatch(setIsGenerating(false));
    dispatch(setShowChatInterface(true));
    dispatch(setShowSuccessModal(true));
    dispatch(resetForm());

    // Initialize chat
    dispatch(setChatMessages([{
      id: '1',
      role: 'assistant',
      content: `Analysis complete. I have generated the **${newReport.type}**. You can ask me questions about the findings.`,
      timestamp: new Date(),
    }]));

    message.success('Analysis Complete');
  }, [dispatch, state.reportType]);

  // Generate report - with dummy data option
  const generate = useCallback(async (workspaceFiles: any[]) => {
    const { inputType, topic, selectedFileId, reportType } = state;

    // Validation
    if (inputType === 'keyword' && !topic.trim()) {
      message.error('Please enter a topic.');
      return;
    }
    if (inputType === 'file' && !selectedFileId) {
      message.error('Please select a file from your workspace.');
      return;
    }

    const targetName = inputType === 'file'
      ? workspaceFiles.find((f: any) => f.id === selectedFileId)?.name || 'Selected File'
      : topic;

    dispatch(setIsGenerating(true));
    dispatch(setShowChatInterface(false));
    dispatch(clearStreamedText());

    const now = () => new Date().toLocaleTimeString();
    dispatch(setStreamedText(
      `[${now()}] 🚀 Starting ${reportType} generation...\n` +
      `[${now()}] 📝 Target: ${targetName}\n` +
      `[${now()}] ⏳ Connecting to AI service...\n\n`
    ));

    // Use dummy data for testing
    if (USE_DUMMY_DATA) {
      await simulateDummyStream(reportType, targetName, now);
      return;
    }

    // Real API call with SSE
    await callRealApi(reportType, targetName, inputType, topic, selectedFileId, now);
  }, [state, dispatch, handleCompletion]);

  // Simulate streaming with dummy data
  const simulateDummyStream = async (reportType: string, targetName: string, now: () => string) => {
    // Stream progress messages
    for (let i = 0; i < STREAM_MESSAGES.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      dispatch(appendStreamedText(`[${now()}] ${STREAM_MESSAGES[i]}\n`));
    }

    // Add a small delay before showing the report
    await new Promise(resolve => setTimeout(resolve, 800));

    // Get the appropriate dummy report
    const dummyReport = DUMMY_REPORTS[reportType] || DUMMY_REPORTS['default'];
    
    // Replace placeholder with actual target name
    const personalizedReport = dummyReport.replace(/Target Entity|Subject/g, targetName);
    
    // Stream the report content character by character for typewriter effect
    dispatch(appendStreamedText('\n'));
    
    // For faster display, append in chunks
    const chunkSize = 50;
    for (let i = 0; i < personalizedReport.length; i += chunkSize) {
      const chunk = personalizedReport.slice(i, i + chunkSize);
      dispatch(appendStreamedText(chunk));
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    // Complete the generation
    handleCompletion({
      id: Date.now(),
      title: targetName,
      type: reportType,
      downloadUrl: `/reports/${targetName.toLowerCase().replace(/\s+/g, '_')}_report.pdf`,
    });
  };

  // Real API call with SSE streaming
  const callRealApi = async (
    reportType: string, 
    targetName: string, 
    inputType: string, 
    topic: string, 
    selectedFileId: string | null,
    now: () => string
  ) => {
    // Get user ID from localStorage
    const userStr = localStorage.getItem('user');
    let userId = 'anonymous';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user._id || user.id || user.userId || 'anonymous';
      } catch (e) {
        console.error('Failed to parse user');
      }
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // SSE Stream from FastAPI
      const response = await fetch(`${CONFIG.FASTAPI_URL}/agentic-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          user_id: userId,
          report_type: reportType,
          keyword: inputType === 'keyword' ? topic : null,
          new_file_text: null,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      let reportResult: any = null;

      // Read SSE stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              const event = JSON.parse(jsonStr);
              
              switch (event.event) {
                case 'status':
                  if (event.data === 'started') {
                    dispatch(appendStreamedText(`[${now()}] ⚡ AI Pipeline initialized...\n`));
                  } else if (event.data === 'completed') {
                    dispatch(appendStreamedText(`[${now()}] ✅ Analysis complete!\n\n`));
                  }
                  break;

                case 'text':
                  dispatch(appendStreamedText(`[${now()}] ${event.data}\n`));
                  break;

                case 'result':
                  reportResult = event.data;
                  const formatted = formatReportResult(event.data);
                  dispatch(appendStreamedText('\n' + formatted));
                  break;

                case 'related':
                  if (Array.isArray(event.data)) {
                    dispatch(appendStreamedText(`\n📎 **Related Insights:**\n${event.data.map((r: string) => `  • ${r}`).join('\n')}\n`));
                  }
                  break;

                case 'error':
                  dispatch(appendStreamedText(`\n❌ **Error:** ${event.data}\n`));
                  message.error(event.data);
                  break;

                case 'done':
                  if (reportResult) {
                    handleCompletion({
                      id: Date.now(),
                      title: targetName,
                      type: reportType,
                      downloadUrl: reportResult.download_link,
                    });
                  } else {
                    dispatch(setIsGenerating(false));
                  }
                  break;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      if (!reportResult) {
        dispatch(setIsGenerating(false));
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        dispatch(appendStreamedText(`\n[${now()}] ⚠️ Request cancelled\n`));
      } else {
        console.error('Stream error:', err);
        dispatch(appendStreamedText(`\n[${now()}] ❌ Error: ${err.message}\n`));
        message.error(`Failed: ${err.message}`);
      }
      dispatch(setIsGenerating(false));
    }
  };

  // Stop generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    dispatch(setIsGenerating(false));
  }, [dispatch]);

  // Chat handler
  const chat = useCallback(async (text: string) => {
    if (!text.trim()) return;

    dispatch(addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }));

    dispatch(sendChatMessage({
      question: text,
      link: state.currentReport?.downloadUrl,
    }));
  }, [dispatch, state.currentReport]);

  // Download handler
  const download = useCallback((report: ReportItem) => {
    if (report.status !== 'Ready') {
      message.error('Cannot download failed reports.');
      return;
    }
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    } else {
      message.info('Download link expired or invalid.');
    }
  }, []);

  return {
    // State
    ...state,
    stats,
    
    // Actions
    setInputType: (type: 'keyword' | 'file') => dispatch(setInputType(type)),
    setTopic: (value: string) => dispatch(setTopic(value)),
    setSelectedFileId: (id: string | null) => dispatch(setSelectedFileId(id)),
    setReportType: (type: string) => dispatch(setReportType(type)),
    setShowSuccessModal: (show: boolean) => dispatch(setShowSuccessModal(show)),
    clearReports: () => dispatch(clearReports()),
    
    // Handlers
    generate,
    stopGeneration,
    chat,
    download,
  };
};

// Helper to format report result as markdown
function formatReportResult(result: any): string {
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
    content += result.keywords.map((k: string) => `\`${k}\``).join(' • ') + '\n\n';
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
  if (result.final_report_text || result.report) {
    content += `## 📄 Detailed Analysis\n\n`;
    content += `${result.final_report_text || result.report}\n\n`;
  }

  // Download Link
  if (result.download_link) {
    content += `---\n\n`;
    content += `📥 **[Download Full Report (PDF)](${result.download_link})**\n`;
  }

  return content;
}

export default useReport;

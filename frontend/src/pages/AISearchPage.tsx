// ============================================
// AI SEARCH PAGE - REPORT GENERATION
// ============================================

import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  NeuralBackground,
  GlowCard,
  SpotlightSection,
} from "@/components/common";
import {
  InputPanel,
  StatusPanel,
  ReportHistory,
  SuccessModal,
  StatsBar,
  ChatGPTEditor,
} from "@/components/ai-search";

import { useReport, useWorkspaceFiles } from "@/hooks";
import { useChatStream } from "../components/ai-search/useStreamHook";
import InternalChatPanel from "./InternalChatPanel";
import WebSearchChatPanel from "./WebSearchChatPanel";

export default function AISearchPage() {
  const {
    inputType,
    topic,
    selectedFileId,
    reportType,
    reports,
    currentReport,
    showSuccessModal,
    stats,
    setInputType,
    setTopic,
    setSelectedFileId,
    setReportType,
    setShowSuccessModal,
    clearReports,
    generate,
    download,
  } = useReport();

  const { files: workspaceFiles, isLoading: isLoadingFiles } =
    useWorkspaceFiles();

  const handleGenerate = () => generate(workspaceFiles);
  const { streamedText, isGenerating } = useChatStream("/api/chat/stream");

  const handleDownloadCurrent = () => {
    if (currentReport) {
      download(currentReport);
      setShowSuccessModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF6] text-slate-900 font-sans flex flex-col relative overflow-x-hidden">
      {/* Background Effects */}
      <NeuralBackground />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-25 mix-blend-soft-light pointer-events-none z-0" />
      <div className="fixed -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-orange-200/20 to-rose-200/20 rounded-full blur-[100px] z-0" />
      <div className="fixed -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-amber-200/20 to-yellow-100/20 rounded-full blur-[100px] z-0" />

      {/* Chat Styles */}
      <style>{`
        .cs-chat-container { background-color: transparent !important; }
        .cs-message-list { background-color: transparent !important; }
        .cs-message__content { background-color: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 12px; padding: 10px 14px; }
        .cs-message--outgoing .cs-message__content { background-color: #f97316; color: white; border: none; }
        .cs-message-input { background-color: #0f172a; border-top: 1px solid #334155; }
        .cs-message-input__content-editor-wrapper { background-color: #1e293b !important; }
      `}</style>

      {/* Header */}
      <div className="relative z-50">
        <Header isAuthenticated={true} />
      </div>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        report={currentReport}
        onClose={() => setShowSuccessModal(false)}
        onDownload={handleDownloadCurrent}
      />

      {/* Main Content */}
      <main className="relative z-10 flex-grow container mx-auto px-4 pt-32 pb-24 max-w-7xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col md:flex-row justify-between items-end"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-white shadow-sm backdrop-blur-md text-slate-600 text-xs font-bold uppercase tracking-widest mb-4">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              AI Intelligence Core
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Generate{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-600">
                Insights
              </span>
            </h1>
          </div>

          <div className="mt-6 md:mt-0">
            <StatsBar
              totalReports={stats.totalReports}
              successRate={stats.successRate}
              timeSaved={stats.timeSaved}
            />
          </div>
        </motion.div>

        {/* Main Panel */}
        <div className="mb-16 relative z-20">
          <SpotlightSection className="rounded-[2.5rem] shadow-2xl shadow-orange-900/5">
            <GlowCard className="border-0 shadow-none bg-white/80 backdrop-blur-2xl">
              <div className="p-2 md:p-10">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                  {/* Left Panel: Configuration */}
                  <div className="xl:col-span-8">
                    <InputPanel
                      inputType={inputType}
                      topic={topic}
                      selectedFileId={selectedFileId}
                      reportType={reportType}
                      isGenerating={isGenerating}
                      isLoadingFiles={isLoadingFiles}
                      workspaceFiles={workspaceFiles}
                      onInputTypeChange={setInputType}
                      onTopicChange={setTopic}
                      onFileSelect={setSelectedFileId}
                      onReportTypeChange={setReportType}
                      onGenerate={handleGenerate}
                    />
                  </div>

                  {/* Right Panel: AI Editor */}
                  <div className="xl:col-span-4 flex flex-col gap-6 h-full max-h-[200px]">
                    {/* <StatusPanel isGenerating={isGenerating} /> */}

                    {/* ChatGPT-style Editor Container */}
                    <div className="flex-grow bg-[#0f172a] rounded-[2rem] relative overflow-hidden shadow-2xl flex flex-col border border-slate-800 min-h-[450px]">
                      {/* Editor Content */}
                      <ChatGPTEditor
                        content={streamedText}
                        isGenerating={isGenerating}
                        // className="h-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full my-16">
                  {/* Internal Report Chat */}
                  <div className="bg-[#0f172a] rounded-[2rem] overflow-hidden shadow-xl border border-slate-800 flex flex-col min-h-[350px]">
                    <InternalChatPanel reportText={streamedText} />
                  </div>

                  {/* Web Search Chat */}
                  <div className="bg-[#0f172a] rounded-[2rem] overflow-hidden shadow-xl border border-slate-800 flex flex-col min-h-[350px]">
                    <WebSearchChatPanel />
                  </div>
                </div>
              </div>
            </GlowCard>
          </SpotlightSection>
        </div>

        {/* Report History */}
        <ReportHistory reports={reports} onClear={clearReports} />
      </main>

      <Footer />
    </div>
  );
}

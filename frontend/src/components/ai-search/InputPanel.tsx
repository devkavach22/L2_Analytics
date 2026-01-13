// ============================================
// INPUT PANEL - REPORT CONFIGURATION FORM
// ============================================

import { Input, Select, Button as AntButton, Empty } from 'antd';
import { ThunderboltFilled, FolderOpenOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined, FileTextOutlined } from '@ant-design/icons';
import { Bot, Search, Layers } from 'lucide-react';
import { REPORT_TYPES } from '@/constants';

interface WorkspaceFile {
  id: string;
  name: string;
  type: string;
  extension: string;
  folderName: string;
}

interface InputPanelProps {
  inputType: 'keyword' | 'file';
  topic: string;
  selectedFileId: string | null;
  reportType: string;
  isGenerating: boolean;
  isLoadingFiles: boolean;
  workspaceFiles: WorkspaceFile[];
  onInputTypeChange: (type: 'keyword' | 'file') => void;
  onTopicChange: (value: string) => void;
  onFileSelect: (fileId: string) => void;
  onReportTypeChange: (type: string) => void;
  onGenerate: () => void;
}

// File icon helper
const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return <FilePdfOutlined className="text-red-500" />;
  if (type.includes('doc')) return <FileWordOutlined className="text-blue-500" />;
  if (type.includes('xls')) return <FileExcelOutlined className="text-green-500" />;
  if (['jpg', 'png', 'jpeg'].some(x => type.includes(x))) return <FileImageOutlined className="text-purple-500" />;
  return <FileTextOutlined className="text-slate-400" />;
};

export const InputPanel = ({
  inputType,
  topic,
  selectedFileId,
  reportType,
  isGenerating,
  isLoadingFiles,
  workspaceFiles,
  onInputTypeChange,
  onTopicChange,
  onFileSelect,
  onReportTypeChange,
  onGenerate,
}: InputPanelProps) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-orange-500 to-rose-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
            <Bot size={26} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 m-0">Parameters</h2>
            <p className="text-sm text-slate-400 font-medium">Configure your analysis source</p>
          </div>
        </div>

        {/* Input Type Toggle */}
        <div className="bg-slate-100/80 p-1.5 rounded-xl flex items-center">
          <button
            onClick={() => !isGenerating && onInputTypeChange('keyword')}
            disabled={isGenerating}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold gap-2 flex items-center transition-all ${
              inputType === 'keyword' ? 'bg-white shadow-sm' : 'text-slate-500'
            } ${isGenerating && 'cursor-not-allowed opacity-50'}`}
          >
            <Search size={14} /> Keyword
          </button>
          <button
            onClick={() => !isGenerating && onInputTypeChange('file')}
            disabled={isGenerating}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold gap-2 flex items-center transition-all ${
              inputType === 'file' ? 'bg-white shadow-sm' : 'text-slate-500'
            } ${isGenerating && 'cursor-not-allowed opacity-50'}`}
          >
            <FolderOpenOutlined /> Workspace
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6 bg-slate-50/60 p-8 rounded-3xl border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Field */}
          <div className="md:col-span-2 space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              {inputType === 'keyword' ? <Layers size={14} /> : <FolderOpenOutlined />}
              {inputType === 'keyword' ? 'Target Entity' : 'Select Source File'}
            </label>

            {inputType === 'keyword' ? (
              <Input
                size="large"
                placeholder="Type a company, topic, or keyword..."
                value={topic}
                onChange={(e) => onTopicChange(e.target.value)}
                disabled={isGenerating}
                className="h-14 rounded-xl font-medium"
              />
            ) : (
              <Select
                size="large"
                className="w-full h-14"
                placeholder="Select a document from your workspace..."
                loading={isLoadingFiles}
                value={selectedFileId}
                onChange={onFileSelect}
                disabled={isGenerating}
                options={workspaceFiles.map(f => ({
                  value: f.id,
                  label: (
                    <div className="flex items-center justify-between w-full pr-4 py-1">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-50 p-1.5 rounded text-lg">
                          {getFileIcon(f.type)}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-slate-700 leading-tight">{f.name}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <FolderOpenOutlined style={{ fontSize: 9 }} /> {f.folderName}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold border border-slate-200">
                        {f.extension.toUpperCase()}
                      </span>
                    </div>
                  ),
                }))}
                notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No files in workspace" />}
              />
            )}
          </div>

          {/* Report Type */}
          <div className="md:col-span-2 space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase">Output Format</label>
            <Select
              size="large"
              value={reportType}
              onChange={onReportTypeChange}
              disabled={isGenerating}
              className="w-full h-14"
              options={REPORT_TYPES}
            />
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex items-center justify-end">
        <AntButton
          type="primary"
          size="large"
          onClick={onGenerate}
          loading={isGenerating}
          disabled={isGenerating}
          icon={!isGenerating && <ThunderboltFilled />}
          className="bg-slate-900 hover:bg-slate-800 border-none h-14 px-10 rounded-xl text-base font-bold shadow-xl w-full sm:w-auto flex items-center justify-center gap-2"
        >
          {isGenerating ? 'Analyzing Data...' : 'Generate Report'}
        </AntButton>
      </div>
    </div>
  );
};

export default InputPanel;

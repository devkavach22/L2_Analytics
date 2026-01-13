// ============================================
// REPORT HISTORY - LIST OF GENERATED REPORTS
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button as AntButton, Tooltip, Pagination, Empty, message } from 'antd';
import { CloudDownloadOutlined, ClockCircleFilled, DeleteOutlined } from '@ant-design/icons';
import { FileOutput } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReportItem } from '@/types';

interface ReportHistoryProps {
  reports: ReportItem[];
  onClear: () => void;
}

const PAGE_SIZE = 5;

export const ReportHistory = ({ reports, onClear }: ReportHistoryProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const paginatedReports = reports.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleDownload = (report: ReportItem) => {
    if (report.status !== 'Ready') {
      message.error('Cannot download failed reports.');
      return;
    }
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    } else {
      message.info('Download link expired or invalid.');
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ClockCircleFilled className="text-orange-500" /> Recent Activity
        </h3>
        
        {reports.length > 0 && (
          <div className="flex items-center gap-4">
            <Pagination
              current={currentPage}
              total={reports.length}
              pageSize={PAGE_SIZE}
              onChange={setCurrentPage}
              size="small"
              className="font-bold"
            />
            <Tooltip title="Clear History">
              <AntButton type="text" danger icon={<DeleteOutlined />} onClick={onClear} />
            </Tooltip>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {paginatedReports.length > 0 ? (
            paginatedReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={cn(
                    'group rounded-2xl p-4 border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-5',
                    report.status === 'Failed'
                      ? 'bg-red-50 border-red-100'
                      : 'bg-white border-slate-100 hover:border-orange-200'
                  )}
                >
                  <div className="w-12 h-12 rounded-xl border flex items-center justify-center bg-slate-50">
                    <FileOutput size={20} className="text-slate-400" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-base text-slate-800">{report.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                      <span>{report.type}</span>
                      <span>{report.date}</span>
                    </div>
                  </div>
                  
                  {report.status === 'Ready' && (
                    <AntButton
                      icon={<CloudDownloadOutlined />}
                      onClick={() => handleDownload(report)}
                    >
                      Download
                    </AntButton>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <Empty description="No reports yet." />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportHistory;

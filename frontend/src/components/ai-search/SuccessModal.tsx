// ============================================
// SUCCESS MODAL - REPORT COMPLETION DIALOG
// ============================================

import { Modal, Button as AntButton } from 'antd';
import { CheckCircleFilled, CloudDownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ReportItem } from '@/types';

interface SuccessModalProps {
  open: boolean;
  report: ReportItem | null;
  onClose: () => void;
  onDownload: () => void;
}

export const SuccessModal = ({ open, report, onClose, onDownload }: SuccessModalProps) => {
  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      centered
      width={400}
      className="rounded-[24px] overflow-hidden"
      closeIcon={
        <div className="bg-slate-100 rounded-full p-1 hover:bg-slate-200 transition-colors">
          <DeleteOutlined className="text-slate-500" />
        </div>
      }
    >
      <div className="text-center p-6">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleFilled className="text-5xl text-green-500 animate-bounce" />
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 mb-2">Report Ready!</h2>
        <p className="text-slate-500 mb-6">
          Your <span className="font-bold text-slate-700">{report?.type}</span> has been
          successfully generated.
        </p>
        
        <div className="space-y-3">
          <AntButton
            type="primary"
            size="large"
            icon={<CloudDownloadOutlined />}
            onClick={onDownload}
            className="w-full h-12 bg-slate-900 hover:bg-orange-600 border-none rounded-xl font-bold shadow-lg"
          >
            Download PDF Now
          </AntButton>
          <AntButton type="text" onClick={onClose} className="text-slate-400">
            Close
          </AntButton>
        </div>
      </div>
    </Modal>
  );
};

export default SuccessModal;

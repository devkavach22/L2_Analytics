// ============================================
// REPORT CONSTANTS
// ============================================

export const REPORT_TYPES = [
  { value: 'Security Report', label: 'Security Report' },
  { value: 'Technical Report', label: 'Technical Report' },
  { value: 'Market Report', label: 'Market Report' },
  { value: 'Executive Report', label: 'Executive Report' },
  { value: 'Master Criminal Profile', label: 'Master Criminal Profile' },
  { value: 'FIR & Case Analysis', label: 'FIR & Case Analysis' },
  { value: 'Interrogation Intelligence Report', label: 'Interrogation Intelligence Report' },
  { value: 'Custody Movement Report', label: 'Custody Movement Report' },
  { value: 'Gang Network Report', label: 'Gang Network Report' },
  { value: 'Court-Ready Legal Summary', label: 'Court-Ready Legal Summary' },
];

export const QUICK_TEMPLATES = [
  { label: 'Suspect Profile', type: 'Master Criminal Profile' },
  { label: 'Incident Analysis', type: 'FIR & Case Analysis' },
  { label: 'Legal Brief', type: 'Court-Ready Legal Summary' },
];

export const DASHBOARD_REPORT_TYPES = [
  {
    id: 'Master Criminal Profile',
    label: 'Master Criminal Profile',
    desc: 'Comprehensive profile & background',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'Quick Summary',
    label: 'Quick Summary',
    desc: 'Key points & executive summary',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    id: 'Deep Dive',
    label: 'Deep Dive',
    desc: 'Detailed analysis & insights',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    id: 'Compliance Check',
    label: 'Compliance Check',
    desc: 'Legal risks & PII detection',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

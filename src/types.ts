export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  sources?: string[];
  suggestedQuestions?: string[];
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  tags?: string[];
  summary?: string;
}

export interface GuideTopic {
  id: string;
  title: string;
  category: 'environment' | 'sensor' | 'calibration' | 'qc' | 'legal' | 'maintenance';
  categoryName: string;
  summary: string;
  keyStandards: string[];
  details: string;
  relatedArticles?: string;
  frequentlyAsked: string[];
}

export interface SensorStandard {
  id: string;
  element: string;
  elementEn: string;
  height: string;
  accuracy: string;
  unit: string;
  range: string;
  installationRule: string;
  maintenanceNote: string;
  calibrationPeriod: string;
}

export interface GoogleDriveSyncInfo {
  isConnected: boolean;
  fileName: string;
  fileId: string;
  driveUrl: string;
  fileSize: string;
  pageCount: number;
  lastSyncedAt: string;
  version: string;
  pubRegNumber: string; // 11-1360000-100230-14
  issuingDept: string; // 기상청 관측정책과
  syncStatus: 'synced' | 'syncing' | 'error';
}

export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  standardRule: string;
  checked: boolean;
  status?: 'pass' | 'warning' | 'fail';
  userValue?: string;
  referenceGuideline: string;
}

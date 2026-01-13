import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store";
import {
  TBSelector,
  FilesGetApi,
  FoldersGetApi,
  LinksGetApi,
  FolderCreateApi,
  FileUploadApi,
  FileDeleteApi,
  FolderDeleteApi,
  LinkAddApi,
  LinkDeleteApi,
  ReportGenerateApi,
  ChatSendApi,
  updateState,
  clearErrors,
  clearSuccess,
} from "@/store/slices/TBSlice";
import Instance from "@/lib/axiosInstance"; 
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  FileText, Clock, Download, Trash2, Rows,
  FileImage, Folder, UploadCloud, X, Plus, 
  LayoutGrid, Search, MoreVertical, 
  File as FileIcon, Eye, Brain, 
  ChevronLeft, ChevronRight, 
  FileCode, 
  TrendingUp, Activity, Sparkles,
  Zap, ArrowUpRight, AlertCircle, 
  CheckCircle2, MessageSquare, FolderOpen, 
  ArrowLeft, Pencil, Loader2,
  Link as LinkIcon, Youtube, ExternalLink, Play,
  Info, FileInput, List, Languages, ScanText, User, Send, Bot, RefreshCw, Copy, Smartphone,
  ShieldCheck, FileBarChart, PieChart, Layers, BarChart3, Target,
  Lightbulb, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip, 
  BarChart, Bar, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart as RePieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

// --- UTILS ---
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals < 0 ? 0 : decimals)) + ' ' + ['Bytes', 'KB', 'MB', 'GB', 'TB'][i];
}

// --- ANIMATION VARIANTS ---
const modalTransition = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const toastVariant = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
  exit: { opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }
};

// --- REPORT TYPES CONSTANTS ---
const REPORT_TYPES = [
    { id: 'Master Criminal Profile', label: 'Master Criminal Profile', icon: FileText, desc: 'Comprehensive profile & background', color: 'bg-blue-50 text-blue-600' },
    { id: 'Quick Summary', label: 'Quick Summary', icon: Zap, desc: 'Key points & executive summary', color: 'bg-orange-50 text-orange-600' },
    { id: 'Deep Dive', label: 'Deep Dive', icon: Brain, desc: 'Detailed analysis & insights', color: 'bg-purple-50 text-purple-600' },
    { id: 'Compliance Check', label: 'Compliance Check', icon: ShieldCheck, desc: 'Legal risks & PII detection', color: 'bg-emerald-50 text-emerald-600' },
];

// --- COMPONENT: GLOW CARD ---
const GlowCard = ({ children, className = "", onClick, hoverEffect = true }: any) => {
  return (
    <motion.div
      onClick={onClick}
      variants={fadeInUp}
      whileHover={hoverEffect ? { y: -4, boxShadow: "0 20px 40px -12px rgba(249, 115, 22, 0.15)" } : {}}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/60 bg-white shadow-lg shadow-orange-500/5 transition-all duration-300 group",
        className
      )}
    >
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {children}
    </motion.div>
  );
};

// --- HELPER FUNCTIONS ---
const getUserId = (user: any) => {
    if (!user) return null;
    return user._id || user.id || user.userId;
};

const getFileStyle = (ext: string) => {
  const e = ext ? ext.toLowerCase() : "file";
  if (['pdf'].includes(e)) return { icon: FileText, color: "text-rose-500", bg: "bg-rose-50" };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(e)) return { icon: FileImage, color: "text-sky-500", bg: "bg-sky-50" };
  if (['doc', 'docx', 'txt'].includes(e)) return { icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" };
  if (['xls', 'xlsx', 'csv'].includes(e)) return { icon: Rows, color: "text-emerald-600", bg: "bg-emerald-50" };
  if (['js', 'ts', 'tsx', 'html', 'css', 'py', 'sql'].includes(e)) return { icon: FileCode, color: "text-orange-500", bg: "bg-orange-50" };
  return { icon: FileIcon, color: "text-slate-400", bg: "bg-slate-50" };
};

const getFileIconByExtension = (ext: string, className: string = "h-5 w-5", simple: boolean = false) => {
  const style = getFileStyle(ext);
  const Icon = style.icon;
  if(simple) return <Icon className={className} />;
  return <Icon className={cn(style.color, className)} />;
};

// --- TYPES ---
type FolderType = { 
    id: string; 
    name: string; 
    desc?: string; 
    fileCount: number; 
    createdAt: string; 
    theme: "orange" | "blue" | "emerald" | "purple";
    userId?: string;
    creatorName?: string; 
    totalSize?: number; 
};

type FileType = { 
  id: string; 
  name: string; 
  extension: string; 
  size: number; 
  pageCount: string | number; 
  publicPath?: string;
  extractedText?: string;
  folderId?: string; 
  userId?: string; 
  createdAt?: string;
}; 

type LinkType = {
  id: string;
  url: string;
  title?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  ocrStatus?: 'pending' | 'completed'; 
  extractedText?: string; 
  translatedText?: string; 
  originalUrl?: string;
  folderId?: string | any; // Updated to allow populated object
};

type ChatMessageType = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isLoading?: boolean;
};

type ReportTarget = {
    type: 'file' | 'folder';
    id: string;
    name: string;
} | null;

const sentimentData = [
  { subject: 'Positivity', A: 120, fullMark: 150 },
  { subject: 'Clarity', A: 98, fullMark: 150 },
  { subject: 'Conciseness', A: 86, fullMark: 150 },
  { subject: 'Actionability', A: 99, fullMark: 150 },
  { subject: 'Compliance', A: 85, fullMark: 150 },
  { subject: 'Tone', A: 65, fullMark: 150 },
];

const trendData = [
  { name: 'Mon', positive: 40, negative: 24, neutral: 24 },
  { name: 'Tue', positive: 30, negative: 13, neutral: 22 },
  { name: 'Wed', positive: 20, negative: 58, neutral: 22 },
  { name: 'Thu', positive: 27, negative: 39, neutral: 20 },
  { name: 'Fri', positive: 18, negative: 48, neutral: 21 },
  { name: 'Sat', positive: 23, negative: 38, neutral: 25 },
  { name: 'Sun', positive: 34, negative: 43, neutral: 21 },
];

// --- COMPONENT: FILE VIEWER OVERLAY ---
const FileViewerOverlay = ({ file, onClose }: { file: FileType; onClose: () => void }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchFile = async () => {
      try {
        setLoading(true);
        setError(false);
        const token = localStorage.getItem("token");

        const response = await Instance.get(`/auth/file/view/${file.id}`, {
          responseType: "blob",
          headers: {
            'Authorization': token 
          }
        });

        if (isActive) {
          const url = URL.createObjectURL(response.data);
          setBlobUrl(url);
        }
      } catch (err) {
        console.error("Error fetching file for preview:", err);
        if (isActive) setError(true);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    if (file.id) {
        fetchFile();
    }

    return () => {
      isActive = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file.id]);

  const docs = blobUrl ? [
    { 
        uri: blobUrl, 
        fileName: file.name,
        fileType: file.extension 
    }
  ] : [];

  return (
    <motion.div 
        key="file-viewer-overlay"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-6" 
        onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} 
        animate={{ scale: 1, y: 0 }} 
        className="w-full max-w-7xl h-[90vh] flex flex-col rounded-[24px] bg-white overflow-hidden shadow-2xl border border-white/20" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10 shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-orange-50 rounded-xl shadow-sm border border-orange-100 text-orange-500">
                {getFileIconByExtension(file.extension)}
             </div>
             <div>
                <h3 className="font-bold text-slate-800 text-sm truncate max-w-[400px]">{file.name}</h3>
                <p className="text-[10px] text-slate-500 font-mono flex gap-2">
                    {formatBytes(file.size)} <span>•</span> {file.extension.toUpperCase()}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-2">
              <a href={blobUrl || "#"} download={file.name}>
                  <Button variant="outline" size="sm" className="gap-2 h-9 text-xs" disabled={!blobUrl}>
                      <Download className="h-4 w-4" /> Download
                  </Button>
              </a>
              <Button onClick={onClose} variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100 text-slate-500">
                  <X className="h-5 w-5" />
              </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative bg-slate-100 w-full">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <span className="text-sm font-medium">Fetching Secure Document...</span>
                </div>
            ) : error || !blobUrl ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                    <span className="text-sm font-medium text-red-500">Failed to load document.</span>
                </div>
            ) : (
                <DocViewer
                    documents={docs}
                    pluginRenderers={DocViewerRenderers}
                    style={{ height: "100%", width: "100%" }}
                    config={{
                        header: {
                            disableHeader: true,
                            disableFileName: true,
                            retainURLParams: false
                        },
                        loadingRenderer: {
                            overrideComponent: (props) => (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                                    <span className="text-sm font-medium">Rendering Document...</span>
                                </div>
                            )
                        },
                        noRenderer: {
                            overrideComponent: (props) => (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
                                    <div className="h-16 w-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                        <FileIcon className="h-8 w-8" />
                                    </div>
                                    <p className="text-lg font-bold text-slate-700">No Preview Available</p>
                                    <p className="text-sm text-slate-500 mt-2 mb-6 max-w-sm">
                                        This file type ({file.extension}) cannot be previewed directly.
                                        {['doc', 'docx', 'ppt', 'pptx'].includes(file.extension) && " (Office documents on localhost may require download)"}
                                    </p>
                                    <a href={blobUrl} download={file.name} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                                        Download File
                                    </a>
                                </div>
                            )
                        }
                    }}
                />
            )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-orange-100 z-50">
        <p className="font-bold text-slate-900 mb-1 text-xs">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs font-medium text-slate-600">
             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill }} />
             <span>{entry.name}: {entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const NOTIFICATION_KEY = "latest_report_notification";

export default function UserDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    isFilesGet, isFilesGetFetching, FilesGetData,
    isFoldersGet, isFoldersGetFetching, FoldersGetData,
    isLinksGet, isLinksGetFetching, LinksGetData,
    isFolderCreate, isFolderCreateFetching,
    isFileUpload, isFileUploadFetching,
    isLinkAdd, isLinkAddFetching,
    isChatSend, isChatSendFetching, ChatMessages,
    isError, errorMessage, isSuccess, successMessage
  } = useSelector(TBSelector);

  const [showWorkspace, setShowWorkspace] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"folders" | "files" | "links">("folders");
  const [folderViewMode, setFolderViewMode] = useState<"grid" | "list">("grid"); 
  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false); 
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [allFiles, setAllFiles] = useState<FileType[]>([]); 
  const [links, setLinks] = useState<LinkType[]>([]); 
  const [stats, setStats] = useState<any>({ processed: 0, storage: 0, storageUnit: 'MB', hoursSaved: 0 });
  
  const [folderSearchTerm, setFolderSearchTerm] = useState(""); 
  const [fileSearchTerm, setFileSearchTerm] = useState("");     
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FileType[]>([]);

  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [metaDocumentType, setMetaDocumentType] = useState("PDF"); 
  const [metaRelatedTo, setMetaRelatedTo] = useState("");

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget>(null);
  const [selectedReportType, setSelectedReportType] = useState<string>("Master Criminal Profile");

  const [activeChatLink, setActiveChatLink] = useState<LinkType | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);
  const [chatInput, setChatInput] = useState("");
  
  const [viewingTextLink, setViewingTextLink] = useState<LinkType | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [textViewerMode, setTextViewerMode] = useState<'original' | 'translated'>('original');

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [targetFolderForLink, setTargetFolderForLink] = useState<FolderType | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [processingLinkId, setProcessingLinkId] = useState<string | null>(null);

  // --- ANALYSIS STATE ---
  const [showAnalysisOverlay, setShowAnalysisOverlay] = useState(false);
  const [isAnalyzingFolder, setIsAnalyzingFolder] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'overview' | 'charts' | 'files'>('overview');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [viewingFile, setViewingFile] = useState<FileType | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7; 

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { const parsed = JSON.parse(storedUser); setCurrentUser(parsed.user || parsed); } 
      catch (e) { console.error(e); }
    }
    setIsUserLoaded(true);
  }, []);

  useEffect(() => {
    if (isUserLoaded && currentUser) fetchData();
  }, [isUserLoaded, currentUser]);

  useEffect(() => {
    const checkReportStatus = async () => {
        const notification = localStorage.getItem(NOTIFICATION_KEY);
        if (notification) {
            try {
                const report = JSON.parse(notification);
                showToast(`Report Ready: ${report.title}`, 'success');
                localStorage.removeItem(NOTIFICATION_KEY);
            } catch (e) { localStorage.removeItem(NOTIFICATION_KEY); }
        }
    };
    const interval = setInterval(checkReportStatus, 3000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeChatLink]);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch data using TBSlice
  const fetchData = () => {
    const uid = getUserId(currentUser);
    if (!uid) return;
    dispatch(FilesGetApi());
    dispatch(FoldersGetApi());
    dispatch(LinksGetApi());
  };

  // Handle Files data from TBSlice
  useEffect(() => {
    if (isFilesGet && FilesGetData) {
      const uid = getUserId(currentUser);
      const myFiles = transformFiles(FilesGetData, folders).filter((f: any) => f.userId === uid).reverse();
      setAllFiles(myFiles);
      
      // Update stats
      const totalBytes = myFiles.reduce((acc: number, f: any) => acc + (f.size || 0), 0);
      let storage = totalBytes / (1024 * 1024);
      let unit = 'MB';
      if (storage > 1024) { storage /= 1024; unit = 'GB'; }
      setStats({
        processed: myFiles.length,
        storage: parseFloat(storage.toFixed(2)),
        storageUnit: unit,
        hoursSaved: (myFiles.length * 0.2).toFixed(1)
      });
      
      dispatch(updateState({ isFilesGet: false }));
    }
  }, [isFilesGet, FilesGetData, currentUser, folders, dispatch]);

  // Handle Folders data from TBSlice
  useEffect(() => {
    if (isFoldersGet && FoldersGetData) {
      const uid = getUserId(currentUser);
      const uName = currentUser?.name || currentUser?.username || "Me";
      const themes: ("orange" | "blue" | "emerald" | "purple")[] = ["orange", "blue", "emerald", "purple"];
      
      const myFolders: FolderType[] = FoldersGetData.map((f: any, i: number) => ({
        id: f._id || f.id,
        name: f.name,
        desc: f.desc || "Security documents",
        createdAt: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "Recently",
        theme: themes[i % themes.length],
        userId: f.userId || f.user,
        creatorName: (f.creator && f.creator.name) ? f.creator.name : ((f.userId === uid || f.user === uid) ? uName : "Unknown"),
        fileCount: 0
      })).filter((f: any) => f.userId === uid);
      
      setFolders(myFolders);
      dispatch(updateState({ isFoldersGet: false }));
    }
  }, [isFoldersGet, FoldersGetData, currentUser, dispatch]);

  // Handle Links data from TBSlice
  useEffect(() => {
    if (isLinksGet && LinksGetData) {
      const completedLinks = LinksGetData.filter((l: any) => l.status === 'completed');
      const uniqueLinkMap = new Map();
      completedLinks.forEach((l: any) => uniqueLinkMap.set(l.url, l));
      const uniqueLinks = Array.from(uniqueLinkMap.values());

      const myLinks = uniqueLinks.map((l: any) => ({
        id: l._id || l.id,
        url: l.url,
        title: l.title || l.url,
        status: l.status || 'completed',
        createdAt: l.createdAt,
        ocrStatus: l.ocrStatus || 'pending',
        extractedText: l.extractedText || "Mock extracted text...",
        translatedText: l.translatedText || "",
        originalUrl: l.url,
        folderId: l.folderId
      }));
      
      setLinks(myLinks.reverse());
      dispatch(updateState({ isLinksGet: false }));
    }
  }, [isLinksGet, LinksGetData, dispatch]);

  // Update folder file counts when files change
  useEffect(() => {
    if (allFiles.length > 0 && folders.length > 0) {
      const updatedFolders = folders.map((f: FolderType) => {
        const folderFiles = allFiles.filter((file: FileType) => String(file.folderId) === String(f.id));
        const totalSize = folderFiles.reduce((acc: number, file: FileType) => acc + (file.size || 0), 0);
        return { ...f, fileCount: folderFiles.length, totalSize };
      });
      if (JSON.stringify(updatedFolders) !== JSON.stringify(folders)) {
        setFolders(updatedFolders);
      }
    }
  }, [allFiles]);

  // Handle Folder Create success
  useEffect(() => {
    if (isFolderCreate) {
      setNewFolderName("");
      setNewFolderDesc("");
      fetchData();
      showToast("Folder created successfully!", "success");
      dispatch(updateState({ isFolderCreate: false }));
    }
  }, [isFolderCreate, dispatch]);

  // Handle File Upload success
  useEffect(() => {
    if (isFileUpload) {
      fetchData();
      showToast("Success! Files uploaded & processed.", "success");
      dispatch(updateState({ isFileUpload: false }));
    }
  }, [isFileUpload, dispatch]);

  // Handle Link Add success
  useEffect(() => {
    if (isLinkAdd) {
      setNewLinkUrl("");
      setTargetFolderForLink(null);
      fetchData();
      showToast("Link added successfully!", "success");
      dispatch(updateState({ isLinkAdd: false }));
    }
  }, [isLinkAdd, dispatch]);

  // Handle TBSlice errors
  useEffect(() => {
    if (isError && errorMessage) {
      showToast(errorMessage, "error");
      dispatch(clearErrors());
    }
  }, [isError, errorMessage, dispatch]);

  // Handle TBSlice success messages
  useEffect(() => {
    if (isSuccess && successMessage) {
      dispatch(clearSuccess());
    }
  }, [isSuccess, successMessage, dispatch]);

  const transformFiles = (rawFiles: any[], currentFolders: FolderType[] = folders) => {
      if (!Array.isArray(rawFiles)) return [];
      return rawFiles.map((f: any) => {
          let folderId = f.folderId || f.folder;
          if (typeof folderId === 'object' && folderId !== null) folderId = folderId._id || folderId.id;
          if (!folderId && f.folderName) {
              let matchedFolder = currentFolders.find(fold => fold.name === f.folderName);
              if (!matchedFolder) matchedFolder = currentFolders.find(fold => fold.name.toLowerCase() === f.folderName.toLowerCase());
              if (matchedFolder) folderId = matchedFolder.id;
          }
          return {
            id: f._id || f.id, 
            name: f.fileName || f.originalName || f.name || "Untitled", 
            extension: f.extension || (f.fileName || f.originalName || f.name || "").split('.').pop() || "file",
            size: f.size || 0, 
            pageCount: f.pageCount || 'N/A', 
            publicPath: f.publicPath || "",
            folderId: folderId,
            userId: f.userId || f.user,
            createdAt: f.createdAt
          };
      });
  };

  const handleCreateFolder = () => {
      if(!newFolderName.trim() || !currentUser) return;
      const uid = getUserId(currentUser);
      const creatorName = currentUser?.name || currentUser?.username || "User";
      dispatch(FolderCreateApi({ 
        name: newFolderName, 
        desc: newFolderDesc, 
        userId: uid, 
        createdBy: creatorName 
      }));
  };

  const initiateUpload = (files: FileList) => {
    if(!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
    setMetaDocumentType("PDF"); setMetaRelatedTo("");
    setShowUploadModal(true);
  };

  const handleConfirmUpload = () => {
    if(pendingFiles.length === 0 || !currentUser) return;
    setShowUploadModal(false); 
    showToast("Uploading & Extracting Text (OCR)...", "info");
    
    const fd = new FormData();
    pendingFiles.forEach((f: any) => fd.append('files', f));
    fd.append('userId', getUserId(currentUser));
    fd.append('documentType', metaDocumentType);
    fd.append('relatedTo', metaRelatedTo);
    
    dispatch(FileUploadApi({ 
      formData: fd, 
      folderId: selectedFolder?.id 
    }));
    setPendingFiles([]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if(e.dataTransfer.files && e.dataTransfer.files.length > 0) initiateUpload(e.dataTransfer.files);
  };

  const onFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files.length > 0) initiateUpload(e.target.files);
  };

  const handleInitiateReport = (type: 'folder' | 'file', id: string, name: string) => {
      setReportTarget({ type, id, name });
      setSelectedReportType("Master Criminal Profile");
      setShowReportModal(true);
  };

  const handleGenerateReport = () => {
      if(!reportTarget) return;
      const { id, name } = reportTarget;
      const reportType = selectedReportType;
      setShowReportModal(false);
      showToast(`Generating ${reportType} for ${name}...`, "info");
      
      dispatch(ReportGenerateApi({ 
        reportType, 
        fileId: id 
      }));
      setReportTarget(null);
  };

  // --- UPDATED ANALYZE FOLDER FUNCTION ---
  const handleAnalyzeFolder = async (folder: FolderType) => {
    if (!folder || !folder.id) {
         showToast("Invalid folder selected.", "error");
         return;
    }
    setIsAnalyzingFolder(true);
    setShowAnalysisOverlay(true);
    setAnalysisData(null); 
    showToast(`Deep Analysis Started for ${folder.name}...`, "info");

    const data = {
      "analyze_text": true,
      "generate_charts": true
    };

    try {
        const response = await Instance.post(`/auth/folder/analyze/${folder.id}`, data);
        const responsePayload = response.data?.data?.data || response.data?.data || response.data;
        
        console.log("Analysis Response:", responsePayload);
        
        if (responsePayload) {
            setAnalysisData(responsePayload);
            showToast("Analysis Complete.", "success");
        } else {
             showToast("Analysis completed but returned no data.", "error");
        }

    } catch (error) {
        console.error("Analysis Error:", error);
        showToast("Analysis failed. Please try again.", "error");
        setShowAnalysisOverlay(false);
    } finally {
        setIsAnalyzingFolder(false);
    }
  };

  const handleConfirmAddLink = () => {
    if(!newLinkUrl.trim()) return;
    if(!targetFolderForLink) { showToast("No target folder selected.", "error"); return; }

    const uid = getUserId(currentUser);
    if (!uid) { showToast("User session not found. Please refresh.", "error"); return; }

    setShowLinkModal(false);
    showToast(`Adding link to ${targetFolderForLink.name}...`, "info");
    
    dispatch(LinkAddApi({ 
      url: newLinkUrl, 
      folderId: targetFolderForLink.id,
      userId: uid 
    }));
  };

  const handleRunOCR = async (link: LinkType) => {
      if(processingLinkId) return;
      setProcessingLinkId(link.id);
      showToast("Running OCR extraction...", "info");
      try {
          await new Promise(r => setTimeout(r, 2000));
          setLinks(prev => prev.map(l => l.id === link.id ? { ...l, ocrStatus: 'completed', extractedText: `Extracted content from ${l.url}...\nLorem ipsum dolor sit amet.` } : l));
          showToast("OCR Completed Successfully", "success");
      } catch (e) {
          showToast("OCR Failed", "error");
      } finally {
          setProcessingLinkId(null);
      }
  };

  const handleOpenChat = (link: LinkType) => {
      setActiveChatLink(link);
      setChatMessages([
          { id: '1', role: 'assistant', content: `Hello! I've analyzed the content from "${link.title || link.url}". What would you like to know?`, timestamp: new Date() }
      ]);
      showToast("Chat initialized", "info");
  };

  const handleSendChatMessage = async () => {
    if(!chatInput.trim() || !activeChatLink) return;
    const userMsg: ChatMessageType = { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    const currentQuestion = chatInput;
    setChatInput("");
    const loadingId = "loading-" + Date.now();
    const loadingMsg: ChatMessageType = { id: loadingId, role: 'assistant', content: "Analyzing content...", timestamp: new Date(), isLoading: true };
    setChatMessages(prev => [...prev, loadingMsg]);

    dispatch(ChatSendApi({ question: currentQuestion, link: activeChatLink.url }));
  };

  // Handle Chat response from TBSlice
  useEffect(() => {
    if (isChatSend && ChatMessages.length > 0) {
      const lastMessage = ChatMessages[ChatMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        setChatMessages(prev => {
          const loadingIndex = prev.findIndex(msg => msg.isLoading);
          if (loadingIndex !== -1) {
            const updated = [...prev];
            updated[loadingIndex] = { ...updated[loadingIndex], content: lastMessage.content, isLoading: false };
            return updated;
          }
          return prev;
        });
      }
      dispatch(updateState({ isChatSend: false }));
    }
  }, [isChatSend, ChatMessages, dispatch]);

  const handleOpenTextViewer = (link: LinkType) => {
      setViewingTextLink(link);
      setTextViewerMode('original');
  };

  const handleTranslateText = async () => {
      if(!viewingTextLink) return;
      setIsTranslating(true);
      showToast("Translating content...", "info");
      try {
          await new Promise(r => setTimeout(r, 1500));
          const translated = `(Translated to English)\n\n${viewingTextLink.extractedText}`;
          const updatedLink = { ...viewingTextLink, translatedText: translated };
          setViewingTextLink(updatedLink);
          setLinks(prev => prev.map(l => l.id === updatedLink.id ? updatedLink : l));
          setTextViewerMode('translated');
          showToast("Translation complete!", "success");
      } catch (e) {
          showToast("Translation failed", "error");
      } finally {
          setIsTranslating(false);
      }
  };

  const handleCopyText = (text: string) => {
     if(!text) return;
     navigator.clipboard.writeText(text);
     showToast("Text copied to clipboard", "success");
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
        const activeTerm = activeWorkspaceTab === "folders" && !selectedFolder ? folderSearchTerm : fileSearchTerm;
        if(!activeTerm || !activeTerm.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await Instance.get(`/search?q=${encodeURIComponent(activeTerm)}`);
            let resultsRaw = [];
            if (Array.isArray(res.data)) resultsRaw = res.data;
            else if (res.data && Array.isArray(res.data.results)) resultsRaw = res.data.results;
            else if (res.data && Array.isArray(res.data.files)) resultsRaw = res.data.files;
            setSearchResults(transformFiles(resultsRaw, folders));
        } catch (e) {
            console.error("Search Error:", e);
            setSearchResults([]);
        }
    }, 500); 
    return () => clearTimeout(delayDebounceFn);
  }, [fileSearchTerm, folderSearchTerm, activeWorkspaceTab, selectedFolder, folders]);

  const getDisplayFolders = () => {
      if (!folderSearchTerm.trim()) return folders;
      const lowerTerm = folderSearchTerm.toLowerCase();
      return folders.filter(folder => {
          const nameMatch = folder.name.toLowerCase().includes(lowerTerm);
          const hasMatchingFile = searchResults.some(file => String(file.folderId) === String(folder.id));
          return nameMatch || hasMatchingFile;
      });
  };

  const getDisplayFiles = () => {
      let files = isSearching && fileSearchTerm.trim() ? searchResults : allFiles;
      if (selectedFolder) {
          files = files.filter(f => String(f.folderId) === String(selectedFolder.id));
      }
      return files;
  };

  const paginatedFiles = getDisplayFiles().slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(getDisplayFiles().length / pageSize);
  const displayName = currentUser?.name || currentUser?.username || "User";

  const renderToast = () => (
    <AnimatePresence>
      {toast && (
        <motion.div
          key="toast-notification"
          variants={toastVariant}
          initial="hidden" animate="visible" exit="exit"
          className={cn(
            "fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border border-white/20 min-w-[320px]",
            toast.type === 'success' ? "bg-emerald-500/90 text-white" :
            toast.type === 'error' ? "bg-rose-500/90 text-white" : "bg-slate-900/90 text-white"
          )}
        >
           <div className="p-2 bg-white/20 rounded-full">
              {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
           </div>
           <div>
              <p className="font-bold text-sm">{toast.type === 'success' ? "Success" : toast.type === 'error' ? "Error" : "Processing"}</p>
              <p className="text-xs opacity-90">{toast.message}</p>
           </div>
           <button onClick={() => setToast(null)} className="ml-auto p-1 hover:bg-white/20 rounded-full transition-colors"><X className="h-4 w-4" /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // --- UPDATED ANALYSIS OVERLAY ---
  const RenderAnalysisOverlay = () => {
      const fileTypeData = analysisData?.charts?.fileTypeDistribution ? 
          analysisData.charts.fileTypeDistribution.labels.map((label: string, i: number) => ({
              name: label.toUpperCase(),
              value: analysisData.charts.fileTypeDistribution.values[i]
          })) : [];

      const fileContentData = analysisData?.charts?.fileContentWeight ? 
          analysisData.charts.fileContentWeight.labels.map((label: string, i: number) => ({
              name: label.length > 20 ? label.substring(0, 15) + '...' : label, 
              value: analysisData.charts.fileContentWeight.values[i],
              fullName: label
          })) : [];

      const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#F43F5E', '#0EA5E9'];

      return (
        <motion.div
            key="analysis-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-slate-900/50 flex items-center justify-center p-4"
        >
            <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} 
                className="w-full max-w-[95vw] h-[95vh] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col relative border border-slate-200"
            >
                {/* Header */}
                <div className="bg-white text-slate-900 px-8 py-5 flex justify-between items-center shrink-0 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                            <Brain className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-800">Intelligence Analysis</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Deep Learning Module • v2.4</p>
                        </div>
                    </div>
                    <Button onClick={() => setShowAnalysisOverlay(false)} variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full"><X className="h-6 w-6" /></Button>
                </div>

                {isAnalyzingFolder ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-slate-50">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center"><Brain className="h-8 w-8 text-orange-500 animate-pulse" /></div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Folder Contents...</h3>
                            <p className="text-slate-500 text-sm max-w-md mx-auto">Our AI is processing documents, extracting entities, and generating intelligence reports. This may take a moment.</p>
                        </div>
                    </div>
                ) : analysisData ? (
                    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]">
                        {/* Tabs */}
                        <div className="px-8 pt-6 border-b border-slate-200 bg-white flex gap-8 shadow-sm z-10">
                            {['overview', 'charts', 'files'].map((tab) => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveAnalysisTab(tab as any)}
                                    className={cn(
                                        "pb-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2",
                                        activeAnalysisTab === tab ? "text-orange-600 border-orange-500" : "text-slate-400 border-transparent hover:text-slate-600"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            {activeAnalysisTab === 'overview' && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* Left Column: Summary Stats */}
                                    <div className="lg:col-span-8 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Files</p>
                                                    <h3 className="text-4xl font-black text-slate-800 mt-2">{analysisData.overview?.total_files || 0}</h3>
                                                </div>
                                                <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><FileText className="h-7 w-7" /></div>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Size</p>
                                                    <h3 className="text-4xl font-black text-slate-800 mt-2">{formatBytes(analysisData.overview?.total_size || 0)}</h3>
                                                </div>
                                                <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><Rows className="h-7 w-7" /></div>
                                            </div>
                                        </div>

                                        {/* AI Insights Section */}
                                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-orange-500" /> Key Insights</h3>
                                            <div className="space-y-3">
                                                {analysisData.insights && analysisData.insights.length > 0 ? (
                                                    analysisData.insights.map((insight: string, idx: number) => (
                                                        <div key={idx} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                            <div className="mt-1.5 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                                                            <p className="text-sm font-medium text-slate-700 leading-relaxed">{insight}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-slate-400 italic">No insights generated.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: File Distribution Chart (Pie) */}
                                    <div className="lg:col-span-4">
                                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                                            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChart className="h-4 w-4 text-purple-500" /> File Type Distribution</h3>
                                            <div className="flex-1 min-h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RePieChart>
                                                        <Pie 
                                                            data={fileTypeData} 
                                                            cx="50%" cy="50%" 
                                                            innerRadius={60} outerRadius={80} 
                                                            paddingAngle={5} dataKey="value"
                                                        >
                                                            {fileTypeData.map((entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                                        <Legend verticalAlign="bottom" height={36}/>
                                                    </RePieChart>
                                                </ResponsiveContainer>
                                            </div>
                                         </div>
                                    </div>
                                </div>
                            )}

                            {activeAnalysisTab === 'charts' && (
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-orange-500" /> File Size Analysis (Content Weight)</h3>
                                    <div className="flex-1 w-full min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={fileContentData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    tick={{ fontSize: 10, fill: '#64748b' }} 
                                                    interval={0} 
                                                    angle={-45} 
                                                    textAnchor="end" 
                                                    height={100}
                                                />
                                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                                                <Tooltip 
                                                    cursor={{ fill: '#f8fafc' }} 
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                />
                                                <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={60}>
                                                    {fileContentData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                            
                            {activeAnalysisTab === 'files' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                     <table className="w-full text-left border-separate border-spacing-0">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">File Name</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Type</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">Size</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {analysisData.files && analysisData.files.map((file: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                                                {getFileIconByExtension(file.type || file.extension)}
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-700">{file.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="secondary" className="uppercase bg-slate-100 text-slate-600 border-slate-200 font-bold text-[10px]">{file.type}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-slate-500 font-mono">
                                                        {formatBytes(file.size)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                     </table>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-red-500">
                        <p>No data available.</p>
                    </div>
                )}
            </motion.div>
        </motion.div>
      );
  };

  const RenderChatOverlay = () => {
      if (!activeChatLink) return null;
      return (
        <motion.div 
            key="chat-overlay"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-4 right-4 w-[350px] md:w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[200] flex flex-col overflow-hidden"
        >
            <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 border border-orange-200"><Bot className="h-6 w-6" /></div>
                    <div>
                        <h3 className="text-slate-800 font-bold text-sm">AI Assistant</h3>
                        <p className="text-slate-400 text-[10px] truncate max-w-[200px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full h-8 w-8" onClick={() => setActiveChatLink(null)}><X className="h-5 w-5" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={chatScrollRef}>
                <div className="text-center text-[10px] text-slate-400 my-4 uppercase tracking-widest font-bold">Today</div>
                {chatMessages.map((msg) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn("flex flex-col gap-1 max-w-[85%]", msg.role === 'user' ? "items-end" : "items-start")}>
                             <div className={cn("p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm relative", msg.role === 'user' ? "bg-orange-500 text-white rounded-br-none" : "bg-white text-slate-700 border border-slate-200 rounded-bl-none")}>
                                {msg.isLoading ? <div className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> {msg.content}</div> : msg.content}
                            </div>
                            <span className="text-[9px] text-slate-400 px-1">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} className="flex gap-2 items-center">
                    <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type your message..." className="rounded-full bg-slate-50 border-slate-200 text-xs focus-visible:ring-orange-400 py-5 pl-4" autoFocus />
                    <Button type="submit" size="icon" disabled={!chatInput.trim()} className="rounded-full bg-slate-900 hover:bg-slate-800 text-white w-10 h-10 shrink-0 shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"><Send className="h-4 w-4 ml-0.5" /></Button>
                </form>
            </div>
        </motion.div>
      );
  };

  const RenderTextViewer = () => {
    if (!viewingTextLink) return null;
    return (
        <motion.div 
            key="text-viewer"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setViewingTextLink(null)}
        >
            <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} 
                className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500 border border-orange-100"><ScanText className="h-5 w-5" /></div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Extracted Content Viewer</h3>
                            <p className="text-xs text-slate-500 truncate max-w-md mt-0.5 flex items-center gap-1"><LinkIcon className="h-3 w-3" /> {viewingTextLink.url}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleTranslateText} disabled={isTranslating || textViewerMode === 'translated'} className={cn("text-xs font-bold border-slate-200 rounded-lg h-9 px-4 transition-all", textViewerMode === 'translated' ? "bg-purple-50 text-purple-600 border-purple-200 cursor-default" : "text-slate-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200")}>
                            {isTranslating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Languages className="h-3.5 w-3.5 mr-2" />}
                            {isTranslating ? "Translating..." : textViewerMode === 'translated' ? "Translated" : "Translate to English"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setViewingTextLink(null)} className="rounded-full hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></Button>
                    </div>
                </div>
                <div className="px-6 border-b border-slate-100 bg-slate-50/50 flex gap-6">
                    <button onClick={() => setTextViewerMode('original')} className={cn("text-xs font-bold py-3 border-b-2 transition-all flex items-center gap-2", textViewerMode === 'original' ? "border-orange-500 text-orange-600" : "border-transparent text-slate-400 hover:text-slate-600")}>Original Extracted Text</button>
                    <button onClick={() => viewingTextLink.translatedText && setTextViewerMode('translated')} disabled={!viewingTextLink.translatedText} className={cn("text-xs font-bold py-3 border-b-2 transition-all flex items-center gap-2", textViewerMode === 'translated' ? "border-purple-500 text-purple-600" : !viewingTextLink.translatedText ? "border-transparent text-slate-300 cursor-not-allowed" : "border-transparent text-slate-400 hover:text-purple-600")}>Translated Text {textViewerMode === 'translated' && <CheckCircle2 className="h-3 w-3" />}</button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 relative">
                    <div className="absolute top-4 right-4 z-10">
                         <Button variant="outline" size="sm" onClick={() => handleCopyText(textViewerMode === 'original' ? viewingTextLink.extractedText || "" : viewingTextLink.translatedText || "")} className="bg-white/80 backdrop-blur border-slate-200 text-slate-500 hover:text-slate-800 text-xs h-8"><Copy className="h-3 w-3 mr-1.5" /> Copy</Button>
                    </div>
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm min-h-full">
                        <div className="prose prose-sm max-w-none text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                            {textViewerMode === 'original' ? (viewingTextLink.extractedText || <span className="text-slate-400 italic">No content extracted yet. Run OCR first.</span>) : viewingTextLink.translatedText}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
  };

  const renderUploadModal = () => (
    <motion.div 
        key="upload-modal"
        className="fixed inset-0 z-[250] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><UploadCloud className="h-5 w-5 text-orange-500" /> Confirm Upload</h3>
                <Button variant="ghost" size="icon" onClick={() => { setShowUploadModal(false); setPendingFiles([]); }}><X className="h-4 w-4 text-slate-400" /></Button>
            </div>
            <div className="mb-6">
                <p className="text-sm font-medium text-slate-600 mb-2">Files to upload:</p>
                <div className="bg-slate-50 rounded-xl p-3 max-h-32 overflow-y-auto border border-slate-100">
                    {pendingFiles.map((f, i) => (<div key={i} className="flex items-center gap-2 text-xs text-slate-500 py-1"><FileIcon className="h-3 w-3" /> <span className="truncate">{f.name}</span></div>))}
                </div>
            </div>
            <div className="space-y-4 mb-8">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Document Type</label>
                    <Input value={metaDocumentType} onChange={(e) => setMetaDocumentType(e.target.value)} placeholder="e.g. PDF, Invoice, Resume" className="rounded-xl border-orange-100"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Related To</label>
                    <Input value={metaRelatedTo} onChange={(e) => setMetaRelatedTo(e.target.value)} placeholder="e.g. Resume, HR, Project ID" className="rounded-xl border-orange-100"/>
                </div>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowUploadModal(false); setPendingFiles([]); }}>Cancel</Button>
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold" onClick={handleConfirmUpload}>Confirm & Upload</Button>
            </div>
        </motion.div>
    </motion.div>
  );

  const renderLinkModal = () => (
    <motion.div 
        key="link-modal"
        className="fixed inset-0 z-[250] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Youtube className="h-5 w-5 text-red-500" /> Add Link to Folder</h3>
                <Button variant="ghost" size="icon" onClick={() => { setShowLinkModal(false); setTargetFolderForLink(null); setNewLinkUrl(""); }}><X className="h-4 w-4 text-slate-400" /></Button>
            </div>
            
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 mb-6 flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-orange-500 shadow-sm border border-orange-50"><Folder className="h-5 w-5" /></div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Folder</p>
                    <p className="text-sm font-bold text-slate-800">{targetFolderForLink?.name}</p>
                </div>
            </div>

            <div className="mb-8">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Paste URL</label>
                <Input 
                    value={newLinkUrl} 
                    onChange={(e) => setNewLinkUrl(e.target.value)} 
                    placeholder="e.g. https://www.youtube.com/watch?v=..." 
                    className="rounded-xl border-orange-100 bg-white h-11"
                    autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1"><Info className="h-3 w-3" /> Supports YouTube, Vimeo, and direct article links.</p>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowLinkModal(false); setTargetFolderForLink(null); setNewLinkUrl(""); }}>Cancel</Button>
                <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold" onClick={handleConfirmAddLink} disabled={!newLinkUrl.trim()}>Add Link</Button>
            </div>
        </motion.div>
    </motion.div>
  );

  const renderReportModal = () => (
      <motion.div 
        key="report-modal"
        className="fixed inset-0 z-[250] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-white p-6 border-b border-orange-100 flex justify-between items-center">
                 <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Sparkles className="h-5 w-5 text-orange-500 fill-orange-500" /> Generate Intelligence Report</h3>
                    <p className="text-xs text-slate-500 mt-1">Analyzing: <span className="font-bold text-slate-700">{reportTarget?.name}</span></p>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setShowReportModal(false)} className="rounded-full"><X className="h-5 w-5 text-slate-400" /></Button>
            </div>
            <div className="p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Select Report Type</p>
                <div className="grid grid-cols-1 gap-3">
                    {REPORT_TYPES.map((type) => (
                        <div key={type.id} onClick={() => setSelectedReportType(type.id)} className={cn("relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 group", selectedReportType === type.id ? "border-orange-500 bg-orange-50/50" : "border-slate-100 hover:border-orange-200 hover:bg-slate-50")}>
                            <div className={cn("p-3 rounded-xl transition-colors", type.color, selectedReportType === type.id ? "bg-white shadow-sm" : "bg-white")}><type.icon className="h-6 w-6" /></div>
                            <div><h4 className={cn("font-bold text-sm", selectedReportType === type.id ? "text-slate-900" : "text-slate-700")}>{type.label}</h4><p className="text-xs text-slate-500">{type.desc}</p></div>
                            {selectedReportType === type.id && (<div className="absolute right-4 top-1/2 -translate-y-1/2"><CheckCircle2 className="h-5 w-5 text-orange-500 fill-orange-100" /></div>)}
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-6 pt-2 bg-slate-50 flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl border-slate-200" onClick={() => setShowReportModal(false)}>Cancel</Button>
                <Button onClick={handleGenerateReport} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10"><Sparkles className="h-4 w-4 mr-2" /> Generate Report</Button>
            </div>
        </motion.div>
    </motion.div>
  );

  const renderWorkspacePopup = () => (
    <motion.div 
        key="workspace-popup"
        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setShowWorkspace(false)}
    >
       <motion.div variants={modalTransition} initial="hidden" animate="visible" exit="exit" onClick={(e) => { e.stopPropagation(); setActiveFolderMenu(null); }} className="bg-slate-900 w-full max-w-[96vw] h-[92vh] rounded-[24px] overflow-hidden flex shadow-2xl relative border border-slate-700/50">
          <div className="w-64 bg-[#0F172A] flex flex-col flex-shrink-0 border-r border-slate-800">
             <div className="p-6 pb-4">
                <div className="flex items-center gap-2 text-orange-500 mb-6"><LayoutGrid className="h-6 w-6" /><h2 className="text-xl font-bold tracking-wide text-white">Workspace</h2></div>
                <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">LOGGED IN AS</p>
                    <div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">{displayName.charAt(0).toUpperCase()}</div><p className="text-white font-medium text-sm truncate">{displayName}</p></div>
                </div>
             </div>
             <div className="flex-1 px-3 space-y-1">
                 <button onClick={() => { setActiveWorkspaceTab("folders"); setSelectedFolder(null); setFileSearchTerm(""); setFolderSearchTerm(""); setSearchResults([]); }} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left", activeWorkspaceTab === 'folders' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800")}><FolderOpen className="h-5 w-5" /> My Folders</button>
                 <button onClick={() => { setActiveWorkspaceTab("files"); setSelectedFolder(null); setFileSearchTerm(""); setFolderSearchTerm(""); setSearchResults([]); }} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left", activeWorkspaceTab === 'files' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800")}><FileText className="h-5 w-5" /> My Files</button>
                 <button onClick={() => { setActiveWorkspaceTab("links"); setSelectedFolder(null); }} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left", activeWorkspaceTab === 'links' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800")}><LinkIcon className="h-5 w-5" /> Links</button>
             </div>
             <div className="p-4 mt-auto"><button onClick={() => setShowWorkspace(false)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium w-full px-4 py-2 hover:bg-slate-800 rounded-lg"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</button></div>
          </div>
          <div className="flex-1 bg-[#FFF8F0] flex flex-col relative overflow-hidden min-h-0">
             {activeWorkspaceTab === "folders" && !selectedFolder && renderFoldersView()}
             {activeWorkspaceTab === "files" && renderFilesView()}
             {activeWorkspaceTab === "folders" && selectedFolder && renderFilesView()}
             {activeWorkspaceTab === "links" && renderLinksView()}
          </div>
       </motion.div>
    </motion.div>
  );

  const renderFoldersView = () => (
      <div className="flex-1 flex flex-col h-full p-6 overflow-hidden">
          <div className="flex-shrink-0 mb-6 flex justify-between items-end">
            <h1 className="text-2xl font-bold text-slate-800">Project Folders</h1>
             <div className="flex items-center gap-4">
                 <div className="bg-slate-100 rounded-lg p-1 flex items-center gap-1">
                     <button onClick={() => setFolderViewMode("grid")} className={cn("p-1.5 rounded-md transition-all flex items-center justify-center", folderViewMode === 'grid' ? "bg-white shadow-sm text-orange-600" : "text-slate-400 hover:text-slate-600")}><LayoutGrid className="h-4 w-4" /></button>
                     <button onClick={() => setFolderViewMode("list")} className={cn("p-1.5 rounded-md transition-all flex items-center justify-center", folderViewMode === 'list' ? "bg-white shadow-sm text-orange-600" : "text-slate-400 hover:text-slate-600")}><List className="h-4 w-4" /></button>
                 </div>
                 <div className="relative">
                     {isSearching && folderSearchTerm.trim() ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-orange-500 animate-spin" /> : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />}
                     <Input value={folderSearchTerm} onChange={(e) => setFolderSearchTerm(e.target.value)} placeholder="Search folders..." className="pl-8 w-64 h-9 rounded-full bg-white border-orange-100 text-xs shadow-sm focus-visible:ring-orange-400" />
                 </div>
             </div>
          </div>

            {!folderSearchTerm && (
            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-orange-100 mb-6 flex-shrink-0">
                <div className="flex flex-col xl:flex-row gap-4 items-end">
                    <div className="flex-1 w-full"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">New Folder Name</label><Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g. Legal Documents 2025" className="rounded-xl border-orange-100 bg-orange-50/30 h-10 text-sm"/></div>
                    <div className="flex-1 w-full"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Description (Optional)</label><Input value={newFolderDesc} onChange={(e) => setNewFolderDesc(e.target.value)} placeholder="Project details..." className="rounded-xl border-orange-100 bg-orange-50/30 h-10 text-sm"/></div>
                    <Button onClick={handleCreateFolder} className="bg-orange-400 hover:bg-orange-500 text-white rounded-xl px-6 h-10 font-bold text-sm shadow-md shrink-0 w-full xl:w-auto mt-2 xl:mt-0"><Plus className="h-4 w-4 mr-2" /> Create</Button>
                </div>
            </div>
            )}

          <div className="flex-1 overflow-y-auto min-h-0">
            {folderViewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-10">
                    {getDisplayFolders().map(folder => (
                        <motion.div 
                            key={folder.id} variants={fadeInUp} 
                            className={cn(
                                "bg-white rounded-[20px] p-5 shadow-sm border border-orange-50 hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer group flex flex-col h-44 justify-between relative",
                                activeFolderMenu === folder.id ? "z-[50]" : "z-auto"
                            )}
                            onClick={() => { setSelectedFolder(folder); setActiveWorkspaceTab("folders"); setFileSearchTerm(""); }}
                        >
                            <div className="absolute inset-0 rounded-[20px] overflow-hidden pointer-events-none">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-50/0 to-orange-50/50 rounded-bl-[100px] rounded-tr-[20px]" />
                            </div>

                            <div className="flex justify-between items-start relative z-30">
                                <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-100"><Folder className="h-5 w-5" /></div>
                                <div className="relative" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-slate-500" onClick={() => setActiveFolderMenu(activeFolderMenu === folder.id ? null : folder.id)}><MoreVertical className="h-4 w-4" /></Button>
                                    {activeFolderMenu === folder.id && (
                                        <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-2xl border border-orange-200 z-[100] overflow-hidden py-1 ring-4 ring-orange-500/5">
                                            <button 
                                                onClick={() => { setActiveFolderMenu(null); handleAnalyzeFolder(folder); }} 
                                                className="w-full text-left px-3 py-2.5 hover:bg-purple-50 text-purple-600 text-xs flex items-center gap-2 font-bold transition-colors"
                                            >
                                                <Sparkles className="h-3.5 w-3.5" /> Analyze
                                            </button>
                                            
                                            <div className="h-px bg-slate-100 my-1"></div>
                                            <button className="w-full text-left px-3 py-2.5 hover:bg-orange-50 text-slate-600 text-xs flex items-center gap-2 font-medium transition-colors"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                                            <button onClick={() => { setActiveFolderMenu(null); }} className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-blue-600 text-xs flex items-center gap-2 font-medium transition-colors"><MessageSquare className="h-3.5 w-3.5" /> Chat</button>
                                            
                                             <button 
                                                onClick={() => { 
                                                    setActiveFolderMenu(null);
                                                    setTargetFolderForLink(folder); 
                                                    setShowLinkModal(true); 
                                                }} 
                                                className="w-full text-left px-3 py-2.5 hover:bg-red-50 text-red-600 text-xs flex items-center gap-2 font-medium transition-colors"
                                            >
                                                <Youtube className="h-3.5 w-3.5" /> YouTube
                                            </button>
                                            
                                            <div className="h-px bg-slate-100 my-1"></div>
                                            <button className="w-full text-left px-3 py-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 text-xs flex items-center gap-2 font-medium transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="z-10 relative mt-2">
                                <h3 className="text-base font-bold text-slate-800 mb-0.5 truncate pr-2">{folder.name}</h3>
                                <p className="text-[10px] text-slate-400 truncate">{folder.desc}</p>
                            </div>
                            <div className="flex flex-col gap-1 z-10 relative">
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                                    <User className="h-3 w-3 text-slate-400" /> 
                                    <span>Created by <span className="text-slate-700 font-bold">{folder.creatorName}</span></span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
                                    <span className="text-[10px] font-bold text-slate-400">{folder.fileCount} Files</span>
                                    <span className="text-[10px] text-slate-300 font-medium">{folder.createdAt}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[24px] border border-orange-100 shadow-sm flex flex-col overflow-hidden mb-10">
                     <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-slate-50">
                             <tr>
                                 <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Folder Name</th>
                                 <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Created By</th>
                                 <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">Files</th>
                                 <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Created</th>
                                 <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Action</th>
                             </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {getDisplayFolders().map(folder => (
                                <tr key={folder.id} onClick={() => { setSelectedFolder(folder); setActiveWorkspaceTab("folders"); setFileSearchTerm(""); }} className="group hover:bg-orange-50/30 transition-colors cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3"><div className="p-2 bg-orange-50 rounded-lg border border-orange-100 text-orange-500"><Folder className="h-4 w-4" /></div><div><span className="text-sm font-bold text-slate-700 block">{folder.name}</span><span className="text-[10px] text-slate-400">{folder.desc}</span></div></div>
                                    </td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold">{folder.creatorName?.charAt(0) || "U"}</div><span className="text-xs font-medium text-slate-600">{folder.creatorName}</span></div></td>
                                    <td className="px-6 py-4 text-center"><Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200">{folder.fileCount}</Badge></td>
                                    <td className="px-6 py-4 text-xs text-slate-400 text-right">{folder.createdAt}</td>
                                    <td className="px-6 py-4 text-right relative">
                                        <div onClick={(e) => e.stopPropagation()} className="inline-block relative">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600" onClick={() => setActiveFolderMenu(activeFolderMenu === folder.id ? null : folder.id)}><MoreVertical className="h-4 w-4" /></Button>
                                            {activeFolderMenu === folder.id && (
                                                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-orange-100 z-[50] overflow-hidden py-1">
                                                    <button onClick={() => { setActiveFolderMenu(null); handleAnalyzeFolder(folder); }} className="w-full text-left px-3 py-2 hover:bg-orange-50 text-purple-600 text-xs flex items-center gap-2 font-bold"><Sparkles className="h-3 w-3" /> Analyze</button>
                                                    <div className="h-px bg-slate-100 my-1"></div>
                                                    <button className="w-full text-left px-3 py-2 hover:bg-orange-50 text-slate-600 text-xs flex items-center gap-2 font-medium"><Pencil className="h-3 w-3" /> Edit</button>
                                                    <button onClick={() => { setActiveFolderMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-600 text-xs flex items-center gap-2 font-medium"><MessageSquare className="h-3 w-3" /> Chat</button>
                                                    <button 
                                                        onClick={() => { 
                                                            setActiveFolderMenu(null);
                                                            setTargetFolderForLink(folder); 
                                                            setShowLinkModal(true); 
                                                        }} 
                                                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 text-xs flex items-center gap-2 font-medium"
                                                    >
                                                        <Youtube className="h-3 w-3" /> YouTube
                                                    </button>
                                                    <div className="h-px bg-slate-100 my-1"></div>
                                                    <button className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 text-xs flex items-center gap-2 font-medium"><Trash2 className="h-3 w-3" /> Delete</button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                </div>
            )}
            {getDisplayFolders().length === 0 && (<div className="flex flex-col items-center justify-center h-40 text-slate-400"><Folder className="h-10 w-10 mb-2 opacity-20" /><p>No folders found matching "{folderSearchTerm}"</p></div>)}
          </div>
      </div>
  );

  const renderLinksView = () => (
    <div className="flex-1 flex flex-col h-full p-6 overflow-hidden">
         <div className="flex-shrink-0 mb-6">
            <h1 className="text-2xl font-bold text-slate-800">External Links</h1>
            <p className="text-xs text-slate-500 mt-1">Manage external URLs added to your folders.</p>
         </div>

         <div className="flex-1 bg-white rounded-[24px] border border-orange-100 shadow-sm flex flex-col overflow-hidden">
             <div className="flex-1 overflow-y-auto min-h-0 relative">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                         <tr>
                             <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 w-20">Sr No</th>
                             <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">URL Details</th>
                             <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">Folder</th>
                             <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 text-center w-40">Actions</th>
                             <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 text-center w-32">Link</th>
                         </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {links.length > 0 ? links.map((link, index) => {
                             // --- UPDATED LOGIC: Handle both populated object AND string ID ---
                             const folderData = link.folderId;
                             let folderName = null;

                             if (folderData && typeof folderData === 'object' && (folderData as any).name) {
                                 // Case 1: Backend returned populated object
                                 folderName = (folderData as any).name;
                             } else if (folderData) {
                                 // Case 2: Backend returned ID string, lookup in local folders array
                                 const found = folders.find(f => String(f.id) === String(folderData));
                                 if (found) folderName = found.name;
                             }

                             return (
                                <tr key={link.id} className="group hover:bg-orange-50/30 transition-colors">
                                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{String(index + 1).padStart(2, '0')}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400"><LinkIcon className="h-4 w-4" /></div>
                                            <div className="min-w-0 max-w-lg">
                                                <p className="text-xs font-bold text-slate-700 truncate">{link.title || link.url}</p>
                                                <p className="text-[10px] text-slate-400 font-medium truncate">{link.url}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {folderName ? (
                                            <div className="flex items-center gap-2">
                                                <Folder className="h-3 w-3 text-orange-400" />
                                                <span className="text-xs font-medium text-slate-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">{folderName}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-300 italic">Unassigned</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {link.ocrStatus !== 'pending' && (
                                                <Button size="sm" onClick={() => handleOpenTextViewer(link)} className="h-8 px-3 text-[10px] font-bold bg-white text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 rounded-full flex items-center gap-1 shadow-sm"><Eye className="h-3 w-3" /> View Content</Button>
                                            )}
                                            <Button size="sm" onClick={() => handleOpenChat(link)} className="h-8 px-3 text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-700 rounded-full flex items-center gap-1 shadow-sm"><MessageSquare className="h-3 w-3" /> Chat</Button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center"><Button variant="ghost" size="sm" onClick={() => window.open(link.originalUrl, '_blank')} className="h-8 w-8 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50"><ExternalLink className="h-4 w-4" /></Button></td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan={5} className="h-40 text-center"><div className="flex flex-col items-center justify-center text-slate-300"><LinkIcon className="h-8 w-8 mb-2 opacity-20" /><p className="text-xs font-medium">No links added yet.</p></div></td></tr>
                        )}
                    </tbody>
                </table>
             </div>
         </div>
    </div>
  );

  const renderFilesView = () => {
    const fileTableContent = (
         <div className="h-full bg-white rounded-[24px] border border-orange-100 shadow-sm flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 shrink-0">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">{isSearching ? `Search Results (${paginatedFiles.length})` : "Files"}</span>
                 <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md">{paginatedFiles.length} items</span></div>
             </div>
             <div className="flex-1 overflow-y-auto min-h-0 relative">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                         <tr>
                             <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">File Name</th>
                             <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">Format</th>
                             <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 text-right">Actions</th>
                         </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginatedFiles.map((file, i) => {
                            const fileFolder = folders.find(f => String(f.id) === String(file.folderId));
                            const fileUrl = file.publicPath ? (file.publicPath.startsWith('http') ? file.publicPath : `http://192.168.11.245:5000${file.publicPath.startsWith('/') ? '' : '/'}${file.publicPath}`) : "#";
                            return (
                            <tr key={file.id} className="group hover:bg-orange-50/30 transition-colors">
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">{getFileIconByExtension(file.extension)}</div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{file.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                {formatBytes(file.size)} <span className="text-slate-300">•</span> {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : "Unknown"}
                                                {fileFolder && !selectedFolder && (<> <span className="text-slate-300">•</span> <span className="text-orange-500 bg-orange-50 px-1.5 rounded-sm flex items-center gap-0.5 border border-orange-100/50"><Folder className="h-2 w-2" /> {fileFolder.name}</span> </>)}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2.5">{getFileIconByExtension(file.extension, "h-6 w-6")}</td>
                                <td className="px-4 py-2.5 text-right w-36">
                                    <div className="flex justify-end gap-1">
                                        <Button onClick={() => handleInitiateReport('file', file.id, file.name)} size="icon" variant="ghost" className="h-7 w-7 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded-full" title="Analyze File"><Sparkles className="h-3.5 w-3.5" /></Button>
                                        <Button onClick={() => setViewingFile(file)} size="icon" variant="ghost" className="h-7 w-7 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-full"><Eye className="h-3.5 w-3.5" /></Button>
                                        <a href={fileUrl} download><Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-full"><Download className="h-3.5 w-3.5" /></Button></a>
                                    </div>
                                </td>
                            </tr>
                        )})}
                        {paginatedFiles.length === 0 && (<tr><td colSpan={3} className="h-40 text-center"><div className="flex flex-col items-center justify-center text-slate-300"><Search className="h-8 w-8 mb-2 opacity-20" /><p className="text-xs font-medium">No results found.</p></div></td></tr>)}
                    </tbody>
                </table>
             </div>
             <div className="p-2 border-t border-slate-100 flex items-center justify-between px-4 bg-slate-50/50 shrink-0">
                 <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="h-7 px-2 text-xs text-slate-500 hover:text-orange-600"><ChevronLeft className="h-3 w-3 mr-1" /> Prev</Button>
                 <span className="text-[10px] font-bold text-slate-400">Page {currentPage} of {totalPages || 1}</span>
                 <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="h-7 px-2 text-xs text-slate-500 hover:text-orange-600">Next <ChevronRight className="h-3 w-3 ml-1" /></Button>
             </div>
         </div>
    );

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
         <div className="px-6 py-4 border-b border-orange-100/50 bg-white/50 backdrop-blur-sm flex justify-between items-center shrink-0">
             <div className="flex items-center gap-4">
                 <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {selectedFolder ? (<> <span className="text-slate-400 cursor-pointer hover:text-orange-500 text-lg" onClick={() => setActiveWorkspaceTab("folders")}>Folders</span> <ChevronRight className="h-5 w-5 text-slate-300" /> {selectedFolder.name} </>) : "All Files"}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedFolder ? "Manage folder content." : "View all documents."}</p>
                 </div>
                 {selectedFolder && (
                     <Button size="sm" onClick={() => handleAnalyzeFolder(selectedFolder)} className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-full h-8 px-4 flex items-center gap-2 shadow-lg shadow-slate-900/10 ml-4">
                         <Sparkles className="h-3 w-3 text-orange-300" /> Analyze Folder
                     </Button>
                 )}
             </div>
             <div className="relative">
                 {isSearching && fileSearchTerm.trim() ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-orange-500 animate-spin" /> : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />}
                 <Input ref={searchInputRef} value={fileSearchTerm} onChange={(e) => setFileSearchTerm(e.target.value)} placeholder={selectedFolder ? `Search in ${selectedFolder.name}...` : "Search all files..."} className="pl-8 w-64 h-9 rounded-full bg-white border-orange-100 text-xs shadow-sm focus-visible:ring-orange-400" />
             </div>
         </div>
         <div className="flex-1 p-6 overflow-hidden min-h-0">
             {selectedFolder ? (
                 <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                     <div className="h-full flex flex-col min-h-0">
                         <motion.div 
                             whileHover={{ scale: 1.01, borderColor: "rgba(249, 115, 22, 0.5)" }} whileTap={{ scale: 0.99 }} animate={isDragging ? { scale: 1.02, backgroundColor: "rgba(255, 247, 237, 0.9)", borderColor: "#f97316" } : {}}
                             className={cn("flex-1 rounded-[24px] border border-orange-100 bg-white/40 backdrop-blur-xl shadow-lg relative overflow-hidden group cursor-pointer flex flex-col items-center justify-center p-8 transition-all duration-300", isDragging ? "ring-4 ring-orange-500/10" : "")}
                             onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }} onDrop={onDrop} onClick={() => fileInputRef.current?.click()}
                         >
                             <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-orange-50/50 opacity-50" />
                             <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-200/20 rounded-full blur-3xl group-hover:bg-orange-300/30 transition-colors" />
                             <input type="file" multiple className="hidden" ref={fileInputRef} onChange={onFileSelectChange} />
                             <div className="relative z-10 flex flex-col items-center text-center">
                                 <motion.div className={cn("h-24 w-24 rounded-3xl flex items-center justify-center shadow-xl mb-6 transition-all duration-500", isDragging ? "bg-orange-500 text-white rotate-12 scale-110" : "bg-gradient-to-br from-white to-orange-50 text-orange-500 border border-orange-100 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-2xl group-hover:border-orange-200")}>
                                     {isDragging ? <UploadCloud className="h-10 w-10 animate-bounce" /> : <UploadCloud className="h-10 w-10" />}
                                 </motion.div>
                                 <h3 className="font-black text-2xl text-slate-800 mb-2 tracking-tight">Upload Documents</h3>
                                 <p className="text-slate-500 text-sm max-w-[240px] leading-relaxed">Drag & Drop files here or <span className="text-orange-500 font-bold underline decoration-2 underline-offset-2">browse</span> from your computer.</p>
                                 <div className="mt-8 flex gap-3"><Badge variant="secondary" className="bg-white/80 backdrop-blur border-orange-100 text-slate-400 font-normal">PDF</Badge><Badge variant="secondary" className="bg-white/80 backdrop-blur border-orange-100 text-slate-400 font-normal">DOCX</Badge><Badge variant="secondary" className="bg-white/80 backdrop-blur border-orange-100 text-slate-400 font-normal">JPG</Badge></div>
                             </div>
                         </motion.div>
                     </div>
                     <div className="h-full min-h-0">{fileTableContent}</div>
                 </div>
             ) : (<div className="h-full min-h-0">{fileTableContent}</div>)}
         </div>
      </div>
  );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF8F0] text-slate-900 font-sans selection:bg-orange-200 selection:text-orange-900">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <motion.div animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-orange-200/20 blur-[120px]" />
         <motion.div animate={{ rotate: -360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} className="absolute bottom-[0%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-amber-100/30 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>
      
      {/* Toast Notification */}
      {renderToast()}

      <AnimatePresence>
        {viewingFile && <FileViewerOverlay key="file-viewer" file={viewingFile} onClose={() => setViewingFile(null)} />}
        {showWorkspace && renderWorkspacePopup()}
        {showUploadModal && renderUploadModal()}
        {showReportModal && renderReportModal()}
        {showLinkModal && renderLinkModal()}
        
        {/* --- ANALYSIS OVERLAY --- */}
        {showAnalysisOverlay && RenderAnalysisOverlay()}
        
        {activeChatLink && RenderChatOverlay()}
        {viewingTextLink && RenderTextViewer()}
      </AnimatePresence>
      <Header isAuthenticated={true} />
      <main className="relative z-10 container mx-auto px-4 pt-24 pb-8 flex-1 h-[calc(100vh-80px)]">
         <div className="h-full flex flex-col">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                 <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">Hello, <span className="text-orange-500 underline decoration-4 decoration-orange-200">{displayName}</span></h1>
                    <div className="flex items-center gap-2 mt-2 text-slate-500 font-medium"><Brain className="h-5 w-5 text-purple-500" /><span>Here are your latest intelligence insights.</span></div>
                 </div>
                 <div className="flex items-center gap-4">
                     <div className="hidden md:block text-right"><p className="text-xs font-bold text-slate-400 uppercase">Storage</p><p className="text-sm font-bold text-slate-700">{stats.storage} {stats.storageUnit} / 1GB</p></div>
                     <Button onClick={() => setShowWorkspace(true)} size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 py-6 shadow-xl shadow-slate-900/20 hover:scale-105 transition-all text-base font-bold flex items-center gap-2 group"><FolderOpen className="h-5 w-5 group-hover:text-orange-400 transition-colors" /> Open Workspace</Button>
                 </div>
             </div>
             <div className="flex-1 overflow-y-auto pr-2 pb-10">
                {/* --- ATTRACTIVE KPI CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <GlowCard className="p-6 flex items-center justify-between">
                        <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis Score</p><h3 className="text-3xl font-black text-slate-800 mt-2">94.2%</h3><div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1"><ArrowUpRight className="h-3 w-3" /> +2.4% vs last week</div></div>
                        <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100"><Activity className="h-7 w-7" /></div>
                    </GlowCard>
                    <GlowCard className="p-6 flex items-center justify-between">
                        <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Processing Vol</p><h3 className="text-3xl font-black text-slate-800 mt-2">{stats.processed} <span className="text-sm text-slate-400">docs</span></h3><div className="flex items-center gap-1 text-xs font-bold text-orange-600 mt-1"><Clock className="h-3 w-3" /> {stats.hoursSaved} hrs saved</div></div>
                        <div className="h-14 w-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100"><Zap className="h-7 w-7" /></div>
                    </GlowCard>
                    <GlowCard className="p-6 flex items-center justify-between">
                        <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Flags</p><h3 className="text-3xl font-black text-slate-800 mt-2">3 <span className="text-sm text-slate-400 font-medium">Alerts</span></h3><p className="text-xs text-slate-400 mt-1">Legal compliance alerts</p></div>
                        <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100"><AlertCircle className="h-7 w-7" /></div>
                    </GlowCard>
                    
                    {/* --- UPDATED GENERATE REPORT CARD (NO GLASSMORPHISM) --- */}
                    <div 
                        onClick={() => handleInitiateReport('folder', selectedFolder?.id || '', selectedFolder?.name || 'Current Context')} 
                        className="rounded-2xl bg-white border border-slate-200 p-0 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-xl hover:border-orange-200 transition-all duration-300 group relative overflow-hidden h-full min-h-[140px]"
                    >
                         <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-100/50 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-125" />
                         <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-100/50 to-transparent rounded-tr-full -ml-4 -mb-4 transition-transform group-hover:scale-125" />
                         
                         <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 mb-3 z-10 group-hover:scale-110 group-hover:bg-orange-500 transition-all duration-300">
                            <Rocket className="h-6 w-6 text-yellow-400 group-hover:text-white transition-colors" />
                         </div>
                         <h3 className="font-bold text-base text-slate-800 z-10 group-hover:text-orange-600 transition-colors">Generate Report</h3>
                         <p className="text-[10px] text-slate-400 mt-1 z-10 font-bold uppercase tracking-wider">Create Summary PDF</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-1">
                        <GlowCard className="p-6 h-[400px] flex flex-col">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Brain className="h-4 w-4 text-purple-500" /> Cognitive Analysis</h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={sentimentData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                        <Radar name="Current Batch" dataKey="A" stroke="#f97316" strokeWidth={3} fill="#f97316" fillOpacity={0.4} />
                                        <Tooltip content={<CustomTooltip />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </GlowCard>
                    </div>
                    <div className="lg:col-span-2">
                        <GlowCard className="p-6 h-[400px] flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue-500" /> Sentiment Trends (7 Days)</h3>
                                <div className="flex gap-4 text-xs font-medium bg-slate-50 px-3 py-1 rounded-full"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Positive</span><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300" /> Neutral</span><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400" /> Negative</span></div>
                            </div>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData} barSize={28}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                                        <Bar dataKey="positive" stackId="a" fill="#34d399" radius={[0,0,4,4]} />
                                        <Bar dataKey="neutral" stackId="a" fill="#cbd5e1" />
                                        <Bar dataKey="negative" stackId="a" fill="#fb7185" radius={[4,4,0,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </GlowCard>
                    </div>
                </div>
             </div>
         </div>
      </main>
      <Footer /> 
    </div>
  );
}


// import React, { useState, useEffect, useRef } from "react";
// import Instance from "@/lib/axiosInstance"; 
// import { Header } from "@/components/Header";
// import { Footer } from "@/components/Footer";
// import {
//   FileText, Clock, Download, Trash2, Rows,
//   FileImage, Folder, UploadCloud, X, Plus, 
//   LayoutGrid, Search, MoreVertical, 
//   File as FileIcon, Eye, Brain, 
//   ChevronLeft, ChevronRight, 
//   FileCode, 
//   TrendingUp, Activity, Sparkles,
//   Zap, ArrowUpRight, AlertCircle, 
//   CheckCircle2, MessageSquare, FolderOpen, 
//   ArrowLeft, Pencil, Loader2,
//   Link as LinkIcon, Youtube, ExternalLink, Play,
//   Info, FileInput, List, Languages, ScanText, User, Send, Bot, RefreshCw, Copy, Smartphone
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import {
//   ResponsiveContainer, XAxis, Tooltip, 
//   BarChart, Bar, CartesianGrid,
//   RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
// } from "recharts";
// import { motion, AnimatePresence } from "framer-motion";
// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";

// // --- UTILS ---
// function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// function formatBytes(bytes: number, decimals = 2) {
//   if (bytes === 0) return '0 Bytes';
//   const k = 1024;
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals < 0 ? 0 : decimals)) + ' ' + ['Bytes', 'KB', 'MB', 'GB', 'TB'][i];
// }

// // --- ANIMATION VARIANTS ---
// const modalTransition = {
//   hidden: { opacity: 0, scale: 0.98 },
//   visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
//   exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
// };

// const fadeInUp = {
//   hidden: { opacity: 0, y: 10 },
//   visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
// };

// const toastVariant = {
//   hidden: { opacity: 0, y: 50, scale: 0.9 },
//   visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
//   exit: { opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }
// };

// // --- COMPONENT: GLOW CARD ---
// const GlowCard = ({ children, className = "", onClick, hoverEffect = true }: any) => {
//   return (
//     <motion.div
//       onClick={onClick}
//       variants={fadeInUp}
//       whileHover={hoverEffect ? { y: -2, boxShadow: "0 20px 40px -12px rgba(249, 115, 22, 0.1)" } : {}}
//       className={cn(
//         "relative overflow-hidden rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-sm transition-all duration-300 group",
//         className
//       )}
//     >
//       <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
//       {children}
//     </motion.div>
//   );
// };

// // --- HELPER FUNCTIONS ---
// const getUserId = (user: any) => {
//     if (!user) return null;
//     return user._id || user.id || user.userId;
// };

// const getFileStyle = (ext: string) => {
//   const e = ext ? ext.toLowerCase() : "file";
//   if (['pdf'].includes(e)) return { icon: FileText, color: "text-rose-500", bg: "bg-rose-50" };
//   if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(e)) return { icon: FileImage, color: "text-sky-500", bg: "bg-sky-50" };
//   if (['doc', 'docx', 'txt'].includes(e)) return { icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" };
//   if (['xls', 'xlsx', 'csv'].includes(e)) return { icon: Rows, color: "text-emerald-600", bg: "bg-emerald-50" };
//   if (['js', 'ts', 'tsx', 'html', 'css', 'py', 'sql'].includes(e)) return { icon: FileCode, color: "text-orange-500", bg: "bg-orange-50" };
//   return { icon: FileIcon, color: "text-slate-400", bg: "bg-slate-50" };
// };

// const getFileIconByExtension = (ext: string, className: string = "h-5 w-5", simple: boolean = false) => {
//   const style = getFileStyle(ext);
//   const Icon = style.icon;
//   if(simple) return <Icon className={className} />;
//   return <Icon className={cn(style.color, className)} />;
// };

// // --- TYPES ---
// type FolderType = { 
//     id: string; 
//     name: string; 
//     desc?: string; 
//     fileCount: number; 
//     createdAt: string; 
//     theme: "orange" | "blue" | "emerald" | "purple";
//     userId?: string;
//     creatorName?: string; 
//     totalSize?: number; 
// };

// type FileType = { 
//   id: string; 
//   name: string; 
//   extension: string; 
//   size: number; 
//   pageCount: string | number; 
//   publicPath?: string;
//   extractedText?: string;
//   folderId?: string; 
//   userId?: string; 
//   createdAt?: string;
// }; 

// type LinkType = {
//   id: string;
//   url: string;
//   title?: string;
//   status: 'pending' | 'processing' | 'completed' | 'failed';
//   createdAt: string;
//   ocrStatus?: 'pending' | 'completed'; 
//   extractedText?: string; // Original Text
//   translatedText?: string; // Translated Text
//   originalUrl?: string;
// };

// type ChatMessageType = {
//     id: string;
//     role: 'user' | 'assistant';
//     content: string;
//     timestamp: Date;
//     isLoading?: boolean;
// };

// // --- MOCK AI DATA ---
// const sentimentData = [
//   { subject: 'Positivity', A: 120, fullMark: 150 },
//   { subject: 'Clarity', A: 98, fullMark: 150 },
//   { subject: 'Conciseness', A: 86, fullMark: 150 },
//   { subject: 'Actionability', A: 99, fullMark: 150 },
//   { subject: 'Compliance', A: 85, fullMark: 150 },
//   { subject: 'Tone', A: 65, fullMark: 150 },
// ];

// const trendData = [
//   { name: 'Mon', positive: 40, negative: 24, neutral: 24 },
//   { name: 'Tue', positive: 30, negative: 13, neutral: 22 },
//   { name: 'Wed', positive: 20, negative: 58, neutral: 22 },
//   { name: 'Thu', positive: 27, negative: 39, neutral: 20 },
//   { name: 'Fri', positive: 18, negative: 48, neutral: 21 },
//   { name: 'Sat', positive: 23, negative: 38, neutral: 25 },
//   { name: 'Sun', positive: 34, negative: 43, neutral: 21 },
// ];

// // --- COMPONENT: FILE VIEWER OVERLAY ---
// const FileViewerOverlay = ({ file, onClose }: { file: FileType; onClose: () => void }) => {
//   const baseURL = "http://192.168.11.236:5000";
//   const fileUrl = file.publicPath 
//     ? (file.publicPath.startsWith('http') ? file.publicPath : `${baseURL}${file.publicPath}`) 
//     : null;
//   const ext = file.extension.toLowerCase();

//   const renderContent = () => {
//     if (!fileUrl) return <div className="text-slate-400">File path missing.</div>;
//     if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return <img src={fileUrl} alt={file.name} className="max-w-full max-h-full object-contain shadow-lg rounded-md" />;
//     if (['mp4', 'webm', 'ogg'].includes(ext)) return <video controls className="max-w-full max-h-full rounded-lg" autoPlay><source src={fileUrl} /></video>;
//     if (['pdf'].includes(ext)) return <iframe src={fileUrl} className="w-full h-full border-none bg-slate-50 rounded-lg shadow-inner" title={file.name} />;
//     return (
//          <div className="flex flex-col items-center justify-center p-10 text-center">
//             <div className="h-24 w-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-orange-500 animate-pulse">
//                {getFileIconByExtension(file.extension, "h-12 w-12")}
//             </div>
//             <p className="text-xl font-bold text-slate-800">Preview Not Available</p>
//             <p className="text-slate-500 mt-2 max-w-sm">This file type requires external viewing software.</p>
//             <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-6 px-8 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all transform hover:-translate-y-1">Download to View</a>
//          </div>
//     );
//   };

//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-6" onClick={onClose}>
//       <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-6xl h-[85vh] flex flex-col rounded-[24px] bg-[#FFFBF5] overflow-hidden shadow-2xl border border-white/20" onClick={(e) => e.stopPropagation()}>
//         <div className="flex items-center justify-between p-4 border-b border-orange-100 bg-white/50 backdrop-blur-xl">
//           <div className="flex items-center gap-4">
//              <div className="p-2 bg-white rounded-xl shadow-sm border border-orange-100">{getFileIconByExtension(file.extension)}</div>
//              <div>
//                 <h3 className="font-bold text-slate-800 text-sm truncate max-w-[400px]">{file.name}</h3>
//                 <p className="text-[10px] text-slate-500 font-mono">{formatBytes(file.size)}</p>
//              </div>
//           </div>
//           <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-orange-100 text-slate-500 hover:text-orange-600 transition-colors"><X className="h-5 w-5" /></Button>
//         </div>
//         <div className="flex-1 overflow-hidden relative bg-slate-100/50 flex items-center justify-center p-4">
//             <div className="w-full h-full flex items-center justify-center relative z-10">{renderContent()}</div>
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// };

// // --- CUSTOM TOOLTIP ---
// const CustomTooltip = ({ active, payload, label }: any) => {
//   if (active && payload && payload.length) {
//     return (
//       <div className="bg-white/95 backdrop-blur-xl p-3 rounded-xl shadow-xl border border-orange-100 z-50">
//         <p className="font-bold text-slate-900 mb-1 text-xs">{label}</p>
//         {payload.map((entry: any, index: number) => (
//           <div key={index} className="flex items-center gap-2 text-xs font-medium text-slate-600">
//              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill }} />
//              <span>{entry.name}: {entry.value}</span>
//           </div>
//         ))}
//       </div>
//     );
//   }
//   return null;
// };

// // --- DASHBOARD COMPONENT ---
// export default function UserDashboard() {
//   // Navigation
//   const [showWorkspace, setShowWorkspace] = useState(false);
//   const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"folders" | "files" | "links">("folders");
//   const [folderViewMode, setFolderViewMode] = useState<"grid" | "list">("grid"); 
//   const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);

//   // Data
//   const [currentUser, setCurrentUser] = useState<any>(null);
//   const [isUserLoaded, setIsUserLoaded] = useState(false); 
//   const [folders, setFolders] = useState<FolderType[]>([]);
//   const [allFiles, setAllFiles] = useState<FileType[]>([]); 
//   const [links, setLinks] = useState<LinkType[]>([]); 
//   const [stats, setStats] = useState<any>({ processed: 0, storage: 0, storageUnit: 'MB', hoursSaved: 0 });
  
//   // Search State
//   const [folderSearchTerm, setFolderSearchTerm] = useState(""); 
//   const [fileSearchTerm, setFileSearchTerm] = useState("");     
//   const [isSearching, setIsSearching] = useState(false);
//   const [searchResults, setSearchResults] = useState<FileType[]>([]);

//   // Notifications State
//   const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

//   // Upload Metadata State
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const [pendingFiles, setPendingFiles] = useState<File[]>([]);
//   const [metaDocumentType, setMetaDocumentType] = useState("PDF"); 
//   const [metaRelatedTo, setMetaRelatedTo] = useState("");

//   // Chat & Link Processing State
//   const [activeChatLink, setActiveChatLink] = useState<LinkType | null>(null);
//   const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);
//   const [chatInput, setChatInput] = useState("");
  
//   // Text Viewer State
//   const [viewingTextLink, setViewingTextLink] = useState<LinkType | null>(null);
//   const [isTranslating, setIsTranslating] = useState(false);
//   const [textViewerMode, setTextViewerMode] = useState<'original' | 'translated'>('original');

//   // Refs & Interactions
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const searchInputRef = useRef<HTMLInputElement>(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const chatScrollRef = useRef<HTMLDivElement>(null);
  
//   // Creation & Selection
//   const [newFolderName, setNewFolderName] = useState("");
//   const [newFolderDesc, setNewFolderDesc] = useState("");
//   const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
//   const [viewingFile, setViewingFile] = useState<FileType | null>(null);

//   // Link State
//   const [newLinkUrl, setNewLinkUrl] = useState("");
//   const [processingLinkId, setProcessingLinkId] = useState<string | null>(null);

//   // Pagination
//   const [currentPage, setCurrentPage] = useState(1);
//   const pageSize = 7; 

//   // --- INIT ---
//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");
//     if (storedUser) {
//       try { const parsed = JSON.parse(storedUser); setCurrentUser(parsed.user || parsed); } 
//       catch (e) { console.error(e); }
//     }
//     setIsUserLoaded(true);
//   }, []);

//   useEffect(() => {
//     if (isUserLoaded && currentUser) fetchData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isUserLoaded, currentUser]);

//   // Scroll to bottom of chat
//   useEffect(() => {
//     if (chatScrollRef.current) {
//         chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
//     }
//   }, [chatMessages, activeChatLink]);

//   const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
//     setToast({ message, type });
//     // Auto hide success/error toasts after a few seconds
//     setTimeout(() => setToast(null), 5000);
//   };

//   const fetchData = async () => {
//     const uid = getUserId(currentUser);
//     const uName = currentUser?.name || currentUser?.username || "Me";
//     if (!uid) return;
//     try {
//         const [filesRes, foldersRes, linksRes] = await Promise.all([
//             Instance.get('/auth/files'),
//             Instance.get('/auth/folders'),
//             Instance.get('/auth/links')
//         ]);
        
//         const rawFolders = foldersRes.data.folders || foldersRes.data || [];
//         const themes = ["orange", "blue", "emerald", "purple"];

//         // 1. Map Folders
//         const myFolders = rawFolders.map((f: any, i: number) => ({
//              id: f._id || f.id, 
//              name: f.name, 
//              desc: f.desc || "Security documents",
//              createdAt: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "Recently",
//              theme: themes[i % themes.length], 
//              userId: f.userId || f.user,
//              creatorName: (f.creator && f.creator.name) ? f.creator.name : ((f.userId === uid || f.user === uid) ? uName : "Unknown"),
//              fileCount: 0 
//         })).filter((f: any) => f.userId === uid);
//         setFolders(myFolders);

//         // 2. Map Files
//         const rawFiles = filesRes.data.files || filesRes.data || [];
//         const myFiles = transformFiles(rawFiles, myFolders).filter((f: any) => f.userId === uid).reverse();
//         setAllFiles(myFiles);

//         // 3. Map Links - FILTERED FOR COMPLETED AND UNIQUE
//         const rawLinks = linksRes.data.links || linksRes.data || [];
//         let myLinks = [];
        
//         if (Array.isArray(rawLinks)) {
//             // Filter only completed links first
//             const completedLinks = rawLinks.filter((l: any) => l.status === 'completed');
            
//             // Remove duplicates (keep the latest one based on URL)
//             const uniqueLinkMap = new Map();
//             completedLinks.forEach((l: any) => {
//                 uniqueLinkMap.set(l.url, l);
//             });
            
//             const uniqueLinks = Array.from(uniqueLinkMap.values());

//             myLinks = uniqueLinks.map((l: any) => ({
//                 id: l._id || l.id,
//                 url: l.url,
//                 title: l.title || l.url,
//                 status: l.status || 'completed',
//                 createdAt: l.createdAt,
//                 ocrStatus: l.ocrStatus || 'pending', 
//                 extractedText: l.extractedText || "Mock extracted text: This is content extracted from the URL...",
//                 translatedText: l.translatedText || "",
//                 originalUrl: l.url
//             }));
//         }
//         setLinks(myLinks.reverse());

//         // 4. Update File Counts inside Folders
//         const updatedFolders = myFolders.map((f: FolderType) => {
//              const folderFiles = myFiles.filter((file: FileType) => String(file.folderId) === String(f.id));
//              const totalSize = folderFiles.reduce((acc: number, file: FileType) => acc + (file.size || 0), 0);
//              return { ...f, fileCount: folderFiles.length, totalSize };
//         });
//         setFolders(updatedFolders);

//         // 5. Stats
//         const totalBytes = myFiles.reduce((acc: number, f: any) => acc + (f.size || 0), 0);
//         let storage = totalBytes / (1024 * 1024);
//         let unit = 'MB';
//         if (storage > 1024) { storage /= 1024; unit = 'GB'; }
        
//         setStats({
//             processed: myFiles.length,
//             storage: parseFloat(storage.toFixed(2)),
//             storageUnit: unit,
//             hoursSaved: (myFiles.length * 0.2).toFixed(1)
//         });

//     } catch (e) { console.error("Fetch Data Error", e); }
//   };

//   // --- TRANSFORM: Handles API Search Results Correctly ---
//   const transformFiles = (rawFiles: any[], currentFolders: FolderType[] = folders) => {
//       if (!Array.isArray(rawFiles)) return [];

//       return rawFiles.map((f: any) => {
//           let folderId = f.folderId || f.folder;
//           if (typeof folderId === 'object' && folderId !== null) {
//               folderId = folderId._id || folderId.id;
//           }

//           if (!folderId && f.folderName) {
//               let matchedFolder = currentFolders.find(fold => fold.name === f.folderName);
//               if (!matchedFolder) {
//                   matchedFolder = currentFolders.find(fold => fold.name.toLowerCase() === f.folderName.toLowerCase());
//               }
//               if (matchedFolder) folderId = matchedFolder.id;
//           }

//           return {
//             id: f._id || f.id, 
//             name: f.fileName || f.originalName || f.name || "Untitled", 
//             extension: f.extension || (f.fileName || f.originalName || f.name || "").split('.').pop() || "file",
//             size: f.size || 0, 
//             pageCount: f.pageCount || 'N/A', 
//             publicPath: f.publicPath || "",
//             folderId: folderId,
//             userId: f.userId || f.user,
//             createdAt: f.createdAt
//           };
//       });
//   };

//   const handleCreateFolder = async () => {
//       if(!newFolderName.trim() || !currentUser) return;
//       const uid = getUserId(currentUser);
//       // Logic to get the creator's name dynamically, fallback to "Prachi Shah" if not found
//       const creatorName = currentUser?.name || currentUser?.username || "Prachi Shah";

//       try {
//           await Instance.post(`/auth/folder/create`, { 
//             name: newFolderName, 
//             desc: newFolderDesc, 
//             userId: uid,
//             createdBy: creatorName 
//           });
//           setNewFolderName(""); setNewFolderDesc(""); fetchData();
//           showToast("Folder created successfully!", "success");
//       } catch(e) { console.error("Create Folder Error", e); }
//   };

//   // --- TRIGGER UPLOAD MODAL ---
//   const initiateUpload = (files: FileList) => {
//     if(!files || files.length === 0) return;
//     setPendingFiles(Array.from(files));
//     setMetaDocumentType("PDF"); 
//     setMetaRelatedTo("");
//     setShowUploadModal(true);
//   };

//   // --- CONFIRM UPLOAD TO API ---
//   const handleConfirmUpload = async () => {
//     if(pendingFiles.length === 0 || !currentUser) return;
    
//     setShowUploadModal(false); 
    
//     showToast("Uploading & Extracting Text (OCR)...", "info");

//     const uid = getUserId(currentUser);
//     const fd = new FormData();
//     pendingFiles.forEach((f: any) => fd.append('files', f));
//     fd.append('userId', uid);
    
//     // Append Metadata
//     fd.append('documentType', metaDocumentType);
//     fd.append('relatedTo', metaRelatedTo);
    
//     const uploadUrl = selectedFolder ? `/auth/upload/${selectedFolder.id}` : `/auth/upload`; 
    
//     try {
//         await Instance.post(uploadUrl, fd, { headers: { "Content-Type": "multipart/form-data" } });
//         fetchData();
//         showToast("Success! Files uploaded & processed.", "success");
//     } catch(e: any) { 
//         console.error("Upload Error", e);
//         const errorMessage = e.response?.data?.message || "Upload denied or failed. Please check file type/permissions.";
//         showToast(errorMessage, "error"); 
//     }
    
//     setPendingFiles([]);
//   };

//   const onDrop = (e: React.DragEvent) => {
//     e.preventDefault(); setIsDragging(false);
//     if(e.dataTransfer.files && e.dataTransfer.files.length > 0) initiateUpload(e.dataTransfer.files);
//   };

//   const onFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//       if(e.target.files && e.target.files.length > 0) initiateUpload(e.target.files);
//   };

//   // --- LINK & CHAT LOGIC ---
//   const handleAddLink = async () => {
//     if(!newLinkUrl.trim()) return;
//     showToast("Adding link...", "info");
//     try {
//         const res = await Instance.post('/auth/link/add', { url: newLinkUrl });
//         setNewLinkUrl("");
//         fetchData(); 
//         showToast("Link added successfully!", "success");
//     } catch (e: any) {
//         console.error("Add Link Error", e);
//         showToast("Failed to add link.", "error");
//     }
//   };

//   const handleRunOCR = async (link: LinkType) => {
//       if(processingLinkId) return;
//       setProcessingLinkId(link.id);
//       showToast("Running OCR extraction...", "info");

//       try {
//           // Mock API call for now. In real app: await Instance.post('/auth/link/ocr', { linkId: link.id });
//           await new Promise(r => setTimeout(r, 2000));
          
//           setLinks(prev => prev.map(l => l.id === link.id ? { ...l, ocrStatus: 'completed', extractedText: `Extracted content from ${l.url}...\nLorem ipsum dolor sit amet.` } : l));
//           showToast("OCR Completed Successfully", "success");
//       } catch (e) {
//           showToast("OCR Failed", "error");
//       } finally {
//           setProcessingLinkId(null);
//       }
//   };

//   const handleOpenChat = (link: LinkType) => {
//       setActiveChatLink(link);
//       setChatMessages([
//           { id: '1', role: 'assistant', content: `Hello! I've analyzed the content from "${link.title || link.url}". What would you like to know?`, timestamp: new Date() }
//       ]);
//       showToast("Chat initialized", "info");
//   };

//   const handleSendChatMessage = async () => {
//     if(!chatInput.trim() || !activeChatLink) return;
    
//     // 1. Add User Message
//     const userMsg: ChatMessageType = { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: new Date() };
//     setChatMessages(prev => [...prev, userMsg]);
    
//     const currentQuestion = chatInput;
//     setChatInput(""); // Clear Input

//     // 2. Add Loading Indicator
//     const loadingId = "loading-" + Date.now();
//     const loadingMsg: ChatMessageType = { 
//         id: loadingId, 
//         role: 'assistant', 
//         content: "Analyzing content...", 
//         timestamp: new Date(),
//         isLoading: true 
//     };
//     setChatMessages(prev => [...prev, loadingMsg]);

//     try {
//         // 3. Prepare Payload & Headers
//         const token = localStorage.getItem("token"); // Get token from local storage
//         const payload = {
//             question: currentQuestion,
//             link: activeChatLink.url
//         };

//         // 4. API Call
//         const res = await Instance.post('/auth/chat/ask', payload, {
//             headers: {
//                 'Authorization': token ? token : '', // Pass token exactly as requested
//                 'Content-Type': 'application/json'
//             }
//         });

//         // 5. Update Chat with Response
//         const responseText = res.data.answer || res.data.message || (typeof res.data === 'string' ? res.data : "Here is the information from the video/link.");

//         setChatMessages(prev => prev.map(msg => 
//             msg.id === loadingId 
//             ? { ...msg, content: responseText, isLoading: false } 
//             : msg
//         ));

//     } catch (error: any) {
//         console.error("Chat API Error:", error);
//         const errorMsg = error.response?.data?.message || "Sorry, I encountered an error communicating with the intelligence engine.";
        
//         setChatMessages(prev => prev.map(msg => 
//             msg.id === loadingId 
//             ? { ...msg, content: errorMsg, isLoading: false } 
//             : msg
//         ));
//     }
//   };

//   // --- TRANSLATION LOGIC ---
//   const handleOpenTextViewer = (link: LinkType) => {
//       setViewingTextLink(link);
//       setTextViewerMode('original'); // Always reset to original when opening
//   };

//   const handleTranslateText = async () => {
//       if(!viewingTextLink) return;
//       setIsTranslating(true);
//       showToast("Translating content...", "info");
      
//       try {
//           // Mock API call: await Instance.post('/auth/link/translate', { linkId: viewingTextLink.id });
//           await new Promise(r => setTimeout(r, 1500));
          
//           const translated = `(Translated to English)\n\n${viewingTextLink.extractedText}`;
          
//           // Update local state and links state
//           const updatedLink = { ...viewingTextLink, translatedText: translated };
//           setViewingTextLink(updatedLink);
//           setLinks(prev => prev.map(l => l.id === updatedLink.id ? updatedLink : l));
          
//           setTextViewerMode('translated');
//           showToast("Translation complete!", "success");
//       } catch (e) {
//           showToast("Translation failed", "error");
//       } finally {
//           setIsTranslating(false);
//       }
//   };

//   const handleCopyText = (text: string) => {
//      if(!text) return;
//      navigator.clipboard.writeText(text);
//      showToast("Text copied to clipboard", "success");
//   };

//   // --- API SEARCH LOGIC ---
//   useEffect(() => {
//     const delayDebounceFn = setTimeout(async () => {
//         const activeTerm = activeWorkspaceTab === "folders" && !selectedFolder ? folderSearchTerm : fileSearchTerm;

//         if(!activeTerm || !activeTerm.trim()) {
//             setIsSearching(false);
//             setSearchResults([]);
//             return;
//         }

//         setIsSearching(true);
//         try {
//             const res = await Instance.get(`/search?q=${encodeURIComponent(activeTerm)}`);
//             let resultsRaw = [];
//             if (Array.isArray(res.data)) {
//                 resultsRaw = res.data;
//             } else if (res.data && Array.isArray(res.data.results)) {
//                 resultsRaw = res.data.results;
//             } else if (res.data && Array.isArray(res.data.files)) {
//                 resultsRaw = res.data.files;
//             }
//             setSearchResults(transformFiles(resultsRaw, folders));
//         } catch (e) {
//             console.error("Search Error:", e);
//             setSearchResults([]);
//         }
        
//     }, 500); 

//     return () => clearTimeout(delayDebounceFn);
//   }, [fileSearchTerm, folderSearchTerm, activeWorkspaceTab, selectedFolder, folders]);

//   // --- DISPLAY LOGIC (STRICT) ---
//   const getDisplayFolders = () => {
//       if (!folderSearchTerm.trim()) return folders;
//       const lowerTerm = folderSearchTerm.toLowerCase();
//       return folders.filter(folder => {
//           const nameMatch = folder.name.toLowerCase().includes(lowerTerm);
//           const hasMatchingFile = searchResults.some(file => String(file.folderId) === String(folder.id));
//           return nameMatch || hasMatchingFile;
//       });
//   };

//   const getDisplayFiles = () => {
//       let files = isSearching && fileSearchTerm.trim() ? searchResults : allFiles;
//       if (selectedFolder) {
//           files = files.filter(f => String(f.folderId) === String(selectedFolder.id));
//       }
//       return files;
//   };

//   const paginatedFiles = getDisplayFiles().slice((currentPage - 1) * pageSize, currentPage * pageSize);
//   const totalPages = Math.ceil(getDisplayFiles().length / pageSize);
//   const displayName = currentUser?.name || currentUser?.username || "User";

//   // --- RENDERERS ---

//   const renderToast = () => (
//     <AnimatePresence>
//       {toast && (
//         <motion.div
//           variants={toastVariant}
//           initial="hidden"
//           animate="visible"
//           exit="exit"
//           className={cn(
//             "fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border border-white/20 min-w-[320px]",
//             toast.type === 'success' ? "bg-emerald-500/90 text-white" :
//             toast.type === 'error' ? "bg-rose-500/90 text-white" :
//             "bg-slate-900/90 text-white"
//           )}
//         >
//            <div className="p-2 bg-white/20 rounded-full">
//               {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
//                toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> :
//                <Loader2 className="h-5 w-5 animate-spin" />}
//            </div>
//            <div>
//               <p className="font-bold text-sm">{toast.type === 'success' ? "Success" : toast.type === 'error' ? "Error" : "Processing"}</p>
//               <p className="text-xs opacity-90">{toast.message}</p>
//            </div>
//            <button onClick={() => setToast(null)} className="ml-auto p-1 hover:bg-white/20 rounded-full transition-colors"><X className="h-4 w-4" /></button>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );

//   const RenderChatOverlay = () => {
//       if (!activeChatLink) return null;
//       return (
//         <motion.div 
//             initial={{ opacity: 0, y: 20, scale: 0.95 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 20, scale: 0.95 }}
//             className="fixed bottom-4 right-4 w-[350px] md:w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[200] flex flex-col overflow-hidden"
//         >
//             {/* Chat Header */}
//             <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shrink-0 shadow-sm z-10">
//                 <div className="flex items-center gap-3">
//                     <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 border border-orange-200">
//                         <Bot className="h-6 w-6" />
//                     </div>
//                     <div>
//                         <h3 className="text-slate-800 font-bold text-sm">AI Assistant</h3>
//                         <p className="text-slate-400 text-[10px] truncate max-w-[200px] flex items-center gap-1">
//                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
//                         </p>
//                     </div>
//                 </div>
//                 <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full h-8 w-8" onClick={() => setActiveChatLink(null)}>
//                     <X className="h-5 w-5" />
//                 </Button>
//             </div>
            
//             {/* Chat Messages Area */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={chatScrollRef}>
//                 <div className="text-center text-[10px] text-slate-400 my-4 uppercase tracking-widest font-bold">Today</div>
//                 {chatMessages.map((msg, index) => (
//                     <motion.div 
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         key={msg.id} 
//                         className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
//                     >
//                         <div className={cn("flex flex-col gap-1 max-w-[85%]", msg.role === 'user' ? "items-end" : "items-start")}>
//                              <div className={cn(
//                                 "p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm relative",
//                                 msg.role === 'user' ? "bg-orange-500 text-white rounded-br-none" : "bg-white text-slate-700 border border-slate-200 rounded-bl-none"
//                             )}>
//                                 {msg.isLoading ? (
//                                     <div className="flex items-center gap-2">
//                                         <Loader2 className="h-3 w-3 animate-spin" /> {msg.content}
//                                     </div>
//                                 ) : msg.content}
//                             </div>
//                             <span className="text-[9px] text-slate-400 px-1">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
//                         </div>
//                     </motion.div>
//                 ))}
//             </div>

//             {/* Input Area */}
//             <div className="p-3 bg-white border-t border-slate-100 shrink-0">
//                 <form onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} className="flex gap-2 items-center">
//                     <Input 
//                         value={chatInput} 
//                         onChange={(e) => setChatInput(e.target.value)} 
//                         placeholder="Type your message..." 
//                         className="rounded-full bg-slate-50 border-slate-200 text-xs focus-visible:ring-orange-400 py-5 pl-4"
//                         autoFocus
//                     />
//                     <Button type="submit" size="icon" disabled={!chatInput.trim()} className="rounded-full bg-slate-900 hover:bg-slate-800 text-white w-10 h-10 shrink-0 shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
//                         <Send className="h-4 w-4 ml-0.5" />
//                     </Button>
//                 </form>
//             </div>
//         </motion.div>
//       );
//   };

//   const RenderTextViewer = () => {
//     if (!viewingTextLink) return null;
//     return (
//         <motion.div 
//             initial={{ opacity: 0 }} 
//             animate={{ opacity: 1 }} 
//             exit={{ opacity: 0 }} 
//             className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
//             onClick={() => setViewingTextLink(null)}
//         >
//             <motion.div 
//                 initial={{ scale: 0.95, y: 20 }} 
//                 animate={{ scale: 1, y: 0 }} 
//                 className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
//                 onClick={(e) => e.stopPropagation()}
//             >
//                 {/* Header */}
//                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
//                     <div className="flex items-center gap-3">
//                         <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500 border border-orange-100"><ScanText className="h-5 w-5" /></div>
//                         <div>
//                             <h3 className="font-bold text-slate-800 text-sm">Extracted Content Viewer</h3>
//                             <p className="text-xs text-slate-500 truncate max-w-md mt-0.5 flex items-center gap-1">
//                                 <LinkIcon className="h-3 w-3" /> {viewingTextLink.url}
//                             </p>
//                         </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <Button 
//                             variant="outline" size="sm" 
//                             onClick={handleTranslateText}
//                             disabled={isTranslating || textViewerMode === 'translated'}
//                             className={cn(
//                                 "text-xs font-bold border-slate-200 rounded-lg h-9 px-4 transition-all",
//                                 textViewerMode === 'translated' ? "bg-purple-50 text-purple-600 border-purple-200 cursor-default" : "text-slate-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
//                             )}
//                         >
//                             {isTranslating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Languages className="h-3.5 w-3.5 mr-2" />}
//                             {isTranslating ? "Translating..." : textViewerMode === 'translated' ? "Translated" : "Translate to English"}
//                         </Button>
//                         <Button variant="ghost" size="icon" onClick={() => setViewingTextLink(null)} className="rounded-full hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></Button>
//                     </div>
//                 </div>

//                 {/* Tabs */}
//                 <div className="px-6 border-b border-slate-100 bg-slate-50/50 flex gap-6">
//                     <button 
//                         onClick={() => setTextViewerMode('original')}
//                         className={cn(
//                             "text-xs font-bold py-3 border-b-2 transition-all flex items-center gap-2",
//                             textViewerMode === 'original' ? "border-orange-500 text-orange-600" : "border-transparent text-slate-400 hover:text-slate-600"
//                         )}
//                     >
//                         Original Extracted Text
//                     </button>
//                     <button 
//                         onClick={() => viewingTextLink.translatedText && setTextViewerMode('translated')}
//                         disabled={!viewingTextLink.translatedText}
//                         className={cn(
//                             "text-xs font-bold py-3 border-b-2 transition-all flex items-center gap-2",
//                             textViewerMode === 'translated' ? "border-purple-500 text-purple-600" : !viewingTextLink.translatedText ? "border-transparent text-slate-300 cursor-not-allowed" : "border-transparent text-slate-400 hover:text-purple-600"
//                         )}
//                     >
//                         Translated Text {textViewerMode === 'translated' && <CheckCircle2 className="h-3 w-3" />}
//                     </button>
//                 </div>

//                 {/* Content Area */}
//                 <div className="flex-1 overflow-y-auto p-8 bg-slate-50 relative">
//                     <div className="absolute top-4 right-4 z-10">
//                          <Button 
//                             variant="outline" size="sm" 
//                             onClick={() => handleCopyText(textViewerMode === 'original' ? viewingTextLink.extractedText || "" : viewingTextLink.translatedText || "")}
//                             className="bg-white/80 backdrop-blur border-slate-200 text-slate-500 hover:text-slate-800 text-xs h-8"
//                          >
//                             <Copy className="h-3 w-3 mr-1.5" /> Copy
//                          </Button>
//                     </div>

//                     <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm min-h-full">
//                         {textViewerMode === 'original' ? (
//                             <div className="prose prose-sm max-w-none text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
//                                 {viewingTextLink.extractedText || <span className="text-slate-400 italic">No content extracted yet. Run OCR first.</span>}
//                             </div>
//                         ) : (
//                             <div className="prose prose-sm max-w-none text-purple-900 font-mono leading-relaxed whitespace-pre-wrap">
//                                 {viewingTextLink.translatedText}
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </motion.div>
//         </motion.div>
//     );
//   };

//   // --- UPLOAD METADATA MODAL ---
//   const renderUploadModal = () => (
//     <motion.div 
//         className="fixed inset-0 z-[250] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//     >
//         <motion.div 
//             initial={{ scale: 0.95, y: 10 }} 
//             animate={{ scale: 1, y: 0 }} 
//             className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/20"
//         >
//             <div className="flex justify-between items-center mb-6">
//                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
//                     <UploadCloud className="h-5 w-5 text-orange-500" /> Confirm Upload
//                 </h3>
//                 <Button variant="ghost" size="icon" onClick={() => { setShowUploadModal(false); setPendingFiles([]); }}>
//                     <X className="h-4 w-4 text-slate-400" />
//                 </Button>
//             </div>
            
//             <div className="mb-6">
//                 <p className="text-sm font-medium text-slate-600 mb-2">Files to upload:</p>
//                 <div className="bg-slate-50 rounded-xl p-3 max-h-32 overflow-y-auto border border-slate-100">
//                     {pendingFiles.map((f, i) => (
//                         <div key={i} className="flex items-center gap-2 text-xs text-slate-500 py-1">
//                             <FileIcon className="h-3 w-3" /> <span className="truncate">{f.name}</span>
//                         </div>
//                     ))}
//                 </div>
//             </div>

//             <div className="space-y-4 mb-8">
//                 <div>
//                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Document Type</label>
//                     <Input 
//                         value={metaDocumentType} 
//                         onChange={(e) => setMetaDocumentType(e.target.value)} 
//                         placeholder="e.g. PDF, Invoice, Resume" 
//                         className="rounded-xl border-orange-100"
//                     />
//                 </div>
//                 <div>
//                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Related To</label>
//                     <Input 
//                         value={metaRelatedTo} 
//                         onChange={(e) => setMetaRelatedTo(e.target.value)} 
//                         placeholder="e.g. Resume, HR, Project ID" 
//                         className="rounded-xl border-orange-100"
//                     />
//                 </div>
//             </div>

//             <div className="flex gap-3">
//                 <Button 
//                     variant="outline" 
//                     className="flex-1 rounded-xl" 
//                     onClick={() => { setShowUploadModal(false); setPendingFiles([]); }}
//                 >
//                     Cancel
//                 </Button>
//                 <Button 
//                     className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold"
//                     onClick={handleConfirmUpload}
//                 >
//                     Confirm & Upload
//                 </Button>
//             </div>
//         </motion.div>
//     </motion.div>
//   );

//   // --- RENDER POPUP ---
//   const renderWorkspacePopup = () => (
//     <motion.div 
//         className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         onClick={() => setShowWorkspace(false)}
//     >
//        <motion.div 
//           variants={modalTransition}
//           initial="hidden"
//           animate="visible"
//           exit="exit"
//           onClick={(e) => { e.stopPropagation(); setActiveFolderMenu(null); }}
//           className="bg-slate-900 w-full max-w-[96vw] h-[92vh] rounded-[24px] overflow-hidden flex shadow-2xl relative border border-slate-700/50"
//        >
//           {/* SIDEBAR */}
//           <div className="w-64 bg-[#0F172A] flex flex-col flex-shrink-0 border-r border-slate-800">
//              <div className="p-6 pb-4">
//                 <div className="flex items-center gap-2 text-orange-500 mb-6">
//                     <LayoutGrid className="h-6 w-6" />
//                     <h2 className="text-xl font-bold tracking-wide text-white">Workspace</h2>
//                 </div>
//                 <div className="mb-4">
//                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">LOGGED IN AS</p>
//                     <div className="flex items-center gap-3">
//                         <div className="h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
//                             {displayName.charAt(0).toUpperCase()}
//                         </div>
//                         <p className="text-white font-medium text-sm truncate">{displayName}</p>
//                     </div>
//                 </div>
//              </div>
//              <div className="flex-1 px-3 space-y-1">
//                  <button 
//                     onClick={() => { setActiveWorkspaceTab("folders"); setSelectedFolder(null); setFileSearchTerm(""); setFolderSearchTerm(""); setSearchResults([]); }}
//                     className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left", activeWorkspaceTab === 'folders' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800")}
//                  >
//                      <FolderOpen className="h-5 w-5" /> My Folders
//                  </button>
//                  <button 
//                     onClick={() => { setActiveWorkspaceTab("files"); setSelectedFolder(null); setFileSearchTerm(""); setFolderSearchTerm(""); setSearchResults([]); }}
//                     className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left", activeWorkspaceTab === 'files' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800")}
//                  >
//                      <FileText className="h-5 w-5" /> My Files
//                  </button>
//                  <button 
//                     onClick={() => { setActiveWorkspaceTab("links"); setSelectedFolder(null); }}
//                     className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left", activeWorkspaceTab === 'links' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800")}
//                  >
//                      <LinkIcon className="h-5 w-5" /> Links
//                  </button>
//              </div>
//              <div className="p-4 mt-auto">
//                  <button onClick={() => setShowWorkspace(false)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium w-full px-4 py-2 hover:bg-slate-800 rounded-lg">
//                      <ArrowLeft className="h-4 w-4" /> Back to Dashboard
//                  </button>
//              </div>
//           </div>

//           {/* MAIN CONTENT */}
//           <div className="flex-1 bg-[#FFF8F0] flex flex-col relative overflow-hidden min-h-0">
//              {activeWorkspaceTab === "folders" && !selectedFolder && renderFoldersView()}
//              {activeWorkspaceTab === "files" && renderFilesView()}
//              {activeWorkspaceTab === "folders" && selectedFolder && renderFilesView()}
//              {activeWorkspaceTab === "links" && renderLinksView()}
//           </div>
//        </motion.div>
//     </motion.div>
//   );

//   const renderFoldersView = () => (
//       <div className="flex-1 flex flex-col h-full p-6 overflow-hidden">
//           <div className="flex-shrink-0 mb-6 flex justify-between items-end">
//             <h1 className="text-2xl font-bold text-slate-800">Project Folders</h1>
//              <div className="flex items-center gap-4">
//                  {/* VIEW MODE TOGGLE */}
//                  <div className="bg-slate-100 rounded-lg p-1 flex items-center gap-1">
//                      <button 
//                         onClick={() => setFolderViewMode("grid")}
//                         className={cn(
//                           "p-1.5 rounded-md transition-all flex items-center justify-center",
//                           folderViewMode === 'grid' ? "bg-white shadow-sm text-orange-600" : "text-slate-400 hover:text-slate-600"
//                         )}
//                      >
//                          <LayoutGrid className="h-4 w-4" />
//                      </button>
//                      <button 
//                         onClick={() => setFolderViewMode("list")}
//                         className={cn(
//                           "p-1.5 rounded-md transition-all flex items-center justify-center",
//                           folderViewMode === 'list' ? "bg-white shadow-sm text-orange-600" : "text-slate-400 hover:text-slate-600"
//                         )}
//                      >
//                          <List className="h-4 w-4" />
//                      </button>
//                  </div>

//                  <div className="relative">
//                      {isSearching && folderSearchTerm.trim() ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-orange-500 animate-spin" /> : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />}
//                      <Input 
//                         value={folderSearchTerm}
//                         onChange={(e) => setFolderSearchTerm(e.target.value)}
//                         placeholder="Search folders..." 
//                         className="pl-8 w-64 h-9 rounded-full bg-white border-orange-100 text-xs shadow-sm focus-visible:ring-orange-400" 
//                      />
//                  </div>
//              </div>
//           </div>

//             {/* Create Folder Box */}
//             {!folderSearchTerm && (
//             <div className="bg-white rounded-[20px] p-5 shadow-sm border border-orange-100 mb-6 flex-shrink-0">
//                 <div className="flex flex-col xl:flex-row gap-4 items-end">
//                     <div className="flex-1 w-full">
//                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">New Folder Name</label>
//                         <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g. Legal Documents 2025" className="rounded-xl border-orange-100 bg-orange-50/30 h-10 text-sm"/>
//                     </div>
//                     <div className="flex-1 w-full">
//                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Description (Optional)</label>
//                         <Input value={newFolderDesc} onChange={(e) => setNewFolderDesc(e.target.value)} placeholder="Project details..." className="rounded-xl border-orange-100 bg-orange-50/30 h-10 text-sm"/>
//                     </div>
//                     <Button onClick={handleCreateFolder} className="bg-orange-400 hover:bg-orange-500 text-white rounded-xl px-6 h-10 font-bold text-sm shadow-md shrink-0 w-full xl:w-auto mt-2 xl:mt-0">
//                         <Plus className="h-4 w-4 mr-2" /> Create
//                     </Button>
//                 </div>
//             </div>
//             )}

//           <div className="flex-1 overflow-y-auto min-h-0">
//             {folderViewMode === "grid" ? (
//                 // GRID VIEW (WATERFALL)
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-10">
//                     {getDisplayFolders().map(folder => (
//                         <motion.div 
//                             key={folder.id} variants={fadeInUp} 
//                             className="bg-white rounded-[20px] p-5 shadow-sm border border-orange-50 hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer group flex flex-col h-44 justify-between relative"
//                             onClick={() => { setSelectedFolder(folder); setActiveWorkspaceTab("folders"); setFileSearchTerm(""); }}
//                         >
//                             <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-50/0 to-orange-50/50 rounded-bl-[100px] pointer-events-none rounded-tr-[20px]" />
                            
//                             <div className="flex justify-between items-start relative z-30">
//                                 <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-100"><Folder className="h-5 w-5" /></div>
//                                 <div className="relative" onClick={(e) => e.stopPropagation()}>
//                                     <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-slate-500" onClick={() => setActiveFolderMenu(activeFolderMenu === folder.id ? null : folder.id)}><MoreVertical className="h-4 w-4" /></Button>
//                                     {activeFolderMenu === folder.id && (
//                                         <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-2xl border border-orange-200 z-[100] overflow-hidden py-1 ring-4 ring-orange-500/5">
//                                             <button className="w-full text-left px-3 py-2.5 hover:bg-orange-50 text-slate-600 text-xs flex items-center gap-2 font-medium transition-colors">
//                                                 <Pencil className="h-3.5 w-3.5" /> Edit
//                                             </button>
//                                             <button 
//                                                 onClick={() => { setActiveFolderMenu(null); }} 
//                                                 className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-blue-600 text-xs flex items-center gap-2 font-medium transition-colors"
//                                             >
//                                                 <MessageSquare className="h-3.5 w-3.5" /> Chat
//                                             </button>
//                                              <button 
//                                                 onClick={() => { 
//                                                     setActiveFolderMenu(null);
//                                                     setActiveWorkspaceTab("links");
//                                                 }} 
//                                                 className="w-full text-left px-3 py-2.5 hover:bg-red-50 text-red-600 text-xs flex items-center gap-2 font-medium transition-colors"
//                                             >
//                                                 <Youtube className="h-3.5 w-3.5" /> YouTube
//                                             </button>
//                                             <div className="h-px bg-slate-100 my-1"></div>
//                                             <button className="w-full text-left px-3 py-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 text-xs flex items-center gap-2 font-medium transition-colors">
//                                                 <Trash2 className="h-3.5 w-3.5" /> Delete
//                                             </button>
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                             <div className="z-10 relative mt-2">
//                                 <h3 className="text-base font-bold text-slate-800 mb-0.5 truncate pr-2">{folder.name}</h3>
//                                 <p className="text-[10px] text-slate-400 truncate">{folder.desc}</p>
//                             </div>
//                             <div className="flex flex-col gap-1 z-10 relative">
//                                 {/* CREATED BY - ADDED HERE */}
//                                 <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
//                                     <User className="h-3 w-3 text-slate-400" /> 
//                                     <span>Created by <span className="text-slate-700 font-bold">{folder.creatorName}</span></span>
//                                 </div>
//                                 <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
//                                     <span className="text-[10px] font-bold text-slate-400">{folder.fileCount} Files</span>
//                                     <span className="text-[10px] text-slate-300 font-medium">{folder.createdAt}</span>
//                                 </div>
//                             </div>
//                         </motion.div>
//                     ))}
//                 </div>
//             ) : (
//                 // LIST VIEW (TABLE)
//                 <div className="bg-white rounded-[24px] border border-orange-100 shadow-sm flex flex-col overflow-hidden mb-10">
//                      <table className="w-full text-left border-separate border-spacing-0">
//                         <thead className="bg-slate-50">
//                              <tr>
//                                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Folder Name</th>
//                                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Created By</th>
//                                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">Files</th>
//                                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Created</th>
//                                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Action</th>
//                              </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-50">
//                             {getDisplayFolders().map(folder => (
//                                 <tr 
//                                     key={folder.id} 
//                                     onClick={() => { setSelectedFolder(folder); setActiveWorkspaceTab("folders"); setFileSearchTerm(""); }}
//                                     className="group hover:bg-orange-50/30 transition-colors cursor-pointer"
//                                 >
//                                     <td className="px-6 py-4">
//                                         <div className="flex items-center gap-3">
//                                             <div className="p-2 bg-orange-50 rounded-lg border border-orange-100 text-orange-500">
//                                                 <Folder className="h-4 w-4" />
//                                             </div>
//                                             <div>
//                                                 <span className="text-sm font-bold text-slate-700 block">{folder.name}</span>
//                                                 <span className="text-[10px] text-slate-400">{folder.desc}</span>
//                                             </div>
//                                         </div>
//                                     </td>
//                                     {/* Created By Column */}
//                                     <td className="px-6 py-4">
//                                          <div className="flex items-center gap-2">
//                                             <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold">
//                                                 {folder.creatorName?.charAt(0) || "U"}
//                                             </div>
//                                             <span className="text-xs font-medium text-slate-600">{folder.creatorName}</span>
//                                          </div>
//                                     </td>
//                                     <td className="px-6 py-4 text-center">
//                                         <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200">{folder.fileCount}</Badge>
//                                     </td>
//                                     <td className="px-6 py-4 text-xs text-slate-400 text-right">{folder.createdAt}</td>
//                                     <td className="px-6 py-4 text-right relative">
//                                         <div onClick={(e) => e.stopPropagation()} className="inline-block relative">
//                                             <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600" onClick={() => setActiveFolderMenu(activeFolderMenu === folder.id ? null : folder.id)}>
//                                                 <MoreVertical className="h-4 w-4" />
//                                             </Button>
//                                             {activeFolderMenu === folder.id && (
//                                                 <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-orange-100 z-[50] overflow-hidden py-1">
//                                                     <button className="w-full text-left px-3 py-2 hover:bg-orange-50 text-slate-600 text-xs flex items-center gap-2 font-medium">
//                                                         <Pencil className="h-3 w-3" /> Edit
//                                                     </button>
//                                                     <button 
//                                                         onClick={() => { setActiveFolderMenu(null); }} 
//                                                         className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-600 text-xs flex items-center gap-2 font-medium"
//                                                     >
//                                                         <MessageSquare className="h-3 w-3" /> Chat
//                                                     </button>
//                                                     <button 
//                                                         onClick={() => { 
//                                                             setActiveFolderMenu(null);
//                                                             setActiveWorkspaceTab("links");
//                                                         }} 
//                                                         className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 text-xs flex items-center gap-2 font-medium"
//                                                     >
//                                                         <Youtube className="h-3 w-3" /> YouTube
//                                                     </button>
//                                                     <div className="h-px bg-slate-100 my-1"></div>
//                                                     <button className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 text-xs flex items-center gap-2 font-medium">
//                                                         <Trash2 className="h-3 w-3" /> Delete
//                                                     </button>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                      </table>
//                 </div>
//             )}

//             {getDisplayFolders().length === 0 && (
//                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
//                      <Folder className="h-10 w-10 mb-2 opacity-20" />
//                      <p>No folders found matching "{folderSearchTerm}"</p>
//                  </div>
//             )}
//           </div>
//       </div>
//   );

//   const renderLinksView = () => (
//     <div className="flex-1 flex flex-col h-full p-6 overflow-hidden">
//          <div className="flex-shrink-0 mb-6">
//             <h1 className="text-2xl font-bold text-slate-800">External Links</h1>
//             <p className="text-xs text-slate-500 mt-1">Manage and analyze external URLs for intelligence.</p>
//          </div>

//          {/* Add Link Section */}
//          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-orange-100 mb-6 flex-shrink-0">
//              <div className="flex flex-col xl:flex-row gap-4 items-end">
//                  <div className="flex-1 w-full">
//                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Add URL</label>
//                      <Input 
//                         value={newLinkUrl} 
//                         onChange={(e) => setNewLinkUrl(e.target.value)} 
//                         placeholder="e.g. https://www.youtube.com/watch?v=..." 
//                         className="rounded-xl border-orange-100 bg-orange-50/30 h-10 text-sm"
//                      />
//                  </div>
//                  <Button onClick={handleAddLink} className="bg-orange-400 hover:bg-orange-500 text-white rounded-xl px-6 h-10 font-bold text-sm shadow-md shrink-0 w-full xl:w-auto mt-2 xl:mt-0">
//                      <Plus className="h-4 w-4 mr-2" /> Add Link
//                  </Button>
//              </div>
//          </div>

//          {/* Links Table */}
//          <div className="flex-1 bg-white rounded-[24px] border border-orange-100 shadow-sm flex flex-col overflow-hidden">
//              <div className="flex-1 overflow-y-auto min-h-0 relative">
//                 <table className="w-full text-left border-separate border-spacing-0">
//                     <thead className="sticky top-0 bg-white z-10 shadow-sm">
//                          <tr>
//                              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 w-20">Sr No</th>
//                              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">URL Details</th>
//                              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 text-center w-40">Actions</th>
//                              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 text-center w-32">Link</th>
//                          </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-50">
//                         {links.length > 0 ? links.map((link, index) => (
//                             <tr key={link.id} className="group hover:bg-orange-50/30 transition-colors">
//                                 <td className="px-6 py-4 text-xs font-bold text-slate-400">
//                                     {String(index + 1).padStart(2, '0')}
//                                 </td>
//                                 <td className="px-6 py-4">
//                                     <div className="flex items-center gap-3">
//                                         <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
//                                             <LinkIcon className="h-4 w-4" />
//                                         </div>
//                                         <div className="min-w-0 max-w-lg">
//                                             <p className="text-xs font-bold text-slate-700 truncate">{link.title || link.url}</p>
//                                             <p className="text-[10px] text-slate-400 font-medium truncate">{link.url}</p>
//                                         </div>
//                                     </div>
//                                 </td>
                                
//                                 {/* ACTIONS: Run OCR, View Content, Chat */}
//                                 <td className="px-6 py-4 text-center">
//                                     <div className="flex justify-center gap-2">
//                                         {link.ocrStatus === 'pending' ? (
//                                              <Button 
//                                                 size="sm" 
//                                                 onClick={() => handleRunOCR(link)}
//                                                 disabled={processingLinkId === link.id}
//                                                 className="h-8 px-3 text-[10px] font-bold bg-white text-slate-600 hover:text-orange-600 border border-slate-200 hover:border-orange-200 rounded-full flex items-center gap-1 shadow-sm"
//                                             >
//                                                 {processingLinkId === link.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
//                                                 Run OCR
//                                             </Button>
//                                         ) : (
//                                             <Button 
//                                                 size="sm" 
//                                                 onClick={() => handleOpenTextViewer(link)}
//                                                 className="h-8 px-3 text-[10px] font-bold bg-white text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 rounded-full flex items-center gap-1 shadow-sm"
//                                             >
//                                                 <Eye className="h-3 w-3" /> View Content
//                                             </Button>
//                                         )}

//                                         <Button 
//                                             size="sm" 
//                                             onClick={() => handleOpenChat(link)}
//                                             className="h-8 px-3 text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-700 rounded-full flex items-center gap-1 shadow-sm"
//                                         >
//                                             <MessageSquare className="h-3 w-3" /> Chat
//                                         </Button>
//                                     </div>
//                                 </td>

//                                 {/* ORIGINAL LINK */}
//                                 <td className="px-6 py-4 text-center">
//                                     <Button 
//                                         variant="ghost" 
//                                         size="sm" 
//                                         onClick={() => window.open(link.originalUrl, '_blank')}
//                                         className="h-8 w-8 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50"
//                                     >
//                                         <ExternalLink className="h-4 w-4" />
//                                     </Button>
//                                 </td>
//                             </tr>
//                         )) : (
//                             <tr>
//                                 <td colSpan={4} className="h-40 text-center">
//                                     <div className="flex flex-col items-center justify-center text-slate-300">
//                                         <LinkIcon className="h-8 w-8 mb-2 opacity-20" />
//                                         <p className="text-xs font-medium">No links added yet.</p>
//                                     </div>
//                                 </td>
//                             </tr>
//                         )}
//                     </tbody>
//                 </table>
//              </div>
//          </div>
//     </div>
//   );

//   const renderFilesView = () => {
//     const fileTableContent = (
//          <div className="h-full bg-white rounded-[24px] border border-orange-100 shadow-sm flex flex-col overflow-hidden">
//              <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 shrink-0">
//                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">
//                     {isSearching ? `Search Results (${paginatedFiles.length})` : "Files"}
//                  </span>
//                  <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md">{paginatedFiles.length} items</span></div>
//              </div>
//              <div className="flex-1 overflow-y-auto min-h-0 relative">
//                 <table className="w-full text-left border-separate border-spacing-0">
//                     <thead className="sticky top-0 bg-white z-10 shadow-sm">
//                          <tr>
//                              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">File Name</th>
//                              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">Format</th>
//                              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 text-right">Actions</th>
//                          </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-50">
//                         {paginatedFiles.map((file, i) => {
//                             const fileFolder = folders.find(f => String(f.id) === String(file.folderId));
//                             const fileUrl = file.publicPath ? (file.publicPath.startsWith('http') ? file.publicPath : `http://192.168.11.236:5000${file.publicPath}`) : "#";
//                             return (
//                             <tr key={file.id} className="group hover:bg-orange-50/30 transition-colors">
//                                 <td className="px-4 py-2.5">
//                                     <div className="flex items-center gap-3">
//                                         <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">{getFileIconByExtension(file.extension)}</div>
//                                         <div className="min-w-0 flex-1">
//                                             <p className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{file.name}</p>
//                                             <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
//                                                 {formatBytes(file.size)} <span className="text-slate-300">•</span> {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : "Unknown"}
//                                                 {fileFolder && !selectedFolder && (
//                                                     <> <span className="text-slate-300">•</span> <span className="text-orange-500 bg-orange-50 px-1.5 rounded-sm flex items-center gap-0.5 border border-orange-100/50"><Folder className="h-2 w-2" /> {fileFolder.name}</span> </>
//                                                 )}
//                                             </p>
//                                         </div>
//                                     </div>
//                                 </td>
//                                 <td className="px-4 py-2.5"><Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 bg-slate-50">{file.extension.toUpperCase()}</Badge></td>
//                                 <td className="px-4 py-2.5 text-right w-24">
//                                     <div className="flex justify-end gap-1">
//                                         <Button onClick={() => setViewingFile(file)} size="icon" variant="ghost" className="h-7 w-7 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-full"><Eye className="h-3.5 w-3.5" /></Button>
//                                         <a href={fileUrl} download><Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-full"><Download className="h-3.5 w-3.5" /></Button></a>
//                                     </div>
//                                 </td>
//                             </tr>
//                         )})}
//                         {paginatedFiles.length === 0 && (
//                             <tr><td colSpan={3} className="h-40 text-center"><div className="flex flex-col items-center justify-center text-slate-300"><Search className="h-8 w-8 mb-2 opacity-20" /><p className="text-xs font-medium">No results found.</p></div></td></tr>
//                         )}
//                     </tbody>
//                 </table>
//              </div>
//              <div className="p-2 border-t border-slate-100 flex items-center justify-between px-4 bg-slate-50/50 shrink-0">
//                  <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="h-7 px-2 text-xs text-slate-500 hover:text-orange-600"><ChevronLeft className="h-3 w-3 mr-1" /> Prev</Button>
//                  <span className="text-[10px] font-bold text-slate-400">Page {currentPage} of {totalPages || 1}</span>
//                  <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="h-7 px-2 text-xs text-slate-500 hover:text-orange-600">Next <ChevronRight className="h-3 w-3 ml-1" /></Button>
//              </div>
//          </div>
//     );

//     return (
//       <div className="flex-1 flex flex-col h-full overflow-hidden">
//          <div className="px-6 py-4 border-b border-orange-100/50 bg-white/50 backdrop-blur-sm flex justify-between items-center shrink-0">
//              <div>
//                 <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
//                    {selectedFolder ? (
//                        <> <span className="text-slate-400 cursor-pointer hover:text-orange-500 text-lg" onClick={() => setActiveWorkspaceTab("folders")}>Folders</span> <ChevronRight className="h-5 w-5 text-slate-300" /> {selectedFolder.name} </>
//                    ) : "All Files"}
//                 </h1>
//                 <p className="text-xs text-slate-500 mt-0.5">{selectedFolder ? "Manage folder content." : "View all documents."}</p>
//              </div>
//              <div className="relative">
//                  {isSearching && fileSearchTerm.trim() ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-orange-500 animate-spin" /> : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />}
//                  <Input 
//                     ref={searchInputRef}
//                     value={fileSearchTerm}
//                     onChange={(e) => setFileSearchTerm(e.target.value)}
//                     placeholder={selectedFolder ? `Search in ${selectedFolder.name}...` : "Search all files..."} 
//                     className="pl-8 w-64 h-9 rounded-full bg-white border-orange-100 text-xs shadow-sm focus-visible:ring-orange-400" 
//                  />
//              </div>
//          </div>
//          <div className="flex-1 p-6 overflow-hidden min-h-0">
//              {selectedFolder ? (
//                  <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
//                      <div className="h-full flex flex-col min-h-0">
//                          {/* ATTRACTIVE UPLOAD SECTION */}
//                          <motion.div 
//                              whileHover={{ scale: 1.01, borderColor: "rgba(249, 115, 22, 0.5)" }}
//                              whileTap={{ scale: 0.99 }}
//                              animate={isDragging ? { scale: 1.02, backgroundColor: "rgba(255, 247, 237, 0.9)", borderColor: "#f97316" } : {}}
//                              className={cn(
//                                  "flex-1 rounded-[24px] border border-orange-100 bg-white/40 backdrop-blur-xl shadow-lg relative overflow-hidden group cursor-pointer flex flex-col items-center justify-center p-8 transition-all duration-300",
//                                  isDragging ? "ring-4 ring-orange-500/10" : ""
//                              )}
//                              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
//                              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
//                              onDrop={onDrop}
//                              onClick={() => fileInputRef.current?.click()}
//                          >
//                              {/* Decorative Background Elements */}
//                              <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-orange-50/50 opacity-50" />
//                              <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-200/20 rounded-full blur-3xl group-hover:bg-orange-300/30 transition-colors" />
                             
//                              <input type="file" multiple className="hidden" ref={fileInputRef} onChange={onFileSelectChange} />
                             
//                              <div className="relative z-10 flex flex-col items-center text-center">
//                                  <motion.div 
//                                     className={cn(
//                                         "h-24 w-24 rounded-3xl flex items-center justify-center shadow-xl mb-6 transition-all duration-500",
//                                         isDragging ? "bg-orange-500 text-white rotate-12 scale-110" : "bg-gradient-to-br from-white to-orange-50 text-orange-500 border border-orange-100 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-2xl group-hover:border-orange-200"
//                                     )}
//                                  >
//                                      {isDragging ? <UploadCloud className="h-10 w-10 animate-bounce" /> : <UploadCloud className="h-10 w-10" />}
//                                  </motion.div>
//                                  <h3 className="font-black text-2xl text-slate-800 mb-2 tracking-tight">Upload Documents</h3>
//                                  <p className="text-slate-500 text-sm max-w-[240px] leading-relaxed">
//                                      Drag & Drop files here or <span className="text-orange-500 font-bold underline decoration-2 underline-offset-2">browse</span> from your computer.
//                                  </p>
//                                  <div className="mt-8 flex gap-3">
//                                      <Badge variant="secondary" className="bg-white/80 backdrop-blur border-orange-100 text-slate-400 font-normal">PDF</Badge>
//                                      <Badge variant="secondary" className="bg-white/80 backdrop-blur border-orange-100 text-slate-400 font-normal">DOCX</Badge>
//                                      <Badge variant="secondary" className="bg-white/80 backdrop-blur border-orange-100 text-slate-400 font-normal">JPG</Badge>
//                                  </div>
//                              </div>
//                          </motion.div>
//                      </div>
//                      <div className="h-full min-h-0">{fileTableContent}</div>
//                  </div>
//              ) : (
//                  <div className="h-full min-h-0">{fileTableContent}</div>
//              )}
//          </div>
//       </div>
//   );
//   };

//   return (
//     <div className="flex flex-col min-h-screen bg-[#FFF8F0] text-slate-900 font-sans selection:bg-orange-200 selection:text-orange-900">
//       <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
//          <motion.div animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-orange-200/20 blur-[120px]" />
//          <motion.div animate={{ rotate: -360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} className="absolute bottom-[0%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-amber-100/30 blur-[100px]" />
//          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
//       </div>
      
//       {/* Toast Notification */}
//       {renderToast()}

//       <AnimatePresence>
//         {viewingFile && <FileViewerOverlay file={viewingFile} onClose={() => setViewingFile(null)} />}
//         {showWorkspace && renderWorkspacePopup()}
//         {showUploadModal && renderUploadModal()}
//         {/* Render New Chat and Text Viewer Overlays */}
//         {activeChatLink && RenderChatOverlay()}
//         {viewingTextLink && RenderTextViewer()}
//       </AnimatePresence>
//       <Header isAuthenticated={true} />
//       <main className="relative z-10 container mx-auto px-4 pt-24 pb-8 flex-1 h-[calc(100vh-80px)]">
//          <div className="h-full flex flex-col">
//              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
//                  <div>
//                     <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">Hello, <span className="text-orange-500 underline decoration-4 decoration-orange-200">{displayName}</span></h1>
//                     <div className="flex items-center gap-2 mt-2 text-slate-500 font-medium"><Brain className="h-5 w-5 text-purple-500" /><span>Here are your latest intelligence insights.</span></div>
//                  </div>
//                  <div className="flex items-center gap-4">
//                      <div className="hidden md:block text-right"><p className="text-xs font-bold text-slate-400 uppercase">Storage</p><p className="text-sm font-bold text-slate-700">{stats.storage} {stats.storageUnit} / 1GB</p></div>
//                      <Button onClick={() => setShowWorkspace(true)} size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 py-6 shadow-xl shadow-slate-900/20 hover:scale-105 transition-all text-base font-bold flex items-center gap-2 group"><FolderOpen className="h-5 w-5 group-hover:text-orange-400 transition-colors" /> Open Workspace</Button>
//                  </div>
//              </div>
//              <div className="flex-1 overflow-y-auto pr-2 pb-10">
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//                     <GlowCard className="p-6 flex items-center justify-between"><div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis Score</p><h3 className="text-3xl font-black text-slate-800 mt-2">94.2%</h3><div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1"><ArrowUpRight className="h-3 w-3" /> +2.4% vs last week</div></div><div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><Activity className="h-6 w-6" /></div></GlowCard>
//                     <GlowCard className="p-6 flex items-center justify-between"><div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Processing Vol</p><h3 className="text-3xl font-black text-slate-800 mt-2">{stats.processed} <span className="text-sm text-slate-400">docs</span></h3><div className="flex items-center gap-1 text-xs font-bold text-orange-600 mt-1"><Clock className="h-3 w-3" /> {stats.hoursSaved} hrs saved</div></div><div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm"><Zap className="h-6 w-6" /></div></GlowCard>
//                     <GlowCard className="p-6 flex items-center justify-between"><div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Flags</p><h3 className="text-3xl font-black text-slate-800 mt-2">3 <span className="text-sm text-slate-400 font-medium">Alerts</span></h3><p className="text-xs text-slate-400 mt-1">Legal compliance alerts</p></div><div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm"><AlertCircle className="h-6 w-6" /></div></GlowCard>
//                     <GlowCard className="p-0 border-none bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col justify-center items-center text-center cursor-pointer hover:scale-[1.02] transition-transform shadow-xl shadow-slate-900/20"><Sparkles className="h-8 w-8 text-yellow-400 mb-2" /><h3 className="font-bold text-lg">Generate Report</h3><p className="text-xs text-slate-400 mt-1">Create Summary PDF</p></GlowCard>
//                 </div>
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//                     <div className="lg:col-span-1">
//                         <GlowCard className="p-6 h-[400px] flex flex-col">
//                             <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Brain className="h-4 w-4 text-purple-500" /> Cognitive Analysis</h3>
//                             <div className="flex-1 w-full min-h-0">
//                                 <ResponsiveContainer width="100%" height="100%">
//                                     <RadarChart cx="50%" cy="50%" outerRadius="75%" data={sentimentData}>
//                                         <PolarGrid stroke="#e2e8f0" />
//                                         <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
//                                         <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
//                                         <Radar name="Current Batch" dataKey="A" stroke="#f97316" strokeWidth={3} fill="#f97316" fillOpacity={0.4} />
//                                         <Tooltip content={<CustomTooltip />} />
//                                     </RadarChart>
//                                 </ResponsiveContainer>
//                             </div>
//                         </GlowCard>
//                     </div>
//                     <div className="lg:col-span-2">
//                         <GlowCard className="p-6 h-[400px] flex flex-col">
//                             <div className="flex justify-between items-start mb-6">
//                                 <h3 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue-500" /> Sentiment Trends (7 Days)</h3>
//                                 <div className="flex gap-4 text-xs font-medium bg-slate-50 px-3 py-1 rounded-full"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Positive</span><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300" /> Neutral</span><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400" /> Negative</span></div>
//                             </div>
//                             <div className="flex-1 w-full min-h-0">
//                                 <ResponsiveContainer width="100%" height="100%">
//                                     <BarChart data={trendData} barSize={28}>
//                                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                                         <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
//                                         <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
//                                         <Bar dataKey="positive" stackId="a" fill="#34d399" radius={[0,0,4,4]} />
//                                         <Bar dataKey="neutral" stackId="a" fill="#cbd5e1" />
//                                         <Bar dataKey="negative" stackId="a" fill="#fb7185" radius={[4,4,0,0]} />
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             </div>
//                         </GlowCard>
//                     </div>
//                 </div>
//              </div>
//          </div>
//       </main>
//       <Footer /> 
//     </div>
//   );
// }
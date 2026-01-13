import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Instance from "@/lib/axiosInstance"; 
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  Flame,
  Layers,
  Clock,
  Database,
  Signal,
  BarChart3,
  AlertTriangle,
  MapPin,
  X,            
  Maximize2,    
  Download,     
  Eye           
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "react-spring"; 
import Lottie from "lottie-react"; 
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DOMPurify from "dompurify"; 

// --- LOTTIE JSON DATA SOURCES ---
const LOTTIE_SEARCHING = "https://lottie.host/5f5d8004-9a74-42b7-8488-82500c242337/C8y3yqG7xJ.json";
const LOTTIE_EMPTY = "https://lottie.host/955e4271-460d-453f-9174-8848d797f14b/p1Q3M6C3s5.json";
const LOTTIE_HERO = "https://lottie.host/b083b4c1-6548-43b6-96b6-52c676751268/K35Z3w3Qc0.json";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENT: ANIMATED COUNTER ---
const AnimatedNumber = ({ n }: { n: number }) => {
  const { number } = useSpring({
    from: { number: 0 },
    to: { number: n },
    delay: 200,
    config: { mass: 1, tension: 20, friction: 10 },
  });
  return <animated.span>{number.to((n) => n.toFixed(0))}</animated.span>;
};

// --- COMPONENT: GLASS CARD ---
const GlassCard = ({ children, className = "", onClick, hoverEffect = true }: any) => {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={hoverEffect ? { y: -5, boxShadow: "0 25px 50px -12px rgba(249, 115, 22, 0.25)" } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative overflow-hidden rounded-[32px] border border-orange-100/60 bg-white/60 backdrop-blur-xl shadow-xl shadow-orange-900/5 transition-all duration-300",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
};

// --- COMPONENT: HIGHLIGHTED TEXT RENDERER ---
const HighlightedText = ({ content }: { content: string }) => {
    // Sanitize to allow <strong> but prevent script injection
    const cleanContent = DOMPurify.sanitize(content, { ALLOWED_TAGS: ['strong', 'em', 'b'] });
    
    return (
        <span 
            className="text-slate-600 [&>strong]:bg-yellow-200 [&>strong]:text-orange-900 [&>strong]:font-bold [&>strong]:px-1 [&>strong]:rounded-sm"
            dangerouslySetInnerHTML={{ __html: cleanContent }} 
        />
    );
};

// --- COMPONENT: DOCUMENT VIEWER MODAL ---
const FileViewerModal = ({ file, onClose }: { file: SearchResult | null, onClose: () => void }) => {
  if (!file) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
        className="relative w-full max-w-5xl h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="h-10 w-10 shrink-0 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
               {file.docType === "Folder" ? <FolderOpen className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-800 truncate">{file.fileName}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-2 truncate">
                 <FolderOpen className="w-3 h-3" /> {file.folderName}
                 <span className="text-slate-300">|</span>
                 <Badge variant="outline" className="text-[10px] h-5 px-1.5">{file.docType}</Badge>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
             <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hidden sm:flex">
                <Download className="w-5 h-5" />
             </Button>
             <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hidden sm:flex">
                <Maximize2 className="w-5 h-5" />
             </Button>
             <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="text-slate-500 hover:text-white hover:bg-red-500 rounded-full transition-colors w-10 h-10"
             >
                <X className="w-6 h-6" />
             </Button>
          </div>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-1 bg-slate-100/50 p-4 sm:p-8 overflow-y-auto">
             <div className="max-w-3xl mx-auto bg-white min-h-[800px] shadow-sm border border-slate-200 rounded-lg p-6 sm:p-10 relative">
                
                {/* Simulated Document Header */}
                <div className="mb-8 pb-6 border-b border-slate-100">
                    <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 mb-2 break-words">{file.fileName.replace(/\.[^/.]+$/, "")}</h1>
                    <div className="text-slate-400 text-sm font-mono">Document ID: {file.id}</div>
                </div>

                {/* Simulated Content with Highlights */}
                <div className="space-y-6">
                    <div className="p-6 bg-orange-50/50 border border-orange-100 rounded-xl mb-8">
                        <h4 className="text-sm font-bold text-orange-800 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <Flame className="w-4 h-4" /> AI Highlighted Context
                        </h4>
                        <p className="text-slate-700 leading-relaxed text-lg font-medium">
                           "... <HighlightedText content={file.snippet} /> ..."
                        </p>
                    </div>

                    {/* Placeholder Text for "Whole Document" feel */}
                    <div className="space-y-4 text-slate-300 select-none blur-[1px] opacity-70">
                         <p className="w-full h-4 bg-slate-200 rounded"></p>
                         <p className="w-[90%] h-4 bg-slate-200 rounded"></p>
                         <p className="w-[95%] h-4 bg-slate-200 rounded"></p>
                         <div className="flex flex-col sm:flex-row gap-4 my-6">
                            <div className="w-full sm:w-1/2 h-40 bg-slate-200 rounded"></div>
                            <div className="w-full sm:w-1/2 h-40 bg-slate-200 rounded"></div>
                         </div>
                         <p className="w-full h-4 bg-slate-200 rounded"></p>
                         <p className="w-[85%] h-4 bg-slate-200 rounded"></p>
                         <p className="w-[92%] h-4 bg-slate-200 rounded"></p>
                    </div>
                    
                    <div className="flex justify-center mt-12 pb-8">
                        <Button variant="outline" className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800">
                            <FileText className="w-4 h-4" /> Load Full Document Content
                        </Button>
                    </div>
                </div>
             </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- INTERFACES MATCHING API RESPONSE ---
interface ApiLocation {
    type: string;
    description: string; // e.g., "Found on Page 1"
    snippet: string;
}

interface SearchResult {
  id: string;
  fileName: string;
  folderName: string;
  docType: "File" | "Folder" | "OcrRecord" | string;
  snippet: string; // HTML string with highlights
  locationLabel: string | null; // e.g. "Page 1" or "Line 55"
  matchCount: number;    
  relevanceScore: number; 
  matchType: string; // e.g. "metadata", "content"
}

const COLORS = ['#f59e0b', '#f97316', '#ea580c', '#fbbf24', '#d97706'];

export default function FileManagement() {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchDuration, setSearchDuration] = useState(0); 
  
  // --- NEW STATE: Selected file for viewer ---
  const [selectedFile, setSelectedFile] = useState<SearchResult | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // --- HANDLER ---
  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    // Abort previous request if active
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setSearchError("");
    setHasSearched(true);
    setSearchResults([]); 

    const startTime = performance.now(); 

    try {
        const response = await Instance.get(`/search?q=${encodeURIComponent(searchQuery)}`, {
            signal: controller.signal
        });

        // The API returns nested results structure: { results: { results: [...] } }
        let apiResults = [];
        if (response.data && response.data.results && Array.isArray(response.data.results.results)) {
            apiResults = response.data.results.results;
        } else if (Array.isArray(response.data)) {
            apiResults = response.data; // Fallback for standard arrays
        }

        const mappedResults: SearchResult[] = apiResults.map((item: any) => {
            const locations = item.locations || [];
            
            // Determine the best location match to show in preview
            // If locations exist, pick the first one; otherwise create a dummy one
            const bestMatch: ApiLocation = locations.length > 0 
                ? locations[0] 
                : { type: "name", description: "Metadata Match", snippet: item.fileName };

            // Extract displayable location label from description (e.g. "Found on Page 1" -> "Page 1")
            // This is robust: if API returns "Found on Line 2", it shows "Line 2".
            const locationLabel = bestMatch.description 
                ? bestMatch.description.replace(/^Found on\s+/i, "").trim() 
                : null;

            // Calculate a mock relevance score since the API doesn't provide one directly
            // Base score 75, add 5 per match, cap at 98.
            const calculatedScore = Math.min(75 + (locations.length * 5), 98);

            return {
                id: item.id,
                fileName: item.fileName || "Unknown",
                folderName: item.folderName || "Root",
                docType: item.docType || "File",
                snippet: bestMatch.snippet || item.fileName,
                locationLabel: locationLabel,
                matchCount: locations.length > 0 ? locations.length : 1,
                relevanceScore: calculatedScore, 
                matchType: bestMatch.type
            };
        });

        setSearchResults(mappedResults);

    } catch (error: any) {
        if (error.name === 'CanceledError') return;
        
        console.error("Search API Error:", error);
        if (error.response?.status === 401) {
             setSearchError("Unauthorized Access. Please login.");
        } else {
             setSearchError("Failed to fetch results. Please try again later.");
        }
        setSearchResults([]);
    } finally {
        const endTime = performance.now();
        setSearchDuration((endTime - startTime) / 1000); 
        if (abortControllerRef.current === controller) setIsSearching(false);
    }
  }, [searchQuery]);

  // --- ANALYTICS ---
  const analytics = useMemo(() => {
    if (!Array.isArray(searchResults) || searchResults.length === 0) {
        return { folderData: [], fileData: [], topFolder: "-", totalFiles: 0, totalMatches: 0, avgRelevance: 0 };
    }
    const folderGroups: Record<string, number> = {};
    const fileGroups: Record<string, number> = {};
    let totalMatches = 0;
    let totalScore = 0;

    searchResults.forEach(res => {
        if (res.folderName) folderGroups[res.folderName] = (folderGroups[res.folderName] || 0) + 1;
        if (res.fileName) fileGroups[res.fileName] = res.matchCount; 
        totalMatches += res.matchCount;
        totalScore += res.relevanceScore;
    });

    const folderData = Object.keys(folderGroups).map(key => ({ name: key, value: folderGroups[key] }));
    const fileData = Object.keys(fileGroups).map(key => ({ name: key, count: fileGroups[key] })).sort((a,b) => b.count - a.count).slice(0, 5);
    const topFolder = Object.keys(folderGroups).reduce((a, b) => folderGroups[a] > folderGroups[b] ? a : b, "-");

    return { 
        folderData, 
        fileData, 
        topFolder, 
        totalFiles: searchResults.length, 
        totalMatches, 
        avgRelevance: Math.round(totalScore / searchResults.length) 
    }; 
  }, [searchResults]);

  // --- HELPER: Density Badge Color ---
  const getDensityColor = (score: number) => {
      if (score > 80) return "text-red-600 bg-red-50 border-red-200"; 
      if (score > 50) return "text-orange-600 bg-orange-50 border-orange-200";
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
  };

  const getDensityLabel = (score: number) => {
      if (score > 80) return "Exact Match";
      if (score > 50) return "High Relevance";
      return "Potential Match";
  };

  // --- LOAD LOTTIE DATA ---
  const [lottieSearchData, setLottieSearchData] = useState<any>(null);
  const [lottieEmptyData, setLottieEmptyData] = useState<any>(null);
  const [lottieHeroData, setLottieHeroData] = useState<any>(null);

  useEffect(() => {
    fetch(LOTTIE_SEARCHING).then(r => r.json()).then(setLottieSearchData);
    fetch(LOTTIE_EMPTY).then(r => r.json()).then(setLottieEmptyData);
    fetch(LOTTIE_HERO).then(r => r.json()).then(setLottieHeroData);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF8F0] font-sans text-slate-900 overflow-x-hidden selection:bg-orange-200 selection:text-orange-900">
      
      {/* --- MODAL FOR DOC VIEWING --- */}
      <AnimatePresence>
         {selectedFile && (
            <FileViewerModal 
                file={selectedFile} 
                onClose={() => setSelectedFile(null)} 
            />
         )}
      </AnimatePresence>

      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] bg-gradient-to-r from-orange-200 to-amber-100 rounded-full blur-[140px] opacity-50" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-soft-light"></div>
      </div>

      <Header isAuthenticated={true} isAdmin={false} />
      
      <main className="relative z-10 flex-1 container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 py-16">
          
        {/* 1. HERO SECTION */}
        <section className="flex flex-col items-center justify-center space-y-8 max-w-5xl mx-auto w-full pt-6">
            <div className="absolute top-20 right-0 w-64 h-64 opacity-20 pointer-events-none md:block hidden">
                 {lottieHeroData && <Lottie animationData={lottieHeroData} loop={true} />}
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center space-y-6 relative z-10"
            >
                <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-orange-200 shadow-lg shadow-orange-500/10 backdrop-blur-md cursor-pointer"
                >
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <span className="text-sm font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        AI-Powered Retrieval
                    </span>
                </motion.div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 drop-shadow-sm">
                    Search your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 animate-gradient-x">
                        digital density.
                    </span>
                </h1>
            </motion.div>

            {/* --- SEARCH BAR --- */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: 0.2, type: "spring" }}
                className="w-full max-w-2xl relative z-20 group"
            >
                <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition duration-1000 animate-pulse"></div>
                <form onSubmit={handleSearch} className="relative flex items-center bg-white rounded-full shadow-2xl shadow-orange-900/10 p-2 border border-orange-100">
                    <div className="pl-6 text-orange-400">
                        <Search className="h-6 w-6" />
                    </div>
                    <Input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-4 pr-4 py-8 text-lg bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none outline-none placeholder:text-slate-400 text-slate-800 font-medium"
                        placeholder="Type keywords (e.g. 'Confidential', 'Criminal')..."
                    />
                    <Button 
                        type="submit" 
                        disabled={isSearching}
                        className="rounded-full px-8 h-14 bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 text-md font-semibold"
                    >
                        Search
                    </Button>
                </form>
                {searchError && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center justify-center text-red-600 text-sm gap-2 bg-red-50 py-3 px-6 rounded-xl border border-red-200 shadow-sm"
                    >
                        <AlertTriangle className="h-4 w-4" /> {searchError}
                    </motion.div>
                )}
            </motion.div>
        </section>

        {/* 2. LOADING STATE */}
        {isSearching && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center py-20 min-h-[400px]"
            >
                <div className="w-64 h-64">
                    {lottieSearchData && <Lottie animationData={lottieSearchData} loop={true} />}
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mt-[-20px] animate-pulse">Scanning Documents & Metadata...</h3>
            </motion.div>
        )}

        {/* 3. ANALYTICS DASHBOARD */}
        <AnimatePresence mode="wait">
            {!isSearching && hasSearched && searchResults.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-7xl mx-auto space-y-8"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                             <BarChart3 className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Search Analytics</h2>
                    </div>

                    {/* --- SUMMARY WIDGETS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        
                        {/* 1. TOTAL FILES */}
                        <GlassCard className="p-6 flex flex-col justify-between h-44 bg-gradient-to-br from-white/90 to-orange-50/50">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-orange-100/80 text-orange-600 rounded-2xl">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Results</span>
                            </div>
                            <div>
                                <h3 className="text-5xl font-black text-slate-800 tracking-tight">
                                    <AnimatedNumber n={analytics.totalFiles} />
                                </h3>
                                <p className="text-sm text-slate-500 font-medium mt-2">Items Found</p>
                            </div>
                        </GlassCard>

                        {/* 2. TOTAL MATCH DENSITY */}
                        <GlassCard className="p-6 flex flex-col justify-between h-44 bg-gradient-to-br from-white/90 to-amber-50/50">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-amber-100/80 text-amber-600 rounded-2xl">
                                    <Database className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Occurrences</span>
                            </div>
                            <div>
                                <h3 className="text-5xl font-black text-slate-800 tracking-tight">
                                    <AnimatedNumber n={analytics.totalMatches} />
                                </h3>
                                <p className="text-sm text-slate-500 font-medium mt-2">Total Highlights</p>
                            </div>
                        </GlassCard>

                        {/* 3. AVERAGE DENSITY SCORE */}
                        <GlassCard className="p-6 flex flex-col justify-between h-44 bg-gradient-to-br from-white/90 to-rose-50/50">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-rose-100/80 text-rose-600 rounded-2xl">
                                    <Signal className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Relevance</span>
                            </div>
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-5xl font-black text-slate-800 tracking-tight">
                                        <AnimatedNumber n={analytics.avgRelevance} />%
                                    </h3>
                                </div>
                                <div className="w-full bg-rose-100 h-2 rounded-full mt-3 overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${analytics.avgRelevance}%` }}></div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* 4. EXECUTION TIME */}
                        <GlassCard className="p-6 flex flex-col justify-between h-44 bg-gradient-to-br from-white/90 to-yellow-50/50">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-yellow-100/80 text-yellow-600 rounded-2xl">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Latency</span>
                            </div>
                            <div>
                                <h3 className="text-5xl font-black text-slate-800 tracking-tight">
                                    {searchDuration.toFixed(2)}<span className="text-3xl text-slate-400">s</span>
                                </h3>
                                <p className="text-sm text-slate-500 font-medium mt-2">Search Duration</p>
                            </div>
                        </GlassCard>
                    </div>

                    {/* --- CHARTS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* 1. SOURCE DISTRIBUTION (PIE CHART) */}
                        <GlassCard className="p-8">
                             <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-orange-500" />
                                    Folder Distribution
                                </h3>
                             </div>
                             <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analytics.folderData}
                                            cx="50%" cy="50%"
                                            innerRadius={60} 
                                            outerRadius={90} 
                                            paddingAngle={4}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                            style={{ fontSize: '11px', fontWeight: 600, fill: '#64748b' }}
                                        >
                                            {analytics.folderData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                             </div>
                             <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mt-2">
                                {analytics.folderData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                                        {d.name} <span className="text-slate-400 font-medium">({d.value})</span>
                                    </div>
                                ))}
                             </div>
                        </GlassCard>
                        
                        {/* 2. DENSITY BAR CHART */}
                        <GlassCard className="p-8">
                             <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-orange-500" />
                                    Top Matches
                                </h3>
                             </div>
                             <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.fileData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#fed7aa" strokeOpacity={0.5} />
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={110} tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} interval={0} />
                                        <RechartsTooltip 
                                            cursor={{fill: 'rgba(251, 146, 60, 0.1)'}} 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24} name="Locations">
                                            {analytics.fileData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                             </div>
                        </GlassCard>
                    </div>

                    {/* --- RESULTS LIST --- */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-3">
                             <div className="h-6 w-1 bg-orange-500 rounded-full"></div>
                             <h2 className="text-xl font-bold text-slate-800">Results with Highlights</h2>
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            {searchResults.map((result, idx) => (
                                <GlassCard 
                                    key={idx} 
                                    onClick={() => setSelectedFile(result)} // Opens Modal
                                    className="p-0 group cursor-pointer border-l-[6px] border-l-transparent hover:border-l-orange-500"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4 w-full">
                                                {/* DYNAMIC ICON BASED ON DOC TYPE */}
                                                <div className="mt-1 h-12 w-12 shrink-0 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shadow-sm">
                                                    {result.docType === "Folder" ? <FolderOpen className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                                                </div>
                                                <div className="w-full">
                                                    <h4 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-orange-600 transition-colors flex items-center gap-2">
                                                        {result.fileName}
                                                        {/* Visual hint for clicking */}
                                                        <Eye className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </h4>
                                                    <div className="flex items-center flex-wrap gap-2 mt-2">
                                                        <Badge variant="outline" className={cn("text-xs font-bold", getDensityColor(result.relevanceScore))}>
                                                            <Signal className="w-3 h-3 mr-1" />
                                                            {getDensityLabel(result.relevanceScore)}
                                                        </Badge>
                                                        <span className="text-xs text-slate-400 font-medium">| {result.folderName}</span>
                                                        
                                                        {/* LOCATION CONTEXT BADGE (Dynamic based on API Description) */}
                                                        {result.locationLabel && (
                                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs border border-slate-200">
                                                                <MapPin className="w-3 h-3 mr-1" />
                                                                {result.locationLabel}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* SCORE INDICATOR */}
                                            <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                                                <span className="text-xs font-bold text-slate-600">{result.matchCount > 1 ? `${result.matchCount} Matches` : '1 Match'}</span>
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={cn("h-full rounded-full", result.relevanceScore > 80 ? "bg-red-500" : result.relevanceScore > 50 ? "bg-orange-500" : "bg-yellow-500")}
                                                        style={{ width: `${result.relevanceScore}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* SNIPPET WITH HIGHLIGHTS */}
                                        <div className="mt-4 p-4 bg-slate-50/80 rounded-xl border border-slate-100 group-hover:bg-orange-50/30 group-hover:border-orange-100 transition-colors">
                                            <p className="text-sm text-slate-600 font-mono line-clamp-3 leading-relaxed">
                                                <HighlightedText content={result.snippet} />
                                            </p>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 4. EMPTY STATE */}
            {!isSearching && hasSearched && searchResults.length === 0 && !searchError && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20"
                >
                     <div className="w-80 h-80 opacity-90">
                        {lottieEmptyData && <Lottie animationData={lottieEmptyData} loop={false} />}
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mt-[-40px]">No matches found</h3>
                    <p className="text-slate-500 mt-2 max-w-md text-center">
                        We scanned the content and metadata of all files but found zero traces of "<b>{searchQuery}</b>".
                    </p>
                </motion.div>
            )}
        </AnimatePresence>

      </main>
      <Footer />
    </div>
  );
}
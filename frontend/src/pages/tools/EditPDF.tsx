import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FilePen, ArrowLeft, Download, Image as ImageIcon, Type, Loader2, MousePointer2, X, Move, CheckCircle, RefreshCw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Instance from "@/lib/axiosInstance";
import { motion } from "framer-motion";

import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Annotation {
  id: string;
  type: 'text' | 'image' | 'signature';
  x: number; 
  y: number; 
  page: number;
  content?: string; 
  src?: string;     
  width?: number;   
  fontSize?: number;
  color?: string;
}

interface ProcessedFileDetails {
  fileName: string; 
  originalName: string;
}

interface PageDimension {
  width: number;
  height: number;
}

const STORAGE_KEY = "kavach_edited_file";

export default function EditPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<ProcessedFileDetails | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageDimensions, setPageDimensions] = useState<Record<number, PageDimension>>({});
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pendingImageClick, setPendingImageClick] = useState<{page: number, x: number, y: number} | null>(null);

  const { toast } = useToast();

  const isAuthenticated = true;
  const isAdmin = false;

  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setProcessedFile(parsedData);
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsEditing(false);
      setNumPages(null);
      setAnnotations([]); 
      setPageDimensions({});
      setProcessedFile(null); 
      localStorage.removeItem(STORAGE_KEY);
      toast({
        title: "File uploaded",
        description: `${e.target.files[0].name} ready to edit`,
      });
    }
  };

  const handleEditStart = () => {
    if (!file) {
      toast({ title: "Error", description: "Please select a PDF file first", variant: "destructive" });
      return;
    }
    setIsEditing(true);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    toast({ title: "Success", description: `Loaded ${numPages} pages.` });
  };

  const onPageLoadSuccess = (page: any) => {
    setPageDimensions(prev => ({
      ...prev,
      [page.pageIndex + 1]: { 
        width: page.originalWidth,
        height: page.originalHeight
      }
    }));
  };

  const handleToolSelect = (toolName: string) => {
    setActiveTool(toolName === activeTool ? null : toolName); 
    toast({ title: "Tool Selected", description: toolName === activeTool ? "Tool deselected" : `Click on page to place: ${toolName}` });
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageNum: number) => {
    if (!activeTool) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; 
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeTool === 'text') {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'text',
        x, y, page: pageNum,
        content: "Type text here...",
        fontSize: 20,
        color: "#000000"
      };
      setAnnotations([...annotations, newAnnotation]);
      setActiveTool(null); 
    } 
    else if (activeTool === 'signature') {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'signature', 
        x, y, page: pageNum,
        content: "Sign Here"
      };
      setAnnotations([...annotations, newAnnotation]);
      setActiveTool(null);
    } 
    else if (activeTool === 'image') {
      setPendingImageClick({ page: pageNum, x, y });
      imageInputRef.current?.click();
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && pendingImageClick) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newAnnotation: Annotation = {
            id: Date.now().toString(),
            type: 'image',
            x: pendingImageClick.x,
            y: pendingImageClick.y,
            page: pendingImageClick.page,
            src: event.target.result as string,
            width: 120, 
            height: 120
          };
          setAnnotations([...annotations, newAnnotation]);
          setPendingImageClick(null);
          setActiveTool(null);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const updateAnnotationContent = (id: string, newContent: string) => {
    setAnnotations(annotations.map(a => a.id === id ? { ...a, content: newContent } : a));
  };

  const deleteAnnotation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255, 
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  const handleDownloadFile = async () => {
    if (!processedFile?.fileName) {
      toast({ title: "Download Error", description: "No file record found.", variant: "destructive" });
      return;
    }

    const rawPath = processedFile.fileName;
    const filenameToDownload = rawPath.split(/[/\\]/).pop();

    if (!filenameToDownload) {
        toast({ title: "Error", description: "Could not parse filename", variant: "destructive" });
        return;
    }

    const token = localStorage.getItem("authToken");
    
    try {
      toast({ title: "Download Started", description: "Fetching your edited file..." });

      const response = await Instance.get(`/pdf/download/${filenameToDownload}`, {
        headers: { 'Authorization': token ? `${token}` : '' },
        responseType: 'blob', 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filenameToDownload); 
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Download Complete", description: "File saved to your device." });

    } catch (error) {
      console.error("Download Error:", error);
      toast({ title: "Download Failed", description: "Could not download the file.", variant: "destructive" });
    }
  };

  const handleProcessAndSave = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const edits = annotations.map(ann => {
        const pageDims = pageDimensions[ann.page] || { width: 600, height: 842 }; 
        const absX = (ann.x / 100) * pageDims.width;
        const absY = (1 - (ann.y / 100)) * pageDims.height; 

        if (ann.type === 'text' || ann.type === 'signature') {
          return {
            type: "text",
            value: ann.content || "Text",
            x: Math.round(absX),
            y: Math.round(absY),
            pageIndex: ann.page - 1, 
            size: ann.fontSize || 20,
            color: hexToRgb(ann.color || "#000000")
          };
        } else if (ann.type === 'image') {
          return {
            type: "image",
            src: ann.src, 
            x: Math.round(absX),
            y: Math.round(absY),
            width: ann.width || 120,
            height: ann.height || 120,
            pageIndex: ann.page - 1
          };
        }
        return null;
      }).filter(Boolean);

      formData.append('edits', JSON.stringify(edits));
      
      const token = localStorage.getItem("authToken");

      const response = await Instance.post('/pdf/edit-pdf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `${token}` : '',
        }
      });

      console.log("Full Edit Response:", response.data);
      const data = response.data;
      
      let extractedName = "";
      if (typeof data === 'string') extractedName = data;
      else if (data.fileName) extractedName = data.fileName;
      else if (data.outputFile) extractedName = data.outputFile;
      
      if (!extractedName && Array.isArray(data.files) && data.files.length > 0) {
        extractedName = data.files[0].outputFile || data.files[0].fileName;
      }

      if (extractedName) {
        const cleanFileName = extractedName.split(/[/\\]/).pop() || extractedName;
        const resultData = {
          fileName: cleanFileName,
          originalName: file.name
        };
        
        setProcessedFile(resultData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resultData));
        setIsEditing(false); 
        
      } else {
        throw new Error("No filename found in server response.");
      }

    } catch (error) {
      console.error("Save Error:", error);
      toast({ title: "Processing Failed", description: "Could not process the PDF.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnnotations([]);
    setProcessedFile(null);
    setIsEditing(false);
    localStorage.removeItem(STORAGE_KEY);
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100" />
        <motion.div animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.1, 1], rotate: [0, 5, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-[20%] left-[10%] w-[60vw] h-[60vw] bg-orange-200/40 rounded-full blur-[120px]" />
        <motion.div animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1], rotate: [0, -5, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-[10%] right-[0%] w-[50vw] h-[50vw] bg-red-200/40 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply" />
      </div>

      <input 
        type="file" 
        accept="image/*" 
        ref={imageInputRef} 
        className="hidden" 
        onChange={handleImageFileChange} 
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => console.log("Logout clicked")} />
        <br/>
        <br/>
        <br/>
        <main className="flex-1 flex-col py-10">
          <div className="max-w-7xl mx-auto space-y-2 px-4 sm:px-6 lg:px-8">
            
            {/* === VIEW: DOWNLOAD RESULT (SHOWN AFTER SAVE) === */}
            {processedFile ? (
              <div className="max-w-3xl mx-auto pt-8">
                 <Link to="/tools" className="inline-flex items-center mb-6 text-sm text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tools
                 </Link>
                 
                 <Card className="bg-emerald-50 backdrop-blur-md shadow-xl border border-emerald-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                        <CardTitle className="text-emerald-900">Editing Complete!</CardTitle>
                      </div>
                      <CardDescription className="text-emerald-700">
                        Your file has been processed successfully. Click below to download.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-white/60 rounded-xl p-6 border border-emerald-100 flex justify-between items-center">
                         <div>
                            <p className="text-sm text-emerald-800 font-medium">Original File</p>
                            <p className="text-emerald-900 font-bold truncate max-w-[250px]">{processedFile.originalName}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm text-emerald-800 font-medium">Status</p>
                            <p className="text-emerald-900 font-bold">Ready</p>
                         </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                         <Button onClick={handleDownloadFile} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]">
                            <Download className="mr-2 h-5 w-5" />
                            Download File
                         </Button>
                         <Button variant="outline" onClick={handleReset} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 py-6 rounded-xl">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Edit Another
                         </Button>
                      </div>
                    </CardContent>
                 </Card>
              </div>
            ) : isEditing && file ? (
              
              /* === VIEW: EDITOR MODE === */
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <Button
                    onClick={() => { setIsEditing(false); setFile(null); }}
                    className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-6 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <ArrowLeft className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-600">Back</span>
                  </Button>
                  
                  <div className="flex flex-col items-center">
                    <h1 className="text-xl font-bold text-slate-900">Editing: <span className="text-orange-600">{file.name}</span></h1>
                    <p className="text-xs text-slate-500">
                      {activeTool ? `Active Tool: ${activeTool.toUpperCase()}` : "Select a tool below"}
                    </p>
                  </div>

                  <Button
                    onClick={handleProcessAndSave}
                    disabled={isProcessing}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-lg py-6 px-8 rounded-xl shadow-lg shadow-orange-500/20"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  {/* Tools Panel */}
                  <div className="col-span-12 md:col-span-3">
                    <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 sticky top-24">
                      <CardHeader>
                        <CardTitle className="text-slate-900">Toolkit</CardTitle>
                        <CardDescription>Click tool, then click page</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button 
                          variant={activeTool === 'text' ? "default" : "outline"} 
                          onClick={() => handleToolSelect('text')}
                          className={`w-full justify-start gap-2 ${activeTool === 'text' ? 'bg-orange-600 text-white hover:bg-orange-700' : 'text-slate-700'}`}
                        >
                          <Type className="h-4 w-4" /> Add Text
                        </Button>
                        <Button 
                          variant={activeTool === 'image' ? "default" : "outline"}
                          onClick={() => handleToolSelect('image')}
                          className={`w-full justify-start gap-2 ${activeTool === 'image' ? 'bg-orange-600 text-white hover:bg-orange-700' : 'text-slate-700'}`}
                        >
                          <ImageIcon className="h-4 w-4" /> Add Image
                        </Button>
                        <Button 
                          variant={activeTool === 'signature' ? "default" : "outline"}
                          onClick={() => handleToolSelect('signature')}
                          className={`w-full justify-start gap-2 ${activeTool === 'signature' ? 'bg-orange-600 text-white hover:bg-orange-700' : 'text-slate-700'}`}
                        >
                          <FilePen className="h-4 w-4" /> Add Signature
                        </Button>
                        
                        <div className="pt-4 mt-2 border-t border-slate-100">
                           <p className="text-xs text-slate-500 flex items-center gap-1">
                             <MousePointer2 className="h-3 w-3" /> Tips: Click placed items to edit.
                           </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pages Grid - PDF RENDERER */}
                  <div className="col-span-12 md:col-span-9">
                    <Card className="bg-slate-200/50 backdrop-blur-sm border border-slate-200 min-h-[600px]">
                      <CardContent className="p-6">
                        <div className="flex justify-center w-full">
                            <Document
                                file={file}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={
                                    <div className="flex flex-col items-center py-20 text-slate-400">
                                        <Loader2 className="h-10 w-10 animate-spin mb-4 text-orange-500" />
                                        <p>Rendering PDF...</p>
                                    </div>
                                }
                                error={<div className="text-red-500 py-10">Failed to load PDF.</div>}
                                className="flex flex-col gap-8 items-center w-full"
                            >
                                {numPages && Array.from(new Array(numPages), (el, index) => {
                                    const pageNum = index + 1;
                                    return (
                                    <div 
                                        key={`page_${pageNum}`} 
                                        className="relative group shadow-lg"
                                    >
                                        <div 
                                          className={`relative bg-white transition-all ${activeTool ? 'cursor-crosshair ring-2 ring-orange-400 ring-offset-4' : 'cursor-default'}`}
                                          onClick={(e) => handlePageClick(e, pageNum)}
                                        >
                                            <Page 
                                                pageNumber={pageNum} 
                                                width={600} 
                                                renderTextLayer={false} 
                                                renderAnnotationLayer={false}
                                                onLoadSuccess={onPageLoadSuccess}
                                            />

                                            {annotations.filter(a => a.page === pageNum).map((ann) => (
                                              <div
                                                key={ann.id}
                                                className="absolute group/item"
                                                style={{ 
                                                  left: `${ann.x}%`, 
                                                  top: `${ann.y}%`,
                                                  transform: 'translate(-50%, -50%)', 
                                                }}
                                                onClick={(e) => e.stopPropagation()} 
                                              >
                                                <button
                                                  onClick={(e) => deleteAnnotation(ann.id, e)}
                                                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/item:opacity-100 transition-opacity z-50 shadow-sm"
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>

                                                {ann.type === 'text' && (
                                                  <textarea
                                                    className="bg-transparent border border-transparent hover:border-blue-300 focus:border-blue-500 text-slate-900 px-2 py-1 resize min-w-[150px] overflow-hidden outline-none rounded"
                                                    value={ann.content}
                                                    onChange={(e) => updateAnnotationContent(ann.id, e.target.value)}
                                                    style={{ fontSize: '1rem', lineHeight: '1.2' }}
                                                  />
                                                )}

                                                {ann.type === 'signature' && (
                                                  <div className="relative">
                                                    <input
                                                      className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-orange-500 text-slate-900 px-2 py-1 text-3xl outline-none min-w-[200px]"
                                                      value={ann.content}
                                                      onChange={(e) => updateAnnotationContent(ann.id, e.target.value)}
                                                      style={{ fontFamily: 'Brush Script MT, cursive' }} 
                                                    />
                                                    <p className="text-[10px] text-slate-400 absolute top-full left-0 w-full text-center pointer-events-none">Signature</p>
                                                  </div>
                                                )}

                                                {ann.type === 'image' && ann.src && (
                                                  <div className="relative border-2 border-transparent hover:border-blue-300 group-hover/item:border-dashed p-1">
                                                    <img 
                                                      src={ann.src} 
                                                      alt="Uploaded" 
                                                      className="max-w-[200px] h-auto object-contain pointer-events-none" 
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 bg-black/10 cursor-move">
                                                      <Move className="h-6 w-6 text-white drop-shadow-md" />
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                        </div>
                                        
                                        <p className="mt-2 text-center text-sm font-medium text-slate-500">
                                            Page {pageNum}
                                        </p>
                                    </div>
                                )})}
                            </Document>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              
              /* === VIEW: UPLOAD MODE === */
              <>
                <Link to="/tools" className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                  <ArrowLeft className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Back to Tools</span>
                </Link>

                <div className="text-center space-y-3 mb-12">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                    <FilePen className="h-8 w-8 text-orange-500" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                    Edit PDF
                  </h1>
                  <p className="text-lg text-slate-500 max-w-xl mx-auto">
                    Upload, add text, signatures, and images effortlessly.
                  </p>
                </div>

                <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 max-w-6xl mx-auto">
                  <CardContent className="space-y-6 pt-6">
                    <div className="border-2 border-dashed rounded-xl p-24 text-center border-slate-300 hover:border-orange-500 transition-colors bg-slate-50">
                      <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-orange-600 font-semibold hover:text-orange-500 text-lg transition-colors">Choose file</span>
                        {" "}<span className="text-slate-500 text-lg">or drag and drop</span>
                        <input id="file-upload" type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                      </label>
                      <p className="text-sm text-slate-500 mt-2">PDF files only</p>
                    </div>

                    {file && (
                      <div className="p-4 rounded-xl border bg-white border-orange-200 shadow-sm flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-900">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                        <Button onClick={handleEditStart} className="bg-orange-600 hover:bg-orange-700 text-white">Start Editing</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
            
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
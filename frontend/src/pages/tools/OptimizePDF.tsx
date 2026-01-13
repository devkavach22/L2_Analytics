import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Zap, ArrowLeft, Loader2, CheckCircle, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";

interface OptimizationOptions {
  removeMetadata: boolean;
  imageCompression: boolean;
  removeUnusedObjects: boolean;
  flattenForms: boolean;
  removeBookmarks: boolean;
  optimizeTransparency: boolean;
  secureOptimization: boolean;
  archivalPdfA: boolean;
}

interface OptimizedFileDetails {
  originalName: string;
  outputFile: string;
  originalSize: number;
  compressedSize: number; 
  reduction: string;
  message: string;
}

const STORAGE_KEY = "kavach_optimized_file"; 

const optimizationTasks: { id: keyof OptimizationOptions; label: string }[] = [
  { id: "removeMetadata", label: "Remove Metadata" },
  { id: "imageCompression", label: "Image Compression" },
  { id: "removeUnusedObjects", label: "Remove Unused Objects" },
  { id: "flattenForms", label: "Flatten Forms" },
  { id: "removeBookmarks", label: "Remove Bookmarks" },
  { id: "optimizeTransparency", label: "Optimize Transparency" },
  { id: "secureOptimization", label: "Secure Optimization" },
  { id: "archivalPdfA", label: "Archival (PDF/A)" },
];

const TASK_MAPPING: Record<keyof OptimizationOptions, string> = {
  removeMetadata: "Remove Metadata",
  imageCompression: "Image Compression",
  removeUnusedObjects: "Remove Unused Objects",
  flattenForms: "Flatten Forms",
  removeBookmarks: "Remove Bookmarks",
  optimizeTransparency: "Optimize Transparency",
  secureOptimization: "Secure Optimization",
  archivalPdfA: "Archival (PDF/A)",
};

export default function OptimizePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<OptimizationOptions>(() => {
    const initialState: OptimizationOptions = {
      removeMetadata: false,
      imageCompression: true,
      removeUnusedObjects: false,
      flattenForms: false,
      removeBookmarks: false,
      optimizeTransparency: false,
      secureOptimization: false,
      archivalPdfA: false,
    };
    return initialState;
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedFile, setOptimizedFile] = useState<OptimizedFileDetails | null>(null);

  const { toast } = useToast();
  const isAuthenticated = true; 
  const isAdmin = false; 

  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData: OptimizedFileDetails = JSON.parse(storedData);
        if (parsedData.outputFile && parsedData.originalSize !== undefined && parsedData.compressedSize !== undefined && parsedData.reduction !== undefined) {
          setOptimizedFile(parsedData);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to parse stored optimized file data", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setOptimizedFile(null);
      localStorage.removeItem(STORAGE_KEY);
      toast({ title: "File uploaded", description: `${e.target.files[0].name} ready to optimize` });
    }
  };

  const handleOptionChange = (key: keyof OptimizationOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOptimize = async () => {
    if (!file) {
      toast({ title: "Error", description: "Please select a PDF file first", variant: "destructive" });
      return;
    }

    setIsOptimizing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const selectedTasks = optimizationTasks
        .filter(task => options[task.id])
        .map(task => TASK_MAPPING[task.id]);

      formData.append('options', JSON.stringify(selectedTasks)); 
      formData.append('level', 'recommended'); 

      const response = await Instance.post('/pdf/optimize-pdf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data', 
        }
      });
      
      const responseData = response.data;
      let fileData: OptimizedFileDetails | null = null;
      
      const resultData = responseData.files && responseData.files.length > 0 
                         ? responseData.files[0] 
                         : responseData;

      fileData = {
          originalName: file.name, 
          outputFile: resultData.outputFile || resultData.filename || '', 
          originalSize: resultData.originalSize || 0,
          compressedSize: resultData.compressedSize || 0,
          reduction: resultData.reduction || '0.00%',
          message: resultData.message || responseData.message || "Your PDF has been successfully optimized.",
      };

      if (fileData && fileData.outputFile && fileData.outputFile.length > 0) {
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fileData));
        setOptimizedFile(fileData); 
        toast({ title: "Success!", description: `Optimization complete. Reduced by ${fileData.reduction}` });
        await handleDownload(fileData); 
      } else {
        throw new Error("Invalid or incomplete response from server after optimization. Check server logs.");
      }

    } catch (error: any) {
      console.error("Optimization Error:", error);
      let errorMessage = "There was an error optimizing your file.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: "Optimization Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };
  
  const handleDownload = async (detailsToDownload: OptimizedFileDetails | null = null) => {
    let fileDetails: OptimizedFileDetails | null = detailsToDownload || optimizedFile;

    if (!fileDetails) {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        try {
          fileDetails = JSON.parse(storedData);
        } catch (error) {
          toast({ title: "Download Error", description: "Corrupted file data in storage.", variant: "destructive" });
          return;
        }
      }
    }

    if (!fileDetails || !fileDetails.outputFile) {
      toast({ title: "Download Error", description: "No optimized file record found to download.", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast({ title: "Authentication Error", description: "Not authenticated. Please log in.", variant: "destructive" });
      return;
    }
    
    const rawPath = fileDetails.outputFile;
    const filenameToDownload = rawPath.split(/[/\\]/).pop();

    if (!filenameToDownload) {
        toast({ title: "Error", description: "Could not determine filename for download.", variant: "destructive" });
        return;
    }

    try {
      toast({ title: "Download Started", description: "Fetching your optimized file..." });

      const response = await Instance.get(`/pdf/download/${filenameToDownload}`, {
        headers: { 
          'Authorization': `${token}` 
        },
        responseType: 'blob', 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileDetails.originalName.replace(/\.pdf$/i, '_optimized.pdf')); 
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Download Complete", description: `"${fileDetails.originalName.replace(/\.pdf$/i, '_optimized.pdf')}" saved to your device.` });

    } catch (error) {
      console.error("Download Error:", error);
      let errorMessage = "Could not download the file.";
      if ((error as any).response?.status === 401) {
        errorMessage = "Unauthorized. Your session may have expired. Please log in again.";
      } else if ((error as any).response?.data?.message) {
         errorMessage = (error as any).response.data.message;
      }
      toast({ title: "Download Failed", description: errorMessage, variant: "destructive" });
    }
  };

  const handleReset = () => {
    setFile(null);
    setOptimizedFile(null);
    localStorage.removeItem(STORAGE_KEY);
    setOptions({
      removeMetadata: false,
      imageCompression: true,
      removeUnusedObjects: false,
      flattenForms: false,
      removeBookmarks: false,
      optimizeTransparency: false,
      secureOptimization: false,
      archivalPdfA: false,
    });
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = ''; 
  };


  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
       {/* --- ENHANCED AMBIENT BACKGROUND --- */}
       <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-white" />
        <motion.div animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.2, 1], rotate: [0, 10, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-gradient-to-br from-orange-300/40 via-amber-200/40 to-transparent rounded-full blur-[100px]" />
        <motion.div animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.3, 1], rotate: [0, -10, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-[15%] -right-[5%] w-[50vw] h-[50vw] bg-gradient-to-tl from-red-200/40 via-orange-200/40 to-transparent rounded-full blur-[100px]" />
        <motion.div animate={{ opacity: [0.2, 0.4, 0.2], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[5%] left-[20%] right-[20%] h-[40vh] bg-gradient-to-b from-orange-100/60 via-amber-100/30 to-transparent rounded-full blur-[80px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => console.log("Logout")} />
        <br/>
        <br/>
        <br/>
        <main className="flex-1 flex-col py-16">
          <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
            
             <Link
              to="/tools"
              className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">Back to Tools</span>
            </Link>

            <div className="text-center space-y-3 relative z-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                <Zap className="h-8 w-8 text-orange-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 animate-gradient-x">Optimize PDF</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Make your PDF smaller and faster for web and email
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              {/* Result & Upload UI */}
              <div className="lg:col-span-2">
                {!optimizedFile ? (
                  <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 h-full">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Upload PDF File</CardTitle>
                      <CardDescription className="text-slate-500">
                        Select a PDF file and choose optimization options
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors bg-slate-50 ${isOptimizing ? 'opacity-50 pointer-events-none border-slate-300' : 'border-slate-300 hover:border-orange-500'}`}>
                        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-orange-600 font-semibold hover:text-orange-500 transition-colors">Choose file</span>
                          {" "}<span className="text-slate-500">or drag and drop</span>
                          <input
                            id="file-upload"
                            type="file"
                            accept=".pdf"
                            disabled={isOptimizing}
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                        </label>
                        <p className="text-sm text-slate-500 mt-2">PDF files only</p>
                      </div>

                      {file && (
                        <div className="p-4 rounded-xl border bg-white border-orange-200 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                            <p className="text-sm text-slate-500">
                              Size: {formatBytes(file.size)}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isOptimizing} className="text-slate-400 hover:text-red-500">
                            Remove
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-emerald-50 backdrop-blur-md shadow-xl border border-emerald-200 h-full relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                        <CardTitle className="text-emerald-900">Optimization Complete!</CardTitle>
                      </div>
                      <CardDescription className="text-emerald-700">
                        {optimizedFile.message}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-white/60 rounded-xl p-6 border border-emerald-100 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-emerald-100/50 rounded-lg">
                          <span className="text-emerald-700 text-sm">Original File</span>
                          <span className="text-emerald-900 font-mono text-sm truncate max-w-[200px]">
                            {optimizedFile.originalName}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-center">
                              <p className="text-[10px] sm:text-xs text-red-700 uppercase">Original</p>
                              <p className="text-sm sm:text-lg font-bold text-slate-900">{formatBytes(optimizedFile.originalSize)}</p>
                            </div>
                            <div className="p-3 bg-green-100 border border-green-200 rounded-lg text-center">
                              <p className="text-[10px] sm:text-xs text-green-700 uppercase">Optimized</p>
                              <p className="text-sm sm:text-lg font-bold text-green-700">{formatBytes(optimizedFile.compressedSize)}</p>
                            </div>
                            <div className="p-3 bg-blue-100 border border-blue-200 rounded-lg text-center">
                              <p className="text-[10px] sm:text-xs text-blue-700 uppercase">Reduction</p>
                              <p className="text-sm sm:text-lg font-bold text-blue-700">{optimizedFile.reduction}</p>
                            </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                         <Button onClick={() => handleDownload()} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]">
                            <Download className="mr-2 h-5 w-5" />
                            Download PDF (Manual)
                         </Button>
                         <Button variant="outline" onClick={handleReset} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 py-6 rounded-xl">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Optimize Another
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Settings UI */}
              <div className="lg:col-span-1 space-y-6">
                <Card className={`bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 transition-opacity duration-300 ${optimizedFile ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <CardHeader>
                    <CardTitle className="text-slate-900">Optimization Options</CardTitle>
                    <CardDescription className="text-slate-500">
                      Select the tasks to perform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4" aria-disabled={isOptimizing}>
                      {optimizationTasks.map((task) => (
                        <div key={task.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                          <Checkbox
                            id={task.id}
                            checked={options[task.id]}
                            onCheckedChange={() => handleOptionChange(task.id)}
                            disabled={isOptimizing}
                            className="border-slate-400 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                          />
                          <Label 
                            htmlFor={task.id} 
                            className="text-sm font-medium leading-none cursor-pointer text-slate-700"
                          >
                            {task.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {!optimizedFile && (
                  <Button 
                    onClick={handleOptimize} 
                    disabled={!file || !Object.values(options).some(Boolean) || isOptimizing}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6 rounded-xl font-semibold transition-colors text-white disabled:opacity-50 disabled:pointer-events-none transition-all hover:scale-[1.02] shadow-lg shadow-orange-500/20"
                  >
                    {isOptimizing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Optimize PDF
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
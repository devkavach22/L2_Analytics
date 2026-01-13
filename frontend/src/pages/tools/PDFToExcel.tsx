import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, ArrowLeft, Loader2, Download, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import axiosInstance from "@/lib/axiosInstance"; 

interface ConvertedFileDetails {
  originalName: string;
  outputFilename: string;
  originalSize: number;
}

const STORAGE_KEY = "kavach_excel_file";

export default function PDFToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [convertedFile, setConvertedFile] = useState<ConvertedFileDetails | null>(null);
  
  const { toast } = useToast();
  
  const isAuthenticated = true;
  const isAdmin = false;

  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData: ConvertedFileDetails = JSON.parse(storedData);
        setConvertedFile(parsedData);
      } catch (error) {
        console.error("Failed to parse stored converted file data", error);
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
      setConvertedFile(null); 
      localStorage.removeItem(STORAGE_KEY);
      
      toast({
        title: "File uploaded",
        description: `${e.target.files[0].name} ready to convert`,
      });
    }
  };

  const handleConvert = async () => {
    if (!file) {
      toast({ title: "Error", description: "Please select a PDF file first", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    toast({ title: "Converting...", description: "Processing your PDF file." });

    try {
      const formData = new FormData();
      formData.append("file", file); 
      const token = localStorage.getItem("authToken");

      const uploadResponse = await axiosInstance.post("/pdf/pdf-to-excel", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          'Authorization': token ? `${token}` : '',
        },
      });

      const responseData = uploadResponse.data;
      let targetFilename = "";

      if (responseData.files && Array.isArray(responseData.files) && responseData.files.length > 0) {
        const fileData = responseData.files[0];
        targetFilename = fileData.outputFile || fileData.outputFilename || fileData.filename || fileData.file;
      }
      else if (typeof responseData === 'string') targetFilename = responseData;
      else if (responseData?.filename) targetFilename = responseData.filename;
      else if (responseData?.file) targetFilename = responseData.file;
      else if (responseData?.data) targetFilename = responseData.data;

      if (!targetFilename) {
        throw new Error("Server returned 200 OK, but could not find the filename in the response.");
      }

      const resultData: ConvertedFileDetails = {
        originalName: file.name,
        originalSize: file.size,
        outputFilename: targetFilename
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(resultData));
      setConvertedFile(resultData);

      toast({ 
        title: "Success!", 
        description: "File converted successfully. Ready for download.",
        className: "bg-green-50 border-green-200"
      });

    } catch (error: any) {
      console.error("Conversion Error:", error);
      let errorMessage = "Conversion failed.";
      if (error.response?.data?.error) {
         errorMessage = error.response.data.error;
      } else if (error.message) {
         errorMessage = error.message;
      }
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    let fileDetails: ConvertedFileDetails | null = null;

    if (storedData) fileDetails = JSON.parse(storedData);
    else if (convertedFile) fileDetails = convertedFile;

    if (!fileDetails || !fileDetails.outputFilename) {
        toast({ title: "Download Error", description: "No converted file record found.", variant: "destructive" });
        return;
    }

    const rawPath = fileDetails.outputFilename;
    const filenameToDownload = rawPath.split(/[/\\]/).pop();

    if (!filenameToDownload) {
        toast({ title: "Error", description: "Could not parse filename", variant: "destructive" });
        return;
    }

    const token = localStorage.getItem("authToken");

    try {
      toast({ title: "Download Started", description: "Fetching your Excel file..." });

      const response = await axiosInstance.get(`/pdf/download/${filenameToDownload}`, {
        headers: { 'Authorization': token ? `${token}` : '' },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filenameToDownload);
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

  const handleReset = () => {
    setFile(null);
    setConvertedFile(null);
    localStorage.removeItem(STORAGE_KEY);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
       {/* --- AMBIENT BACKGROUND --- */}
       <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100" />
        <motion.div animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.1, 1], rotate: [0, 5, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-[20%] left-[10%] w-[60vw] h-[60vw] bg-orange-200/40 rounded-full blur-[120px]" />
        <motion.div animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1], rotate: [0, -5, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-[10%] right-[0%] w-[50vw] h-[50vw] bg-red-200/40 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => console.log("Logout")} />
        <br/>
        <br/>
        <br/>
        <main className="flex-1 flex-col py-10">
          <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
            
            <Link
              to="/tools"
              className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">Back to Tools</span>
            </Link>

            <div className="text-center space-y-3 mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                <FileSpreadsheet className="h-8 w-8 text-orange-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 animate-gradient-x">PDF to Excel</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Extract tables from your PDF to an editable Excel spreadsheet (.xlsx)
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2">
                  
                  {!convertedFile ? (
                    <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 h-full">
                      <CardHeader>
                        <CardTitle className="text-slate-900">Upload PDF File</CardTitle>
                        <CardDescription className="text-slate-500">
                          Select a PDF file to extract tables to Excel
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors bg-slate-50 ${isLoading ? 'opacity-50 pointer-events-none border-slate-300' : 'border-slate-300 hover:border-orange-500'}`}>
                          <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-orange-600 font-semibold hover:text-orange-500 transition-colors text-lg">Choose file</span>
                            {" "}<span className="text-slate-500 text-lg">or drag and drop</span>
                            <input
                              id="file-upload"
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={handleFileSelect}
                              disabled={isLoading}
                            />
                          </label>
                          <p className="text-sm text-slate-500 mt-2">PDF files only</p>
                        </div>

                        {file && (
                          <div className="p-4 rounded-xl border bg-white border-orange-200 shadow-sm flex justify-between items-center">
                            <div>
                              <p className="font-medium text-slate-900">{file.name}</p>
                              <p className="text-sm text-slate-500">
                                Size: {formatBytes(file.size)}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isLoading} className="text-slate-400 hover:text-red-500">
                                Remove
                            </Button>
                          </div>
                        )}

                        <Button
                          onClick={handleConvert}
                          disabled={!file || isLoading}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6 rounded-xl font-semibold transition-colors disabled:opacity-70"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Converting...
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="mr-2 h-5 w-5" />
                              Convert to Excel
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    
                    <Card className="bg-emerald-50 backdrop-blur-md shadow-xl border border-emerald-200 h-full relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                       <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle className="h-6 w-6 text-emerald-600" />
                          <CardTitle className="text-emerald-900">Conversion Complete!</CardTitle>
                        </div>
                        <CardDescription className="text-emerald-700">
                          Your PDF tables have been successfully extracted to Excel.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        
                        <div className="bg-white/60 rounded-xl p-6 border border-emerald-100 space-y-4">
                           <div className="flex items-center justify-between p-3 bg-emerald-100/50 rounded-lg">
                            <span className="text-emerald-700 text-sm">Original File</span>
                            <span className="text-emerald-900 font-mono text-sm truncate max-w-[150px] sm:max-w-[300px]">
                              {convertedFile.originalName}
                            </span>
                          </div>
                           <div className="flex items-center justify-between p-3 bg-emerald-100/50 rounded-lg">
                            <span className="text-emerald-700 text-sm">Original Size</span>
                            <span className="text-emerald-900 font-mono text-sm">
                              {formatBytes(convertedFile.originalSize)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                           <Button 
                              onClick={handleDownload} 
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]"
                            >
                              <Download className="mr-2 h-5 w-5" />
                              Download Excel
                           </Button>
                           <Button 
                              variant="outline" 
                              onClick={handleReset} 
                              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 py-6 rounded-xl"
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Convert Another
                           </Button>
                        </div>

                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className={`lg:col-span-1 transition-opacity duration-300 ${convertedFile ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 h-full">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Why convert?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-slate-600">
                      <p className="text-sm">
                        • <span className="font-semibold text-orange-600">Edit data:</span> Modify numbers and text in your tables easily.
                      </p>
                      <p className="text-sm">
                        • <span className="font-semibold text-orange-600">Analyze:</span> Use Excel formulas to analyze your extracted data.
                      </p>
                      <p className="text-sm">
                         • <span className="font-semibold text-orange-600">Reuse:</span> Copy and paste tables into other reports.
                      </p>
                    </CardContent>
                  </Card>
                </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, ArrowRightLeft, ArrowLeft, Download, Loader2, CheckCircle, RefreshCw, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import Instance from "@/lib/axiosInstance";

interface ConvertedFileDetails {
  originalName: string;
  outputFileName: string;
  message: string;
}

const STORAGE_KEY = "kavach_pdf_to_word_data";

export default function PDFToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFile, setConvertedFile] = useState<ConvertedFileDetails | null>(null);
  
  const { toast } = useToast();

  const isAuthenticated = !!localStorage.getItem("authToken");
  const isAdmin = false;

  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData && parsedData.outputFileName) {
          setConvertedFile(parsedData);
        }
      } catch (error) {
        console.error("Failed to parse stored data", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setConvertedFile(null);
      localStorage.removeItem(STORAGE_KEY);
      
      toast({
        title: "File uploaded",
        description: `${selectedFile.name} ready to convert`,
      });
    }
  };

  const handleConvert = async () => {
    if (!file) {
      toast({ title: "Error", description: "Please select a PDF file first", variant: "destructive" });
      return;
    }

    setIsConverting(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await Instance.post("/pdf/pdf-to-word", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("SERVER RESPONSE:", response.data);

      let generatedFileName = "";
      
      if (response.data.files && Array.isArray(response.data.files) && response.data.files.length > 0) {
        const fileData = response.data.files[0];
        generatedFileName = fileData.outputFile || fileData.fileName || fileData.filename || fileData.name;
      } 
      else if (typeof response.data === 'object' && response.data !== null) {
        generatedFileName = 
          response.data.fileName || 
          response.data.filename || 
          response.data.outputFile || 
          response.data.file || 
          response.data.name;
      }
      else if (typeof response.data === 'string') {
        generatedFileName = response.data;
      }

      if (!generatedFileName) {
        throw new Error("Server returned a response, but could not find the filename.");
      }

      const fileData: ConvertedFileDetails = {
        originalName: file.name,
        outputFileName: generatedFileName,
        message: "PDF converted to Word successfully!",
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(fileData));
      setConvertedFile(fileData);

      toast({
        title: "Conversion Complete!",
        description: "Your document is ready for download.",
      });

    } catch (error: any) {
      console.error("Conversion failed:", error);
      let errorMessage = "There was an error processing your request.";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Process Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async () => {
    if (!convertedFile || !convertedFile.outputFileName) {
      toast({ title: "Download Error", description: "No file available to download.", variant: "destructive" });
      return;
    }

    const rawPath = convertedFile.outputFileName;
    const filenameToDownload = rawPath.split(/[/\\]/).pop();

    if (!filenameToDownload) {
        toast({ title: "Error", description: "Could not parse filename", variant: "destructive" });
        return;
    }

    const token = localStorage.getItem("authToken");

    try {
      toast({ title: "Download Started", description: "Fetching your Word document..." });

      const response = await Instance.get(`/pdf/download/${filenameToDownload}`, {
        headers: { 
          'Authorization': token ? `${token}` : '' 
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      
      const downloadName = convertedFile.originalName 
        ? convertedFile.originalName.replace(/\.pdf$/i, ".docx")
        : filenameToDownload;
        
      link.setAttribute("download", downloadName);
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
    <div className="relative flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100" />
        <motion.div
          animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] left-[10%] w-[60vw] h-[60vw] bg-orange-200/40 rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => { localStorage.removeItem("authToken"); window.location.href = "/login"; }} />
        <br/>
        <br/>
        <br/>
        <main className="flex-1 flex-col py-12">
          <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
            <Link to="/tools" className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">Back to Tools</span>
            </Link>

            <div className="text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                <ArrowRightLeft className="h-8 w-8 text-orange-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 animate-gradient-x">
                  PDF to Word
                </span>
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Convert your PDF to an editable Word document (.docx)
              </p>
            </div>

            {/* === MAIN CARD AREA === */}
            <div className="max-w-6xl mx-auto mt-8">
              {!convertedFile ? (
                <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Upload PDF File</CardTitle>
                    <CardDescription className="text-slate-500">
                      Select a PDF file to convert to Word
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors bg-slate-50 ${isConverting ? "opacity-50 pointer-events-none border-slate-300" : file ? "border-orange-500" : "border-slate-300 hover:border-orange-500"}`}>
                      <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-orange-600 font-semibold hover:text-orange-500 transition-colors text-lg">Choose file</span>
                        <span className="text-slate-500 text-lg"> or drag and drop</span>
                        <input id="file-upload" type="file" accept=".pdf" disabled={isConverting} className="hidden" onChange={handleFileSelect} />
                      </label>
                      <p className="text-sm text-slate-500 mt-2">PDF files only</p>
                    </div>

                    {file && (
                      <div className="p-4 rounded-xl border bg-white border-orange-200 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                          <p className="text-sm text-slate-500">Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isConverting} className="text-slate-400 hover:text-red-500">Remove</Button>
                      </div>
                    )}

                    <Button onClick={handleConvert} disabled={!file || isConverting} className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6 rounded-xl font-semibold transition-colors mt-4 text-white shadow-lg shadow-orange-500/20">
                      {isConverting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</> : <><ArrowRightLeft className="mr-2 h-5 w-5" />Convert to Word</>}
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
                      {convertedFile?.message || "File converted successfully"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-white/60 rounded-xl p-6 border border-emerald-100 space-y-4">
                      <div className="flex items-center justify-between p-3 bg-emerald-100/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-md border border-emerald-200">
                                <FileText className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <span className="text-emerald-700 text-xs block uppercase font-semibold">Output File</span>
                                <span className="text-emerald-900 font-mono text-sm truncate max-w-[200px] block">
                                  {convertedFile?.outputFileName ? String(convertedFile.outputFileName).split(/[/\\]/).pop() : "Unknown_File"}
                                </span>
                            </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]">
                        <Download className="mr-2 h-5 w-5" />
                        Download Word File
                      </Button>
                      <Button variant="outline" onClick={handleReset} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 py-6 rounded-xl">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Convert Another
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, ArrowRightLeft, ArrowLeft, Download, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ConvertedFileDetails {
  originalName: string;
  outputFile: string; 
  message?: string;
}

const STORAGE_KEY = "kavach_converted_word_file";

export default function WordToPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFile, setConvertedFile] = useState<ConvertedFileDetails | null>(null);
  
  const { toast } = useToast();
  const isAuthenticated = true;
  const isAdmin = false;

  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData && parsedData.outputFile) {
          setConvertedFile(parsedData);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setConvertedFile(null); 
      localStorage.removeItem(STORAGE_KEY);
      toast({ title: "File added", description: `${e.target.files[0].name} ready` });
    }
  };

  const findPdfInResponse = (obj: any): string | null => {
    if (!obj) return null;
    
    if (typeof obj === 'string' && obj.toLowerCase().endsWith('.pdf')) {
        return obj;
    }

    if (typeof obj === 'object') {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const result = findPdfInResponse(obj[key]);
                if (result) return result;
            }
        }
    }
    return null;
  };

  const handleConvert = async () => {
    if (!file) {
      toast({ title: "Error", description: "Please select a Word file first", variant: "destructive" });
      return;
    }

    setIsConverting(true);
    const token = localStorage.getItem("authToken");

    try {
      const formData = new FormData();
      formData.append('files', file);

      console.log("Starting conversion...");

      const response = await Instance.post('/pdf/word-to-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `${token}` : '', 
        }
      });

      console.log("API Raw Response:", response.data);

      const data = response.data;
      let detectedOutputFile: string | null = null;

      detectedOutputFile = data.outputFile || data.filename || data.file || data.path || data.url;

      if (!detectedOutputFile && data.files && Array.isArray(data.files) && data.files[0]) {
         const f = data.files[0];
         detectedOutputFile = f.outputFile || f.filename || f.path || f.url;
      }

      if (!detectedOutputFile) {
          console.warn("Standard keys failed. Attempting deep search for PDF...");
          detectedOutputFile = findPdfInResponse(data);
      }

      if (detectedOutputFile) {
        console.log("PDF File Found:", detectedOutputFile);
        
        const fileData: ConvertedFileDetails = {
            outputFile: detectedOutputFile,
            originalName: file.name,
            message: data.message || "Conversion successful"
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fileData));
        setConvertedFile(fileData);
        toast({ title: "Success!", description: "File converted successfully." });
      } else {
        console.error("Could not find PDF path in:", data);
        throw new Error("Conversion succeeded, but no PDF filename was found in the response.");
      }

    } catch (error: any) {
      console.error("Conversion Error:", error);
      let errorMessage = "There was an error converting your file.";
      
      if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
      } else if (error.message) {
          errorMessage = error.message;
      }

      toast({ title: "Conversion Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async () => {
    if (!convertedFile || !convertedFile.outputFile) {
      toast({ title: "Download Error", description: "No converted file record found.", variant: "destructive" });
      return;
    }

    const rawPath = convertedFile.outputFile;
    const filenameToDownload = rawPath.split(/[/\\]/).pop();

    if (!filenameToDownload) {
        toast({ title: "Error", description: "Invalid filename", variant: "destructive" });
        return;
    }

    const token = localStorage.getItem("authToken");

    try {
      toast({ title: "Download Started", description: "Fetching your PDF..." });

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
        <div className="absolute inset-0 bg-white" />
        <motion.div animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -top-[20%] left-[10%] w-[60vw] h-[60vw] bg-orange-200/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => console.log("Logout")} />
        <br/>
        <br/>
        <br/>
         {/* --- IGNORE ABOVE --- */}
        <main className="flex-1 flex-col py-10">
          <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
             <Link to="/tools" className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4 text-slate-500" /><span className="text-slate-600">Back to Tools</span>
            </Link>

            <div className="text-center space-y-3 mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                <ArrowRightLeft className="h-8 w-8 text-orange-600" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900">Word to PDF</h1>
              <p className="text-lg text-slate-500">Convert your Word document (.docx, .doc) to a universal PDF file</p>
            </div>

             <div className="max-w-6xl mx-auto">
                {!convertedFile ? (
                  <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Upload Word File</CardTitle>
                      <CardDescription className="text-slate-500">Select a Word file to convert</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className={`border-2 border-dashed rounded-xl p-20 text-center transition-colors bg-slate-50/50 ${isConverting ? 'opacity-50 pointer-events-none border-slate-300' : 'border-slate-300 hover:border-orange-500'}`}>
                        <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-orange-600 font-semibold hover:text-orange-500 text-lg">Choose file</span> <span className="text-slate-500 text-lg">or drag and drop</span>
                          <input id="file-upload" type="file" accept=".doc,.docx" disabled={isConverting} className="hidden" onChange={handleFileSelect} />
                        </label>
                        <p className="text-sm text-slate-500 mt-2">.doc or .docx files only</p>
                      </div>

                      {file && (
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-white border-orange-200 text-slate-900 shadow-sm">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-orange-600" />
                              <span className="font-medium truncate max-w-[200px] sm:max-w-md">{file.name}</span>
                            </div>
                            <span className="text-sm text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                            <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isConverting} className="text-slate-400 hover:text-red-500 ml-2">
                              Remove
                            </Button>
                        </div>
                      )}

                      <Button 
                        onClick={handleConvert} 
                        disabled={!file || isConverting} 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]"
                      >
                         {isConverting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Converting...
                          </>
                        ) : (
                          <>
                            <ArrowRightLeft className="mr-2 h-5 w-5" />
                            Convert to PDF
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-emerald-50 backdrop-blur-md shadow-xl border border-emerald-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                        <CardTitle className="text-emerald-900">Conversion Complete!</CardTitle>
                      </div>
                      <CardDescription className="text-emerald-700">
                        Your file has been successfully converted to PDF.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-white/60 rounded-xl p-6 border border-emerald-100">
                        <div className="flex items-center justify-between p-3 bg-emerald-100/50 rounded-lg">
                          <span className="text-emerald-700 text-sm">File Name</span>
                          <span className="text-emerald-900 font-mono text-sm truncate max-w-[200px]">
                            {convertedFile.outputFile 
                                ? convertedFile.outputFile.split(/[/\\]/).pop() 
                                : "converted.pdf"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                         <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]">
                            <Download className="mr-2 h-5 w-5" />
                            Download PDF
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
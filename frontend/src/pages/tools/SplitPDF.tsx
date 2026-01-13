import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Upload, Download, ArrowLeft, Loader2, CheckCircle, RefreshCw, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface SplitFileDetails {
  originalName: string;
  outputFile: string;
  message: string;
}

type CustomRange = { id: string; from: string; to: string; };

const STORAGE_KEY = "kavach_split_file";

export default function SplitPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitResult, setSplitResult] = useState<SplitFileDetails | null>(null);
  const [customRanges, setCustomRanges] = useState<CustomRange[]>([{ id: crypto.randomUUID(), from: "1", to: "2" }]);
  
  const { toast } = useToast();
  const isAuthenticated = true;
  const isAdmin = false;

  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData: SplitFileDetails = JSON.parse(storedData);
        setSplitResult(parsedData);
      } catch (error) {
        console.error("Failed to parse stored split file data", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSplitResult(null);
      localStorage.removeItem(STORAGE_KEY);
      
      toast({
        title: "File uploaded",
        description: `${e.target.files[0].name} ready to split`,
      });
    }
  };

  const handleAddRange = () => {
    const lastRangeEnd = customRanges[customRanges.length - 1]?.to || "0";
    const newFrom = (parseInt(lastRangeEnd) + 1).toString();
    const newTo = (parseInt(newFrom) + 1).toString();
    setCustomRanges([...customRanges, { id: crypto.randomUUID(), from: newFrom, to: newTo }]);
  };

  const handleRemoveRange = (id: string) => setCustomRanges((prev) => prev.filter((range) => range.id !== id));
  
  const handleRangeChange = (id: string, field: 'from' | 'to', value: string) => {
    setCustomRanges((prev) => prev.map((range) => range.id === id ? { ...range, [field]: value } : range));
  };

  const handleSplit = async () => {
    if (!file) {
      toast({ title: "Error", description: "Please select a PDF file first", variant: "destructive" });
      return;
    }

    setIsSplitting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      customRanges.forEach(range => {
        if(range.from && range.to) {
            formData.append('ranges', `${range.from}-${range.to}`);
        }
      });

      const token = localStorage.getItem("authToken");

      const response = await Instance.post('/pdf/split-pdf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data', 
            'Authorization': token ? `${token}` : '',
        }
      });

      const resultData = response.data;
      
      if (resultData) {
        const fileData: SplitFileDetails = {
            originalName: file.name,
            outputFile: resultData.outputFile || resultData.filename || resultData.zipUrl, 
            message: resultData.message || "Split successful"
        };

        if(response.data.files && response.data.files.length > 0) {
             fileData.outputFile = response.data.files[0].outputFile;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(fileData));
        setSplitResult(fileData); 
        toast({ title: "Success!", description: "PDF split successfully." });
      } else {
        throw new Error("Invalid response structure");
      }

    } catch (error) {
      console.error(error);
      toast({ title: "Split Failed", description: "There was an error splitting your file.", variant: "destructive" });
    } finally {
      setIsSplitting(false);
    }
  };

  const handleDownload = async () => {
    if (!splitResult || !splitResult.outputFile) {
      toast({ title: "Download Error", description: "No file record found.", variant: "destructive" });
      return;
    }

    const rawPath = splitResult.outputFile;
    const filenameToDownload = rawPath.split(/[/\\]/).pop();

    if (!filenameToDownload) {
        toast({ title: "Error", description: "Could not parse filename", variant: "destructive" });
        return;
    }

    const token = localStorage.getItem("authToken");
    
    try {
      toast({ title: "Download Started", description: "Fetching your split files..." });

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
    setSplitResult(null);
    setCustomRanges([{ id: crypto.randomUUID(), from: "1", to: "2" }]);
    localStorage.removeItem(STORAGE_KEY);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100" />
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

            <div className="text-center space-y-3 mb-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                <Scissors className="h-8 w-8 text-orange-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 animate-gradient-x">
                  Split PDF
                </span>
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">Extract specific ranges from your PDF document</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              
              <div className="lg:col-span-2">
                {!splitResult ? (
                  <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 h-full">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Upload PDF File</CardTitle>
                      <CardDescription className="text-slate-500">Select the PDF file you want to split</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors bg-slate-50 ${isSplitting ? 'opacity-50 pointer-events-none border-slate-300' : 'border-slate-300 hover:border-orange-500'}`}>
                        <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-orange-600 font-semibold hover:text-orange-500 transition-colors text-lg">Choose file</span>
                            {" "}<span className="text-slate-500 text-lg">or drag and drop</span>
                            <input id="file-upload" type="file" accept=".pdf" disabled={isSplitting} className="hidden" onChange={handleFileSelect} />
                        </label>
                      </div>
                      {file && (
                        <div className="p-4 rounded-xl border bg-white border-orange-200 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                            <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isSplitting} className="text-slate-400 hover:text-red-500">Remove</Button>
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
                        <CardTitle className="text-emerald-900">Split Complete!</CardTitle>
                      </div>
                      <CardDescription className="text-emerald-700">{splitResult.message}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-white/60 rounded-xl p-6 border border-emerald-100 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-emerald-100/50 rounded-lg">
                          <span className="text-emerald-700 text-sm">Original File</span>
                          <span className="text-emerald-900 font-mono text-sm truncate max-w-[200px]">{splitResult.originalName}</span>
                        </div>
                        <div className="p-4 bg-emerald-100/30 border border-emerald-200 rounded-lg text-center">
                            <p className="text-sm text-emerald-800">Your files are ready for download as a ZIP archive.</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                         <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]">
                            <Download className="mr-2 h-5 w-5" />
                            Download ZIP
                         </Button>
                         <Button variant="outline" onClick={handleReset} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 py-6 rounded-xl">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Split Another
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-1 space-y-6">
                <Card className={`bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 transition-opacity duration-300 ${splitResult ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <CardHeader>
                    <CardTitle className="text-slate-900">Range Settings</CardTitle>
                    <CardDescription className="text-slate-500">Define the pages to extract</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {customRanges.map((range, index) => (
                        <div key={range.id} className="space-y-3 rounded-xl border border-slate-200 p-4 bg-slate-50">
                          <div className="flex justify-between items-center">
                            <Label className="font-semibold text-orange-600">Range {index + 1}</Label>
                            {customRanges.length > 1 && (
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveRange(range.id)} className="text-slate-400 hover:text-red-500 h-6 w-6">
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">From</Label>
                                <Input type="number" min="1" value={range.from} onChange={(e) => handleRangeChange(range.id, 'from', e.target.value)} className="bg-white border-slate-300 text-slate-900 h-9" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">To</Label>
                                <Input type="number" min="1" value={range.to} onChange={(e) => handleRangeChange(range.id, 'to', e.target.value)} className="bg-white border-slate-300 text-slate-900 h-9" />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-orange-400 hover:text-orange-600" onClick={handleAddRange}>
                        <Plus className="mr-2 h-4 w-4" /> Add Another Range
                      </Button>
                    </div>

                    <Separator className="bg-slate-200" />
                  </CardContent>
                </Card>

                {!splitResult && (
                  <Button
                    onClick={handleSplit}
                    disabled={!file || isSplitting}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6 rounded-xl font-semibold disabled:opacity-50 disabled:pointer-events-none transition-all hover:scale-[1.02] shadow-lg shadow-orange-500/20"
                  >
                    {isSplitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Splitting...
                      </>
                    ) : (
                      <>
                        <Scissors className="mr-2 h-5 w-5" />
                        Split PDF
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
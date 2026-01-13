import { useState } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance"; 
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileImage, ArrowRightLeft, ArrowLeft, CheckCircle, X, FileText, Loader2, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type ViewState = "upload" | "options" | "success";

export default function PDFToImage() {
  const [viewState, setViewState] = useState<ViewState>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [conversionMode, setConversionMode] = useState<"page_to_jpg" | "extract_images">("page_to_jpg");
  const [imageQuality, setImageQuality] = useState<"normal" | "high">("normal");
  const [isConverting, setIsConverting] = useState(false);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  
  const { toast } = useToast();
  const isAuthenticated = true;
  const isAdmin = false;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResultFilename(null);
      setViewState("options"); 
      toast({ title: "File uploaded", description: `${e.target.files[0].name} ready to convert` });
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultFilename(null);
    setViewState("upload");
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsConverting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', conversionMode); 
      formData.append('quality', imageQuality);
      const token = localStorage.getItem("authToken");

      const response = await Instance.post('/pdf/pdf-to-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `${token}` : '',
        }
      });
      const data = response.data;
      const resultFiles = data?.files || data?.images || [];

      if (Array.isArray(resultFiles) && resultFiles.length > 0) {
        const firstItem = resultFiles[0];
        let finalName = "";
        if (typeof firstItem === "string") {
            finalName = firstItem;
        } else if (typeof firstItem === "object" && firstItem !== null) {
            finalName = firstItem.outputFile || firstItem.filename || firstItem.name || "";
        }
        if (finalName) {
            setResultFilename(finalName);
            setViewState("success");
            toast({ title: "Success!", description: "PDF converted successfully." });
        } else {
            throw new Error("Could not parse filename from server response.");
        }
      } else {
        throw new Error("Server returned no output files.");
      }
    } catch (error: any) {
      console.error("Conversion Error:", error);
      toast({ 
        title: "Conversion Failed", 
        description: error.response?.data?.message || "There was an error converting your file.", 
        variant: "destructive" 
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async () => {
    if (!resultFilename) {
        toast({ title: "Error", description: "No file to download", variant: "destructive" });
        return;
    }
    const cleanFilename = resultFilename.split(/[/\\]/).pop();
    if (!cleanFilename) return;
    const token = localStorage.getItem("authToken");
    try {
      toast({ title: "Download Started", description: "Fetching your files..." });
      const response = await Instance.get(`/pdf/download/${cleanFilename}`, {
        headers: { 'Authorization': token ? `${token}` : '' },
        responseType: 'blob', 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', cleanFilename); 
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

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
       {/* Background */}
       <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-white" />
        <motion.div animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.2, 1], rotate: [0, 10, 0] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -top-[15%] left-[10%] w-[60vw] h-[60vw] bg-orange-200/40 rounded-full blur-[120px]" />
        <motion.div animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.3, 1], rotate: [0, -10, 0] }} transition={{ duration: 25, repeat: Infinity }} className="absolute -bottom-[10%] right-[0%] w-[50vw] h-[50vw] bg-red-200/40 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => console.log("Logout")} />
        <br/>
        <br/>
        <br/>
        <main className="flex-1 container py-10">
          <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
             <Link to="/tools" className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4 text-slate-500" /> <span className="text-slate-600">Back to Tools</span>
            </Link>

            <div className="text-center space-y-4 mb-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 animate-gradient-x">PDF to Image</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Convert each PDF page into a high-quality image file
              </p>
            </div>

            {/* UPLOAD */}
            {viewState === "upload" && (
              <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 max-w-6xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-slate-900">Upload PDF File</CardTitle>
                  <CardDescription className="text-slate-500">Select a PDF to get started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed rounded-xl p-24 text-center border-slate-300 hover:border-orange-500 transition-colors bg-slate-50 hover:bg-orange-50/20">
                    <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-orange-600 font-semibold hover:text-orange-500 text-lg">Choose file</span>
                      {" "}<span className="text-slate-500 text-lg">or drag and drop</span>
                      <input id="file-upload" type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* OPTIONS */}
            {viewState === "options" && file && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                <div className="lg:col-span-2 space-y-4">
                  <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 relative h-full min-h-[400px]">
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-slate-400 hover:text-red-500 z-10" onClick={handleReset} disabled={isConverting}>
                      <X className="h-5 w-5" />
                    </Button>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-slate-900">
                        <FileText className="h-5 w-5 text-orange-500" /> {file.name}
                      </CardTitle>
                      <CardDescription className="text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[350px]">
                      <div className="w-full h-full bg-slate-100 rounded-xl flex flex-col items-center justify-center border border-slate-200">
                         <FileText className="h-20 w-20 text-slate-300 mb-2" />
                         <p className="text-slate-400">PDF Preview Ready</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                  <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 h-full">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <RadioGroup value={conversionMode} onValueChange={(val) => setConversionMode(val as any)} disabled={isConverting}>
                        <Label htmlFor="page-to-jpg" className={cn("flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-colors bg-slate-50", conversionMode === "page_to_jpg" ? "border-orange-500 bg-orange-50" : "border-slate-300")}>
                          <RadioGroupItem value="page_to_jpg" id="page-to-jpg" className="mt-1 border-slate-400 text-orange-600" />
                          <div className="flex-1 space-y-1">
                            <span className="font-semibold text-slate-900 text-sm">PAGE TO JPG</span>
                            <p className="text-xs text-slate-500">Convert every page.</p>
                          </div>
                        </Label>
                        <Label htmlFor="extract-images" className={cn("flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-colors bg-slate-50", conversionMode === "extract_images" ? "border-orange-500 bg-orange-50" : "border-slate-300")}>
                          <RadioGroupItem value="extract_images" id="extract-images" className="mt-1 border-slate-400 text-orange-600" />
                          <div className="flex-1 space-y-1">
                            <span className="font-semibold text-slate-900 text-sm">EXTRACT IMAGES</span>
                            <p className="text-xs text-slate-500">Get internal images.</p>
                          </div>
                        </Label>
                      </RadioGroup>

                      <div className="space-y-3">
                        <Label className="font-semibold text-slate-900 text-sm">Quality</Label>
                        <RadioGroup value={imageQuality} onValueChange={(val) => setImageQuality(val as any)} className="grid grid-cols-2 gap-2" disabled={isConverting}>
                          <div>
                            <RadioGroupItem value="normal" id="normal" className="peer sr-only" />
                            <Label htmlFor="normal" className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-300 bg-slate-50 p-3 hover:bg-slate-100 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:text-orange-600 cursor-pointer text-slate-600 text-sm">Normal</Label>
                          </div>
                          <div>
                            <RadioGroupItem value="high" id="high" className="peer sr-only" />
                            <Label htmlFor="high" className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-300 bg-slate-50 p-3 hover:bg-slate-100 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:text-orange-600 cursor-pointer text-slate-600 text-sm">High</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <Button onClick={handleConvert} disabled={isConverting} className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6 rounded-xl font-semibold transition-colors text-white">
                        {isConverting ? ( <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>) : ( <><FileImage className="mr-2 h-5 w-5" /> Convert PDF</>)}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {viewState === "success" && resultFilename && (
              <div className="max-w-6xl mx-auto">
                  <Card className="bg-emerald-50 backdrop-blur-md shadow-xl border border-emerald-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                        <CardTitle className="text-emerald-900">Conversion Complete!</CardTitle>
                      </div>
                      <CardDescription className="text-emerald-700">Your images have been extracted and are ready for download.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-white/60 rounded-xl p-6 border border-emerald-100 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-emerald-100/50 rounded-lg">
                          <span className="text-emerald-700 text-sm">Output File</span>
                          <span className="text-emerald-900 font-mono text-sm truncate max-w-[200px] sm:max-w-md">
                            {typeof resultFilename === 'string' ? resultFilename.split(/[/\\]/).pop() : "converted-file.zip"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                         <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]">
                            <Download className="mr-2 h-5 w-5" /> Download File
                         </Button>
                         <Button variant="outline" onClick={handleReset} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 py-6 rounded-xl">
                            <RefreshCw className="mr-2 h-4 w-4" /> Convert Another
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
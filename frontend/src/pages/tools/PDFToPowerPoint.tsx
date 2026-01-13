import { useState } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, LucidePresentation, ArrowLeft, Loader2, Download, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ConvertedFileDetails {
  filename: string;
  originalName: string;
  outputFile: string;
}

export default function PDFToPowerPoint() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFile, setConvertedFile] = useState<ConvertedFileDetails | null>(null);

  const { toast } = useToast();
  const isAuthenticated = true;
  const isAdmin = false;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setConvertedFile(null);
      toast({ title: "File uploaded", description: `${e.target.files[0].name} ready to convert` });
    }
  };

  const handleConvert = async () => {
    if (!file) { 
        toast({ title: "Error", description: "Please select a PDF file first", variant: "destructive" }); 
        return; 
    }

    setIsConverting(true);

    try {
      const formData = new FormData();
      formData.append('file', file); 
      const token = localStorage.getItem("authToken");

      const response = await Instance.post('/pdf/pdf-to-ppt', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `${token}` : '',
        }
      });

      if (response.data && (response.data.files || response.data.filename)) {
        const outputData = response.data.files ? response.data.files[0] : response.data;
        const fileData: ConvertedFileDetails = {
            filename: outputData.filename || outputData.outputFile.split(/[/\\]/).pop(), 
            originalName: file.name,
            outputFile: outputData.outputFile || outputData.filename
        };
        setConvertedFile(fileData);
        toast({ title: "Success!", description: "PDF converted to PowerPoint successfully." });
      } else {
        throw new Error("Invalid response structure");
      }

    } catch (error) {
      console.error(error);
      toast({ title: "Conversion Failed", description: "There was an error converting your file.", variant: "destructive" });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async () => {
    if (!convertedFile || !convertedFile.outputFile) {
      toast({ title: "Download Error", description: "No file record found.", variant: "destructive" });
      return;
    }

    const rawPath = convertedFile.outputFile;
    const filenameToDownload = rawPath.split(/[/\\]/).pop();

    if (!filenameToDownload) {
        toast({ title: "Error", description: "Could not parse filename", variant: "destructive" });
        return;
    }

    const token = localStorage.getItem("authToken");

    try {
      toast({ title: "Download Started", description: "Fetching your PowerPoint file..." });
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
      toast({ title: "Download Complete", description: "Presentation saved to your device." });

    } catch (error) {
      console.error("Download Error:", error);
      toast({ title: "Download Failed", description: "Could not download the file.", variant: "destructive" });
    }
  };

  const handleReset = () => {
    setFile(null);
    setConvertedFile(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
       {/* Enhanced Ambient Background */}
       <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-white" />
        <motion.div animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1], rotate: [0, 15, 0] }} transition={{ duration: 18, repeat: Infinity }} className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-orange-200/30 rounded-full blur-[100px]" />
        <motion.div animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1], rotate: [0, -15, 0] }} transition={{ duration: 22, repeat: Infinity }} className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] bg-red-200/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={() => console.log("Logout")} />
        <br/>
        <br/>
        <br/>
        <main className="flex-1 flex-col py-10">
          <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
             <Link to="/tools" className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4 text-slate-500" /><span className="text-slate-600">Back to Tools</span>
            </Link>

            <div className="text-center space-y-3 mb-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                <LucidePresentation className="h-7 w-7 text-orange-500" />
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-amber-500">
                PDF to PowerPoint
              </h1>
              <p className="text-lg text-slate-500">Convert your PDF to an editable PowerPoint presentation (.pptx)</p>
            </div>

            <div className="w-full max-w-6xl mx-auto">
                {!convertedFile ? (
                    <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200">
                        <CardHeader>
                        <CardTitle className="text-slate-900">Upload PDF File</CardTitle>
                        <CardDescription className="text-slate-500">Select a PDF file to convert</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                        <div className={`border-2 border-dashed rounded-xl p-20 text-center transition-colors bg-slate-50 ${isConverting ? 'opacity-50 pointer-events-none border-slate-300' : 'border-slate-300 hover:border-orange-500 hover:bg-orange-50/20'}`}>
                            <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                            <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-orange-600 font-semibold hover:text-orange-500 text-lg">Choose file</span> <span className="text-slate-500 text-lg">or drag and drop</span>
                            <input id="file-upload" type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} disabled={isConverting} />
                            </label>
                            <p className="text-sm text-slate-500 mt-2">PDF files only</p>
                        </div>
                        
                        {file && (
                            <div className="p-4 rounded-xl border bg-white border-orange-200 shadow-sm flex items-center justify-between">
                                <p className="font-medium text-slate-900">{file.name}</p>
                                <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isConverting} className="text-slate-400 hover:text-red-500">
                                    Remove
                                </Button>
                            </div>
                        )}

                        <Button 
                            onClick={handleConvert} 
                            disabled={!file || isConverting} 
                            className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6 rounded-xl font-semibold text-white shadow-lg shadow-orange-500/20"
                        >
                            {isConverting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Converting...
                                </>
                            ) : (
                                <>
                                    <LucidePresentation className="mr-2 h-5 w-5" /> Convert to PowerPoint
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
                                Your file has been successfully converted to PowerPoint.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-white/60 rounded-xl p-8 border border-emerald-100 flex flex-col items-center text-center space-y-2">
                                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                                    <LucidePresentation className="h-8 w-8 text-red-600" />
                                </div>
                                <h3 className="font-semibold text-slate-900 text-lg break-all">
                                    {convertedFile.filename}
                                </h3>
                                <p className="text-sm text-slate-500">Ready for download</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]">
                                    <Download className="mr-2 h-5 w-5" />
                                    Download PowerPoint
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
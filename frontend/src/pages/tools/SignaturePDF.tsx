import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileSignature, ArrowLeft, Download, CheckCircle, RefreshCw, Loader2, Maximize, FileText, LayoutTemplate, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

// --- Types ---
interface SignedFileDetails {
  outputFile: string;
  message?: string;
}

interface SignatureOptions {
  file: File;
  pages: string;
  position: string;
  scale: string;
}

const STORAGE_KEY = "kavach_signed_file";

// --- Modals ---
function SignatureDetailsModal({ open, onOpenChange, onApply }: { open: boolean, onOpenChange: (v: boolean) => void, onApply: (opts: SignatureOptions) => void }) {
  const [stampFile, setStampFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); 
  
  const [position, setPosition] = useState("bottom-right");
  const [pages, setPages] = useState("all");
  const [scale, setScale] = useState(0.5);

  const handleStampFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setStampFile(e.target.files[0]);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleApplyClick = () => {
    if (!stampFile) {
        alert("Please upload a signature image to proceed.");
        return;
    }
    
    onApply({
        file: stampFile,
        position: position,
        pages: pages,
        scale: scale.toString()
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 bg-white border border-slate-200 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex-col items-start border-b border-slate-100 p-4">
          <DialogTitle className="text-lg font-semibold text-slate-900">Configure Signature</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Upload your signature image and choose where it appears on the document.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          
          {/* 1. File Upload Area */}
          <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">1. Upload Signature Image</Label>
              
              <div 
                onClick={triggerFileUpload}
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all group ${stampFile ? 'border-orange-500 bg-orange-50' : 'border-slate-300 hover:border-orange-500 hover:bg-slate-50'}`}
              >
                {stampFile ? (
                    <div className="text-center">
                        <CheckCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-900">{stampFile.name}</p>
                        <p className="text-xs text-slate-500 group-hover:text-orange-600">Click to replace</p>
                    </div>
                ) : (
                  <div className="text-center pointer-events-none">
                      <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-orange-500 transition-colors" />
                      <p className="text-sm font-medium text-slate-600 group-hover:text-orange-600 transition-colors">Click to Select Image</p>
                      <p className="text-xs text-slate-400">PNG, JPG, SVG (Transparent recommended)</p>
                  </div>
                )}
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleStampFileChange} 
                />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 2. Position Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <LayoutTemplate className="w-4 h-4" /> 2. Position
                </Label>
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                        <button
                            key={pos}
                            onClick={() => setPosition(pos)}
                            className={`p-2 text-xs font-medium rounded-md border transition-all ${position === pos 
                                ? 'bg-orange-100 border-orange-500 text-orange-700 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'}`}
                        >
                            {pos.replace('-', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>
              </div>

              {/* 3. Pages Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FileText className="w-4 h-4" /> 3. Pages
                </Label>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <input 
                            type="radio" 
                            id="page-all" 
                            name="pages" 
                            checked={pages === "all"} 
                            onChange={() => setPages("all")} 
                            className="accent-orange-600 w-4 h-4"
                        />
                        <Label htmlFor="page-all" className="cursor-pointer text-slate-700">All Pages</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="radio" 
                            id="page-custom" 
                            name="pages" 
                            checked={pages !== "all"} 
                            onChange={() => setPages("1")} 
                            className="accent-orange-600 w-4 h-4"
                        />
                        <Label htmlFor="page-custom" className="cursor-pointer whitespace-nowrap text-slate-700">Custom:</Label>
                        <Input 
                            value={pages === "all" ? "" : pages}
                            disabled={pages === "all"}
                            onClick={() => setPages(prev => prev === "all" ? "1" : prev)}
                            onChange={(e) => setPages(e.target.value)}
                            className="h-8 text-sm w-full"
                            placeholder="e.g. 1, 3-5"
                        />
                    </div>
                </div>
              </div>
          </div>

          {/* 4. Scale Slider */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Maximize className="w-4 h-4" /> 4. Size (Scale)
                </Label>
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{Math.round(scale * 100)}%</span>
            </div>
            <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.1" 
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
            <div className="flex justify-between text-xs text-slate-400">
                <span>Small</span>
                <span>Medium</span>
                <span>Large</span>
            </div>
          </div>

        </div>
        <DialogFooter className="border-t border-slate-100 p-4">
          <Button onClick={handleApplyClick} className="bg-orange-600 hover:bg-orange-700 text-white w-full shadow-lg shadow-orange-500/20">
            Apply Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Component ---
export default function SignaturePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [signedFile, setSignedFile] = useState<SignedFileDetails | null>(null);
  const [showSignatureDetails, setShowSignatureDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();
  const isAuthenticated = true;
  const isAdmin = false;

  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData: SignedFileDetails = JSON.parse(storedData);
        setSignedFile(parsedData);
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSignedFile(null);
      localStorage.removeItem(STORAGE_KEY);
      toast({ title: "File uploaded", description: `${e.target.files[0].name} ready to sign` });
      setShowSignatureDetails(true);
    }
  };

  const handleSign = async (options: SignatureOptions) => {
    setShowSignatureDetails(false);
    
    if (!file) {
        toast({ title: "Error", description: "No PDF file selected.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    toast({ title: "Processing", description: "Signing your document..." });

    try {
        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('signature', options.file);
        formData.append('pages', options.pages);
        formData.append('position', options.position);
        formData.append('scale', options.scale);

        const token = localStorage.getItem("authToken");

        const response = await Instance.post('/pdf/pdf-sign', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': token ? `${token}` : '',
            }
        });

        console.log("PDF Sign Server Response:", response.data);

        let resultData: SignedFileDetails | null = null;

        if (response.data?.files?.length > 0) {
            resultData = response.data.files[0];
        }
        else if (response.data?.file && response.data.file.outputFile) {
            resultData = response.data.file;
        }
        else if (response.data?.outputFile) {
            resultData = response.data;
        }

        if (resultData) {
            setSignedFile(resultData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(resultData));
            toast({ title: "Success", description: "Document signed successfully!" });
        } else {
             console.error("Structure Mismatch. Received:", response.data);
             throw new Error("Invalid response from server - check console for details");
        }

    } catch (error) {
        console.error("Signing Error:", error);
        toast({ title: "Failed", description: "Could not sign the PDF.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    let fileDetails: SignedFileDetails | null = null;

    if (storedData) {
      try {
        fileDetails = JSON.parse(storedData);
      } catch (e) {
        console.error("Error parsing stored file details", e);
      }
    } else if (signedFile) {
      fileDetails = signedFile;
    }

    if (!fileDetails || !fileDetails.outputFile) {
      toast({ title: "Error", description: "No signed file found.", variant: "destructive" });
      return;
    }

    const rawPath = fileDetails.outputFile;
    const filenameToDownload = rawPath.split(/[/\\]/).pop();

    if (!filenameToDownload) {
        toast({ title: "Error", description: "Invalid filename", variant: "destructive" });
        return;
    }

    const token = localStorage.getItem("authToken");

    try {
      toast({ title: "Download Started", description: "Fetching your document..." });

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
    setSignedFile(null);
    localStorage.removeItem(STORAGE_KEY);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
       {/* Background Effects */}
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
        <main className="flex-1 py-10">
          <div className="max-w-6xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
            <Link to="/tools" className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4 text-slate-500" /><span className="text-slate-600">Back</span>
            </Link>

            <div className="text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                <FileSignature className="h-10 w-10 text-orange-600" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900">Sign PDF</h1>
              <p className="text-xl text-slate-500">Add your electronic signature to a PDF document</p>
            </div>

            {/* Processing State */}
            {isProcessing && (
                 <Card className="bg-white/80 backdrop-blur-md shadow-xl border border-slate-200 p-12 text-center max-w-4xl mx-auto">
                    <Loader2 className="h-12 w-12 text-orange-600 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900">Applying Signature...</h3>
                    <p className="text-slate-500">Please wait while we process your document.</p>
                 </Card>
            )}

            {/* Input State */}
            {!isProcessing && !signedFile && (
                <Card className="bg-white shadow-xl border border-slate-200 max-w-5xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-slate-900">Upload PDF File</CardTitle>
                    <CardDescription className="text-slate-500">Select a PDF file to add your signature</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="border-2 border-dashed rounded-xl p-16 text-center border-slate-300 hover:border-orange-500/50 transition-colors bg-slate-50/50">
                    <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-orange-600 font-semibold hover:text-orange-500 text-lg">Choose file</span> <span className="text-slate-500 text-lg">or drag and drop</span>
                        <input id="file-upload" type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                    </label>
                    <p className="text-sm text-slate-500 mt-2">PDF files only</p>
                    </div>
                    {file && (
                        <div className="p-4 rounded-xl border bg-white border-orange-200 shadow-sm flex items-center justify-between">
                            <p className="font-medium text-slate-900">Selected: {file.name}</p>
                            <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
                                Remove
                            </Button>
                        </div>
                    )}
                </CardContent>
                </Card>
            )}

            {/* Success / Download State */}
            {!isProcessing && signedFile && (
                <Card className="bg-emerald-50 backdrop-blur-md shadow-xl border border-emerald-200 h-full relative overflow-hidden max-w-5xl mx-auto">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                    <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                        <CardTitle className="text-emerald-900">Signing Complete!</CardTitle>
                    </div>
                    <CardDescription className="text-emerald-700">
                        Your document has been signed successfully.
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="bg-white/60 rounded-xl p-6 border border-emerald-100 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-emerald-100/50 rounded-lg">
                        <span className="text-emerald-700 text-sm">File Name</span>
                        <span className="text-emerald-900 font-mono text-sm truncate max-w-[200px]">
                            {signedFile.outputFile.split(/[/\\]/).pop()}
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
                            Sign Another
                        </Button>
                    </div>
                    </CardContent>
                </Card>
            )}

          </div>
        </main>
        <Footer />
      </div>
      
      <SignatureDetailsModal 
        open={showSignatureDetails} 
        onOpenChange={setShowSignatureDetails} 
        onApply={handleSign} 
      />
    </div>
  );
}
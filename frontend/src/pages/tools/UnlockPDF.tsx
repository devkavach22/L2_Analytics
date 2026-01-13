import { useState } from "react";
import { Link } from "react-router-dom";
import Instance from "@/lib/axiosInstance";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Unlock, ArrowLeft, Loader2, Download, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function UnlockPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedFileName, setUnlockedFileName] = useState<string | null>(null);
  
  const { toast } = useToast();
  const isAuthenticated = true;
  const isAdmin = false;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUnlockedFileName(null);
      toast({ title: "File uploaded", description: `${e.target.files[0].name} ready` });
    }
  };

  const handleUnlock = async () => {
    if (!file || !password) { 
      toast({ title: "Error", description: "Please provide both file and password", variant: "destructive" }); 
      return; 
    }

    setIsUnlocking(true);

    try {
      const formData = new FormData();
      formData.append('file', file); 
      formData.append('password', password);

      const token = localStorage.getItem("authToken");

      const response = await Instance.post('/pdf/unlock-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `${token}` : '',
        }
      });

      if (response.data && response.data.files && response.data.files.length > 0) {
        const outputData = response.data.files[0]; 
        const finalPath = typeof outputData === 'string' ? outputData : outputData.outputFile;
        
        setUnlockedFileName(finalPath);
        toast({ title: "Success!", description: "PDF unlocked successfully." });
      } else {
         toast({ title: "Error", description: "Unexpected response format.", variant: "destructive" });
      }

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Failed to unlock PDF. Please check the password.";
      toast({ title: "Unlock Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleDownload = async () => {
    if (!unlockedFileName) return;

    const filenameToDownload = unlockedFileName.split(/[/\\]/).pop();
    if (!filenameToDownload) {
        toast({ title: "Error", description: "Could not parse filename", variant: "destructive" });
        return;
    }

    const token = localStorage.getItem("authToken");

    try {
      toast({ title: "Download Started", description: "Fetching your unlocked file..." });

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
    setPassword("");
    setUnlockedFileName(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
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
          <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
            <Link to="/tools" className="inline-flex items-center bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 gap-2 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4 text-slate-500" /><span className="text-slate-600">Back</span>
            </Link>

            <div className="text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 border border-orange-200 animate-float">
                <Unlock className="h-8 w-8 text-orange-600" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900">Unlock PDF</h1>
              <p className="text-lg text-slate-500">Remove password protection from your PDF file</p>
            </div>

            {/* Main Content Area: Switch between Input Form and Success State */}
            {!unlockedFileName ? (
              <Card className="bg-white shadow-xl border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-900">Upload PDF File</CardTitle>
                  <CardDescription className="text-slate-500">Select a PDF and provide its password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors bg-slate-50/50 ${isUnlocking ? 'opacity-50 pointer-events-none border-slate-300' : 'border-slate-300 hover:border-orange-500/50'}`}>
                    <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-orange-600 font-semibold hover:text-orange-500 text-lg">Choose file</span> <span className="text-slate-500 text-lg">or drag and drop</span>
                      <input id="file-upload" type="file" accept=".pdf" disabled={isUnlocking} className="hidden" onChange={handleFileSelect} />
                    </label>
                    <p className="text-sm text-slate-500 mt-2">PDF files only</p>
                  </div>

                  {file && (
                    <div className="p-4 rounded-xl border bg-slate-50 border-orange-200 flex justify-between items-center">
                      <p className="font-medium text-slate-900">{file.name}</p>
                      <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isUnlocking} className="text-slate-400 hover:text-red-500">
                          Remove
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700">Enter Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Enter the file's current password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      disabled={isUnlocking}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-orange-500 h-12" 
                    />
                  </div>

                  <Button 
                    onClick={handleUnlock} 
                    disabled={!file || !password || isUnlocking} 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6 rounded-xl font-semibold shadow-lg shadow-orange-500/20"
                  >
                    {isUnlocking ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Unlocking...
                      </>
                    ) : (
                      <>
                        <Unlock className="mr-2 h-5 w-5" /> Unlock PDF
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              // Success / Download State
              <Card className="bg-emerald-50 shadow-xl border border-emerald-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                    <CardTitle className="text-emerald-900">PDF Unlocked Successfully!</CardTitle>
                  </div>
                  <CardDescription className="text-emerald-700">
                    Your file has been decrypted and is ready for download.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-white/60 rounded-xl p-6 border border-emerald-100">
                    <div className="flex items-center justify-between p-3 bg-emerald-100/50 rounded-lg">
                       <span className="text-emerald-700 text-sm">Output File</span>
                       <span className="text-emerald-900 font-mono text-sm truncate max-w-[200px] sm:max-w-md">
                         {unlockedFileName.split(/[/\\]/).pop()}
                       </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl font-semibold shadow-lg shadow-green-900/10 transition-all hover:scale-[1.02]">
                      <Download className="mr-2 h-5 w-5" />
                      Download Unlocked PDF
                    </Button>
                    <Button variant="outline" onClick={handleReset} className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 py-6 rounded-xl">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Unlock Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
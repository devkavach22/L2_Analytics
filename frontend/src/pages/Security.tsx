import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Server, EyeOff, FileKey } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENT: GLASS CARD ---
const GlassCard = ({ children, className = "" }: any) => {
  return (
    <div className={cn("relative overflow-hidden rounded-[32px] border border-orange-100/60 bg-white/60 backdrop-blur-xl shadow-xl shadow-orange-900/5", className)}>
       <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent opacity-50" />
       {children}
    </div>
  );
};

export default function Security() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0] text-slate-900 font-sans overflow-x-hidden relative selection:bg-orange-200 selection:text-orange-900">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-red-200/50 rounded-full blur-[100px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-soft-light"></div>
      </div>
      
      <div className="relative z-50"><Header /></div>

      <main className="relative z-10 pt-32 pb-24 px-6">
        <div className="container max-w-7xl mx-auto">
            <div className="text-center mb-20">
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-bold mb-4"
                >
                   <ShieldCheck size={14} /> ISO 27001 Certified
                </motion.div>
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-6xl font-black text-slate-900 mb-6"
                >
                    Security at our <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Core</span>
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-600 max-w-2xl mx-auto font-medium text-lg"
                >
                    We don't just process your files. We protect them. Our zero-knowledge architecture means we can't read your data even if we wanted to.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard className="p-8 hover:-translate-y-2 transition-transform duration-500">
                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
                        <Lock className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">AES-256 Encryption</h3>
                    <p className="text-slate-600 font-medium leading-relaxed">All files are encrypted in transit using TLS 1.3 and at rest using AES-256. Your documents are mathematically secure.</p>
                </GlassCard>
                
                <GlassCard className="p-8 hover:-translate-y-2 transition-transform duration-500">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                        <EyeOff className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Zero-Knowledge Privacy</h3>
                    <p className="text-slate-600 font-medium leading-relaxed">Most processing happens in your browser via WebAssembly. The files never leave your device for basic operations.</p>
                </GlassCard>
                
                <GlassCard className="p-8 hover:-translate-y-2 transition-transform duration-500">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                        <Server className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Automatic Deletion</h3>
                    <p className="text-slate-600 font-medium leading-relaxed">For server-side tasks, files are automatically and permanently wiped from our servers after 1 hour.</p>
                </GlassCard>
                
                <GlassCard className="p-8 hover:-translate-y-2 transition-transform duration-500">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                        <FileKey className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">GDPR Compliant</h3>
                    <p className="text-slate-600 font-medium leading-relaxed">We strictly adhere to GDPR and CCPA regulations. You own your data, always.</p>
                </GlassCard>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
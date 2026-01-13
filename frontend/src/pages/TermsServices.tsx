import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Scale, Gavel, AlertTriangle, UserCheck, Ban } from "lucide-react";
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

export default function TermsServices() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0] text-slate-900 font-sans overflow-x-hidden relative selection:bg-orange-200 selection:text-orange-900">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-gradient-to-r from-orange-200 to-amber-100 rounded-full blur-[100px] opacity-50" 
        />
        <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
            className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-gradient-to-l from-red-200 to-orange-100 rounded-full blur-[100px] opacity-50" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-soft-light"></div>
      </div>

      <div className="relative z-50"><Header /></div>

      <main className="relative z-10 pt-32 pb-24 px-6">
        <div className="container max-w-4xl mx-auto">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 border-b border-orange-100 pb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold mb-6">
              <Scale size={14} />
              <span>Legal Agreement</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Terms of Service</h1>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              By accessing or using Kavach, you agree to be bound by these terms. Please read them carefully before using our PDF tools.
            </p>
          </motion.div>

          {/* Content */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-12"
          >
            {/* Section 1 */}
            <GlassCard className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100"><UserCheck size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-900">1. Usage License</h2>
              </div>
              <div className="pl-4 md:pl-14 space-y-4 text-slate-600 leading-relaxed font-medium">
                <p>
                  Kavach grants you a revocable, non-exclusive, non-transferable, limited license to use the website and services strictly in accordance with the terms of this agreement.
                </p>
                <p>
                  <strong>Free Tier:</strong> Users are limited to specific file size limits and daily task counts. <br />
                  <strong>Pro Tier:</strong> Paid users are granted extended limits, API access, and priority processing.
                </p>
              </div>
            </GlassCard>

            {/* Section 2 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100"><Ban size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-900">2. Prohibited Activities</h2>
              </div>
              <div className="pl-4 md:pl-14 space-y-4 text-slate-600 leading-relaxed font-medium">
                <p>You agree strictly NOT to use the Service to:</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-red-500">
                  <li>Upload files containing malware, viruses, or malicious code.</li>
                  <li>Process documents that contain illegal content.</li>
                  <li>Attempt to reverse engineer the API or WebAssembly modules.</li>
                  <li>Automate usage of the free tier via scripts or bots (scraping).</li>
                </ul>
                <p className="text-sm italic border-l-4 border-red-500 pl-4 mt-4 text-slate-700 bg-red-50/50 p-2 rounded-r-lg">
                  Violation of these terms will result in immediate account termination and IP banning.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100"><AlertTriangle size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-900">3. Limitation of Liability</h2>
              </div>
              <div className="pl-4 md:pl-14 space-y-4 text-slate-600 leading-relaxed font-medium">
                <p className="uppercase text-[10px] font-black tracking-widest text-slate-500 mb-2">Read Carefully</p>
                <p>
                  The service is provided "AS IS" and "AS AVAILABLE". Kavach makes no warranties, expressed or implied, regarding reliability or availability.
                </p>
                <p>
                  <strong>We are not liable for:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-2">
                   <li>Loss of data resulting from file processing errors.</li>
                   <li>Corrupted PDF files (users are strongly advised to keep backups).</li>
                   <li>Any consequential damages arising from the use of our tools.</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100"><Gavel size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-900">4. Governing Law</h2>
              </div>
              <div className="pl-4 md:pl-14 space-y-4 text-slate-600 leading-relaxed font-medium">
                <p>
                  These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
                </p>
                <p>
                  Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                </p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-orange-200 text-center">
                <p className="text-slate-500 font-medium">Questions about our Terms?</p>
                <Link to="/contact" className="text-orange-600 font-bold hover:text-orange-500 transition-colors">Contact Support</Link>
            </div>

          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
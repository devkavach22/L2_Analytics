import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Cookie, Settings, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENT: GLASS CARD ---
const GlassCard = ({ children, className = "" }: any) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[32px] border border-orange-100/60 bg-white/60 backdrop-blur-xl shadow-xl shadow-orange-900/5",
        className
      )}
    >
       <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent opacity-50" />
       {children}
    </div>
  );
};

export default function CookiesPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0] text-slate-900 font-sans overflow-x-hidden relative selection:bg-orange-200 selection:text-orange-900">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-r from-orange-200 to-amber-100 rounded-full blur-[100px] opacity-50" 
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
            className="mb-16 border-b border-orange-100 pb-12 text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-sm font-bold mb-6">
              <Cookie size={14} />
              <span>Policy & Settings</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Cookie Policy</h1>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              We use cookies to make Kavach faster, more secure, and easier to use. This guide explains what they are and how you can control them.
            </p>
          </motion.div>

          {/* Content */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-12"
          >
            {/* Introduction */}
            <GlassCard className="p-8">
               <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Info size={20} className="text-orange-500" /> What are Cookies?</h2>
               <p className="text-slate-600 leading-relaxed font-medium">
                 Cookies are small text files stored on your device when you visit a website. They allow the site to remember your actions and preferences (such as login, language, font size, and other display preferences) over a period of time, so you don’t have to keep re-entering them.
               </p>
            </GlassCard>

            {/* Types of Cookies */}
            <section>
               <h2 className="text-2xl font-bold text-slate-900 mb-8">How We Use Them</h2>
               <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Essential */}
                  <GlassCard className="p-8 border-orange-200 bg-white/80">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded-xl bg-orange-50 text-orange-500"><CheckCircle2 size={24} /></div>
                        <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-1 rounded-full uppercase tracking-wider">Required</span>
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">Essential Cookies</h3>
                     <p className="text-slate-600 text-sm mb-4 font-medium">
                        Strictly necessary for the website to function. They enable core functionality like security, network management, and accessibility.
                     </p>
                     <ul className="text-sm text-slate-500 space-y-1 list-disc pl-4 font-medium">
                        <li>Session IDs (Login status)</li>
                        <li>CSRF Security Tokens</li>
                        <li>Load Balancing</li>
                     </ul>
                  </GlassCard>

                  {/* Analytics */}
                  <GlassCard className="p-8 bg-white/40">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded-xl bg-white border border-slate-100 text-blue-500"><Settings size={24} /></div>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full uppercase tracking-wider">Optional</span>
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">Analytics Cookies</h3>
                     <p className="text-slate-600 text-sm mb-4 font-medium">
                        Help us understand how visitors interact with the website by collecting and reporting information anonymously.
                     </p>
                     <ul className="text-sm text-slate-500 space-y-1 list-disc pl-4 font-medium">
                        <li>Google Analytics</li>
                        <li>Heatmaps (Hotjar)</li>
                        <li>Performance Monitoring</li>
                     </ul>
                  </GlassCard>

               </div>
            </section>

            {/* Management */}
            <section>
               <h2 className="text-2xl font-bold text-slate-900 mb-6">Managing Your Preferences</h2>
               <div className="text-slate-600 space-y-4 font-medium">
                  <p>
                     You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed.
                  </p>
                  <p>
                     However, if you do this, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work.
                  </p>
               </div>
               
               <div className="mt-8 p-6 rounded-2xl bg-orange-50/50 border border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                     <h4 className="text-slate-900 font-bold">Current Consent Status</h4>
                     <p className="text-sm text-slate-500 font-medium">You have not yet set your privacy preferences.</p>
                  </div>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 font-bold">
                     Open Cookie Settings
                  </Button>
               </div>
            </section>

          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
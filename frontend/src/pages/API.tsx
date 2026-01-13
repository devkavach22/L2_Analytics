import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { Terminal, Cpu, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function APIPage() {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFAF4] text-slate-900 font-sans overflow-x-hidden selection:bg-orange-200 selection:text-orange-900">
       
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-200/40 via-transparent to-transparent" />
      <div className="relative z-50"><Header /></div>

      <main className="relative z-10 pt-32 pb-24 px-6">
        <div className="container max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Left Content */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-100 text-orange-700 text-xs font-bold font-mono">
              <Cpu size={14} /> V2.4 STABLE
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-none">
              Build with <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Cognitive APIs</span>
            </h1>
            
            <p className="text-slate-600 text-lg font-medium leading-relaxed max-w-lg">
              Embed enterprise-grade NLP into your app. Extract entities, analyze sentiment, and generate reports with a simple REST call.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all hover:scale-105 shadow-xl shadow-slate-900/20">
                  Read Documentation
              </button>
              <button className="px-8 py-4 rounded-xl bg-white border border-orange-200 text-orange-600 font-bold hover:bg-orange-50 transition-all">
                  Get API Key
              </button>
            </div>
          </div>

          {/* Right Code Block */}
          <div className="flex-1 w-full max-w-xl">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="rounded-3xl bg-[#0f172a] border border-slate-700 shadow-2xl shadow-orange-500/10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 bg-slate-800/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">POST /v1/nlp/analyze</span>
                    <button onClick={copyCode} className="text-slate-400 hover:text-white transition-colors">
                        {copied ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
                    </button>
                </div>
              </div>
              <div className="p-6 font-mono text-sm overflow-x-auto">
                <div className="text-blue-400 mb-2">curl -X POST https://api.konvert.io/v1/analyze \</div>
                <div className="text-slate-300 pl-4 mb-2">-H <span className="text-green-400">"Authorization: Bearer sk_live_..."</span> \</div>
                <div className="text-slate-300 pl-4 mb-2">-d <span className="text-orange-300">'{`{`}</span></div>
                <div className="text-purple-300 pl-8">"text": <span className="text-green-300">"The server outage in US-East caused a 20% revenue drop."</span>,</div>
                <div className="text-purple-300 pl-8">"features": [<span className="text-green-300">"sentiment"</span>, <span className="text-green-300">"entities"</span>]</div>
                <div className="text-slate-300 pl-4">{`}'`}</div>
                
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Response</div>
                  <TypeAnimation
                     sequence={[
                        1000,
                        `{
                          "sentiment": "Negative",
                          "score": 0.89,
                          "entities": [
                            { "text": "US-East", "type": "LOCATION" },
                            { "text": "20%", "type": "PERCENTAGE" }
                          ]
                        }`
                     ]}
                     wrapper="pre"
                     speed={90}
                     className="text-emerald-400"
                  />
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
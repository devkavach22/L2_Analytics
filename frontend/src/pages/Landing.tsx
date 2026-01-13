import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring, useTransform, useMotionValue, AnimatePresence, useMotionTemplate } from "framer-motion";
import { 
  Brain, 
  Search, 
  FileBarChart, 
  Database, 
  Sparkles, 
  ArrowRight, 
  Activity, 
  Command,
  ShieldCheck,
  Users,
  Scale,
  Receipt,
  Lock,
  FileJson,
  FileText,
  PieChart,
  Terminal,
  CheckCircle2,
  Cpu
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- CUSTOM ANIMATIONS & GRAPHICS ---

// 1. SPOTLIGHT CARD (Mouse-following glow)
const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        "group relative border border-slate-200 bg-white overflow-hidden",
        className
      )}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(249, 115, 22, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
};

// 2. ANIMATED GRID PATTERN
const GridPattern = () => {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-gradient-to-t from-[#FFFBF6] to-transparent" 
      />
    </div>
  );
};

// 3. SHIMMER BADGE
const ShimmerBadge = ({ text, icon: Icon }: any) => {
  return (
    <div className="relative inline-flex overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#F97316_0%,#FFF_50%,#F97316_100%)]" />
      <span className="inline-flex h-full w-full cursor-default items-center justify-center rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase text-orange-600 backdrop-blur-3xl">
        <Icon size={12} className="mr-2" />
        {text}
      </span>
    </div>
  );
};


// --- CUSTOM LOGO SVGS ---
const BrandLogos = {
  Quantum: () => <svg viewBox="0 0 40 40" className="w-8 h-8 fill-current"><path d="M20 0L37.32 10V30L20 40L2.68 30V10L20 0ZM20 7.5L8.66 14.05V25.95L20 32.5L31.34 25.95V14.05L20 7.5Z"/></svg>,
  Echo: () => <svg viewBox="0 0 40 40" className="w-8 h-8 fill-current"><circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="4" fill="none"/><circle cx="20" cy="20" r="10" fill="currentColor"/></svg>,
  Nebula: () => <svg viewBox="0 0 40 40" className="w-8 h-8 fill-current"><path d="M20 4L4 36H36L20 4Z" /><circle cx="20" cy="24" r="4" fill="white"/></svg>,
  Vertex: () => <svg viewBox="0 0 40 40" className="w-8 h-8 fill-current"><rect x="5" y="5" width="12" height="12" /><rect x="23" y="5" width="12" height="12" /><rect x="5" y="23" width="12" height="12" /><circle cx="29" cy="29" r="6" /></svg>,
  Cyber: () => <svg viewBox="0 0 40 40" className="w-8 h-8 fill-current"><path d="M4 20L20 4L36 20L20 36L4 20Z" /><rect x="16" y="16" width="8" height="8" fill="white"/></svg>
};

// --- VISUAL COMPONENTS (EXISTING) ---

const TiltCard = ({ children, className }: any) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  return (
    <motion.div
      style={{ x, y, rotateX, rotateY, z: 100 }}
      drag
      dragElastic={0.12}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      whileTap={{ cursor: "grabbing" }}
      className={cn("cursor-grab perspective-1000", className)}
    >
      {children}
    </motion.div>
  );
};

const GlowButton = ({ children, className, onClick, to, variant = "primary" }: any) => {
  const Component = to ? Link : motion.button;
  const isPrimary = variant === "primary";
  
  return (
    <Component
      to={to}
      onClick={onClick}
      className={cn(
        "relative group px-8 py-4 rounded-xl font-bold overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] text-base",
        isPrimary 
          ? "bg-slate-900 text-white shadow-lg shadow-orange-900/10" 
          : "bg-white text-slate-900 border border-slate-200 hover:border-orange-300 hover:text-orange-600 shadow-sm",
        className
      )}
    >
      {isPrimary && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-[length:200%_auto] animate-gradient-x" />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </Component>
  );
};

// Neural Network Canvas
const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const nodes: any[] = [];
    const nodeCount = 40; 

    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          this.x += dx * 0.01;
          this.y += dy * 0.01;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(249, 115, 22, 0.4)";
        ctx.fill();
      }
    }

    for (let i = 0; i < nodeCount; i++) nodes.push(new Node());

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);
      nodes.forEach((node, index) => {
        node.update();
        node.draw();
        for (let j = index + 1; j < nodes.length; j++) {
          const node2 = nodes[j];
          const dx = node.x - node2.x;
          const dy = node.y - node2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 180) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(249, 115, 22, ${0.12 - dist / 1500})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(node2.x, node2.y);
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    }
    animate();
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60" />;
};

const TypewriterText = ({ text, className }: { text: string, className?: string }) => {
  const [displayText, setDisplayText] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [text]);
  return <span className={className}>{displayText}<span className="animate-pulse text-orange-500">|</span></span>;
};

// --- MAIN PAGE ---
export default function Landing() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const [activeTab, setActiveTab] = useState("input");

  return (
    <div className="min-h-screen bg-[#FFFBF6] text-slate-900 font-sans selection:bg-orange-200 selection:text-orange-900 overflow-x-hidden flex flex-col">
      
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 origin-left z-50" />
      <NeuralBackground />
      
      {/* Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-orange-300/20 rounded-full blur-[120px] mix-blend-multiply pointer-events-none animate-pulse duration-[5000ms]" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-amber-300/20 rounded-full blur-[120px] mix-blend-multiply pointer-events-none animate-pulse duration-[7000ms]" />

      <div className="relative z-50">
        <Header isAuthenticated={false} />
      </div>

      <main className="relative z-10 pt-28 flex-grow">
        
        {/* --- HERO SECTION --- */}
        <section className="relative px-6 py-8 lg:py-12 overflow-visible">
          <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <motion.div whileHover={{ scale: 1.05 }} className="inline-block cursor-default">
                 <ShimmerBadge text="NLP Engine v2.4 Live" icon={Cpu} />
              </motion.div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-slate-900">
                Data speaks. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 animate-gradient-x">
                   We listen.
                </span>
              </h1>
              
              <div className="h-20">
                 <p className="text-xl text-slate-600 max-w-lg leading-relaxed font-medium">
                   Transform unstructured text into <TypewriterText text="structured insights using ElasticSearch & Transformers." className="text-slate-900 font-bold" />
                 </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <GlowButton onClick={() => navigate('/auth')} variant="primary">
                  Start Analysis <ArrowRight className="w-5 h-5" />
                </GlowButton>
                <GlowButton onClick={() => navigate('/demo')} variant="outline">
                   <Command className="w-5 h-5" /> View Demo
                </GlowButton>
              </div>
            </motion.div>

            {/* 3D Dashboard Graphic */}
            <div className="relative flex justify-center perspective-1000">
               <TiltCard className="relative z-10 w-full max-w-lg">
                  <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-orange-500/10 overflow-hidden group">
                     {/* Dashboard Header */}
                     <div className="h-12 border-b border-slate-100 flex items-center px-5 justify-between bg-white/50">
                        <div className="flex gap-2">
                           <div className="w-3 h-3 rounded-full bg-red-400" />
                           <div className="w-3 h-3 rounded-full bg-amber-400" />
                           <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">query_time: 12ms</div>
                     </div>
                     
                     <div className="p-6 space-y-6">
                        <div className="flex gap-4">
                           <div className="flex-1 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                 <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Activity size={16} /></div>
                                 <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                              </div>
                              <div className="text-2xl font-black text-slate-800">98.2</div>
                              <div className="text-xs text-slate-400 font-bold uppercase">Sentiment Index</div>
                           </div>
                           <div className="flex-1 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Database size={16} /></div>
                              </div>
                              <div className="text-2xl font-black text-slate-800">4.2M</div>
                              <div className="text-xs text-slate-400 font-bold uppercase">Vectors Stored</div>
                           </div>
                        </div>

                        <div className="relative">
                           <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                              <Search size={16} />
                           </div>
                           <input disabled placeholder="Search semantic entities..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium" />
                        </div>

                        <div className="h-28 w-full bg-gradient-to-b from-orange-50/50 to-transparent rounded-lg border border-dashed border-orange-200 relative overflow-hidden flex items-end justify-between px-2 pb-0 pt-6">
                            {[40, 65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                               <motion.div 
                                  key={i}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${h}%` }}
                                  transition={{ delay: 0.5 + (i * 0.1), duration: 1, type: "spring" }}
                                  className="w-[10%] bg-orange-400 rounded-t-sm opacity-80"
                               />
                            ))}
                        </div>
                     </div>
                  </div>
               </TiltCard>
            </div>
          </div>
        </section>

        {/* --- AUTO-SCROLL LOGO STRIP (MARQUEE) --- */}
        <section className="py-12 border-y border-orange-100 bg-white/50 backdrop-blur-sm overflow-hidden">
           <div className="container mx-auto px-6 max-w-7xl">
              <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Trusted by modern data teams</p>
              
              <div className="relative w-full overflow-hidden mask-linear-gradient">
                 <motion.div 
                   className="flex gap-20 items-center w-max"
                   animate={{ x: ["0%", "-50%"] }}
                   transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                 >
                    {[...Array(2)].map((_, i) => (
                       <div key={i} className="flex gap-20 items-center">
                          <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all text-slate-800 font-bold text-xl"><BrandLogos.Quantum /> Quantum</div>
                          <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all text-slate-800 font-bold text-xl"><BrandLogos.Echo /> Echo Systems</div>
                          <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all text-slate-800 font-bold text-xl"><BrandLogos.Nebula /> NebulaAI</div>
                          <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all text-slate-800 font-bold text-xl"><BrandLogos.Vertex /> Vertex Data</div>
                          <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all text-slate-800 font-bold text-xl"><BrandLogos.Cyber /> CyberDynamics</div>
                       </div>
                    ))}
                 </motion.div>
              </div>
           </div>
        </section>

        {/* --- REDESIGNED INTERACTIVE PLAYGROUND (IDE STYLE) --- */}
        <section className="py-20 relative overflow-hidden bg-slate-50">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
           <div className="container mx-auto px-6 max-w-6xl relative z-10">
              <div className="text-center mb-12">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest mb-4">
                    <Terminal size={12} /> Live Engine
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">See the <span className="text-orange-600">Magic.</span></h2>
                 <p className="text-slate-600 text-lg max-w-xl mx-auto">From unstructured noise to structured intelligence in milliseconds.</p>
              </div>

              <div className="bg-[#1e293b] rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden border border-slate-700 flex flex-col md:flex-row h-[550px] ring-4 ring-slate-900/5">
                 
                 {/* Sidebar */}
                 <div className="w-full md:w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col">
                    <div className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Explorer</div>
                    <div className="flex flex-col gap-1 px-2">
                       {[
                         { id: "input", label: "document_raw.pdf", icon: FileText, color: "text-blue-400" },
                         { id: "json", label: "parsed_output.json", icon: FileJson, color: "text-yellow-400" },
                         { id: "analytics", label: "visual_report.tsx", icon: PieChart, color: "text-purple-400" }
                       ].map((tab) => (
                         <button 
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id)}
                           className={cn(
                             "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all text-left",
                             activeTab === tab.id 
                               ? "bg-slate-800 text-white shadow-inner" 
                               : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                           )}
                         >
                            <tab.icon size={16} className={tab.color} /> 
                            {tab.label}
                            {activeTab === tab.id && <motion.div layoutId="activeDot" className="w-1.5 h-1.5 rounded-full bg-green-500 ml-auto" />}
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Editor Area */}
                 <div className="flex-1 flex flex-col bg-[#1e293b]">
                    {/* Traffic Lights & Tabs */}
                    <div className="h-12 border-b border-slate-800 flex items-center px-4 gap-4 bg-[#1e293b]">
                       <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/80" />
                          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                          <div className="w-3 h-3 rounded-full bg-green-500/80" />
                       </div>
                       <div className="text-xs text-slate-500 font-mono flex-1 text-center">
                          {activeTab === 'input' ? 'Preview Mode' : activeTab === 'json' ? 'Read-Only' : 'Dashboard View'}
                       </div>
                    </div>

                    <div className="flex-1 overflow-auto p-8 font-mono text-sm leading-relaxed relative">
                        <AnimatePresence mode="wait">
                          {activeTab === "input" && (
                            <motion.div 
                                key="input"
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -10 }}
                                className="text-slate-300"
                            >
                                <div className="text-slate-500 mb-6 select-none">1  // SCANNED DOCUMENT CONTENT (OCR)</div>
                                <div className="pl-6 border-l-2 border-slate-700 space-y-2">
                                   <div className="text-blue-300 font-bold text-lg">INVOICE #INV-2025-001</div>
                                   <div><span className="text-slate-400">Date:</span> Oct 24, 2025</div>
                                   <div><span className="text-slate-400">Vendor:</span> Acme Cloud Services</div>
                                   <br/>
                                   <div><span className="text-slate-400">Description_____________Amount</span></div>
                                   <div>Server Hosting (Q3)_____$4,500.00</div>
                                   <div>Data Backup_____________$250.00</div>
                                   <br/>
                                   <div className="text-green-400 font-bold text-lg">TOTAL DUE: $4,750.00</div>
                                </div>
                            </motion.div>
                          )}

                          {activeTab === "json" && (
                            <motion.div 
                                key="json"
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-1"
                            >
                                <div className="text-slate-500 mb-4 select-none">1  // EXTRACTED ENTITIES</div>
                                <div className="text-purple-400">{"{"}</div>
                                <div className="pl-4"><span className="text-blue-300">"status"</span>: <span className="text-green-300">"success"</span>,</div>
                                <div className="pl-4"><span className="text-blue-300">"confidence"</span>: <span className="text-orange-300">0.99</span>,</div>
                                <div className="pl-4"><span className="text-blue-300">"data"</span>: {"{"}</div>
                                <div className="pl-8"><span className="text-blue-300">"vendor"</span>: <span className="text-green-300">"Acme Cloud Services"</span>,</div>
                                <div className="pl-8"><span className="text-blue-300">"date"</span>: <span className="text-green-300">"2025-10-24"</span>,</div>
                                <div className="pl-8"><span className="text-blue-300">"total"</span>: <span className="text-orange-300">4750.00</span>,</div>
                                <div className="pl-8"><span className="text-blue-300">"line_items"</span>: [</div>
                                <div className="pl-12 text-slate-400">{"{ 'item': 'Hosting', 'cost': 4500 }"},</div>
                                <div className="pl-12 text-slate-400">{"{ 'item': 'Backup', 'cost': 250 }"}</div>
                                <div className="pl-8">]</div>
                                <div className="pl-4">{"}"}</div>
                                <div className="text-purple-400">{"}"}</div>
                            </motion.div>
                          )}

                          {activeTab === "analytics" && (
                            <motion.div 
                                key="analytics"
                                initial={{ opacity: 0, scale: 0.98 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="h-full flex flex-col justify-center items-center"
                            >
                               <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
                                  <div className="flex items-center justify-between mb-6">
                                     <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><Activity size={20}/></div>
                                        <div>
                                           <div className="text-slate-200 font-bold text-sm">Spend Analysis</div>
                                           <div className="text-slate-500 text-xs">Real-time categorization</div>
                                        </div>
                                     </div>
                                     <div className="text-green-400 bg-green-900/30 px-2 py-1 rounded text-[10px] font-bold">LIVE</div>
                                  </div>

                                  <div className="space-y-4">
                                     <div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                           <span>Infrastructure</span>
                                           <span>92%</span>
                                        </div>
                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                           <motion.div initial={{ width: 0 }} animate={{ width: "92%" }} transition={{ delay: 0.2, duration: 1 }} className="h-full bg-orange-500" />
                                        </div>
                                     </div>
                                     <div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                           <span>Services</span>
                                           <span>8%</span>
                                        </div>
                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                           <motion.div initial={{ width: 0 }} animate={{ width: "8%" }} transition={{ delay: 0.4, duration: 1 }} className="h-full bg-blue-500" />
                                        </div>
                                     </div>
                                  </div>

                                  <div className="mt-6 pt-4 border-t border-slate-700 flex items-center gap-3">
                                     <CheckCircle2 size={16} className="text-green-500" />
                                     <span className="text-xs text-slate-300">Approved for payment automatically.</span>
                                  </div>
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* --- BENTO GRID FEATURES (SPOTLIGHT & GRID) --- */}
        <section id="capabilities" className="py-20 relative bg-white/50">
           <GridPattern />
           <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
               
               {/* Feature 1: Large Box */}
               <SpotlightCard className="md:col-span-2 md:row-span-2 rounded-[32px] p-10">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Search size={240} className="text-orange-500" />
                  </div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                     <div>
                        <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6">
                           <Search size={28} />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-4">Semantic Search</h3>
                        <p className="text-slate-500 text-lg leading-relaxed font-medium">
                           Don't just match keywords. Understand the <i>intent</i> behind the query. Our vector-based engine retrieves contextually relevant results even when terms don't exactly match.
                        </p>
                     </div>
                  </div>
               </SpotlightCard>

               {/* Feature 2: Wide Box */}
               <motion.div 
                 whileHover={{ y: -5 }}
                 className="md:col-span-2 rounded-[32px] bg-slate-900 text-white p-10 relative overflow-hidden"
               >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 opacity-10" />
                  <div className="relative z-10 flex items-center justify-between h-full">
                     <div className="flex-1 pr-6">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                              <Brain size={24} className="text-orange-400" />
                           </div>
                           <h3 className="text-2xl font-bold">Neural Analysis</h3>
                        </div>
                        <p className="text-slate-400 text-lg font-medium">
                           Real-time entity extraction and sentiment classification running at the edge.
                        </p>
                     </div>
                  </div>
               </motion.div>

               {/* Feature 3: Small Box */}
               <SpotlightCard className="md:col-span-1 rounded-[32px] p-8">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                     <ShieldCheck size={28} />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">Role Security</h3>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Enterprise Grade</p>
                  </div>
               </SpotlightCard>

               {/* Feature 4: Small Box */}
               <SpotlightCard className="md:col-span-1 rounded-[32px] p-8 bg-gradient-to-br from-orange-50 to-amber-50">
                  <div className="w-12 h-12 rounded-2xl bg-white text-orange-600 flex items-center justify-center mb-4 shadow-sm">
                     <FileBarChart size={28} />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">Auto Reports</h3>
                     <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                        <div className="h-full w-2/3 bg-orange-500" />
                     </div>
                  </div>
               </SpotlightCard>
            </div>
          </div>
        </section>

        {/* --- ENTERPRISE SECURITY --- */}
        <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
            <div className="absolute -left-20 top-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]" />

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                <div className="flex flex-col lg:flex-row gap-16 items-center">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-900/30 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase mb-6">
                            <Lock size={12} /> Security First
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-6">Fortress-Grade <br/>Data Protection.</h2>
                        <p className="text-slate-400 text-lg leading-relaxed mb-8">
                            We don't just process data; we protect it. Your documents are encrypted at rest and in transit.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-6">
                             <div className="flex items-center gap-3 text-sm font-bold text-slate-200">
                                 <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" /> SOC2 Type II
                             </div>
                             <div className="flex items-center gap-3 text-sm font-bold text-slate-200">
                                 <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" /> GDPR Compliant
                             </div>
                             <div className="flex items-center gap-3 text-sm font-bold text-slate-200">
                                 <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" /> AES-256 Encryption
                             </div>
                             <div className="flex items-center gap-3 text-sm font-bold text-slate-200">
                                 <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" /> SSO Integration
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- USE CASES --- */}
        <section id="solutions" className="py-24">
           <div className="container mx-auto px-6 max-w-7xl">
              <div className="flex flex-col md:flex-row gap-12 items-start md:items-center mb-12">
                 <div className="flex-1">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Built for <span className="text-orange-600">Every Team.</span></h2>
                    <p className="text-slate-600 text-lg">Whether you are auditing contracts or analyzing candidate profiles, we have a model for you.</p>
                 </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 {[
                    { title: "Human Resources", icon: Users, text: "Resume parsing, candidate scoring, and bias detection in seconds.", bg: "bg-blue-50", color: "text-blue-600" },
                    { title: "Legal & Compliance", icon: Scale, text: "Contract review, clause extraction, and automated risk flagging.", bg: "bg-amber-50", color: "text-amber-600" },
                    { title: "Finance & Accounts", icon: Receipt, text: "Invoice processing, expense categorization, and anomaly detection.", bg: "bg-green-50", color: "text-green-600" },
                 ].map((card, idx) => (
                    <SpotlightCard 
                       key={idx}
                       className="p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40"
                    >
                       <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center mb-6`}>
                          <card.icon size={28} />
                       </div>
                       <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
                       <p className="text-slate-500 text-base font-medium leading-relaxed">{card.text}</p>
                    </SpotlightCard>
                 ))}
              </div>
           </div>
        </section>

      </main>

      <div className="relative z-50">
        <Footer />
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store";
import { TBSelector, LoginApi, RegisterApi, updateState, clearErrors } from "@/store/slices/TBSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ArrowRight, CheckCircle2, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import Kavachlogo from "@/assets/KavachLogo.png";
import { GlassCard, AnimatedBackground } from "@/components/common";
import { FormInput, FormPasswordInput, FormButton, FormAlert } from "@/components/form";

export default function Auth() {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    isLogin, isLoginFetching, 
    isRegister, isRegisterFetching,
    isError, errorMessage, successMessage 
  } = useSelector(TBSelector);
  
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [activeTab, setActiveTab] = useState("login");

  // Handle Login Success
  useEffect(() => {
    if (isLogin) {
      toast({ title: "Access Granted", description: successMessage || "Welcome back to Kavach." });
      dispatch(updateState({ isLogin: false }));
      navigate("/dashboard");
    }
  }, [isLogin, successMessage, navigate, toast, dispatch]);

  // Handle Register Success
  useEffect(() => {
    if (isRegister) {
      toast({ title: "Account Created", description: "Please log in to continue." });
      setLoginEmail(signupEmail);
      setSignupName(""); setSignupEmail(""); setSignupPassword("");
      setActiveTab("login");
      dispatch(updateState({ isRegister: false }));
    }
  }, [isRegister, signupEmail, toast, dispatch]);

  // Handle Errors
  useEffect(() => {
    if (isError && errorMessage) {
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      dispatch(clearErrors());
    }
  }, [isError, errorMessage, toast, dispatch]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    dispatch(LoginApi({ email: loginEmail, password: loginPassword }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    dispatch(RegisterApi({ name: signupName, email: signupEmail, password: signupPassword, role: "user" }));
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4 md:p-8 font-sans selection:bg-orange-200 selection:text-orange-900">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-5xl relative z-10"
      >
        <GlassCard className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] bg-white/70">
          
          {/* === Left Column: Form Section === */}
          <div className="flex flex-col justify-center p-8 md:p-12">
            <img
            src={Kavachlogo}
            className="h-16 w-auto ml-6 pb-2 object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
            alt="Kavach Logo"
          />    
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 border border-orange-100 rounded-xl p-1 mb-8">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm text-slate-500 font-bold transition-all">Login</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm text-slate-500 font-bold transition-all">Sign Up</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent key="login" value="login" className="mt-0 focus-visible:outline-none">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                    <div className="mb-6">
                      <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome back</h2>
                      <p className="text-slate-500 font-medium">Enter your credentials to decrypt your vault.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-5">
                      <FormInput
                        id="email"
                        type="email"
                        label="Email Address"
                        placeholder="name@company.com"
                        icon={Mail}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                      <FormPasswordInput
                        id="password"
                        label="Password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        forgotPasswordLink="/forgot_password"
                        required
                      />
                      {error && activeTab === "login" && (
                        <FormAlert type="error" message={error} />
                      )}
                      <FormButton
                        type="submit"
                        isLoading={isLoginFetching}
                        loadingText="Signing in..."
                        icon={ArrowRight}
                        fullWidth
                      >
                        Access Dashboard
                      </FormButton>
                    </form>
                  </motion.div>
                </TabsContent>

                <TabsContent key="signup" value="signup" className="mt-0 focus-visible:outline-none">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                    <div className="mb-6">
                      <h2 className="text-3xl font-black text-slate-900 mb-2">Initialize Account</h2>
                      <p className="text-slate-500 font-medium">Secure your digital workspace in seconds.</p>
                    </div>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <FormInput
                        id="fullname"
                        label="Full Name"
                        placeholder="John Doe"
                        icon={User}
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                      <FormInput
                        id="signup-email"
                        type="email"
                        label="Email Address"
                        placeholder="name@company.com"
                        icon={Mail}
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                      <FormPasswordInput
                        id="signup-password"
                        label="Password"
                        placeholder="Create a strong password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                      {error && activeTab === "signup" && (
                        <FormAlert type="error" message={error} />
                      )}
                      <FormButton
                        type="submit"
                        isLoading={isRegisterFetching}
                        loadingText="Creating Account..."
                        icon={CheckCircle2}
                        fullWidth
                      >
                        Create Secure Account
                      </FormButton>
                    </form>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </div>

          {/* === Right Column: Visual === */}
          <div className="relative hidden lg:flex flex-col items-center justify-center p-12 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-l border-orange-100">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            
            {/* Animated Circles */}
            <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
               transition={{ duration: 8, repeat: Infinity }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-orange-300 to-red-300 rounded-full blur-[80px] opacity-40"
            />

            <div className="relative z-10 text-center space-y-10">
              <div className="relative h-48 w-48 mx-auto">
                 {/* Floating Shield Graphic */}
                 <motion.div 
                   animate={{ y: [0, -15, 0] }}
                   transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                   className="relative z-10 w-full h-full bg-white/40 backdrop-blur-md rounded-[40px] border border-white/60 shadow-2xl shadow-orange-500/20 flex items-center justify-center"
                 >
                    <Shield className="w-20 h-20 text-orange-500" />
                 </motion.div>
                 
                 {/* Orbiting Elements */}
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                   className="absolute -inset-8 border border-orange-200 rounded-full border-dashed"
                 />
                 <motion.div 
                   animate={{ rotate: -360 }}
                   transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                   className="absolute -inset-16 border border-orange-100 rounded-full border-dashed opacity-60"
                 />
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                  Military-Grade <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                    Protection.
                  </span>
                </h3>
                <p className="text-slate-600 text-lg font-medium leading-relaxed">
                    Kavach ensures your documents are encrypted, processed efficiently, and always accessible.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
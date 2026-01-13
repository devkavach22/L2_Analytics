// ============================================
// RESET PASSWORD PAGE
// ============================================

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, LockKeyhole, CheckCircle2, ShieldCheck, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Kavachlogo from "@/assets/KavachLogo.png";
import Instance from "@/lib/axiosInstance";
import { AnimatedBackground, GlassCard } from "@/components/common";
import { FormPasswordInput, FormButton, FormAlert } from "@/components/form";

// --- REQUIREMENT ITEM COMPONENT ---
function RequirementItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${isValid ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors duration-300 ${isValid ? "bg-emerald-100 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
         {isValid ? <Check className="w-2.5 h-2.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
      </div>
      <span>{text}</span>
    </div>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || ""; 
  
  useEffect(() => {
    if (!email) {
      navigate("/forgot_password"); 
    }
  }, [email, navigate]);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(""); 
  
  const [newPasswordChecks, setNewPasswordChecks] = useState({
    minChars: false,
    firstUpper: false,
    hasNumber: false,
    hasSpecial: false,
    match: false,
  });
  
  const [strength, setStrength] = useState({ score: 0, label: "Weak", color: "bg-red-500" });

  useEffect(() => {
    const minChars = newPassword.length >= 8;
    const firstUpper = /^[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const match = newPassword === confirm && newPassword.length > 0;

    setNewPasswordChecks({ minChars, firstUpper, hasNumber, hasSpecial, match });

    let score = 0;
    if (minChars) score++;
    if (firstUpper) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    if (score <= 1) setStrength({ score, label: "Weak", color: "bg-red-500" });
    else if (score === 2) setStrength({ score, label: "Medium", color: "bg-amber-500" });
    else if (score >= 3) {
       if(newPassword.length >= 12) setStrength({ score, label: "Strong", color: "bg-emerald-500" });
       else setStrength({ score, label: "Good", color: "bg-emerald-400" });
    }
  }, [newPassword, confirm]);

  const isNewPasswordValid = Object.entries(newPasswordChecks)
    .filter(([key]) => key !== 'match')
    .every(([, value]) => value);

  const isFormValid = isNewPasswordValid && newPasswordChecks.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!isFormValid) return;

    try {
      setLoading(true);
      
      const payload = { 
        email: email, 
        newPassword: newPassword,
        confirmPassword: confirm
      };

      await Instance.post("/reset-password", payload);
      
      setLoading(false);
      setIsSubmitted(true);
      
      setTimeout(() => navigate("/auth"), 2000);

    } catch (err: any) {
      setLoading(false);
      
      let errorMsg = "An unexpected error occurred.";
      if (err.response) {
        errorMsg = err.response.data?.error || err.response.data?.message || `Server Error: ${err.response.status}`;
      } else {
        errorMsg = err.message;
      }
      setApiError(errorMsg);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden font-sans selection:bg-orange-200 selection:text-orange-900">
      <AnimatedBackground />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-lg relative z-10 px-4"
      >
        <GlassCard className="p-8 md:p-10 max-h-[95vh] overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center justify-center mb-6">
            <img src={Kavachlogo} alt="Kavach Logo" className="h-12 w-auto object-contain mb-6 drop-shadow-sm" />
            
            <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-300">
              {isSubmitted ? <ShieldCheck className="w-8 h-8 text-emerald-500" /> : <LockKeyhole className="w-8 h-8 text-orange-500" />}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Set New Password</h2>
                  <p className="text-slate-500 text-sm font-medium">Create a new strong password for <span className="text-orange-600 font-bold">{email}</span></p>
                </div>
                
                {apiError && <FormAlert type="error" message={apiError} className="mb-4" />}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <FormPasswordInput
                      id="new-password"
                      label="New Password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    
                    {newPassword && (
                      <div className="space-y-1 mt-2 px-1">
                         <div className="flex justify-between text-xs font-bold mb-1">
                            <span className={strength.score > 0 ? "text-slate-700" : "text-slate-400"}>Strength</span>
                            <span className={`${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(strength.score / 4) * 100}%` }}
                              className={`h-full ${strength.color} transition-all duration-300`} 
                            />
                         </div>
                      </div>
                    )}
                  </div>

                  <FormPasswordInput
                    id="confirm-password"
                    label="Re-Enter Password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    error={confirm.length > 0 && !newPasswordChecks.match ? "Passwords do not match" : undefined}
                    required
                  />

                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Requirements</p>
                    <RequirementItem isValid={newPasswordChecks.firstUpper} text="Starts with uppercase letter" />
                    <RequirementItem isValid={newPasswordChecks.hasNumber} text="Contains a number" />
                    <RequirementItem isValid={newPasswordChecks.hasSpecial} text="Contains special character" />
                    <RequirementItem isValid={newPasswordChecks.minChars} text="Min 8 characters long" />
                    <RequirementItem isValid={newPasswordChecks.match} text="Passwords match" />
                  </div>

                  <FormButton
                    type="submit"
                    isLoading={loading}
                    loadingText="Updating..."
                    variant="secondary"
                    fullWidth
                    disabled={!isFormValid || !!apiError}
                    className="mt-2"
                  >
                    Update Password
                  </FormButton>
                </form>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                  <div className="inline-flex p-4 rounded-full bg-emerald-100 mb-6 shadow-sm">
                    <CheckCircle2 className="w-16 h-16 text-emerald-600 drop-shadow-sm" />
                  </div>
                </motion.div>
                <h2 className="text-3xl text-slate-900 font-extrabold mt-2">Success!</h2>
                <p className="text-slate-500 font-medium mt-2">Your password has been securely updated.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center border-t border-slate-100 pt-6">
            <Link to="/auth" className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-600 transition-colors font-bold group text-sm">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

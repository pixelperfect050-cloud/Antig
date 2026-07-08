import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Mail, KeyRound, ShieldCheck, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const STEPS = { EMAIL: 1, OTP: 2, NEW_PASSWORD: 3 };
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resendTimer, setResendTimer] = useState(0);
  const [success, setSuccess] = useState(false);
  const otpRefs = useRef([]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ─── STEP 1: Send OTP ───
  const handleSendCode = async (e) => {
    e?.preventDefault();
    if (!email.trim()) { setErrors({ email: 'Email is required' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrors({ email: 'Enter a valid email' }); return; }
    setLoading(true);
    setErrors({});
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Verification code sent!');
      setStep(STEPS.OTP);
      setResendTimer(RESEND_COOLDOWN);
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP Input Handling ───
  const handleOtpChange = (idx, val) => {
    if (val && !/^\d$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    setErrors((p) => ({ ...p, otp: '' }));
    if (val && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split('').forEach((ch, i) => { newOtp[i] = ch; });
    setOtp(newOtp);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIdx]?.focus();
  };

  // ─── STEP 2: Verify OTP ───
  const handleVerifyCode = async (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) { setErrors({ otp: 'Enter the full 6-digit code' }); return; }
    setLoading(true);
    setErrors({});
    try {
      await api.post('/auth/verify-code', { email, code });
      toast.success('Code verified!');
      setStep(STEPS.NEW_PASSWORD);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
      setErrors({ otp: err.response?.data?.message || 'Invalid code' });
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 3: Reset Password ───
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!newPassword) errs.password = 'Password is required';
    else if (newPassword.length < 6) errs.password = 'Must be at least 6 characters';
    if (newPassword !== confirmPassword) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      const code = otp.join('');
      await api.post('/auth/reset-password', { email, code, newPassword });
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend Code ───
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('New code sent!');
      setOtp(Array(OTP_LENGTH).fill(''));
      setResendTimer(RESEND_COOLDOWN);
      otpRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step indicators ───
  const steps = [
    { num: 1, label: 'Email', icon: Mail },
    { num: 2, label: 'Verify', icon: KeyRound },
    { num: 3, label: 'Reset', icon: ShieldCheck },
  ];

  const inputClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-[10px] text-white placeholder-blue-200/60 text-sm outline-none transition-all duration-200 focus:border-[#F59E0B] focus:ring-2 focus:ring-amber-400/20";
  const inputErrorClass = "w-full px-4 py-3 bg-white/10 border border-red-400/60 rounded-[10px] text-white placeholder-blue-200/60 text-sm outline-none transition-all duration-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/20";
  const orangeBtn = "w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold text-sm rounded-[10px] transition-all duration-200 active:scale-[0.98] disabled:opacity-50";

  // ─── Success Screen ───
  if (success) {
    return (
      <div className="min-h-screen bg-[#1E3A8A] flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Password Reset!</h1>
          <p className="text-blue-200/70 text-sm mb-6">Redirecting you to login...</p>
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E3A8A] flex flex-col">
      {/* Logo */}
      <div className="p-6 lg:p-8">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <PenTool className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">ArtFlow Studio</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step >= s.num
                      ? 'bg-[#F59E0B] text-white shadow-lg shadow-amber-500/30'
                      : 'bg-white/10 text-blue-200/40'
                  }`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${
                    step >= s.num ? 'text-white' : 'text-blue-200/30'
                  }`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-12 h-0.5 rounded-full mb-5 transition-colors duration-300 ${
                    step > s.num ? 'bg-[#F59E0B]' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Back link */}
          <div className="mb-6">
            <button onClick={() => step === STEPS.EMAIL ? navigate('/login') : setStep((s) => s - 1)}
              className="inline-flex items-center gap-1.5 text-sm text-blue-200/50 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              {step === STEPS.EMAIL ? 'Back to Sign In' : 'Back'}
            </button>
          </div>

          <AnimatePresence mode="wait">

            {/* ─── STEP 1: Enter Email ─── */}
            {step === STEPS.EMAIL && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <h1 className="text-2xl font-bold text-white mb-1">Forgot Password?</h1>
                <p className="text-sm text-blue-200/70 mb-8">Enter your email and we'll send a verification code</p>

                <form onSubmit={handleSendCode}>
                  <div className="bg-[#243B82] rounded-2xl p-6 lg:p-8 space-y-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <div>
                      <label className="block text-sm font-medium text-blue-100 mb-1.5">Email Address</label>
                      <div className="relative">
                        <input type="email" value={email}
                          onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                          className={`${errors.email ? inputErrorClass : inputClass} pl-10`}
                          placeholder="you@company.com" autoFocus />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/40" />
                      </div>
                      {errors.email && <p className="text-[11px] text-red-300 mt-1">{errors.email}</p>}
                    </div>

                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      type="submit" disabled={loading} className={orangeBtn}>
                      {loading
                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Mail className="w-4 h-4" /> Send Verification Code</>}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ─── STEP 2: Enter OTP ─── */}
            {step === STEPS.OTP && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <h1 className="text-2xl font-bold text-white mb-1">Enter Verification Code</h1>
                <p className="text-sm text-blue-200/70 mb-1">We sent a 6-digit code to</p>
                <p className="text-sm text-[#F59E0B] font-medium mb-8">{email}</p>

                <form onSubmit={handleVerifyCode}>
                  <div className="bg-[#243B82] rounded-2xl p-6 lg:p-8 space-y-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>

                    {/* OTP Boxes */}
                    <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                      {otp.map((digit, idx) => (
                        <input key={idx} ref={(el) => (otpRefs.current[idx] = el)}
                          type="text" inputMode="numeric" maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className={`w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all duration-200 ${
                            digit
                              ? 'bg-[#F59E0B]/15 border-2 border-[#F59E0B] text-white'
                              : 'bg-white/10 border-2 border-white/15 text-white'
                          } focus:border-[#F59E0B] focus:ring-2 focus:ring-amber-400/20`}
                        />
                      ))}
                    </div>
                    {errors.otp && <p className="text-[11px] text-red-300 text-center">{errors.otp}</p>}

                    {/* Resend */}
                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <p className="text-xs text-blue-200/40">
                          Resend code in <span className="text-white font-medium">{resendTimer}s</span>
                        </p>
                      ) : (
                        <button type="button" onClick={handleResend} disabled={loading}
                          className="text-xs text-[#F59E0B] hover:text-amber-300 font-medium transition-colors">
                          Didn't receive the code? Resend
                        </button>
                      )}
                    </div>

                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      type="submit" disabled={loading} className={orangeBtn}>
                      {loading
                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><KeyRound className="w-4 h-4" /> Verify Code</>}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ─── STEP 3: New Password ─── */}
            {step === STEPS.NEW_PASSWORD && (
              <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <h1 className="text-2xl font-bold text-white mb-1">Set New Password</h1>
                <p className="text-sm text-blue-200/70 mb-8">Choose a strong password for your account</p>

                <form onSubmit={handleResetPassword}>
                  <div className="bg-[#243B82] rounded-2xl p-6 lg:p-8 space-y-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>

                    <div>
                      <label className="block text-sm font-medium text-blue-100 mb-1.5">New Password</label>
                      <div className="relative">
                        <input type={showPw ? 'text' : 'password'} value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                          className={`${errors.password ? inputErrorClass : inputClass} pr-11`}
                          placeholder="Min 6 characters" autoFocus />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200/50 hover:text-white transition-colors">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-[11px] text-red-300 mt-1">{errors.password}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-100 mb-1.5">Confirm Password</label>
                      <input type="password" value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirm: '' })); }}
                        className={errors.confirm ? inputErrorClass : inputClass}
                        placeholder="Re-enter password" />
                      {errors.confirm && <p className="text-[11px] text-red-300 mt-1">{errors.confirm}</p>}
                    </div>

                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      type="submit" disabled={loading} className={`${orangeBtn} !mt-6`}>
                      {loading
                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><ShieldCheck className="w-4 h-4" /> Reset Password</>}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}

          </AnimatePresence>

          <p className="mt-8 text-center text-xs text-blue-200/30">© 2024 ArtFlow Studio</p>
        </div>
      </div>
    </div>
  );
}

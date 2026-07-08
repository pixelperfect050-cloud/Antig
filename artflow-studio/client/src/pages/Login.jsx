import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { PenTool, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // Signup state embedded in right panel
  const [signupForm, setSignupForm] = useState({ name: '', company: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupShowPw, setSignupShowPw] = useState(false);
  const [signupErrors, setSignupErrors] = useState({});
  const updateSignup = (k) => (e) => setSignupForm((p) => ({ ...p, [k]: e.target.value }));
  const clearSignupError = (k) => () => setSignupErrors((p) => ({ ...p, [k]: '' }));
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!signupForm.name?.trim()) errs.name = 'Full name is required';
    if (!signupForm.email?.trim()) errs.email = 'Email is required';
    else if (!validateEmail(signupForm.email)) errs.email = 'Enter a valid email address';
    if (!signupForm.password) errs.password = 'Password is required';
    else if (signupForm.password.length < 6) errs.password = 'Must be at least 6 characters';
    if (signupForm.password !== signupForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setSignupErrors(errs); return; }
    setSignupLoading(true);
    setSignupErrors({});
    try {
      await signup(signupForm.name, signupForm.email, signupForm.password, signupForm.company, signupForm.phone);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Signup failed'); }
    finally { setSignupLoading(false); }
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[#111827] placeholder-gray-400 text-sm outline-none transition-all duration-200 focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-500/15";
  const inputErrorClass = "w-full px-4 py-3 bg-white border border-red-400 rounded-[10px] text-[#111827] placeholder-gray-400 text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/15";
  const loginInputClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-[10px] text-white placeholder-blue-200/60 text-sm outline-none transition-all duration-200 focus:border-[#F59E0B] focus:ring-2 focus:ring-amber-400/20";
  const loginInputErrorClass = "w-full px-4 py-3 bg-white/10 border border-red-400/60 rounded-[10px] text-white placeholder-blue-200/60 text-sm outline-none transition-all duration-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/20";
  const orangeBtn = "w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold text-sm rounded-[10px] transition-all duration-200 active:scale-[0.98] disabled:opacity-50";
  const errorMsg = "text-[11px] text-red-400 mt-1 text-left";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ─── LEFT: LOGIN (Dark Blue) ─── */}
      <div className="w-full lg:w-1/2 bg-[#1E3A8A] flex flex-col">
        {/* Logo */}
        <div className="p-6 lg:p-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <PenTool className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-display font-bold text-white">ArtFlow Studio</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-10 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="w-full max-w-sm">

            <h1 className="text-2xl font-display font-bold text-white mb-1">Welcome Back</h1>
            <p className="text-sm text-blue-200/70 mb-8">Sign in to access your dashboard</p>

            <form onSubmit={handleLogin}>
              <div className="bg-[#243B82] rounded-2xl p-6 lg:p-8 space-y-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                    className={errors.email ? loginInputErrorClass : loginInputClass} placeholder="you@company.com" />
                  {errors.email && <p className="text-[11px] text-red-300 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                      className={`${errors.password ? loginInputErrorClass : loginInputClass} pr-11`} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200/50 hover:text-white transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] text-red-300 mt-1">{errors.password}</p>}
                </div>

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-blue-200/50 hover:text-[#F59E0B] transition-colors">
                    Forgot Password?
                  </Link>
                </div>

                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading} className={`${orangeBtn} !mt-2`}>
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><LogIn className="w-4 h-4" /> Sign In</>}
                </motion.button>
              </div>
            </form>


            <p className="mt-6 text-center text-xs text-blue-200/30">© 2024 ArtFlow Studio</p>
          </motion.div>
        </div>
      </div>

      {/* ─── RIGHT: SIGNUP (Light) ─── */}
      <div className="flex-1 bg-[#F5F7FA] flex flex-col justify-center px-6 py-10 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-md mx-auto">

          <h2 className="text-xl font-display font-bold text-[#111827] mb-1">Don't have an account?</h2>
          <p className="text-sm text-gray-500 mb-8">Create your free account in seconds</p>

          <form onSubmit={handleSignup}>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-7 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Full Name <span className="text-red-400">*</span></label>
                  <input type="text" value={signupForm.name} onChange={(e) => { setSignupForm((p) => ({ ...p, name: e.target.value })); setSignupErrors((p) => ({ ...p, name: '' })); }} className={signupErrors.name ? inputErrorClass : inputClass} placeholder="John Doe" />
                  {signupErrors.name && <p className={errorMsg}>{signupErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Company</label>
                  <input type="text" value={signupForm.company} onChange={updateSignup('company')} className={inputClass} placeholder="Your company" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Phone</label>
                  <input type="tel" value={signupForm.phone} onChange={updateSignup('phone')} className={inputClass} placeholder="+1 (555) 000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Email <span className="text-red-400">*</span></label>
                  <input type="email" value={signupForm.email} onChange={(e) => { setSignupForm((p) => ({ ...p, email: e.target.value })); setSignupErrors((p) => ({ ...p, email: '' })); }} className={signupErrors.email ? inputErrorClass : inputClass} placeholder="you@company.com" />
                  {signupErrors.email && <p className={errorMsg}>{signupErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input type={signupShowPw ? 'text' : 'password'} value={signupForm.password} onChange={(e) => { setSignupForm((p) => ({ ...p, password: e.target.value })); setSignupErrors((p) => ({ ...p, password: '' })); }}
                      className={signupErrors.password ? `${inputErrorClass} pr-11` : `${inputClass} pr-11`} placeholder="Min 6 chars" />
                    <button type="button" onClick={() => setSignupShowPw(!signupShowPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {signupShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupErrors.password && <p className={errorMsg}>{signupErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Confirm <span className="text-red-400">*</span></label>
                  <input type="password" value={signupForm.confirmPassword} onChange={(e) => { setSignupForm((p) => ({ ...p, confirmPassword: e.target.value })); setSignupErrors((p) => ({ ...p, confirmPassword: '' })); }}
                    className={signupErrors.confirmPassword ? inputErrorClass : inputClass} placeholder="Re-enter" />
                  {signupErrors.confirmPassword && <p className={errorMsg}>{signupErrors.confirmPassword}</p>}
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={signupLoading} className={`${orangeBtn} !mt-5`}>
                {signupLoading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><UserPlus className="w-4 h-4" /> Create Account</>}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

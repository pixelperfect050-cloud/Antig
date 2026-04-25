import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { PenTool, Eye, EyeOff, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Signup state embedded in right panel
  const [signupForm, setSignupForm] = useState({ name: '', company: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupShowPw, setSignupShowPw] = useState(false);
  const { signup } = useAuth();
  const updateSignup = (k) => (e) => setSignupForm({ ...signupForm, [k]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupForm.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (signupForm.password !== signupForm.confirmPassword) return toast.error('Passwords do not match');
    setSignupLoading(true);
    try {
      await signup(signupForm.name, signupForm.email, signupForm.password, signupForm.company, signupForm.phone);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Signup failed'); }
    finally { setSignupLoading(false); }
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[#111827] placeholder-gray-400 text-sm outline-none transition-all duration-200 focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-500/15";
  const loginInputClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-[10px] text-white placeholder-blue-200/60 text-sm outline-none transition-all duration-200 focus:border-[#F59E0B] focus:ring-2 focus:ring-amber-400/20";
  const orangeBtn = "w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold text-sm rounded-[10px] transition-all duration-200 active:scale-[0.98] disabled:opacity-50";

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
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className={loginInputClass} placeholder="you@company.com" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      className={`${loginInputClass} pr-11`} placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200/50 hover:text-white transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading} className={`${orangeBtn} !mt-6`}>
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><LogIn className="w-4 h-4" /> Sign In</>}
                </motion.button>
              </div>
            </form>

            {/* Quick access for dev */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-xs text-blue-200/40 text-center mb-3">Quick access</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setEmail('admin@artflow.studio'); setPassword('admin123'); }}
                  className="text-xs text-blue-200/60 hover:text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-center transition-colors">
                  Admin Demo
                </button>
                <button type="button" onClick={() => { setEmail(''); setPassword(''); }}
                  className="text-xs text-blue-200/60 hover:text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-center transition-colors">
                  Clear
                </button>
              </div>
            </div>

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
                  <input type="text" value={signupForm.name} onChange={updateSignup('name')} className={inputClass} placeholder="John Doe" required />
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
                  <input type="email" value={signupForm.email} onChange={updateSignup('email')} className={inputClass} placeholder="you@company.com" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input type={signupShowPw ? 'text' : 'password'} value={signupForm.password} onChange={updateSignup('password')}
                      className={`${inputClass} pr-11`} placeholder="Min 6 chars" required />
                    <button type="button" onClick={() => setSignupShowPw(!signupShowPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {signupShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Confirm <span className="text-red-400">*</span></label>
                  <input type="password" value={signupForm.confirmPassword} onChange={updateSignup('confirmPassword')}
                    className={inputClass} placeholder="Re-enter" required />
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

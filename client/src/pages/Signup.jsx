import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { PenTool, Eye, EyeOff, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Login state embedded in right panel
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginShowPw, setLoginShowPw] = useState(false);
  const { login } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.company, form.phone);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Signup failed'); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
    finally { setLoginLoading(false); }
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[#111827] placeholder-gray-400 text-sm outline-none transition-all duration-200 focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-500/15";
  const loginInputClass = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-[10px] text-white placeholder-blue-200/60 text-sm outline-none transition-all duration-200 focus:border-[#F59E0B] focus:ring-2 focus:ring-amber-400/20";
  const orangeBtn = "w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold text-sm rounded-[10px] transition-all duration-200 active:scale-[0.98] disabled:opacity-50";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ─── LEFT: SIGNUP (Light) ─── */}
      <div className="flex-1 bg-[#F5F7FA] flex flex-col">
        {/* Logo */}
        <div className="p-6 lg:p-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center">
              <PenTool className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-display font-bold text-[#111827]">ArtFlow Studio</span>
          </Link>
        </div>

        {/* Signup Form */}
        <div className="flex-1 flex items-center justify-center px-6 pb-10 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="w-full max-w-md">

            <h1 className="text-2xl font-display font-bold text-[#111827] mb-1">Create Your Account</h1>
            <p className="text-sm text-gray-500 mb-8">Get started with your free ArtFlow account</p>

            <form onSubmit={handleSignup}>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

                {/* Row: Name + Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1.5">Full Name <span className="text-red-400">*</span></label>
                    <input type="text" value={form.name} onChange={update('name')} className={inputClass} placeholder="John Doe" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1.5">Company Name</label>
                    <input type="text" value={form.company} onChange={update('company')} className={inputClass} placeholder="Your company" />
                  </div>
                </div>

                {/* Row: Phone + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1.5">Phone</label>
                    <input type="tel" value={form.phone} onChange={update('phone')} className={inputClass} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1.5">Email <span className="text-red-400">*</span></label>
                    <input type="email" value={form.email} onChange={update('email')} className={inputClass} placeholder="you@company.com" required />
                  </div>
                </div>

                {/* Row: Password + Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1.5">Password <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} value={form.password} onChange={update('password')}
                        className={`${inputClass} pr-11`} placeholder="Min 6 characters" required />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1.5">Confirm Password <span className="text-red-400">*</span></label>
                    <input type="password" value={form.confirmPassword} onChange={update('confirmPassword')}
                      className={inputClass} placeholder="Re-enter password" required />
                  </div>
                </div>

                {/* Submit */}
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading} className={`${orangeBtn} !mt-6`}>
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><UserPlus className="w-4 h-4" /> Create Account</>}
                </motion.button>
              </div>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500 lg:hidden">
              Already have an account? <Link to="/login" className="text-[#1E3A8A] hover:underline font-medium">Sign in</Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* ─── RIGHT: LOGIN (Dark Blue) ─── */}
      <div className="w-full lg:w-[420px] xl:w-[460px] bg-[#1E3A8A] flex flex-col justify-center px-8 py-12 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>

          <h2 className="text-xl font-display font-bold text-white mb-1">Already have an account?</h2>
          <p className="text-sm text-blue-200/70 mb-8">Sign in to access your dashboard</p>

          <form onSubmit={handleLogin}>
            <div className="bg-[#243B82] rounded-2xl p-6 lg:p-7 space-y-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">Email</label>
                <input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className={loginInputClass} placeholder="you@company.com" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
                <div className="relative">
                  <input type={loginShowPw ? 'text' : 'password'} value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className={`${loginInputClass} pr-11`} placeholder="••••••••" required />
                  <button type="button" onClick={() => setLoginShowPw(!loginShowPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200/50 hover:text-white transition-colors">
                    {loginShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={loginLoading} className={`${orangeBtn} !mt-5`}>
                {loginLoading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><LogIn className="w-4 h-4" /> Sign In</>}
              </motion.button>
            </div>
          </form>

          {/* Quick access for dev */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-xs text-blue-200/40 text-center mb-3">Quick access</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setLoginForm({ email: 'admin@artflow.studio', password: 'admin123' })}
                className="text-xs text-blue-200/60 hover:text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-center transition-colors">
                Admin Demo
              </button>
              <button type="button" onClick={() => setLoginForm({ email: '', password: '' })}
                className="text-xs text-blue-200/60 hover:text-white bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-center transition-colors">
                Clear
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-blue-200/30">© 2024 ArtFlow Studio</p>
        </motion.div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, History, Gift, CheckCircle2, Star, Zap, ShoppingBag, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

export default function Rewards() {
  const { user, refreshUser } = useAuth();
  const [creditData, setCreditData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const { data } = await api.get('/credits');
        if (data.success) {
          setCreditData(data);
        }
      } catch (err) {
        console.error('Failed to fetch credits:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCredits();
    refreshUser(); // Also refresh auth context for latest credits
  }, []);

  const credits = creditData?.credits ?? user?.credits ?? 0;
  const totalEarned = creditData?.totalCreditsEarned ?? user?.totalCreditsEarned ?? 0;

  const earnOptions = [
    { title: 'Welcome Bonus', amount: 10, detail: 'Awarded on first signup', icon: Gift, color: 'text-pink-500', bg: 'bg-pink-50' },
    { title: 'Order Completion', amount: 20, detail: 'Per completed order', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'Loyalty Cashback', amount: '5%', detail: 'On every payment', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-5xl mx-auto">
      <motion.div variants={fade} className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900">Rewards & Benefits</h1>
        <p className="text-sm text-gray-500 mt-1">Earn coins and use them for discounts on your orders</p>
      </motion.div>

      {/* Main Balance Card */}
      <motion.div variants={fade} className="mb-8">
        <div className="relative overflow-hidden rounded-3xl p-8 text-white"
          style={{ background: 'linear-gradient(135deg, #0B1220 0%, #1a2744 100%)', boxShadow: '0 20px 40px rgba(11,18,32,0.2)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#ff7a18]/20 to-transparent rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full -ml-10 -mb-10 blur-2xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff7a18] to-[#ff5722] flex items-center justify-center shadow-lg shadow-orange-500/20">
                {loading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Coins className="w-8 h-8 text-white" />}
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Total Available Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-display font-black tracking-tight">{credits}</span>
                  <span className="text-lg text-orange-400 font-bold uppercase tracking-widest">Coins</span>
                </div>
              </div>
            </div>
            
            <div className="h-16 w-px bg-white/10 hidden md:block" />
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Lifetime Earned</p>
                <p className="text-xl font-display font-bold">{totalEarned} 🪙</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Rank</p>
                <p className="text-xl font-display font-bold flex items-center gap-2">
                  {totalEarned > 500 ? 'Platinum' : totalEarned > 200 ? 'Gold' : 'Silver'}
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <motion.div variants={fade} className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1E40AF]" /> How to Earn
            </h2>
            <div className="space-y-4">
              {earnOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl ${opt.bg} flex items-center justify-center flex-shrink-0`}>
                    <opt.icon className={`w-6 h-6 ${opt.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">{opt.title}</h3>
                    <p className="text-xs text-gray-500">{opt.detail}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-display font-black text-gray-900">+{opt.amount}</span>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Coins</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#1E40AF]" /> How to Use
            </h2>
            <div className="relative overflow-hidden rounded-2xl bg-blue-600 p-6 text-white">
              <div className="relative z-10">
                <p className="text-sm font-medium mb-2 opacity-90">Instant Discounts</p>
                <h3 className="text-xl font-display font-bold mb-4">1 ArtFlow Coin = ₹1 Discount</h3>
                <p className="text-sm leading-relaxed opacity-80 mb-6">
                  Apply your available coins during the payment step for any order. There's no minimum balance required to start saving!
                </p>
                <Link to="/orders" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl text-sm font-bold shadow-lg shadow-black/10 hover:bg-blue-50 transition-colors">
                  Go to Orders
                </Link>
              </div>
              <Coins className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10 -rotate-12" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fade} className="space-y-6">
          <div className="card p-6 h-full">
            <h2 className="text-lg font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-[#1E40AF]" /> History
            </h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-sm text-gray-400 font-medium">Transaction history coming soon</p>
              <p className="text-xs text-gray-300 mt-1">We're building this feature for you</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

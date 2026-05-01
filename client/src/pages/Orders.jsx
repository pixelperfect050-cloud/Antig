import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Download, Star, ChevronDown, ChevronUp, MessageSquare,
  CreditCard, CheckCircle2, Clock, AlertCircle, Coins, Loader2
} from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusBadge = {
  processing: 'badge badge-progress',
  ready: 'badge badge-completed',
  delivered: 'badge badge-review',
  archived: 'badge badge-pending'
};

const paymentBadge = {
  unpaid: 'bg-red-50 text-red-600',
  pending: 'bg-amber-50 text-amber-600',
  paid: 'bg-green-50 text-green-600',
  failed: 'bg-red-50 text-red-600',
  refunded: 'bg-purple-50 text-purple-600'
};

const paymentIcon = {
  unpaid: AlertCircle,
  pending: Clock,
  paid: CheckCircle2,
  failed: AlertCircle,
  refunded: AlertCircle
};

const fade = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

function Skeleton({ className }) {
  return <div className={`skeleton ${className}`} />;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 5, text: '' });
  const [paying, setPaying] = useState(null);
  const [credits, setCredits] = useState(0);
  const [useCreditsMode, setUseCreditsMode] = useState({});
  const [creditsToUse, setCreditsToUse] = useState({});

  useEffect(() => {
    api.get('/orders/user')
      .then(({ data }) => setOrders(data.orders))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
    api.get('/credits').then(({ data }) => setCredits(data.credits)).catch(() => {});
  }, []);

  useEffect(() => {
    socket.on('order-updated', (u) =>
      setOrders((p) => p.map((o) => (o._id === u._id ? u : o)))
    );
    return () => socket.off('order-updated');
  }, []);

  // Refresh credits on notification
  useEffect(() => {
    const handleNotif = (n) => {
      if (n.type === 'credits_earned' || n.type === 'credits_used') {
        api.get('/credits').then(({ data }) => setCredits(data.credits)).catch(() => {});
      }
    };
    socket.on('notification', handleNotif);
    return () => socket.off('notification', handleNotif);
  }, []);

  const handleDownload = async (orderId, filename) => {
    try {
      const r = await api.get(`/orders/${orderId}/download/${filename}`, {
        responseType: 'blob'
      });
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(r.data);
      a.download = filename;
      a.click();
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleFeedback = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/feedback`, {
        rating: feedback.rating,
        feedback: feedback.text
      });
      toast.success('Thanks for your feedback! ⭐');
      setOrders((p) =>
        p.map((o) =>
          o._id === orderId ? { ...o, rating: feedback.rating, feedback: feedback.text } : o
        )
      );
      setFeedback({ rating: 5, text: '' });
    } catch {
      toast.error('Feedback failed');
    }
  };

  const handleApplyCredits = async (orderId) => {
    const amount = creditsToUse[orderId] || 0;
    if (amount <= 0) return;
    try {
      const { data } = await api.post('/credits/use', { amount, reason: 'order_discount', orderId });
      toast.success(`🪙 ${amount} coins applied! New balance: ${data.credits}`);
      setCredits(data.credits);
      setUseCreditsMode((p) => ({ ...p, [orderId]: false }));
      
      // Update order in state
      if (data.order) {
        setOrders((p) => p.map((o) => o._id === orderId ? data.order : o));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply credits');
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (orderId) => {
    setPaying(orderId);
    try {
      const { data } = await api.post('/payments/create-order', { orderId });

      if (data.gateway === 'razorpay') {
        const loaded = await loadRazorpay();
        if (!loaded) return toast.error('Razorpay load failed');

        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: 'ArtFlow Studio',
          description: 'Job Payment',
          order_id: data.razorpayOrderId,
          handler: async (response) => {
            try {
              const verifyRes = await api.post('/payments/verify', {
                orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              if (verifyRes.data.success) {
                toast.success('Payment successful 🎉');
                setOrders((p) => p.map((o) => o._id === orderId ? { ...o, paymentStatus: 'paid' } : o));
              }
            } catch {
              toast.error('Verification failed');
            }
          },
          theme: { color: '#ff7a18' }
        };
        new window.Razorpay(options).open();
      } else if (data.gateway === 'demo') {
        const confirmPay = window.confirm(`Demo Payment\n₹${data.amount}\n\nOK = Success`);
        if (confirmPay) {
          const verifyRes = await api.post('/payments/verify', { orderId, demoPaymentId: data.demoPaymentId });
          if (verifyRes.data.success) {
            toast.success('Payment successful 🎉');
            setOrders((p) => p.map((o) => o._id === orderId ? { ...o, paymentStatus: 'paid' } : o));
          }
        }
      } else {
        toast.success('Order marked as paid');
        setOrders((p) => p.map((o) => o._id === orderId ? { ...o, paymentStatus: 'paid' } : o));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(null);
    }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Track deliveries and manage payments</p>
        </div>
        {credits > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-100"
            style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFFBEB)' }}>
            <Coins className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-700">{credits} coins available</span>
          </div>
        )}
      </motion.div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <motion.div variants={fade} className="card p-16 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Orders will appear here when jobs are completed.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {orders.map((o, idx) => {
            const PayIcon = paymentIcon[o.paymentStatus] || AlertCircle;
            const isExpanded = expanded === o._id;

            return (
              <motion.div
                key={o._id}
                variants={fade}
                layout
                className="card overflow-hidden"
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : o._id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      o.status === 'ready' ? 'bg-green-50' : o.status === 'delivered' ? 'bg-blue-50' : 'bg-orange-50'
                    }`}>
                      <Package className={`w-5 h-5 ${
                        o.status === 'ready' ? 'text-green-600' : o.status === 'delivered' ? 'text-blue-600' : 'text-orange-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{o.jobId?.title || 'Order'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(o.createdAt), 'MMM d, yyyy')}
                        {o.amount > 0 && <> · <span className="font-medium text-gray-600">₹{o.amount}</span></>}
                        {o.discountAmount > 0 && (
                          <> · <span className="text-amber-600 font-bold">-₹{o.discountAmount}</span> <span className="text-[10px] text-amber-500 font-bold">(🪙 {o.discountAmount})</span></>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${paymentBadge[o.paymentStatus]}`}>
                      <PayIcon className="w-3 h-3" />
                      {o.paymentStatus}
                    </span>
                    <span className={statusBadge[o.status]}>{o.status}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-5 space-y-4">

                        {/* Payment Section */}
                        {o.amount > 0 && o.paymentStatus !== 'paid' && (
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">Payment Required</p>
                                <p className="text-xs text-gray-500">Amount: ₹{o.amount}</p>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handlePayment(o._id)}
                                disabled={paying === o._id}
                                className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #ff7a18, #ff5722)', boxShadow: '0 4px 12px rgba(255,87,34,0.3)' }}
                              >
                                {paying === o._id ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><CreditCard className="w-4 h-4" /> Pay Now</>}
                              </motion.button>
                            </div>

                            {/* Use Credits */}
                            {credits > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                {!useCreditsMode[o._id] ? (
                                  <button
                                    onClick={() => setUseCreditsMode((p) => ({ ...p, [o._id]: true }))}
                                    className="flex items-center gap-2 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                                  >
                                    <Coins className="w-3.5 h-3.5" />
                                    Use coins for discount ({credits} available)
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 flex-1">
                                      <Coins className="w-4 h-4 text-amber-500" />
                                      <input
                                        type="number"
                                        min="1"
                                        max={credits}
                                        value={creditsToUse[o._id] || ''}
                                        onChange={(e) => setCreditsToUse((p) => ({ ...p, [o._id]: Math.min(parseInt(e.target.value) || 0, credits) }))}
                                        className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-400">/ {credits}</span>
                                    </div>
                                    <button
                                      onClick={() => handleApplyCredits(o._id)}
                                      className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
                                    >
                                      Apply
                                    </button>
                                    <button
                                      onClick={() => setUseCreditsMode((p) => ({ ...p, [o._id]: false }))}
                                      className="text-xs text-gray-400 hover:text-gray-600"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Paid Success */}
                        {o.paymentStatus === 'paid' && (
                          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Payment completed</span>
                          </div>
                        )}

                        {/* Delivery Files */}
                        {o.deliveryFiles?.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-900 mb-2">Delivery Files</p>
                            <div className="space-y-2">
                              {o.deliveryFiles.map((f) => (
                                <motion.button
                                  key={f.filename}
                                  whileHover={{ x: 4 }}
                                  onClick={() => handleDownload(o._id, f.filename)}
                                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl text-left hover:bg-blue-100 transition-colors group"
                                >
                                  <Download className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-blue-700 truncate">{f.originalName}</p>
                                    <p className="text-[10px] text-blue-400">{(f.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Feedback Section */}
                        {o.status === 'delivered' && !o.rating && (
                          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50">
                            <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-amber-600" /> Leave a Review
                            </p>
                            <div className="flex gap-1 mb-3">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <motion.button
                                  key={s}
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setFeedback((p) => ({ ...p, rating: s }))}
                                >
                                  <Star className={`w-6 h-6 transition-colors ${s <= feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                                </motion.button>
                              ))}
                            </div>
                            <textarea
                              value={feedback.text}
                              onChange={(e) => setFeedback((p) => ({ ...p, text: e.target.value }))}
                              placeholder="Share your experience..."
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
                            />
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleFeedback(o._id)}
                              className="mt-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                            >
                              Submit Review
                            </motion.button>
                          </div>
                        )}

                        {/* Show existing rating */}
                        {o.rating && (
                          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50/50 rounded-xl">
                            <div className="flex gap-0.5">
                              {[...Array(o.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">Your review</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
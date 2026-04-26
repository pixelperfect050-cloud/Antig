import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Download, Star, ChevronDown, ChevronUp, MessageSquare, CreditCard, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusBadge = { processing: 'badge badge-progress', ready: 'badge badge-completed', delivered: 'badge badge-review', archived: 'badge badge-pending' };
const paymentBadge = { unpaid: 'bg-red-50 text-red-600', pending: 'bg-amber-50 text-amber-600', paid: 'bg-green-50 text-green-600', failed: 'bg-red-50 text-red-600', refunded: 'bg-purple-50 text-purple-600' };
const paymentIcon = { unpaid: AlertCircle, pending: Clock, paid: CheckCircle2, failed: AlertCircle, refunded: AlertCircle };
function Skeleton({ className }) { return <div className={`skeleton ${className}`} />; }

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 5, text: '' });
  const [paying, setPaying] = useState(null);

  useEffect(() => { api.get('/orders/user').then(({ data }) => setOrders(data.orders)).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { socket.on('order-updated', (u) => setOrders((p) => p.map((o) => (o._id === u._id ? u : o)))); return () => socket.off('order-updated'); }, []);

  const handleDownload = async (orderId, filename) => {
    try { const r = await api.get(`/orders/${orderId}/download/${filename}`, { responseType: 'blob' }); const a = document.createElement('a'); a.href = window.URL.createObjectURL(r.data); a.download = filename; a.click(); toast.success('Download started'); } catch { toast.error('Download failed'); }
  };
  const handleFeedback = async (orderId) => {
    try { await api.post(`/orders/${orderId}/feedback`, { rating: feedback.rating, feedback: feedback.text }); toast.success('Thanks for your feedback!'); setOrders((p) => p.map((o) => (o._id === orderId ? { ...o, rating: feedback.rating } : o))); setExpanded(null); } catch { toast.error('Failed'); }
  };

  const handlePayment = async (orderId) => {
    setPaying(orderId);
    try {
      const { data } = await api.post('/payments/create-order', { orderId });

      if (data.gateway === 'razorpay') {
        // Load Razorpay script if not loaded
        if (!window.Razorpay) {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          document.body.appendChild(script);
          await new Promise((resolve) => { script.onload = resolve; });
        }

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
                razorpay_signature: response.razorpay_signature,
              });
              if (verifyRes.data.success) {
                toast.success('Payment successful! 🎉');
                setOrders((p) => p.map((o) => (o._id === orderId ? { ...o, paymentStatus: 'paid' } : o)));
              }
            } catch { toast.error('Payment verification failed'); }
          },
          theme: { color: '#1E40AF' },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else if (data.gateway === 'demo') {
        // Demo mode — simulate payment
        const confirm = window.confirm(`Demo Payment\n\nAmount: ₹${data.amount}\nOrder: ${data.orderId}\n\nClick OK to simulate successful payment.`);
        if (confirm) {
          const verifyRes = await api.post('/payments/verify', {
            orderId,
            demoPaymentId: data.demoPaymentId,
          });
          if (verifyRes.data.success) {
            toast.success('Payment successful! 🎉');
            setOrders((p) => p.map((o) => (o._id === orderId ? { ...o, paymentStatus: 'paid' } : o)));
          }
        }
      } else {
        // Free order
        toast.success(data.message || 'Order marked as paid!');
        setOrders((p) => p.map((o) => (o._id === orderId ? { ...o, paymentStatus: 'paid' } : o)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8"><h1 className="text-2xl font-display font-bold text-gray-900">Orders</h1><p className="text-sm text-gray-500 mt-1">Download completed files, pay for services, and leave feedback</p></div>
      {loading ? <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      : orders.length === 0 ? <div className="card p-16 text-center"><Package className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No orders yet.</p></div>
      : (
        <div className="space-y-3">{orders.map((o) => {
          const PayIcon = paymentIcon[o.paymentStatus] || AlertCircle;
          return (
          <div key={o._id} className="card overflow-hidden">
            <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(expanded === o._id ? null : o._id)}>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 truncate">{o.jobId?.title || 'Order'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{format(new Date(o.createdAt), 'MMM d, yyyy')}{o.amount > 0 && <span className="ml-2 font-medium text-gray-600">₹{o.amount}</span>}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${paymentBadge[o.paymentStatus] || paymentBadge.unpaid}`}>
                  <PayIcon className="w-3 h-3" />{o.paymentStatus || 'unpaid'}
                </span>
                <span className={statusBadge[o.status]}>{o.status}</span>
              </div>
              {expanded === o._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
            {expanded === o._id && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-gray-100 p-5 space-y-4">
                {/* Payment Section */}
                {o.amount > 0 && o.paymentStatus !== 'paid' && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Payment Required</p>
                        <p className="text-2xl font-bold text-[#1E40AF] mt-1">₹{o.amount}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePayment(o._id); }}
                        disabled={paying === o._id}
                        className="btn-primary flex items-center gap-2 !px-6 !py-3"
                      >
                        {paying === o._id ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><CreditCard className="w-4 h-4" /> Pay Now</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {o.paymentStatus === 'paid' && (
                  <div className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">Payment Complete</span>
                    {o.paymentId && <span className="text-xs text-green-500 ml-auto">ID: {o.paymentId.slice(0, 16)}...</span>}
                  </div>
                )}

                {o.deliveryNotes && <p className="text-sm text-gray-500"><span className="font-medium text-gray-700">Notes:</span> {o.deliveryNotes}</p>}
                {o.deliveryFiles?.length > 0 && <div><p className="text-sm font-medium text-gray-700 mb-3">Delivery Files</p>{o.deliveryFiles.map((f) => (
                  <div key={f.filename} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-2"><span className="text-sm text-gray-700 truncate flex-1">{f.originalName}</span><button onClick={() => handleDownload(o._id, f.filename)} className="btn-primary !px-4 !py-2 text-xs flex items-center gap-1.5 ml-3"><Download className="w-3.5 h-3.5" /> Download</button></div>
                ))}</div>}
                {!o.rating && o.status !== 'processing' && <div className="pt-3 border-t border-gray-100"><p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Leave Feedback</p><div className="flex gap-1 mb-3">{[1,2,3,4,5].map((n) => <button key={n} onClick={() => setFeedback({...feedback, rating: n})}><Star className={`w-5 h-5 ${n <= feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} /></button>)}</div><textarea value={feedback.text} onChange={(e) => setFeedback({...feedback, text: e.target.value})} className="input-field min-h-[60px] resize-y mb-3" placeholder="How was the quality?" /><button onClick={() => handleFeedback(o._id)} className="btn-primary text-sm !px-5 !py-2.5">Submit</button></div>}
                {o.rating && <div className="flex items-center gap-2 pt-3 border-t border-gray-100"><span className="text-sm text-gray-500">Your rating:</span>{[1,2,3,4,5].map((n) => <Star key={n} className={`w-4 h-4 ${n <= o.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />)}</div>}
              </motion.div>
            )}
          </div>
        )})}</div>
      )}
    </motion.div>
  );
}

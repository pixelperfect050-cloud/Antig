import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Download, Star, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusBadge = { processing: 'badge badge-progress', ready: 'badge badge-completed', delivered: 'badge badge-review', archived: 'badge badge-pending' };
function Skeleton({ className }) { return <div className={`skeleton ${className}`} />; }

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 5, text: '' });

  useEffect(() => { api.get('/orders/user').then(({ data }) => setOrders(data.orders)).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { socket.on('order-updated', (u) => setOrders((p) => p.map((o) => (o._id === u._id ? u : o)))); return () => socket.off('order-updated'); }, []);

  const handleDownload = async (orderId, filename) => {
    try { const r = await api.get(`/orders/${orderId}/download/${filename}`, { responseType: 'blob' }); const a = document.createElement('a'); a.href = window.URL.createObjectURL(r.data); a.download = filename; a.click(); toast.success('Download started'); } catch { toast.error('Download failed'); }
  };
  const handleFeedback = async (orderId) => {
    try { await api.post(`/orders/${orderId}/feedback`, { rating: feedback.rating, feedback: feedback.text }); toast.success('Thanks for your feedback!'); setOrders((p) => p.map((o) => (o._id === orderId ? { ...o, rating: feedback.rating } : o))); setExpanded(null); } catch { toast.error('Failed'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8"><h1 className="text-2xl font-display font-bold text-gray-900">Orders</h1><p className="text-sm text-gray-500 mt-1">Download completed files and leave feedback</p></div>
      {loading ? <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      : orders.length === 0 ? <div className="card p-16 text-center"><Package className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No orders yet.</p></div>
      : (
        <div className="space-y-3">{orders.map((o) => (
          <div key={o._id} className="card overflow-hidden">
            <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(expanded === o._id ? null : o._id)}>
              <div className="flex-1 min-w-0"><h3 className="font-medium text-sm text-gray-900 truncate">{o.jobId?.title || 'Order'}</h3><p className="text-xs text-gray-400 mt-0.5">{format(new Date(o.createdAt), 'MMM d, yyyy')}</p></div>
              <span className={statusBadge[o.status]}>{o.status}</span>
              {expanded === o._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
            {expanded === o._id && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-gray-100 p-5 space-y-4">
                {o.deliveryNotes && <p className="text-sm text-gray-500"><span className="font-medium text-gray-700">Notes:</span> {o.deliveryNotes}</p>}
                {o.deliveryFiles?.length > 0 && <div><p className="text-sm font-medium text-gray-700 mb-3">Delivery Files</p>{o.deliveryFiles.map((f) => (
                  <div key={f.filename} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-2"><span className="text-sm text-gray-700 truncate flex-1">{f.originalName}</span><button onClick={() => handleDownload(o._id, f.filename)} className="btn-primary !px-4 !py-2 text-xs flex items-center gap-1.5 ml-3"><Download className="w-3.5 h-3.5" /> Download</button></div>
                ))}</div>}
                {!o.rating && o.status !== 'processing' && <div className="pt-3 border-t border-gray-100"><p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Leave Feedback</p><div className="flex gap-1 mb-3">{[1,2,3,4,5].map((n) => <button key={n} onClick={() => setFeedback({...feedback, rating: n})}><Star className={`w-5 h-5 ${n <= feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} /></button>)}</div><textarea value={feedback.text} onChange={(e) => setFeedback({...feedback, text: e.target.value})} className="input-field min-h-[60px] resize-y mb-3" placeholder="How was the quality?" /><button onClick={() => handleFeedback(o._id)} className="btn-primary text-sm !px-5 !py-2.5">Submit</button></div>}
                {o.rating && <div className="flex items-center gap-2 pt-3 border-t border-gray-100"><span className="text-sm text-gray-500">Your rating:</span>{[1,2,3,4,5].map((n) => <Star key={n} className={`w-4 h-4 ${n <= o.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />)}</div>}
              </motion.div>
            )}
          </div>
        ))}</div>
      )}
    </motion.div>
  );
}

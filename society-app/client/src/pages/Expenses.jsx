import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import api from '../utils/api';

const CATEGORIES = [
  { value: 'electricity', label: 'Electricity', icon: '⚡' },
  { value: 'lift', label: 'Lift', icon: '🛗' },
  { value: 'security', label: 'Security', icon: '🛡️' },
  { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { value: 'gardening', label: 'Gardening', icon: '🌿' },
  { value: 'repairs', label: 'Repairs', icon: '🔨' },
  { value: 'water', label: 'Water', icon: '💧' },
  { value: 'misc', label: 'Miscellaneous', icon: '📦' }
];

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    category: 'electricity', description: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: ''
  });
  const [saving, setSaving] = useState(false);
  const [catFilter, setCatFilter] = useState('all');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const sid = user?.societyId?._id || user?.societyId;
      if (!sid) return;
      const data = await api.get(`/api/expenses/society/${sid}`);
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const sid = user?.societyId?._id || user?.societyId;
      if (editingExpense) {
        await api.put(`/api/expenses/${editingExpense._id}`, formData);
      } else {
        await api.post('/api/expenses', { ...formData, societyId: sid });
      }
      setShowModal(false);
      setEditingExpense(null);
      setFormData({ category: 'electricity', description: '', amount: '', date: new Date().toISOString().split('T')[0], vendor: '' });
      fetchExpenses();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: new Date(expense.date).toISOString().split('T')[0],
      vendor: expense.vendor || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/api/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const filtered = catFilter === 'all' ? expenses : expenses.filter(e => e.category === catFilter);
  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  const getCategoryInfo = (cat) => CATEGORIES.find(c => c.value === cat) || { icon: '📦', label: cat };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track & manage society spending</p>
        </div>
        {isAdmin && (
          <button className="btn btn--primary btn--sm mt-2 sm:mt-0" onClick={() => { setEditingExpense(null); setShowModal(true); }}>
            ➕ Add Expense
          </button>
        )}
      </header>

      {/* Responsive Category Filter */}
      <div className="card mb-6 overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar p-2 gap-2 bg-slate-50/50">
          <button 
            className={`whitespace-now-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 ${catFilter === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-secondary border border-slate-200'}`}
            onClick={() => setCatFilter('all')}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat.value} 
              className={`whitespace-now-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 ${catFilter === cat.value ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-secondary border border-slate-200'}`}
              onClick={() => setCatFilter(cat.value)}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stat Card */}
      <div className="stats-card stats-card--primary mb-6">
        <div className="stats-card__icon">📊</div>
        <div className="stats-card__content">
          <span className="stats-card__label">Total {catFilter === 'all' ? '' : catFilter} Expenses</span>
          <div className="flex items-baseline gap-2">
            <span className="stats-card__value text-2xl">{formatCurrency(totalAmount)}</span>
            <span className="text-[10px] font-bold text-secondary uppercase">{filtered.length} entries</span>
          </div>
        </div>
      </div>

      {/* Premium Expense List */}
      <div className="flex flex-col gap-3">
        {filtered.map(expense => {
          const catInfo = getCategoryInfo(expense.category);
          return (
            <div key={expense._id} className="card group hover:border-primary transition-all">
              <div className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-2xl flex items-center justify-center shrink-0 group-hover:bg-primary-light transition-colors">
                  {catInfo.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-black text-slate-900 truncate pr-2">
                      {expense.description}
                    </h3>
                    <span className="text-sm font-black text-primary shrink-0">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-secondary uppercase tracking-widest">
                    <span className="text-primary">{catInfo.label}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{new Date(expense.date).toLocaleDateString('en-IN')}</span>
                    {expense.vendor && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="truncate max-w-[100px]">{expense.vendor}</span>
                      </>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs hover:bg-primary hover:text-white transition-colors" onClick={() => handleEdit(expense)}>✏️</button>
                    <button className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center text-xs hover:bg-rose-500 hover:text-white transition-colors" onClick={() => handleDelete(expense._id)}>🗑️</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {filtered.length === 0 && (
          <div className="empty-state p-20">
            <div className="text-6xl mb-6">💸</div>
            <h2 className="text-xl font-black mb-2">No Expenses</h2>
            <p className="text-secondary">No recorded expenses found for this category.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal - Standardized */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingExpense(null); }}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} className="modal-form p-4">
          <div className="grid gap-4">
            <div className="form-group">
              <label>Category</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="e.g., Electricity Bill" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>Amount (₹)</label>
                <input type="number" min="1" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
              </div>
            </div>

            <div className="form-group">
              <label>Vendor (Optional)</label>
              <input type="text" value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })} placeholder="e.g., BESCOM" />
            </div>
          </div>

          <div className="modal-actions mt-8">
            <button type="button" className="btn btn--secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary flex-1" disabled={saving}>
              {saving ? <span className="btn-spinner"></span> : (editingExpense ? 'Update' : 'Add Expense')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
    </div>
  );
};

export default Expenses;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenTool, Layers, ImageIcon, Zap, FileType, HelpCircle, Send } from 'lucide-react';
import FileUpload from '../components/shared/FileUpload';
import api from '../services/api';
import toast from 'react-hot-toast';

const serviceTypes = [
  { value: 'vector-tracing', label: 'Vector Tracing', icon: PenTool },
  { value: 'embroidery-digitizing', label: 'Embroidery Digitizing', icon: Layers },
  { value: 'logo-design', label: 'Logo Design', icon: ImageIcon },
  { value: 'image-editing', label: 'Image Editing', icon: Zap },
  { value: 'format-conversion', label: 'Format Conversion', icon: FileType },
  { value: 'other', label: 'Other', icon: HelpCircle },
];
const priorities = [
  { value: 'low', label: 'Low', active: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'normal', label: 'Normal', active: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'high', label: 'High', active: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'urgent', label: 'Urgent', active: 'bg-red-50 text-red-700 border-red-200' },
];

export default function CreateJob() {
  const [form, setForm] = useState({ title: '', description: '', serviceType: '', instructions: '', priority: 'normal' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.serviceType) return toast.error('Select a service type');
    if (!form.title.trim()) return toast.error('Enter a job title');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('files', f));
      await api.post('/jobs/create', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Job submitted!');
      navigate('/jobs');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900">New Job</h1>
        <p className="text-sm text-gray-500 mt-1">Submit your artwork for professional processing</p>
      </div>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Service Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {serviceTypes.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => setForm({ ...form, serviceType: value })}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${form.serviceType === value ? 'bg-blue-50 border-blue-200 text-[#1E40AF]' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <Icon className="w-4 h-4" /><span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label><input type="text" value={form.title} onChange={update('title')} className="input-field" placeholder="e.g. Logo vectorization" required /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Description</label><textarea value={form.description} onChange={update('description')} className="input-field min-h-[100px] resize-y" placeholder="Describe what you need..." /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label><textarea value={form.instructions} onChange={update('instructions')} className="input-field min-h-[80px] resize-y" placeholder="Formats, colors, sizes..." /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-3">Priority</label>
          <div className="flex flex-wrap gap-2">{priorities.map(({ value, label, active }) => (
            <button key={value} type="button" onClick={() => setForm({ ...form, priority: value })} className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${form.priority === value ? active : 'border-gray-200 text-gray-500 bg-white'}`}>{label}</button>
          ))}</div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-3">Upload Files</label><FileUpload files={files} setFiles={setFiles} /></div>
        <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Submit Job</>}
        </button>
      </form>
    </motion.div>
  );
}

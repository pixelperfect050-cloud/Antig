import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, ArrowRight, Send, Loader2, CheckCircle2, Upload, ArrowLeft, FileText, X, Image, Link2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const serviceOptions = [
  'Vector Tracing',
  'Embroidery Digitizing',
  'Logo Design',
  'Format Conversion',
  'Virtual Sample / Proof',
  'Catalog & Flyer Design',
  'Branding Package',
  'Custom / Other',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file
const MAX_FILES = 2;

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function RequestQuote() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    service: '', description: '', fileLink: '',
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    const validFiles = [];
    const errors = [];

    newFiles.forEach(file => {
      if (files.length + validFiles.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} files allowed`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds 20MB limit. Please use the link option to share large files.`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length) {
      errors.forEach(e => toast.error(e));
      if (validFiles.length === 0 && files.length === 0) {
        setShowLinkInput(true);
      }
    }

    if (validFiles.length) {
      setFiles(prev => [...prev, ...validFiles]);
      // Generate previews
      validFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviews(prev => [...prev, { name: file.name, url: e.target.result, type: 'image' }]);
          };
          reader.readAsDataURL(file);
        } else {
          setPreviews(prev => [...prev, { name: file.name, url: null, type: 'file' }]);
        }
      });
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.service || !form.description) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('company', form.company);
      formData.append('service', form.service);
      formData.append('description', form.description);
      formData.append('fileLink', form.fileLink);
      files.forEach(f => formData.append('files', f));

      await api.post('/quotes/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
      toast.success('Quote request submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setForm({ name: '', email: '', phone: '', company: '', service: '', description: '', fileLink: '' });
    setFiles([]);
    setPreviews([]);
    setShowLinkInput(false);
  };

  const inputClass = "w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm outline-none transition-all duration-200 focus:border-[#ff7a18] focus:ring-2 focus:ring-orange-500/15";

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-[72px]">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff7a18] flex items-center justify-center shadow-md shadow-orange-200">
              <PenTool className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-display font-bold text-[#0B1220]">ArtFlow Studio</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0B1220] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-display font-bold text-[#0B1220] mb-3">Quote Request Submitted!</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                Thank you for reaching out. Our team will review your request and get back to you within 2-4 hours with a detailed quote.
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/" className="btn-pill btn-pill-outline !py-3 !px-6 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
                <button onClick={resetForm}
                  className="btn-pill btn-pill-primary !py-3 !px-6 text-sm">
                  Submit Another <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Header */}
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-10 h-[2px] bg-[#ff7a18]" />
                  <span className="text-sm font-semibold uppercase tracking-widest text-[#ff7a18]">Free Quote</span>
                  <div className="w-10 h-[2px] bg-[#ff7a18]" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1220] mb-3">Request a Quote</h1>
                <p className="text-gray-500 max-w-lg mx-auto">
                  It's free, fast and with zero obligations. Fill out the form below and we'll get in touch with you as soon as possible.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-3xl border border-gray-100 p-8 sm:p-10" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left column */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                          <FileText className="w-3.5 h-3.5 inline mr-1.5 text-[#ff7a18]" />
                          Select Service <span className="text-red-400">*</span>
                        </label>
                        <select value={form.service} onChange={update('service')} className={inputClass} required>
                          <option value="">Please Select Service</option>
                          {serviceOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                          Tell us about your project <span className="text-red-400">*</span>
                        </label>
                        <textarea value={form.description} onChange={update('description')}
                          rows={5} className={`${inputClass} resize-none`}
                          placeholder="Describe what you would like quoted — include dimensions, colors, file formats needed, quantity, etc."
                          required />
                      </div>

                      {/* ─── Image Upload Area ─── */}
                      <div>
                        <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                          <Image className="w-3.5 h-3.5 inline mr-1.5 text-[#ff7a18]" />
                          Upload Reference Images
                          <span className="text-xs font-normal text-gray-400 ml-2">(optional · max 20MB each)</span>
                        </label>

                        {/* Drop Zone */}
                        <div
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => files.length < MAX_FILES && fileInputRef.current?.click()}
                          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                            dragActive
                              ? 'border-[#ff7a18] bg-orange-50/60 scale-[1.01]'
                              : files.length >= MAX_FILES
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-200 bg-gray-50/50 hover:border-[#ff7a18]/50 hover:bg-orange-50/30'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.ai,.eps,.svg,.psd,.cdr"
                            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
                            className="hidden"
                          />
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                              dragActive ? 'bg-[#ff7a18]/10' : 'bg-gray-100'
                            }`}>
                              <Upload className={`w-5 h-5 ${dragActive ? 'text-[#ff7a18]' : 'text-gray-400'}`} />
                            </div>
                            {files.length >= MAX_FILES ? (
                              <p className="text-xs text-gray-400">Maximum {MAX_FILES} files reached</p>
                            ) : (
                              <>
                                <p className="text-sm text-gray-600">
                                  <span className="font-semibold text-[#ff7a18]">Click to browse</span> or drag & drop
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  JPG, PNG, PDF, AI, EPS, SVG, PSD · max 20MB per file
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* File Previews */}
                        <AnimatePresence>
                          {previews.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 space-y-2"
                            >
                              {previews.map((preview, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  className="flex items-center gap-3 bg-white border border-gray-150 rounded-xl px-4 py-3 group hover:border-[#ff7a18]/30 transition-colors"
                                >
                                  {/* Thumbnail */}
                                  {preview.type === 'image' && preview.url ? (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                      <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
                                      <FileText className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}

                                  {/* File Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{preview.name}</p>
                                    <p className="text-[11px] text-gray-400">{formatFileSize(files[idx]?.size || 0)}</p>
                                  </div>

                                  {/* Remove */}
                                  <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ─── Optional Link Input ─── */}
                      <div>
                        {!showLinkInput ? (
                          <button
                            type="button"
                            onClick={() => setShowLinkInput(true)}
                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#ff7a18] transition-colors group"
                          >
                            <Link2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                            Have large files? Share a link instead
                            <span className="text-[10px] text-gray-300">(WeTransfer, Dropbox, Google Drive)</span>
                          </button>
                        ) : (
                          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                            <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                              <Link2 className="w-3.5 h-3.5 inline mr-1.5 text-[#ff7a18]" />
                              File Sharing Link
                              <span className="text-xs font-normal text-gray-400 ml-2">(optional)</span>
                            </label>
                            <div className="relative">
                              <input
                                type="url"
                                value={form.fileLink}
                                onChange={update('fileLink')}
                                className={inputClass}
                                placeholder="https://wetransfer.com/... or drive.google.com/..."
                              />
                              <button
                                type="button"
                                onClick={() => { setShowLinkInput(false); setForm({ ...form, fileLink: '' }); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-start gap-2 mt-2 p-2.5 bg-amber-50/80 rounded-lg border border-amber-100">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-[11px] text-amber-700 leading-relaxed">
                                For files larger than 20MB, please use <a href="https://wetransfer.com" target="_blank" rel="noreferrer" className="font-semibold underline">WeTransfer</a>, <a href="https://www.dropbox.com" target="_blank" rel="noreferrer" className="font-semibold underline">Dropbox</a>, or <a href="https://drive.google.com" target="_blank" rel="noreferrer" className="font-semibold underline">Google Drive</a> to share your files.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                          Name <span className="text-red-400">*</span>
                        </label>
                        <input type="text" value={form.name} onChange={update('name')}
                          className={inputClass} placeholder="John Doe" required />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                          Company Name
                        </label>
                        <input type="text" value={form.company} onChange={update('company')}
                          className={inputClass} placeholder="Your company" />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                          Phone <span className="text-red-400">*</span>
                        </label>
                        <input type="tel" value={form.phone} onChange={update('phone')}
                          className={inputClass} placeholder="+91 98765 43210" />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input type="email" value={form.email} onChange={update('email')}
                          className={inputClass} placeholder="you@company.com" required />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                          Username
                        </label>
                        <input type="text" value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })}
                          className={inputClass} placeholder="Enter your username if you are an existing client OR choose preferred username." />
                      </div>
                    </div>
                  </div>

                  <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                    type="submit" disabled={loading}
                    className="mt-8 w-full sm:w-auto mx-auto flex items-center justify-center gap-2 px-10 py-4 bg-[#ff7a18] hover:bg-[#EA580C] text-white font-semibold rounded-full text-base transition-all shadow-lg shadow-orange-500/25 disabled:opacity-60">
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                    ) : (
                      <><Send className="w-5 h-5" /> Submit Request</>
                    )}
                  </motion.button>

                  {/* Large file note */}
                  <p className="text-center text-[11px] text-gray-400 mt-4">
                    *Please use <a href="https://wetransfer.com" target="_blank" rel="noreferrer" className="text-[#ff7a18] hover:underline">wetransfer.com</a> or <a href="https://www.dropbox.com" target="_blank" rel="noreferrer" className="text-[#ff7a18] hover:underline">dropbox.com</a> to send large size files. (minimum 25mb)
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

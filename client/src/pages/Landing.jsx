import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInView, motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowRight, CheckCircle2, Star, PenTool, Layers, ImageIcon, FileType, Upload, Monitor, Download } from 'lucide-react';
import BeforeAfterSlider from '../components/shared/BeforeAfterSlider';
import CustomCursor from '../components/shared/CustomCursor';
import TypingText from '../components/shared/TypingText';

/* ── Reusable Animations ── */
const FadeUp = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }} className={className}>
      {children}
    </motion.div>
  );
};

const SlideIn = ({ children, delay = 0, direction = 'left', className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const x = direction === 'left' ? -60 : 60;
  return (
    <motion.div ref={ref} initial={{ opacity: 0, x }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }} className={className}>
      {children}
    </motion.div>
  );
};

const ScaleIn = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, scale: 0.85 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay, type: 'spring', stiffness: 200, damping: 20 }} className={className}>
      {children}
    </motion.div>
  );
};

/* ── Animated Counter ── */
function Counter({ target, suffix = '', prefix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    if (!inView) return;
    const num = typeof target === 'string' ? parseInt(target.replace(/[^0-9]/g, '')) : target;
    const ctrl = animate(count, num, { duration: 2, ease: [0.25, 0.1, 0.25, 1] });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => { ctrl.stop(); unsub(); };
  }, [inView]);

  return <span ref={ref}>{display}</span>;
}

/* ── Data ── */
const trustStats = [
  { value: 12000, suffix: '+', label: 'Jobs Completed' },
  { value: 2500, suffix: '+', label: 'Happy Clients' },
  { value: 24, prefix: '< ', suffix: 'h', label: 'Avg Turnaround' },
  { value: 99.8, suffix: '%', label: 'Satisfaction' },
];

const services = [
  { icon: PenTool, title: 'Vector Tracing', slug: 'vector-tracing', desc: 'Convert any raster image to scalable vector format with clean paths and perfect accuracy.' },
  { icon: Layers, title: 'Embroidery Digitizing', slug: 'embroidery-digitizing', desc: 'Production-ready embroidery files with precise stitch mapping for any garment or fabric.' },
  { icon: ImageIcon, title: 'Logo Design', slug: 'logo-design', desc: 'Professional logo creation and refinement built around your unique brand identity.' },
  { icon: FileType, title: 'Format Conversion', slug: 'format-conversion', desc: 'Seamless conversion between AI, EPS, SVG, PDF, and 20+ professional file formats.' },
];

const portfolio = [
  { src: '/images/portfolio-1.png', cat: 'Simple', title: 'Eagle Sports Logo' },
  { src: '/images/portfolio-2.png', cat: 'Medium', title: 'Lion Mascot Design' },
  { src: '/images/portfolio-3.png', cat: 'Complex', title: 'Vintage Motorcycle' },
  { src: '/images/portfolio-4.png', cat: 'Custom', title: 'Mountain Badge' },
];

const steps = [
  { num: '01', icon: Upload, title: 'Submit Artwork', desc: 'Upload your files and select the service you need. Add special instructions.' },
  { num: '02', icon: Monitor, title: 'Track Progress', desc: 'Watch your job move through our pipeline in real-time from your dashboard.' },
  { num: '03', icon: Download, title: 'Download Files', desc: 'Receive production-ready files in your chosen formats. Free revisions included.' },
];

const reviews = [
  { name: 'Sarah Mitchell', role: 'Creative Director, BrandForge', text: 'ArtFlow transformed our merch workflow. What used to take days now takes hours, with incredible quality every time.', rating: 5, bg: 'bg-orange-500' },
  { name: 'James Chen', role: 'Founder, StudioNine', text: "The embroidery digitizing is world-class. We've tried other services and nothing comes close to the stitch quality.", rating: 5, bg: 'bg-[#0B1220]' },
  { name: 'Maria Gonzalez', role: 'Marketing Lead, CoreDesign', text: "Fast turnaround, perfect vectors, and the team understands design intent. Best service we've partnered with.", rating: 5, bg: 'bg-orange-600' },
];

/* ── MAIN COMPONENT ── */
export default function Landing() {
  const [activeCat, setActiveCat] = useState('All');
  const cats = ['All', 'Simple', 'Medium', 'Complex', 'Custom'];
  const filtered = activeCat === 'All' ? portfolio : portfolio.filter((p) => p.cat === activeCat);

  return (
    <div className="min-h-screen bg-white text-[#0B1220] overflow-x-hidden">
      <CustomCursor />

      {/* ── NAV ── */}
      <motion.nav initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-[72px]">
          <Link to="/" className="flex items-center gap-3">
            <motion.div whileHover={{ rotate: 12, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}
              className="w-9 h-9 rounded-xl bg-[#ff7a18] flex items-center justify-center shadow-md shadow-orange-200">
              <PenTool className="w-4.5 h-4.5 text-white" />
            </motion.div>
            <span className="text-lg font-display font-bold text-[#0B1220] tracking-tight">ArtFlow Studio</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            {['Services', 'Portfolio', 'How It Works', 'Reviews'].map((item) => (
              <motion.a key={item} href={`#${item.toLowerCase().replace(/ /g, '')}`}
                whileHover={{ y: -2, color: '#0B1220' }} transition={{ duration: 0.2 }}
                className="hover:text-[#0B1220] transition-colors">{item}</motion.a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-[#0B1220] px-4 py-2.5 transition-colors">Log In</Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/signup" className="btn-pill btn-pill-primary !py-2.5 !px-6 text-sm">Sign Up <ArrowRight className="w-3.5 h-3.5" /></Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section className="bg-white relative overflow-hidden min-h-[90vh] flex flex-col justify-center">
        {/* Floating Gradient Blobs */}
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />

        {/* Floating Particles for depth */}
        <div className="hero-particle w-2 h-2 bg-[#ff7a18] opacity-30 top-[15%] left-[10%]" style={{ animation: 'particleFloat 6s ease-in-out infinite' }} />
        <div className="hero-particle w-1.5 h-1.5 bg-[#ff6a00] opacity-25 top-[25%] right-[15%]" style={{ animation: 'particleDrift 8s ease-in-out infinite 1s' }} />
        <div className="hero-particle w-2.5 h-2.5 bg-[#ff7a18] opacity-20 bottom-[20%] left-[20%]" style={{ animation: 'particleFloat 7s ease-in-out infinite 2s' }} />
        <div className="hero-particle w-1.5 h-1.5 bg-[#0B1220] opacity-10 top-[60%] right-[25%]" style={{ animation: 'particleDrift 9s ease-in-out infinite 3s' }} />
        <div className="hero-particle w-2 h-2 bg-[#ff7a18] opacity-15 top-[80%] left-[65%]" style={{ animation: 'particleFloat 10s ease-in-out infinite 1.5s' }} />
        <div className="hero-particle w-3 h-3 bg-orange-200 opacity-30 top-[10%] right-[40%]" style={{ animation: 'particleDrift 11s ease-in-out infinite 4s' }} />

        <div className="max-w-7xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Text Content */}
            <div>
              <div className="hero-animate hero-animate-delay-1">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-[2px] bg-gradient-to-r from-[#ff7a18] to-[#ff6a00]" />
                  <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff7a18]">Since 2000</span>
                </div>
              </div>

              <h1 className="hero-animate hero-animate-delay-2 text-4xl sm:text-5xl lg:text-[56px] font-display font-bold leading-[1.08] mb-7 tracking-tight text-[#0B1220]">
                Your very own<br />
                <TypingText /><br />
                company focused on<br />
                craft and dialed for results.
              </h1>

              <p className="hero-animate hero-animate-delay-3 text-lg text-gray-500 max-w-lg mb-10 leading-relaxed">
                Upload your artwork, get a quote in minutes. Studio-quality vector tracing, embroidery digitizing, and design services — delivered in 24 hours.
              </p>

              <div className="hero-animate hero-animate-delay-4 flex flex-wrap gap-3">
                <Link to="/signup" className="btn-pill btn-pill-primary">
                  Become a Client <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/request-quote" className="btn-pill btn-pill-primary">
                  Request a Quote <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/signup" className="btn-pill btn-pill-outline">
                  Submit an Order <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: Hero Illustration with enhanced effects */}
            <motion.div initial={{ opacity: 0, x: 50, scale: 0.92 }} animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block">
              <div className="relative">
                {/* Soft glow behind illustration */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-100/40 via-transparent to-orange-50/20 rounded-3xl blur-2xl scale-110" />
                <img src="/images/hero-illustration.png" alt="Creative design illustration" className="w-full max-w-[540px] mx-auto drop-shadow-2xl relative z-10" />

                {/* Floating accent elements */}
                <motion.div animate={{ y: [0, -16, 0], rotate: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-8 left-4 w-5 h-5 rounded-full bg-gradient-to-br from-[#ff7a18] to-[#ff6a00] opacity-70 shadow-lg shadow-orange-300/40" />
                <motion.div animate={{ y: [0, 12, 0], x: [0, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                  className="absolute bottom-24 right-8 w-3.5 h-3.5 rounded-full bg-[#0B1220] opacity-30" />
                <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                  className="absolute top-1/3 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-orange-200 to-orange-100" />
                <motion.div animate={{ y: [0, -10, 0], x: [0, 8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
                  className="absolute bottom-1/3 -left-4 w-4 h-4 rounded-full bg-orange-300/40" />
              </div>
            </motion.div>
          </div>

          {/* Trust Stats */}
          <div className="hero-animate hero-animate-delay-5 mt-20 pt-12 border-t border-gray-100/80">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {trustStats.map((s, i) => (
                <motion.div key={i} whileHover={{ y: -4, scale: 1.03 }}
                  className="py-5 px-4 rounded-2xl hover:bg-orange-50/30 transition-all duration-300 cursor-default text-center group">
                  <p className="text-3xl sm:text-4xl font-display font-bold text-[#ff7a18] group-hover:text-[#ff6a00] transition-colors">
                    <Counter target={s.value} suffix={s.suffix} prefix={s.prefix || ''} />
                  </p>
                  <p className="text-sm text-gray-500 mt-1.5 font-medium">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="bg-[#FAFBFC] border-y border-gray-100 py-20 relative">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <p className="text-sm text-[#ff7a18] font-semibold uppercase tracking-widest mb-3">Our Services</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1220]">What We Do</h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map(({ icon: Icon, title, desc, slug }, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <Link to={`/services/${slug}`}>
                  <motion.div whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="card-hover p-7 h-full group">
                    <motion.div whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} transition={{ duration: 0.5 }}
                      className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5 text-[#ff7a18]" />
                    </motion.div>
                    <h3 className="font-display font-semibold text-lg text-[#0B1220] mb-2 group-hover:text-[#ff7a18] transition-colors">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">{desc}</p>
                    <span className="text-xs font-semibold text-[#ff7a18] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Learn More <ArrowRight className="w-3 h-3" /></span>
                  </motion.div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING PROMO ── */}
      <section className="bg-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-orange-50 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <FadeUp className="text-center mb-14">
            <p className="text-sm text-[#ff7a18] font-semibold uppercase tracking-widest mb-3">Simple Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1220] mb-4">Studio-Quality Work. Unbeatable Prices.</h2>
            <p className="text-gray-500 max-w-lg mx-auto">No hidden fees. No subscriptions. Just pay per project and get production-ready results.</p>
          </FadeUp>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {[
              { icon: PenTool, title: 'Vector Tracing', price: '5.99', tag: 'Most Popular', desc: 'Simple logos & text', slug: 'vector-tracing' },
              { icon: Layers, title: 'Embroidery Digitizing', price: '9.99', tag: 'Best Value', desc: 'Left chest / cap designs', slug: 'embroidery-digitizing' },
              { icon: ImageIcon, title: 'Logo Design', price: '49.99', tag: 'Custom', desc: '3 unique concepts included', slug: 'logo-design' },
              { icon: FileType, title: 'Format Conversion', price: '4.99', tag: 'Quick', desc: 'Any format to any format', slug: 'format-conversion' },
            ].map(({ icon: Icon, title, price, tag, desc, slug }, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <Link to={`/services/${slug}`}>
                  <motion.div 
                    whileHover={{ y: -10, boxShadow: '0 25px 50px rgba(255, 122, 24, 0.15)' }}
                    className="relative bg-white rounded-2xl border border-gray-100 p-6 h-full group overflow-hidden transition-all duration-300 hover:border-orange-200"
                  >
                    <div className="absolute top-3 right-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-50 text-[#ff7a18] px-2.5 py-1 rounded-full">{tag}</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#ff7a18]" />
                    </div>
                    <h3 className="font-display font-semibold text-[#0B1220] mb-1 group-hover:text-[#ff7a18] transition-colors">{title}</h3>
                    <p className="text-xs text-gray-400 mb-4">{desc}</p>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-sm text-gray-400 font-medium">from</span>
                      <span className="text-3xl font-display font-bold text-[#0B1220]">${price}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#ff7a18] flex items-center gap-1 group-hover:gap-2 transition-all">
                      Get Started <ArrowRight className="w-3 h-3" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
                  </motion.div>
                </Link>
              </FadeUp>
            ))}
          </div>
          
          <FadeUp delay={0.3}>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-r from-[#0B1220] via-[#1a2a4a] to-[#0B1220] rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden"
            >
              <motion.div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#ff7a18]/10" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 4, repeat: Infinity }} />
              <motion.div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-[#ff7a18]/8" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} />
              <div className="text-center sm:text-left relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-3xl">🎨</motion.div>
                  <div>
                    <h3 className="text-white font-display font-bold text-xl">Need a custom quote?</h3>
                    <p className="text-gray-400 text-sm">Complex projects, bulk orders, rush delivery — we've got you covered.</p>
                  </div>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} className="relative z-10 flex-shrink-0">
                <Link to="/request-quote" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#ff7a18] hover:bg-[#EA580C] text-white font-semibold rounded-full text-sm transition-colors shadow-lg shadow-orange-500/25">
                  Request Free Quote <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>
          </FadeUp>
        </div>
      </section>

      {/* ── PORTFOLIO ── */}
      <section id="portfolio" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-10">
            <p className="text-sm text-[#ff7a18] font-semibold uppercase tracking-widest mb-3">Sample Work</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1220] mb-4">Our Portfolio</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Real client work showcasing our quality across different complexity levels.</p>
          </FadeUp>
          <FadeUp delay={0.1} className="flex justify-center gap-2 mb-10 flex-wrap">
            {cats.map((c) => (
              <motion.button key={c} onClick={() => setActiveCat(c)} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeCat === c ? 'bg-[#ff7a18] text-white shadow-md shadow-orange-300/30' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                }`}>
                {c}
              </motion.button>
            ))}
          </FadeUp>
          <motion.div layout className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {filtered.map((item, i) => (
              <motion.div key={item.src} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.4, delay: i * 0.08 }}>
                <motion.div whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                  className="group rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 transition-all duration-300">
                  <div className="aspect-square overflow-hidden">
                    <img src={item.src} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#ff7a18]">{item.cat}</span>
                    <p className="text-sm font-medium text-[#0B1220] mt-0.5">{item.title}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── BEFORE / AFTER ── */}
      <section className="bg-[#FAFBFC] border-y border-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <p className="text-sm text-[#ff7a18] font-semibold uppercase tracking-widest mb-3">See the Difference</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1220] mb-4">Before, After & Final Result</h2>
            <p className="text-gray-500 max-w-lg mx-auto">From rough sketch to production-ready file to the real-world product.</p>
          </FadeUp>
          <div className="grid lg:grid-cols-3 gap-6">
            <SlideIn direction="left" className="lg:col-span-2">
              <BeforeAfterSlider beforeSrc="/images/before.png" afterSrc="/images/after.png" beforeLabel="Original Sketch" afterLabel="Vectorized" />
              <p className="text-center text-sm text-gray-400 mt-3">↔ Drag the slider to compare</p>
            </SlideIn>
            <SlideIn direction="right">
              <motion.div whileHover={{ y: -6 }} className="group rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm relative h-full">
                <div className="aspect-square overflow-hidden">
                  <img src="/images/final.png" alt="Final product mockup" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-[#0B1220]">Final Output</p>
                  <p className="text-xs text-gray-500">Production-ready embroidery on garment</p>
                </div>
              </motion.div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="howitworks" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <p className="text-sm text-[#ff7a18] font-semibold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1220]">How It Works</h2>
          </FadeUp>
          <div className="relative">
            <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-gray-200" />
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((s, i) => (
                <ScaleIn key={i} delay={i * 0.15}>
                  <div className="text-center relative">
                    <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }}
                      className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-5 relative z-10 bg-white">
                      <s.icon className="w-6 h-6 text-[#ff7a18]" />
                    </motion.div>
                    <span className="text-xs font-bold text-[#ff7a18] mb-2 block">STEP {s.num}</span>
                    <h3 className="font-display font-semibold text-lg text-[#0B1220] mb-2">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                  </div>
                </ScaleIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="reviews" className="bg-[#FAFBFC] border-y border-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <p className="text-sm text-[#ff7a18] font-semibold uppercase tracking-widest mb-3">Client Reviews</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1220]">What Our Clients Say</h2>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <SlideIn key={i} delay={i * 0.12} direction={i === 0 ? 'left' : i === 2 ? 'right' : 'left'}>
                <motion.div whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
                  className="card-hover p-7 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(r.rating)].map((_, j) => (
                      <motion.div key={j} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + j * 0.1, type: 'spring', stiffness: 400 }}>
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-6">"{r.text}"</p>
                  <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                    <div className={`w-10 h-10 rounded-full ${r.bg} flex items-center justify-center text-sm font-bold text-white`}>{r.name[0]}</div>
                    <div><p className="text-sm font-semibold text-[#0B1220]">{r.name}</p><p className="text-xs text-gray-500">{r.role}</p></div>
                  </div>
                </motion.div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <ScaleIn>
          <motion.div whileHover={{ scale: 1.01 }} className="bg-[#0B1220] rounded-3xl p-12 sm:p-16 text-center text-white relative overflow-hidden">
            <motion.div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#ff7a18]/10" animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 8, repeat: Infinity }} />
            <motion.div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[#ff7a18]/10" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 6, repeat: Infinity, delay: 2 }} />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">Upload your artwork and get a quote in minutes. No commitment required.</p>
              <motion.div whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.95 }} className="inline-block">
                <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-[#ff7a18] text-white font-semibold rounded-full text-base hover:bg-[#EA580C] transition-colors shadow-lg shadow-orange-500/25">
                  Create Free Account <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><ArrowRight className="w-4 h-4" /></motion.span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </ScaleIn>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#ff7a18] flex items-center justify-center"><PenTool className="w-3.5 h-3.5 text-white" /></div>
            <span className="text-sm text-gray-400">© 2024 ArtFlow Studio</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-[#0B1220] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#0B1220] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#0B1220] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

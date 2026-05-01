import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenTool, Layers, ImageIcon, FileType, Monitor, ArrowLeft, ArrowRight, CheckCircle2, Zap, Clock, Shield, Star } from 'lucide-react';

const servicesData = {
  'vector-tracing': {
    icon: PenTool,
    title: 'Vector Tracing',
    subtitle: 'Pixel-Perfect Vector Conversion',
    hero: 'Transform any raster image into a clean, scalable vector format with perfect accuracy.',
    description: 'Our vector tracing service converts your bitmap images (JPEG, PNG, BMP) into crisp, scalable vector files. Whether you need a simple logo cleanup or a complex illustration vectorized, our artists deliver production-ready files with clean paths, proper layering, and optimized anchor points.',
    features: [
      'Clean, optimized anchor points & paths',
      'Unlimited scalability — print at any size',
      'Color-separated layers for production',
      'Multiple output formats (AI, EPS, SVG, PDF)',
      'Free revisions until perfect',
      'Rush delivery available (4 hours)',
    ],
    process: [
      { step: '01', title: 'Upload Image', desc: 'Submit your raster image in any format. Add notes about colors, size, and special requirements.' },
      { step: '02', title: 'Artist Review', desc: 'Our vector specialist reviews your artwork and begins the manual tracing process.' },
      { step: '03', title: 'Quality Check', desc: 'Every file goes through our QC pipeline — checking paths, colors, and compatibility.' },
      { step: '04', title: 'Delivery', desc: 'Download your production-ready vector files in all requested formats.' },
    ],
    pricing: [
      { tier: 'Simple', price: '$5.99', desc: 'Text, basic shapes, 1-2 colors', time: '4-6 hours' },
      { tier: 'Medium', price: '$14.99', desc: 'Logos, moderate detail, 3-5 colors', time: '8-12 hours' },
      { tier: 'Complex', price: '$24.99', desc: 'Detailed illustrations, many colors', time: '12-24 hours' },
    ],
    useCases: ['Screen Printing', 'Embroidery', 'Signage & Banners', 'Vehicle Wraps', 'Merchandise', 'Business Cards'],
  },
  'embroidery-digitizing': {
    icon: Layers,
    title: 'Embroidery Digitizing',
    subtitle: 'Production-Ready Stitch Files',
    hero: 'Convert your artwork into high-quality embroidery files with precise stitch mapping for any fabric.',
    description: 'Our digitizing experts translate your designs into embroidery-ready files with proper stitch types, densities, and pathing. We account for fabric type, thread count, and production variables to ensure perfect results on the machine.',
    features: [
      'DST, PES, JEF, EXP and all major formats',
      'Proper push/pull compensation built in',
      'Optimized stitch count for efficiency',
      'Color sequence & thread charts included',
      'Left chest, full back, cap, and all placements',
      'Test sew photos upon request',
    ],
    process: [
      { step: '01', title: 'Submit Design', desc: 'Upload your logo or artwork. Tell us the placement, size, and fabric type.' },
      { step: '02', title: 'Digitizing', desc: 'Our digitizer maps stitch types — satin, fill, running — to match your design perfectly.' },
      { step: '03', title: 'Proof Review', desc: 'Receive a visual stitch preview showing colors, stitch direction, and placement.' },
      { step: '04', title: 'Production File', desc: 'Download the final file ready for your embroidery machine.' },
    ],
    pricing: [
      { tier: 'Left Chest', price: '$9.99', desc: 'Up to 10,000 stitches', time: '6-8 hours' },
      { tier: 'Full Design', price: '$19.99', desc: '10K-30K stitches', time: '12-18 hours' },
      { tier: 'Complex / Cap', price: '$29.99', desc: '30K+ stitches, specialty', time: '18-24 hours' },
    ],
    useCases: ['Polo Shirts', 'Caps & Hats', 'Jackets', 'Uniforms', 'Bags & Totes', 'Patches'],
  },
  'logo-design': {
    icon: ImageIcon,
    title: 'Logo Design',
    subtitle: 'Professional Brand Identity',
    hero: 'Get a professional, unique logo designed by experienced artists who understand brand identity.',
    description: 'Our logo design service creates professional, memorable logos from scratch or refines your existing concepts. Every logo is hand-crafted with attention to versatility — ensuring it works across print, digital, embroidery, and every application.',
    features: [
      '3 initial concept options',
      'Unlimited revisions on chosen concept',
      'All file formats included (AI, EPS, SVG, PNG, PDF)',
      'Brand color palette & typography guide',
      'Print-ready & web-optimized versions',
      'Full ownership — no licensing fees',
    ],
    process: [
      { step: '01', title: 'Creative Brief', desc: 'Share your vision, industry, target audience, and design preferences.' },
      { step: '02', title: 'Concept Design', desc: 'Our designer creates 3 unique concepts based on your brief.' },
      { step: '03', title: 'Refinement', desc: 'Choose your favorite and we refine it with unlimited revisions.' },
      { step: '04', title: 'Final Package', desc: 'Receive your complete logo package with all formats and brand guidelines.' },
    ],
    pricing: [
      { tier: 'Starter', price: '$49.99', desc: '2 concepts, 3 revisions', time: '3-5 days' },
      { tier: 'Professional', price: '$99.99', desc: '3 concepts, unlimited revisions', time: '5-7 days' },
      { tier: 'Premium', price: '$199.99', desc: '5 concepts, brand guide included', time: '7-10 days' },
    ],
    useCases: ['Startups', 'Rebrand', 'Sports Teams', 'Restaurants', 'E-commerce', 'Personal Brands'],
  },
  'format-conversion': {
    icon: FileType,
    title: 'Format Conversion',
    subtitle: 'Seamless File Transformation',
    hero: 'Convert between 20+ professional file formats while maintaining quality and editability.',
    description: 'Need your AI file as an SVG? Your PDF as an editable EPS? We handle all format conversions while preserving layers, colors, fonts, and quality. Our artists manually verify every conversion to ensure nothing is lost.',
    features: [
      'AI, EPS, SVG, PDF, PNG, JPEG, TIFF, PSD and more',
      'Color mode conversion (CMYK ↔ RGB ↔ Pantone)',
      'Font outlining & embedding',
      'Layer preservation & organization',
      'Resolution optimization for print or web',
      'Batch conversion available',
    ],
    process: [
      { step: '01', title: 'Upload Files', desc: 'Submit your source files in any format. Specify the target format you need.' },
      { step: '02', title: 'Conversion', desc: 'Our team converts and verifies every element — colors, layers, text.' },
      { step: '03', title: 'QC Review', desc: 'Side-by-side comparison to ensure zero quality loss in the conversion.' },
      { step: '04', title: 'Download', desc: 'Receive your files in the requested format, ready for use.' },
    ],
    pricing: [
      { tier: 'Single File', price: '$4.99', desc: 'One format conversion', time: '1-2 hours' },
      { tier: 'Multi-Format', price: '$12.99', desc: 'Convert to 5+ formats', time: '4-6 hours' },
      { tier: 'Batch (10+)', price: '$29.99', desc: '10+ file conversions', time: '12-24 hours' },
    ],
    useCases: ['Print Production', 'Web Development', 'CNC/Laser Cutting', 'Vinyl Cutting', 'Screen Printing', 'Apparel Decoration'],
  },
};

const FadeUp = ({ children, delay = 0, className = '' }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
    className={className}>{children}</motion.div>
);

export default function ServiceDetail() {
  const { slug } = useParams();
  const service = servicesData[slug];

  if (!service) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service not found</h2>
          <Link to="/#services" className="text-[#ff7a18] hover:underline">← Back to Services</Link>
        </div>
      </div>
    );
  }

  const Icon = service.icon;
  const otherServices = Object.entries(servicesData).filter(([k]) => k !== slug).slice(0, 3);

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
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-500 hover:text-[#0B1220] hidden sm:inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <Link to="/request-quote" className="btn-pill btn-pill-primary !py-2.5 !px-6 text-sm">
              Get a Quote <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B1220] via-[#1a2a4a] to-[#0B1220] py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#ff7a18]/20 flex items-center justify-center">
                <Icon className="w-7 h-7 text-[#ff7a18]" />
              </div>
              <div>
                <p className="text-sm text-[#ff7a18] font-semibold uppercase tracking-widest">{service.subtitle}</p>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">{service.title}</h1>
              </div>
            </div>
            <p className="text-xl text-gray-300 max-w-2xl leading-relaxed mb-8">{service.hero}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/request-quote" className="btn-pill btn-pill-primary !py-3.5">
                Request a Quote <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/signup" className="btn-pill !py-3.5 border-2 border-white/20 text-white hover:bg-white/10 transition-all">
                Start an Order <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Description + Features */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <FadeUp>
              <h2 className="text-2xl font-display font-bold text-[#0B1220] mb-4">About This Service</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>
              <div className="grid grid-cols-3 gap-4">
                {[{ icon: Zap, label: 'Fast Turnaround' }, { icon: Shield, label: 'Quality Guaranteed' }, { icon: Star, label: 'Free Revisions' }].map((item, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-orange-50/50">
                    <item.icon className="w-5 h-5 text-[#ff7a18] mx-auto mb-1" />
                    <p className="text-xs font-medium text-gray-600">{item.label}</p>
                  </div>
                ))}
              </div>
            </FadeUp>
            <FadeUp delay={0.15}>
              <h3 className="text-lg font-display font-bold text-[#0B1220] mb-4">What's Included</h3>
              <div className="space-y-3">
                {service.features.map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{f}</span>
                  </motion.div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 bg-[#FAFBFC] border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <FadeUp className="text-center mb-12">
            <p className="text-sm text-[#ff7a18] font-semibold uppercase tracking-widest mb-2">Our Process</p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1220]">How It Works</h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {service.process.map((p, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 h-full hover:shadow-lg hover:border-orange-100 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-[#ff7a18] text-white font-bold text-sm flex items-center justify-center mb-4">{p.step}</div>
                  <h3 className="font-display font-semibold text-[#0B1220] mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Get a Quote CTA (instead of detailed pricing) */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <FadeUp>
            <motion.div
              whileHover={{ scale: 1.005 }}
              className="relative bg-gradient-to-br from-[#0B1220] via-[#162040] to-[#0B1220] rounded-3xl p-10 sm:p-14 overflow-hidden"
            >
              {/* Decorative elements */}
              <motion.div className="absolute top-0 right-0 w-64 h-64 bg-[#ff7a18]/8 rounded-full -translate-y-1/2 translate-x-1/3" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} />
              <motion.div className="absolute bottom-0 left-0 w-48 h-48 bg-[#ff7a18]/5 rounded-full translate-y-1/2 -translate-x-1/3" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 8, repeat: Infinity, delay: 2 }} />
              
              <div className="relative z-10 text-center">
                <p className="text-sm text-[#ff7a18] font-semibold uppercase tracking-widest mb-3">Pricing</p>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-4">Get Your Custom Quote</h2>
                <p className="text-gray-400 max-w-lg mx-auto mb-8">
                  Every project is unique. Tell us what you need and we'll send you a detailed quote with pricing, turnaround time, and delivery formats — all within a few hours.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                  <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Starting from</p>
                    <p className="text-4xl font-display font-bold text-[#ff7a18]">{service.pricing[0].price}</p>
                    <p className="text-gray-500 text-xs mt-1">{service.pricing[0].desc}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-gray-500 text-sm">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> Free revisions included</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /> Turnaround: {service.pricing[0].time}</div>
                    <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Rush delivery available</div>
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} className="inline-block">
                  <Link to="/request-quote" className="inline-flex items-center gap-2 px-10 py-4 bg-[#ff7a18] hover:bg-[#EA580C] text-white font-semibold rounded-full text-base transition-colors shadow-lg shadow-orange-500/30">
                    Request Free Quote <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </FadeUp>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 bg-[#FAFBFC] border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <FadeUp className="text-center mb-8">
            <h2 className="text-xl font-display font-bold text-[#0B1220]">Common Use Cases</h2>
          </FadeUp>
          <div className="flex flex-wrap justify-center gap-3">
            {service.useCases.map((u, i) => (
              <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="px-5 py-2.5 bg-white rounded-full text-sm text-gray-600 border border-gray-200 hover:border-[#ff7a18] hover:text-[#ff7a18] transition-all cursor-default">
                {u}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Other Services */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <FadeUp className="text-center mb-10">
            <h2 className="text-2xl font-display font-bold text-[#0B1220]">Explore Other Services</h2>
          </FadeUp>
          <div className="grid sm:grid-cols-3 gap-5">
            {otherServices.map(([key, s], i) => (
              <FadeUp key={key} delay={i * 0.1}>
                <Link to={`/services/${key}`}>
                  <motion.div whileHover={{ y: -6 }} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all">
                    <s.icon className="w-8 h-8 text-[#ff7a18] mb-3" />
                    <h3 className="font-display font-semibold text-[#0B1220] mb-1">{s.title}</h3>
                    <p className="text-xs text-gray-500">{s.subtitle}</p>
                  </motion.div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0B1220]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-display font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">Upload your artwork and get a free quote in minutes. No commitment required.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/request-quote" className="btn-pill btn-pill-primary !py-3.5">
              Request a Quote <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/signup" className="btn-pill !py-3.5 border-2 border-white/20 text-white hover:bg-white/10 transition-all">
              Create Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#ff7a18] flex items-center justify-center"><PenTool className="w-3.5 h-3.5 text-white" /></div>
            <span className="text-sm text-gray-400">© 2024 ArtFlow Studio</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link to="/" className="hover:text-[#0B1220] transition-colors">Home</Link>
            <Link to="/request-quote" className="hover:text-[#0B1220] transition-colors">Get Quote</Link>
            <Link to="/login" className="hover:text-[#0B1220] transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState({});
  const observerRef = useRef(null);

  // Parallax scroll tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer for reveal animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  // Screenshot carousel auto-play
  const screenshots = [
    { title: 'Dashboard Overview', desc: 'Real-time analytics at a glance', emoji: '📊' },
    { title: 'Payment Tracking', desc: 'Track every maintenance payment', emoji: '💳' },
    { title: 'Flat Management', desc: 'Visual floor-wise flat grid', emoji: '🏢' },
    { title: 'Expense Reports', desc: 'Detailed expense breakdown', emoji: '📋' },
    { title: 'Society Funds', desc: 'Manage community funds easily', emoji: '💰' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % screenshots.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [screenshots.length]);

  const features = [
    { icon: '🧾', title: 'Maintenance Bills', desc: 'Generate and track monthly maintenance bills for every flat automatically.' },
    { icon: '✅', title: 'Payment Verification', desc: 'Admin approval system for payment screenshots with real-time status updates.' },
    { icon: '🏢', title: 'Flat Management', desc: 'Visual block and flat grid with occupancy status, owner details, and history.' },
    { icon: '💰', title: 'Society Funds', desc: 'Create and manage community funds with contribution tracking and progress bars.' },
    { icon: '📋', title: 'Expense Tracking', desc: 'Categorize and track all society expenses with detailed breakdowns.' },
    { icon: '📈', title: 'Reports & Analytics', desc: 'Comprehensive collection and expense reports with downloadable PDFs.' },
    { icon: '🔔', title: 'Smart Notifications', desc: 'Instant alerts for payments, approvals, and society updates.' },
    { icon: '🔐', title: 'Access Control', desc: 'Role-based access for admins and members with invite-code system.' },
  ];

  const benefits = [
    { icon: '🔍', title: 'Transparent Accounting', desc: 'Every rupee tracked and visible to all members.' },
    { icon: '👥', title: 'Easy Member Tracking', desc: 'Know who\'s paid, who\'s pending, at a glance.' },
    { icon: '⚡', title: 'Faster Collection', desc: 'Reduce maintenance collection time by 70%.' },
    { icon: '📱', title: 'Real-time Updates', desc: 'Instant notifications on every transaction.' },
    { icon: '🛡️', title: 'Admin Approval', desc: 'Multi-step verification for payment security.' },
    { icon: '🌐', title: 'Mobile Access', desc: 'Works perfectly on any device, anywhere.' },
  ];

  const stats = [
    { value: '500+', label: 'Active Societies' },
    { value: '15K+', label: 'Flats Managed' },
    { value: '₹2Cr+', label: 'Payments Tracked' },
    { value: '99.9%', label: 'Uptime' },
  ];

  return (
    <div className="landing" data-theme={theme}>
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={`landing-nav ${scrollY > 60 ? 'landing-nav--scrolled' : ''}`}>
        <div className="landing-nav__inner">
          <Link to="/" className="landing-nav__logo">
            <span className="landing-nav__logo-icon">🏘️</span>
            <span className="landing-nav__logo-text">SocietySync</span>
          </Link>

          <div className={`landing-nav__links ${menuOpen ? 'open' : ''}`}>
            <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#demo" onClick={() => setMenuOpen(false)}>Demo</a>
            <a href="#benefits" onClick={() => setMenuOpen(false)}>Why Us</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          </div>

          <div className="landing-nav__actions">
            <button className="landing-nav__theme" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <Link to="/login" className="landing-btn landing-btn--ghost" id="nav-login-btn">Login</Link>
            <Link to="/register" className="landing-btn landing-btn--primary" id="nav-signup-btn">Get Started</Link>
          </div>

          <button
            className={`landing-nav__hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile menu overlay */}
        {menuOpen && (
          <div className="landing-mobile-menu">
            <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#demo" onClick={() => setMenuOpen(false)}>Demo</a>
            <a href="#benefits" onClick={() => setMenuOpen(false)}>Why Us</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
            <div className="landing-mobile-menu__actions">
              <Link to="/login" className="landing-btn landing-btn--ghost" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="landing-btn landing-btn--primary" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="landing-hero" id="home">
        <div className="landing-hero__bg">
          <div className="landing-hero__orb landing-hero__orb--1" style={{ transform: `translateY(${scrollY * 0.15}px)` }} />
          <div className="landing-hero__orb landing-hero__orb--2" style={{ transform: `translateY(${scrollY * -0.1}px)` }} />
          <div className="landing-hero__orb landing-hero__orb--3" style={{ transform: `translateY(${scrollY * 0.08}px)` }} />
          <div className="landing-hero__grid" />
        </div>

        <div className="landing-hero__content">
          <div className="landing-hero__badge">
            <span className="landing-hero__badge-dot" />
            🚀 Trusted by 500+ Housing Societies
          </div>
          <h1 className="landing-hero__title">
            Smart Society<br />
            <span className="landing-hero__title-gradient">Maintenance Management</span>
          </h1>
          <p className="landing-hero__subtitle">
            Simplify maintenance collection, track payments, manage expenses, and keep your society finances 
            transparent — all in one powerful platform.
          </p>
          <div className="landing-hero__cta">
            <Link to="/register" className="landing-btn landing-btn--primary landing-btn--lg" id="hero-start-btn">
              Start Free →
            </Link>
            <a href="#demo" className="landing-btn landing-btn--outline landing-btn--lg" id="hero-demo-btn">
              ▶ Watch Demo
            </a>
          </div>

          <div className="landing-hero__stats">
            {stats.map((stat, i) => (
              <div key={i} className="landing-hero__stat">
                <span className="landing-hero__stat-value">{stat.value}</span>
                <span className="landing-hero__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-hero__mockup">
          <div className="landing-hero__mockup-frame">
            <div className="landing-hero__mockup-bar">
              <span /><span /><span />
            </div>
            <div className="landing-hero__mockup-screen">
              <div className="mock-dash">
                <div className="mock-dash__header">
                  <div className="mock-dash__title">📊 Dashboard</div>
                  <div className="mock-dash__date">May 2026</div>
                </div>
                <div className="mock-dash__stats">
                  <div className="mock-stat mock-stat--primary">
                    <span className="mock-stat__label">Collected</span>
                    <span className="mock-stat__value">₹4,52,000</span>
                  </div>
                  <div className="mock-stat mock-stat--success">
                    <span className="mock-stat__label">Paid Flats</span>
                    <span className="mock-stat__value">78</span>
                  </div>
                  <div className="mock-stat mock-stat--danger">
                    <span className="mock-stat__label">Pending</span>
                    <span className="mock-stat__value">12</span>
                  </div>
                </div>
                <div className="mock-dash__chart">
                  {[65, 80, 45, 90, 70, 85, 55, 75, 60, 95, 50, 88].map((h, i) => (
                    <div key={i} className="mock-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="landing-hero__glow" />
        </div>
      </section>

      {/* ═══════════ APP INTRO ═══════════ */}
      <section className="landing-section landing-intro" id="intro" data-animate>
        <div className={`landing-section__inner ${visibleSections.intro ? 'animate-in' : ''}`}>
          <div className="landing-section__header">
            <span className="landing-section__tag">Everything You Need</span>
            <h2 className="landing-section__title">One Platform. Complete Society Management.</h2>
            <p className="landing-section__desc">
              From maintenance tracking to expense analytics — SocietySync handles everything 
              your housing society needs to run smoothly.
            </p>
          </div>

          <div className="landing-intro__grid">
            {[
              { emoji: '🧾', title: 'Maintenance Tracking', desc: 'Auto-generate monthly bills and track every payment status.' },
              { emoji: '🏠', title: 'Flat-wise Status', desc: 'Visual color-coded grid showing paid, pending, and partial payments.' },
              { emoji: '💰', title: 'Fund Management', desc: 'Create community funds with contribution tracking and goals.' },
              { emoji: '📊', title: 'Expense Analytics', desc: 'Categorize and visualize where every rupee is spent.' },
              { emoji: '👥', title: 'Member Management', desc: 'Invite, approve, and manage admin/member roles easily.' },
              { emoji: '📱', title: 'Mobile-first Design', desc: 'Fully responsive, works beautifully on phones and tablets.' },
            ].map((item, i) => (
              <div key={i} className="landing-intro__card" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="landing-intro__card-emoji">{item.emoji}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section className="landing-section landing-features" id="features" data-animate>
        <div className={`landing-section__inner ${visibleSections.features ? 'animate-in' : ''}`}>
          <div className="landing-section__header">
            <span className="landing-section__tag">Premium Features</span>
            <h2 className="landing-section__title">Built for Modern Housing Societies</h2>
            <p className="landing-section__desc">
              Every feature designed to simplify society management and boost transparency.
            </p>
          </div>

          <div className="landing-features__grid">
            {features.map((feature, i) => (
              <div key={i} className="landing-feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="landing-feature-card__icon">{feature.icon}</div>
                <h3 className="landing-feature-card__title">{feature.title}</h3>
                <p className="landing-feature-card__desc">{feature.desc}</p>
                <div className="landing-feature-card__shine" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ DEMO / SCREENSHOTS ═══════════ */}
      <section className="landing-section landing-demo" id="demo" data-animate>
        <div className={`landing-section__inner ${visibleSections.demo ? 'animate-in' : ''}`}>
          <div className="landing-section__header">
            <span className="landing-section__tag">See It In Action</span>
            <h2 className="landing-section__title">Experience the Dashboard</h2>
            <p className="landing-section__desc">
              Explore the powerful features that make SocietySync the preferred choice.
            </p>
          </div>

          <div className="landing-demo__carousel">
            <div className="landing-demo__slides">
              {screenshots.map((slide, i) => (
                <div
                  key={i}
                  className={`landing-demo__slide ${i === activeSlide ? 'active' : ''}`}
                >
                  <div className="landing-demo__slide-visual">
                    <div className="landing-demo__slide-emoji">{slide.emoji}</div>
                    <div className="landing-demo__slide-mockup">
                      <div className="slide-mock-header">
                        <span className="slide-mock-dot" /><span className="slide-mock-dot" /><span className="slide-mock-dot" />
                      </div>
                      <div className="slide-mock-content">
                        <div className="slide-mock-sidebar">
                          {['📊','🏢','💳','📋','💰','📈'].map((e,j) => (
                            <div key={j} className={`slide-mock-nav ${j === i ? 'active' : ''}`}>{e}</div>
                          ))}
                        </div>
                        <div className="slide-mock-main">
                          <div className="slide-mock-title">{slide.title}</div>
                          <div className="slide-mock-cards">
                            <div className="slide-mock-card" /><div className="slide-mock-card" /><div className="slide-mock-card" />
                          </div>
                          <div className="slide-mock-chart">
                            {[40,65,50,80,60,75,55].map((h,k) => (
                              <div key={k} className="slide-mock-bar" style={{height:`${h}%`}} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3>{slide.title}</h3>
                  <p>{slide.desc}</p>
                </div>
              ))}
            </div>

            <div className="landing-demo__dots">
              {screenshots.map((_, i) => (
                <button
                  key={i}
                  className={`landing-demo__dot ${i === activeSlide ? 'active' : ''}`}
                  onClick={() => setActiveSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ WHY SOCIETYSYNC ═══════════ */}
      <section className="landing-section landing-benefits" id="benefits" data-animate>
        <div className={`landing-section__inner ${visibleSections.benefits ? 'animate-in' : ''}`}>
          <div className="landing-section__header">
            <span className="landing-section__tag">Why SocietySync?</span>
            <h2 className="landing-section__title">The Smarter Way to Manage Your Society</h2>
            <p className="landing-section__desc">
              Join hundreds of societies that switched to digital management.
            </p>
          </div>

          <div className="landing-benefits__grid">
            {benefits.map((benefit, i) => (
              <div key={i} className="landing-benefit-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="landing-benefit-card__icon">{benefit.icon}</div>
                <div className="landing-benefit-card__content">
                  <h3>{benefit.title}</h3>
                  <p>{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="landing-benefits__cta">
            <Link to="/register" className="landing-btn landing-btn--primary landing-btn--lg">
              Get Started for Free →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section className="landing-cta-section" data-animate id="cta-section">
        <div className={`landing-cta-section__inner ${visibleSections['cta-section'] ? 'animate-in' : ''}`}>
          <div className="landing-cta__bg-orbs">
            <div className="landing-cta__orb" />
            <div className="landing-cta__orb" />
          </div>
          <h2>Ready to Transform Your Society Management?</h2>
          <p>Join 500+ societies that trust SocietySync for transparent, efficient maintenance management.</p>
          <div className="landing-cta__actions">
            <Link to="/register" className="landing-btn landing-btn--white landing-btn--lg">Start Free Trial</Link>
            <a href="mailto:funkariya.shop@gmail.com" className="landing-btn landing-btn--outline-white landing-btn--lg">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="landing-footer" id="contact">
        <div className="landing-footer__inner">
          <div className="landing-footer__top">
            <div className="landing-footer__brand">
              <div className="landing-footer__logo">
                <span>🏘️</span>
                <span className="landing-footer__logo-text">SocietySync</span>
              </div>
              <p className="landing-footer__tagline">
                Smart Society Maintenance Management Platform. 
                Simplify payments, track expenses, and manage your community.
              </p>
              <div className="landing-footer__social">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">𝕏</a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">📷</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">🔗</a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶️</a>
              </div>
            </div>

            <div className="landing-footer__links-group">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#demo">Demo</a>
              <a href="#benefits">Benefits</a>
              <Link to="/register">Sign Up</Link>
            </div>

            <div className="landing-footer__links-group">
              <h4>Company</h4>
              <a href="#home">About Us</a>
              <Link to="/privacy-policy">Privacy Policy</Link>
              <a href="#contact">Terms of Service</a>
              <a href="mailto:funkariya.shop@gmail.com">Contact</a>
            </div>

            <div className="landing-footer__links-group">
              <h4>Support</h4>
              <a href="mailto:funkariya.shop@gmail.com">Help Center</a>
              <a href="mailto:funkariya.shop@gmail.com">Email Support</a>
              <Link to="/login">Login</Link>
              <Link to="/join">Join Society</Link>
            </div>
          </div>

          <div className="landing-footer__bottom">
            <p>© {new Date().getFullYear()} SocietySync. All rights reserved.</p>
            <p>
              Powered by <a href="mailto:funkariya.shop@gmail.com" style={{ fontWeight: 700, color: 'var(--primary-light)' }}>Funkariya</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

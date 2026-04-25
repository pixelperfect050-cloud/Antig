import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const trailRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const trail = trailRef.current;
    const glow = glowRef.current;
    if (!cursor || !trail || !glow) return;

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    const move = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
      setTimeout(() => {
        trail.style.left = mouseX + 'px';
        trail.style.top = mouseY + 'px';
      }, 80);
    };

    // Smooth glow follow with lerp
    let rafId;
    const animateGlow = () => {
      glowX += (mouseX - glowX) * 0.06;
      glowY += (mouseY - glowY) * 0.06;
      glow.style.left = glowX + 'px';
      glow.style.top = glowY + 'px';
      rafId = requestAnimationFrame(animateGlow);
    };
    rafId = requestAnimationFrame(animateGlow);

    const addHover = (cls) => () => cursor.classList.add(cls);
    const removeHover = (cls) => () => cursor.classList.remove(cls);

    document.addEventListener('mousemove', move);

    const observe = () => {
      document.querySelectorAll('.btn-pill, a, button').forEach((el) => {
        el.addEventListener('mouseenter', addHover('cursor-hover-btn'));
        el.addEventListener('mouseleave', removeHover('cursor-hover-btn'));
      });
      document.querySelectorAll('h1, h2, h3, p, span').forEach((el) => {
        el.addEventListener('mouseenter', addHover('cursor-hover-text'));
        el.addEventListener('mouseleave', removeHover('cursor-hover-text'));
      });
    };

    observe();
    const interval = setInterval(observe, 2000);

    return () => {
      document.removeEventListener('mousemove', move);
      clearInterval(interval);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Large soft glow that follows mouse with delay */}
      <div ref={glowRef} className="cursor-glow hidden lg:block" />
      {/* Main cursor dot */}
      <div ref={cursorRef} className="custom-cursor hidden lg:block" />
      {/* Trail dot */}
      <div ref={trailRef} className="custom-cursor-trail hidden lg:block" />
    </>
  );
}

import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const trailRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show custom cursor on desktop with fine pointer
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!hasFinePointer || window.innerWidth < 1024) return;

    const cursor = cursorRef.current;
    const trail = trailRef.current;
    if (!cursor || !trail) return;

    let mouseX = -100, mouseY = -100;
    let trailX = -100, trailY = -100;
    let rafId;

    const move = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) setIsVisible(true);
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    };

    // Smooth trail animation using RAF
    const animateTrail = () => {
      trailX += (mouseX - trailX) * 0.15;
      trailY += (mouseY - trailY) * 0.15;
      trail.style.left = trailX + 'px';
      trail.style.top = trailY + 'px';
      rafId = requestAnimationFrame(animateTrail);
    };
    rafId = requestAnimationFrame(animateTrail);

    const addHover = () => cursor.classList.add('cursor-hover-btn');
    const removeHover = () => cursor.classList.remove('cursor-hover-btn');

    document.addEventListener('mousemove', move);

    const observe = () => {
      document.querySelectorAll('a, button, [role="button"], .btn-pill, input, textarea, select').forEach((el) => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
        el.addEventListener('mouseenter', addHover);
        el.addEventListener('mouseleave', removeHover);
      });
    };

    observe();
    const interval = setInterval(observe, 2000);

    // Add hide-cursor class to body
    document.body.classList.add('hide-cursor');

    return () => {
      document.removeEventListener('mousemove', move);
      clearInterval(interval);
      cancelAnimationFrame(rafId);
      document.body.classList.remove('hide-cursor');
    };
  }, []);

  return (
    <>
      {/* Main PenTool cursor - filled orange with white stroke for visibility */}
      <div ref={cursorRef} className="custom-cursor" style={{ display: isVisible ? 'block' : 'none' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Shadow layer */}
          <g transform="translate(1, 1)" opacity="0.2">
            <path d="m12 19 7-7 3 3-7 7-3-3z" fill="#000" />
            <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" fill="#000" />
          </g>
          {/* Main pen body - filled orange */}
          <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" fill="#ff7a18" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
          {/* Pen nib - darker orange */}
          <path d="m12 19 7-7 3 3-7 7-3-3z" fill="#EA580C" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
          {/* Line from corner */}
          <path d="m2 2 7.586 7.586" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          {/* Center circle */}
          <circle cx="11" cy="11" r="2" fill="#fff" stroke="#EA580C" strokeWidth="0.8" />
        </svg>
      </div>
      {/* Trail dot */}
      <div ref={trailRef} className="custom-cursor-trail" style={{ display: isVisible ? 'block' : 'none' }} />
    </>
  );
}

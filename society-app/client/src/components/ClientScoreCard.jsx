import { useState, useEffect, useRef } from 'react';
import ClientScoreModal from './ClientScoreModal';

const ClientScoreCard = ({ 
  client, 
  score, 
  breakdown = {},
  onClick,
  size = 'medium'
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);
  
  const getScoreStatus = (score) => {
    if (score >= 70) return 'healthy';
    if (score >= 40) return 'risky';
    return 'critical';
  };
  
  const status = getScoreStatus(score);
  const statusLabels = {
    healthy: 'Healthy',
    risky: 'Risky',
    critical: 'Critical'
  };
  const statusIcons = {
    healthy: '🟢',
    risky: '🟡',
    critical: '🔴'
  };
  
  const ringSize = size === 'large' ? 100 : size === 'small' ? 60 : 80;
  const strokeWidth = size === 'large' ? 10 : size === 'small' ? 6 : 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          animateScore();
        }
      },
      { threshold: 0.3 }
    );
    
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  const animateScore = () => {
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };
  
  const progress = animatedScore / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div 
      ref={cardRef}
      className={`client-card ${status} ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}
      onClick={() => onClick?.(client)}
      style={{ 
        animationDelay: `${Math.random() * 0.3}s`,
        '--card-accent': status === 'healthy' ? 'var(--score-healthy)' : 
                         status === 'risky' ? 'var(--score-risky)' : 'var(--score-critical)'
      }}
    >
      <div className="client-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="client-avatar">
            {client.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div className="client-info">
            <h3>{client.name}</h3>
            <p>{client.type || 'Individual'}</p>
          </div>
        </div>
        
        <div className="score-ring-container" style={{ width: ringSize, height: ringSize }}>
          <svg 
            className="score-ring" 
            width={ringSize} 
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
          >
            <circle
              className="score-ring-bg"
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
            />
            {isVisible && (
              <circle
                className={`score-ring-fill ${status}`}
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  strokeDashoffset: circumference * (1 - progress),
                  transition: 'stroke-dashoffset 1.5s ease-out'
                }}
              />
            )}
          </svg>
          <div className="score-value" style={{ fontSize: size === 'small' ? '1rem' : size === 'large' ? '2rem' : '1.5rem' }}>
            {animatedScore}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.75rem' }}>{statusIcons[status]}</span>
        <span className={`ca-badge ca-badge-${status}`}>
          {statusLabels[status]}
        </span>
      </div>
      
      {breakdown && Object.keys(breakdown).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {Object.entries(breakdown).map(([key, value]) => (
            <div 
              key={key} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '0.75rem',
                color: value > 0 ? 'var(--score-critical)' : 'var(--text-muted)'
              }}
            >
              <span style={{ opacity: value > 0 ? 1 : 0.4 }}>
                {key === 'lateReplies' && '⏰'}
                {key === 'missingDocs' && '📄'}
                {key === 'delays' && '⚠️'}
                {key === 'pendingFees' && '💰'}
                {key === 'inactivity' && '📵'}
              </span>
              <span style={{ opacity: value > 0 ? 1 : 0.5 }}>
                {value > 0 ? `${value} ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}` : '✓ All clear'}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <button className="ca-btn ca-btn-ghost ca-btn-sm" style={{ flex: 1 }}>
          📲 WhatsApp
        </button>
        <button className="ca-btn ca-btn-ghost ca-btn-sm" style={{ flex: 1 }}>
          📞 Call
        </button>
        <button className="ca-btn ca-btn-ghost ca-btn-sm" style={{ flex: 1 }}>
          📎 Docs
        </button>
      </div>
    </div>
  );
};

export default ClientScoreCard;

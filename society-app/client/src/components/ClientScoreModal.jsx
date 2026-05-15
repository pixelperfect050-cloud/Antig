import { useState, useEffect } from 'react';
import { generateAISuggestions, generatePendingTasks } from '../utils/aiHelper';

const ClientScoreModal = ({ client, score, breakdown, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && client) {
      loadAIInsights();
    }
  }, [isOpen, client]);

  const loadAIInsights = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAiSuggestions(generateAISuggestions(client, breakdown));
      setPendingTasks(generatePendingTasks(client, breakdown));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getScoreStatus = (score) => {
    if (score >= 70) return 'healthy';
    if (score >= 40) return 'risky';
    return 'critical';
  };

  const status = getScoreStatus(score);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'ai', label: 'AI Insights', icon: '🤖' },
    { id: 'comm', label: 'Chat', icon: '💬' },
  ];

  const breakdownItems = [
    { key: 'lateReplies', label: 'Late Replies', icon: '⏰', maxScore: 20 },
    { key: 'missingDocs', label: 'Missing Documents', icon: '📄', maxScore: 25 },
    { key: 'delays', label: 'Filing Delays', icon: '⚠️', maxScore: 20 },
    { key: 'pendingFees', label: 'Pending Fees', icon: '💰', maxScore: 20 },
    { key: 'inactivity', label: 'Inactivity', icon: '📵', maxScore: 15 },
  ];

  return (
    <div className="ca-modal-overlay" onClick={onClose}>
      <div className="ca-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="ca-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="client-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
              {client?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="ca-modal-title">{client?.name}</h2>
              <span className={`ca-badge ca-badge-${status}`} style={{ fontSize: '0.65rem' }}>
                Health Score: {score}/100
              </span>
            </div>
          </div>
          <button className="ca-modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '4px', 
          padding: '8px 16px',
          overflowX: 'auto',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="ca-modal-body">
          {activeTab === 'overview' && (
            <div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div className="story-card">
                  <div className="story-card-content">
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{score}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Health Score</div>
                  </div>
                </div>
                <div className="story-card">
                  <div className="story-card-content">
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{client?.totalDocs || 12}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Documents</div>
                  </div>
                </div>
                <div className="story-card">
                  <div className="story-card-content">
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{client?.completedTasks || 8}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tasks Done</div>
                  </div>
                </div>
              </div>

              <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>Score Breakdown</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {breakdownItems.map(item => {
                  const value = breakdown?.[item.key] || 0;
                  const deductedScore = Math.round((value / item.maxScore) * 100);
                  const remainingScore = item.maxScore - deductedScore;
                  
                  return (
                    <div key={item.key}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '6px',
                        fontSize: '0.8rem'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{item.icon}</span>
                          {item.label}
                        </span>
                        <span style={{ color: value > 0 ? 'var(--score-critical)' : 'var(--score-healthy)' }}>
                          {value > 0 ? `-${deductedScore}` : `+${item.maxScore}`}
                        </span>
                      </div>
                      <div style={{ 
                        height: '6px', 
                        background: 'var(--bg-secondary)', 
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(remainingScore / item.maxScore) * 100}%`,
                          background: value > 0 
                            ? `linear-gradient(90deg, var(--score-critical), var(--score-risky))`
                            : 'linear-gradient(90deg, var(--score-healthy), #34d399)',
                          borderRadius: '3px',
                          transition: 'width 1s ease-out'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              {[
                { icon: '📄', title: 'ITR Filed', desc: 'FY 2023-24 return submitted', time: '2 days ago', color: 'var(--score-healthy)' },
                { icon: '⏰', title: 'Reminder Sent', desc: 'GSTR-3B due in 5 days', time: '5 hours ago', color: 'var(--score-risky)' },
                { icon: '📤', title: 'Document Uploaded', desc: 'Bank statement April 2024', time: '1 day ago', color: 'var(--brand-primary)' },
                { icon: '💬', title: 'Follow-up Call', desc: 'Discussed pending invoices', time: '3 days ago', color: 'var(--brand-accent)' },
                { icon: '⚠️', title: 'AI Warning', desc: 'GST mismatch detected', time: '1 week ago', color: 'var(--score-critical)' },
              ].map((item, i) => (
                <div key={i} className="timeline-card" style={{ 
                  '--timeline-color': item.color,
                  marginBottom: i < 4 ? '16px' : 0
                }}>
                  <div className="timeline-icon">{item.icon}</div>
                  <div className="timeline-title">{item.title}</div>
                  <div className="timeline-desc">{item.desc}</div>
                  <div className="timeline-time">{item.time}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'ITR Acknowledgment', type: 'Income Tax', status: 'uploaded', date: 'Apr 15, 2024' },
                { name: 'Form 16', type: 'Income Tax', status: 'uploaded', date: 'Mar 20, 2024' },
                { name: 'GSTR-3B Returns', type: 'GST', status: 'pending', date: 'Due May 20' },
                { name: 'Balance Sheet', type: 'Financial', status: 'missing', date: 'Required' },
                { name: 'Bank Statements', type: 'Financial', status: 'partial', date: 'Mar 2024 only' },
              ].map((doc, i) => (
                <div key={i} className="task-card">
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px',
                    background: doc.status === 'uploaded' ? 'rgba(16,185,129,0.15)' : 
                               doc.status === 'missing' ? 'rgba(239,68,68,0.15)' :
                               'rgba(245,158,11,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    {doc.status === 'uploaded' ? '✅' : doc.status === 'missing' ? '❌' : '⏳'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{doc.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {doc.type} • {doc.date}
                    </div>
                  </div>
                  <span className={`ca-badge ca-badge-${doc.status === 'uploaded' ? 'healthy' : doc.status === 'missing' ? 'critical' : 'risky'}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <h4 style={{ marginBottom: '16px', fontSize: '0.9rem' }}>Pending Tasks</h4>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '12px' }} />
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingTasks.map((task, i) => (
                    <div key={i} className={`task-card ${task.urgent ? 'urgent' : ''}`}>
                      <div className="task-checkbox">
                        {task.completed && '✓'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{task.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {task.description}
                        </div>
                      </div>
                      {task.urgent && (
                        <span className="ca-badge ca-badge-critical">Urgent</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '16px',
                padding: '12px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
                borderRadius: '12px',
                border: '1px solid rgba(99,102,241,0.2)'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🤖</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Analysis</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Based on client history and patterns
                  </div>
                </div>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {aiSuggestions.map((suggestion, i) => (
                    <div key={i} className="ai-suggestion">
                      <div className="ai-suggestion-icon">
                        {suggestion.type === 'warning' ? '⚠️' : 
                         suggestion.type === 'action' ? '🎯' : '💡'}
                      </div>
                      <div className="ai-suggestion-content">
                        <h4>{suggestion.title}</h4>
                        <p>{suggestion.description}</p>
                      </div>
                      <button className="ca-btn ca-btn-primary ca-btn-sm">
                        {suggestion.action}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comm' && (
            <div>
              <div style={{ 
                background: 'var(--wa-bg)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div className="wa-chat-bubble wa-bubble-sent" style={{ marginBottom: '8px' }}>
                  Hi, please send your April bank statement for GST filing.
                </div>
                <div className="wa-bubble-time">
                  10:30 AM ✓✓
                </div>

                <div className="wa-chat-bubble wa-bubble-received" style={{ marginTop: '12px' }}>
                  Sure, will send by tomorrow.
                </div>
                <div className="wa-bubble-time" style={{ justifyContent: 'flex-start' }}>
                  10:45 AM ✓✓
                </div>

                <div className="wa-chat-bubble wa-bubble-received" style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Typing...</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="ca-input" 
                  placeholder="Type a message..."
                  style={{ flex: 1 }}
                />
                <button className="ca-btn ca-btn-primary">
                  📤
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="ca-btn ca-btn-ghost ca-btn-sm" style={{ flex: 1 }}>
                  📎 Quick Reply
                </button>
                <button className="ca-btn ca-btn-ghost ca-btn-sm" style={{ flex: 1 }}>
                  🔔 Send Reminder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientScoreModal;

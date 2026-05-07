import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const FlatGrid = () => {
  const { blockId } = useParams();
  const navigate = useNavigate();
  const [flats, setFlats] = useState([]);
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [blockId]);

  const fetchData = async () => {
    try {
      const [flatsData, blockData] = await Promise.all([
        api.get(`/api/flats/block/${blockId}`),
        api.get(`/api/blocks/${blockId}`)
      ]);
      setFlats(flatsData);
      setBlock(blockData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFlats = flats.filter(f => filter === 'all' || f.currentMonthStatus === filter);

  // Group flats by floor
  const floors = {};
  filteredFlats.forEach(flat => {
    if (!floors[flat.floor]) floors[flat.floor] = [];
    floors[flat.floor].push(flat);
  });

  const statusCounts = {
    all: flats.length,
    paid: flats.filter(f => f.currentMonthStatus === 'paid').length,
    pending: flats.filter(f => f.currentMonthStatus === 'pending').length,
    partial: flats.filter(f => f.currentMonthStatus === 'partial').length
  };

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <Link to="/blocks" className="breadcrumb-link">Blocks</Link>
            <span className="breadcrumb-sep">›</span>
            <span>Block {block?.name}</span>
          </div>
          <h1 className="page-title">Block {block?.name} - Flats</h1>
          <p className="page-subtitle">{block?.totalFloors} Floors • {flats.length} Flats</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {[
          { key: 'all', label: 'All', icon: '📋' },
          { key: 'paid', label: 'Paid', icon: '✅' },
          { key: 'pending', label: 'Pending', icon: '⏳' },
          { key: 'partial', label: 'Partial', icon: '🔶' }
        ].map(tab => (
          <button key={tab.key}
            className={`filter-tab ${filter === tab.key ? 'active' : ''} filter-tab--${tab.key}`}
            onClick={() => setFilter(tab.key)} id={`filter-${tab.key}`}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className="filter-count">{statusCounts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Visual Legend */}
      <div className="flat-grid-legend" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem', background: 'var(--bg-input)', borderRadius: '12px' }}>
        <div className="legend-item-flat"><span className="legend-color" style={{ background: '#10b981' }}></span> Paid</div>
        <div className="legend-item-flat"><span className="legend-color" style={{ background: '#ef4444' }}></span> Pending</div>
        <div className="legend-item-flat"><span className="legend-color" style={{ background: '#f59e0b' }}></span> Partial</div>
        <div className="legend-item-flat"><span className="legend-color" style={{ background: 'var(--text-muted)' }}></span> Vacant</div>
      </div>

      {/* Flat Grid by Floor */}
      <div className="floor-sections">
        {Object.keys(floors).sort((a, b) => b - a).map(floor => (
          <div key={floor} className="floor-section" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', paddingLeft: '0.5rem', borderLeft: '3px solid var(--primary)' }}>FLOOR {floor}</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', 
              gap: '0.75rem',
              padding: '0.5rem'
            }}>
              {floors[floor].map(flat => (
                <div key={flat._id}
                  onClick={() => navigate(`/flats/${flat._id}`)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: flat.currentMonthStatus === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 
                               flat.currentMonthStatus === 'pending' ? 'rgba(239, 68, 68, 0.1)' :
                               flat.currentMonthStatus === 'partial' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-input)',
                    border: `2px solid ${
                      flat.currentMonthStatus === 'paid' ? '#10b981' : 
                      flat.currentMonthStatus === 'pending' ? '#ef4444' :
                      flat.currentMonthStatus === 'partial' ? '#f59e0b' : 'var(--border)'
                    }`,
                    color: flat.currentMonthStatus === 'paid' ? '#10b981' : 
                           flat.currentMonthStatus === 'pending' ? '#ef4444' :
                           flat.currentMonthStatus === 'partial' ? '#f59e0b' : 'var(--text-muted)',
                    boxShadow: 'var(--shadow)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                  id={`flat-${flat.number}`}>
                  <span style={{ fontSize: '1rem', fontWeight: '800' }}>{flat.number}</span>
                  <span style={{ fontSize: '0.5rem', opacity: 0.7, textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {flat.isOccupied ? (flat.ownerName?.split(' ')[0] || 'Member') : 'Vacant'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredFlats.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2>No flats found</h2>
          <p>No flats match the selected filter</p>
        </div>
      )}
    </div>
  );
};

export default FlatGrid;

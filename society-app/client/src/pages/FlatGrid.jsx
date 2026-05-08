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
      <header className="page-header">
        <div className="page-title-group">
          <div className="breadcrumb flex items-center gap-1 text-xs text-secondary mb-1">
            <Link to="/blocks" className="hover:text-primary">Blocks</Link>
            <span>›</span>
            <span className="font-bold text-text">Block {block?.name}</span>
          </div>
          <h1 className="page-title">Block {block?.name}</h1>
          <p className="page-subtitle">{block?.totalFloors} Floors • {flats.length} Flats</p>
        </div>
      </header>

      {/* Responsive Filter Tabs */}
      <div className="filter-tabs mb-6">
        {[
          { key: 'all', label: 'All', icon: '📋' },
          { key: 'paid', label: 'Paid', icon: '✅' },
          { key: 'pending', label: 'Pending', icon: '⏳' },
          { key: 'partial', label: 'Partial', icon: '🔶' }
        ].map(tab => (
          <button 
            key={tab.key}
            className={`filter-tab ${filter === tab.key ? 'active' : ''} filter-tab--${tab.key}`}
            onClick={() => setFilter(tab.key)}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="font-bold">{tab.label}</span>
            <span className="filter-count">{statusCounts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Legend - Responsive and Clean */}
      <div className="card mb-6 p-4 bg-slate-50 border-dashed">
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          <div className="legend-item-flat flex items-center gap-2 text-xs font-bold">
            <span className="w-3 h-3 rounded-full bg-success"></span> Paid
          </div>
          <div className="legend-item-flat flex items-center gap-2 text-xs font-bold">
            <span className="w-3 h-3 rounded-full bg-danger"></span> Pending
          </div>
          <div className="legend-item-flat flex items-center gap-2 text-xs font-bold">
            <span className="w-3 h-3 rounded-full bg-warning"></span> Partial
          </div>
          <div className="legend-item-flat flex items-center gap-2 text-xs font-bold text-muted">
            <span className="w-3 h-3 rounded-full bg-slate-300"></span> Vacant
          </div>
        </div>
      </div>

      {/* Flat Grid by Floor */}
      <div className="floor-sections flex flex-col gap-8">
        {Object.keys(floors).sort((a, b) => b - a).map(floor => (
          <div key={floor} className="floor-section">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="h-6 w-1 bg-primary rounded-full"></div>
              <h3 className="text-xs font-black text-secondary tracking-widest uppercase">FLOOR {floor}</h3>
            </div>
            
            <div className="flat-grid">
              {floors[floor].map(flat => (
                <div 
                  key={flat._id}
                  className={`flat-cell flat-cell--${flat.currentMonthStatus || 'vacant'}`}
                  onClick={() => navigate(`/flats/${flat._id}`)}
                  style={{
                    background: flat.currentMonthStatus === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 
                               flat.currentMonthStatus === 'pending' ? 'rgba(239, 68, 68, 0.1)' :
                               flat.currentMonthStatus === 'partial' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-input)',
                    border: `2px solid ${
                      flat.currentMonthStatus === 'paid' ? 'var(--success)' : 
                      flat.currentMonthStatus === 'pending' ? 'var(--danger)' :
                      flat.currentMonthStatus === 'partial' ? 'var(--warning)' : 'var(--border)'
                    }`,
                    color: flat.currentMonthStatus === 'paid' ? 'var(--success)' : 
                           flat.currentMonthStatus === 'pending' ? 'var(--danger)' :
                           flat.currentMonthStatus === 'partial' ? 'var(--warning)' : 'var(--text-muted)'
                  }}
                >
                  <span className="text-lg font-black tracking-tighter">{flat.number}</span>
                  <span className="text-[9px] font-bold opacity-70 truncate w-full text-center px-1">
                    {flat.isOccupied ? (flat.ownerName?.split(' ')[0] || 'Member') : 'VACANT'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredFlats.length === 0 && (
        <div className="empty-state p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-bold">No flats found</h2>
          <p className="text-secondary">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

export default FlatGrid;

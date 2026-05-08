const StatsCard = ({ icon, label, value, subValue, color = 'primary', trend }) => {
  return (
    <div className={`stats-card stats-card--${color}`}>
      <div className="stats-card__icon">{icon}</div>
      <div className="stats-card__content">
        <span className="stats-card__label">{label}</span>
        <span className="stats-card__value">{value}</span>
        {subValue && <span className="stats-card__sub">{subValue}</span>}
        {trend && (
          <span className={`stats-card__trend ${trend > 0 ? 'up' : 'down'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;

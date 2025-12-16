export default function SensorCard({ title, value, unit, status, icon, color }) {
  // Map bootstrap text classes to hex colors for backgrounds
  const getColor = (c) => {
    if (c?.includes('warning')) return '#ff8d72'; // Orange
    if (c?.includes('info')) return '#1d8cf8';    // Blue
    if (c?.includes('success')) return '#00f2c3'; // Green
    if (c?.includes('danger')) return '#fd625d';  // Pink/Red
    return '#8993a2'; // Secondary/Grey
  };

  const accentColor = getColor(color);
  const bgOpacity = '0.1';
  
  // Calculate RGB for shadow and background
  const r = parseInt(accentColor.slice(1,3), 16);
  const g = parseInt(accentColor.slice(3,5), 16);
  const b = parseInt(accentColor.slice(5,7), 16);
  const shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`;

  return (
    <div className="card mb-4" style={{
      background: '#27293d',
      border: 'none',
      borderRadius: '12px',
      boxShadow: `0 4px 20px 0 rgba(0,0,0,.14), 0 7px 10px -5px ${shadowColor}`,
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Accent Line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: '4px',
        background: accentColor
      }} />

      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between">
          
          {/* Icon Section */}
          <div className="d-flex align-items-center justify-content-center shadow-sm" style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: `rgba(${r}, ${g}, ${b}, ${bgOpacity})`,
            color: accentColor,
            fontSize: '1.8rem'
          }}>
            {icon}
          </div>

          {/* Text Section */}
          <div className="text-end">
            <p className="card-category mb-1" style={{
              color: 'rgba(255,255,255,0.6)', 
              fontSize: '0.85rem', 
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {title}
            </p>
            <h3 className="card-title mb-0" style={{
              color: 'white', 
              fontWeight: '600',
              fontSize: '1.8rem'
            }}>
              {value} <small style={{fontSize: '0.6em', opacity: 0.8}}>{unit}</small>
            </h3>
          </div>
        </div>

        {/* Footer / Status */}
        <div className="mt-4 pt-3 d-flex align-items-center border-top border-secondary" style={{borderColor: 'rgba(255,255,255,0.1) !important'}}>
          <div style={{
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: accentColor,
            marginRight: '8px',
            boxShadow: `0 0 10px ${accentColor}`
          }} />
          <span style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem'}}>
            {status || "Atualizado agora"}
          </span>
        </div>
      </div>
    </div>
  );
}

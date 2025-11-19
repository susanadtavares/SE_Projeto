export default function SensorCard({ title, value, unit, status }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 36, fontWeight: 700 }}>{value ?? "--"}</span>
        <span style={{ opacity: .8 }}>{unit}</span>
      </div>
      {status && (
        <div style={{
          marginTop: 8,
          display: "inline-block",
          padding: "4px 8px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.08)"
        }}>
          {status}
        </div>
      )}
    </div>
  );
}

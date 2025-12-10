export default function SensorCard({ title, value, unit, status, icon, color }) {
  return (
    <div className="card card-stats">
      <div className="card-body">
        <div className="row">
          <div className="col-5">
            <div className="info-icon text-center icon-warning">
              <i className={`${icon} ${color}`} style={{fontSize: "2.5rem"}}></i>
            </div>
          </div>
          <div className="col-7">
            <div className="numbers">
              <p className="card-category">{title}</p>
              <h3 className="card-title">
                {value ?? "--"} <small>{unit}</small>
              </h3>
            </div>
          </div>
        </div>
      </div>
      <div className="card-footer">
        <hr />
        <div className="stats">
          <i className="tim-icons icon-sound-wave" /> {status || "Atualizado agora"}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/alerts")
      .then((res) => res.json())
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao buscar alertas:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Carregando alertas...</div>;

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Histórico de Alertas</h2>
      
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Sensor</th>
                  <th>Mensagem</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">Nenhum alerta registado.</td>
                  </tr>
                ) : (
                  alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>{new Date(alert.timestamp).toLocaleString()}</td>
                      <td>{alert.sensor_name || alert.sensor_id}</td>
                      <td>{alert.message}</td>
                      <td>
                        <span 
                          className={`badge ${
                            alert.type === 'critical' ? 'bg-danger' : 
                            alert.type === 'warning' ? 'bg-warning text-dark' : 
                            'bg-info'
                          }`}
                        >
                          {alert.type === 'critical' ? 'Crítico' : 
                           alert.type === 'warning' ? 'Aviso' : 'Info'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

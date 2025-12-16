import { useState, useEffect } from "react";

export default function Sensors() {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/sensors")
      .then((res) => res.json())
      .then((data) => {
        setSensors(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao buscar sensores:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Carregando sensores...</div>;

  return (
    <div className="content">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Sensores Conectados</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table tablesorter">
                  <thead className="text-primary">
                    <tr>
                      <th>Nome</th>
                      <th>Localização</th>
                      <th>Status</th>
                      <th>Última Atualização</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensors.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center">Nenhum sensor encontrado.</td>
                      </tr>
                    ) : (
                      sensors.map((sensor) => (
                        <tr key={sensor.id}>
                          <td>{sensor.name}</td>
                          <td>{sensor.location}</td>
                          <td>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                background: sensor.status === "active" ? "rgba(0, 255, 0, 0.1)" : "rgba(255, 0, 0, 0.1)",
                                color: sensor.status === "active" ? "#00d455" : "#ff3d00",
                                fontSize: "0.85rem",
                                fontWeight: "bold"
                              }}
                            >
                              {sensor.status === "active" ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td>{new Date(sensor.last_seen).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { FaFire, FaExclamationTriangle, FaInfoCircle, FaSearch, FaClock, FaUserShield, FaBellSlash, FaTrash, FaEllipsisV } from "react-icons/fa";
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";

const BASE_URL = import.meta?.env?.VITE_API_URL ?? "http://localhost:3001";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = () => {
    const params = new URLSearchParams();
    if (user.email) params.append("email", user.email);
    if (user.role) params.append("role", user.role);

    fetch(`${BASE_URL}/api/alerts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao buscar alertas:", err);
        setLoading(false);
      });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem a certeza que deseja eliminar este alerta?")) return;

    try {
      const res = await fetch(`${BASE_URL}/api/alerts/${id}`, {
        method: "DELETE"
      });
      
      if (!res.ok) throw new Error("Erro ao eliminar alerta");
      
      fetchAlerts();
    } catch (err) {
      console.error("Erro:", err);
      alert("Erro ao eliminar alerta");
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    alert.message.toLowerCase().includes(filter.toLowerCase()) ||
    alert.type.toLowerCase().includes(filter.toLowerCase()) ||
    (alert.user_email && alert.user_email.toLowerCase().includes(filter.toLowerCase()))
  );

  const getTypeStyles = (type) => {
    switch(type) {
      case 'critical': return { color: '#fd625d', bg: 'rgba(253, 98, 93, 0.1)', icon: <FaFire /> };
      case 'warning': return { color: '#ff8d72', bg: 'rgba(255, 141, 114, 0.1)', icon: <FaExclamationTriangle /> };
      default: return { color: '#1d8cf8', bg: 'rgba(29, 140, 248, 0.1)', icon: <FaInfoCircle /> };
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: "60vh"}}>
        <div className="spinner-border text-primary" role="status" style={{width: "3rem", height: "3rem"}}>
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      {/* Header Section */}
      <div className="row mb-4 align-items-end">
        <div className="col-md-6">
          <h2 className="title m-0" style={{fontWeight: 700, color: 'white'}}>Centro de Alertas</h2>
          <p className="m-0" style={{color: 'rgba(255, 255, 255, 0.6)'}}>Monitorização de eventos e segurança em tempo real.</p>
        </div>
        <div className="col-md-6 mt-3 mt-md-0">
          <div className="input-group no-border" style={{background: '#2b3553', borderRadius: '30px', padding: '8px 20px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <span className="input-group-text bg-transparent border-0 p-0 me-2" style={{color: 'rgba(255,255,255,0.8)'}}><FaSearch /></span>
            <input 
              type="text" 
              className="form-control border-0 text-white p-0 bg-transparent-important" 
              placeholder="Pesquisar por mensagem, tipo ou cliente..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{boxShadow: 'none', height: 'auto'}}
            />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="row">
        <div className="col-12">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-5" style={{opacity: 0.6}}>
              <FaBellSlash size={60} className="mb-3 text-white-50" />
              <h4>Nenhum alerta encontrado</h4>
              <p className="text-white-50">O sistema está seguro e sem registos recentes.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {filteredAlerts.map((alert) => {
                const style = getTypeStyles(alert.type);
                return (
                  <div key={alert.id} className="card mb-0" style={{
                    borderLeft: `4px solid ${style.color}`,
                    background: '#27293d',
                    transition: 'transform 0.2s',
                    cursor: 'default'
                  }}>
                    <div className="card-body p-2">
                      <div className="d-flex align-items-center">
                        {/* Icon */}
                        <div className="flex-shrink-0 d-flex align-items-center justify-content-center" style={{
                          width: '40px', height: '40px', 
                          borderRadius: '50%', 
                          background: style.bg,
                          color: style.color,
                          fontSize: '1.2rem'
                        }}>
                          {style.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-grow-1 ms-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h5 className="mb-1 text-white" style={{fontWeight: 600, fontSize: '1rem'}}>
                                {alert.message}
                              </h5>
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge" style={{
                                  background: style.bg, 
                                  color: style.color, 
                                  border: `1px solid ${style.color}`,
                                  fontSize: '0.7rem',
                                  padding: '0.35em 0.65em'
                                }}>
                                  {alert.type.toUpperCase()}
                                </span>
                                {isAdmin && alert.user_email && (
                                  <small className="d-flex align-items-center" style={{color: 'rgba(255,255,255,0.7)'}}>
                                    <FaUserShield className="me-1" /> {alert.user_email}
                                  </small>
                                )}
                              </div>
                            </div>
                            
                            {/* Time & Actions */}
                            <div className="d-flex align-items-center gap-3">
                              <div className="text-end" style={{minWidth: '120px', color: 'rgba(255,255,255,0.9)'}}>
                                <small className="d-flex align-items-center justify-content-end" style={{fontWeight: 500}}>
                                  <FaClock className="me-1" /> 
                                  {new Date(alert.timestamp).toLocaleDateString()}
                                </small>
                                <small style={{fontSize: '0.75rem', opacity: 0.9}}>
                                  {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </small>
                              </div>
                              
                              {isAdmin && (
                                <UncontrolledDropdown>
                                  <DropdownToggle
                                    color="link"
                                    className="btn-icon"
                                    style={{ color: "#8993a2", boxShadow: "none" }}
                                  >
                                    <FaEllipsisV />
                                  </DropdownToggle>
                                  <DropdownMenu end style={{ background: "#27293d", border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <DropdownItem
                                      onClick={() => handleDelete(alert.id)}
                                      className="text-danger"
                                      style={{ cursor: "pointer" }}
                                    >
                                      <FaTrash className="me-2" /> Eliminar
                                    </DropdownItem>
                                  </DropdownMenu>
                                </UncontrolledDropdown>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

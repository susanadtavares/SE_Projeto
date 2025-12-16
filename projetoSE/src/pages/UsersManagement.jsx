import { useState, useEffect } from "react";
import { FaUserPlus, FaTrash, FaEnvelope, FaUserShield, FaSearch, FaUsers, FaEllipsisV } from "react-icons/fa";
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import "../styles/black-dashboard.css";

const BASE_URL = import.meta?.env?.VITE_API_URL ?? "http://localhost:3001";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState({ email: "" });
  const [createdUser, setCreatedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users`);
      if (!res.ok) throw new Error("Falha ao carregar utilizadores");
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreatedUser(null);
    setError("");

    try {
      const res = await fetch(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: newUser.email })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao criar");
      }

      const data = await res.json();
      setCreatedUser(data);
      setNewUser({ email: "" });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Tem a certeza que deseja remover este utilizador?")) return;

    try {
      const res = await fetch(`${BASE_URL}/api/users/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erro ao apagar");
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="content">
      {/* Header */}
      <div className="row mb-4 align-items-end">
        <div className="col-md-6">
          <h2 className="title m-0" style={{fontWeight: 700, color: 'white'}}>Gestão de Utilizadores</h2>
          <p className="m-0" style={{color: 'rgba(255, 255, 255, 0.6)'}}>Administração de contas e permissões de acesso.</p>
        </div>
      </div>

      <div className="row">
        {/* Create User Card */}
        <div className="col-md-4 mb-4">
          <div className="card h-100" style={{background: '#27293d', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px 0 rgba(0,0,0,.14)'}}>
            <div className="card-header mb-3">
              <h4 className="card-title d-flex align-items-center gap-2" style={{color: '#fd625d'}}>
                <FaUserPlus /> Novo Utilizador
              </h4>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger p-2 small">{error}</div>}
              {createdUser && (
                <div className="alert alert-success p-2 small">
                  <strong>Sucesso!</strong> Credenciais enviadas para {createdUser.email}.
                </div>
              )}
              
              <form onSubmit={handleCreate}>
                <div className="form-group mb-3">
                  <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem'}}>Email do Cliente</label>
                  <div className="input-group" style={{background: '#1e1e2f', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)'}}>
                    <span className="input-group-text bg-transparent border-0" style={{color: 'rgba(255,255,255,0.6)'}}><FaEnvelope /></span>
                    <input 
                      type="email" 
                      className="form-control bg-transparent border-0 text-white" 
                      placeholder="exemplo@iot.com"
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      required
                      style={{boxShadow: 'none'}}
                    />
                  </div>
                </div>
                <button type="submit" className="btn w-100" style={{
                  background: 'linear-gradient(to right, #fd625d, #ec250d)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 600,
                  padding: '10px',
                  borderRadius: '8px'
                }}>
                  Criar Conta
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="col-md-8">
          <div className="card" style={{background: '#27293d', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px 0 rgba(0,0,0,.14)'}}>
            <div className="card-header d-flex justify-content-between align-items-center mb-3">
              <h4 className="card-title m-0">Utilizadores Registados</h4>
              <div className="input-group no-border" style={{width: '200px', background: '#1e1e2f', borderRadius: '20px', padding: '5px 15px'}}>
                <span className="input-group-text bg-transparent border-0 p-0 me-2" style={{color: 'rgba(255,255,255,0.6)'}}><FaSearch size={12} /></span>
                <input 
                  type="text" 
                  className="form-control border-0 text-white p-0 bg-transparent" 
                  placeholder="Pesquisar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{boxShadow: 'none', fontSize: '0.9rem', height: 'auto'}}
                />
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table align-items-center table-flush">
                  <thead style={{color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', textTransform: 'uppercase'}}>
                    <tr>
                      <th style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>Utilizador</th>
                      <th style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>Função</th>
                      <th style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}} className="text-end">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="3" className="text-center py-4">Carregando...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan="3" className="text-center py-4" style={{color: 'rgba(255,255,255,0.6)'}}>Nenhum utilizador encontrado.</td></tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} style={{transition: 'background 0.2s'}}>
                          <td style={{borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '15px 20px'}}>
                            <div className="d-flex align-items-center">
                              <div className="avatar rounded-circle d-flex align-items-center justify-content-center me-3" 
                                style={{width: '36px', height: '36px', background: 'rgba(253, 98, 93, 0.1)', color: '#fd625d', fontWeight: 'bold'}}>
                                {user.email[0].toUpperCase()}
                              </div>
                              <div>
                                <span className="d-block text-white">{user.email}</span>
                                <small style={{color: 'rgba(255,255,255,0.5)'}}>ID: {user.id}</small>
                              </div>
                            </div>
                          </td>
                          <td style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                            <span className="badge" style={{
                              background: user.role === 'admin' ? 'rgba(29, 140, 248, 0.1)' : 'rgba(137, 147, 162, 0.1)',
                              color: user.role === 'admin' ? '#1d8cf8' : '#8993a2',
                              border: '1px solid currentColor'
                            }}>
                              {user.role === 'admin' ? 'Admin' : 'Cliente'}
                            </span>
                          </td>
                          <td className="text-end" style={{borderBottom: '1px solid rgba(255,255,255,0.05)', paddingRight: '20px'}}>
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
                                    onClick={() => handleDelete(user.id)}
                                    className="text-danger"
                                    style={{ cursor: "pointer" }}
                                  >
                                    <FaTrash className="me-2" /> Eliminar
                                  </DropdownItem>
                                </DropdownMenu>
                              </UncontrolledDropdown>
                            )}
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
      </div>
    </div>
  );
}

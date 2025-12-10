import { useState, useEffect } from "react";
import "../styles/black-dashboard.css";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState({ email: "" });
  const [createdUser, setCreatedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/users");
      if (!res.ok) throw new Error("Falha ao carregar utilizadores");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreatedUser(null);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/api/users", {
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
      fetchUsers(); // Recarregar lista
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Tem a certeza?")) return;

    try {
      const res = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erro ao apagar");
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="content">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Gestão de Utilizadores</h2>
            </div>
            <div className="card-body">
              
              {error && <div className="alert alert-danger">{error}</div>}
              
              {createdUser && (
                <div className="alert alert-success">
                  <strong>Utilizador criado com sucesso!</strong><br/>
                  Um email com as credenciais de acesso foi enviado para <strong>{createdUser.email}</strong>.
                </div>
              )}

              {/* Formulário de Criação */}
              <form onSubmit={handleCreate} className="mb-4 p-3" style={{background: "rgba(255,255,255,0.05)", borderRadius: 8}}>
                <h4>Novo Utilizador</h4>
                <div className="row align-items-end">
                  <div className="col-md-8">
                    <label>Email do Cliente</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="exemplo@iot.com"
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <button type="submit" className="btn btn-primary w-100">Gerar Conta</button>
                  </div>
                </div>
              </form>

              {/* Tabela de Utilizadores */}
              <div className="table-responsive">
                <table className="table tablesorter">
                  <thead className="text-primary">
                    <tr>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.email}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(user.id)}
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <p className="text-center mt-3">Nenhum utilizador encontrado.</p>}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

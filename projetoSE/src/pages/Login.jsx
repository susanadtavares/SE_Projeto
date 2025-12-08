import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // login básico (podes trocar por API depois)
    if (user === "admin" && pass === "1234") {
      localStorage.setItem("auth", "true");
      navigate("/");
    } else {
      setError("Credenciais inválidas");
    }
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#1e1e2f",
      color: "white"
    }}>
      <form 
        onSubmit={handleLogin} 
        style={{
          width: 320,
          background: "#27293d",
          padding: 30,
          borderRadius: 12,
          boxShadow: "0 4px 10px rgba(0,0,0,0.4)"
        }}
      >
        <h2 style={{textAlign: "center", marginBottom: 20}}>Login</h2>

        <label>Utilizador</label>
        <input 
          type="text"
          className="form-control mb-3"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />

        <label>Password</label>
        <input 
          type="password"
          className="form-control mb-3"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />

        {error && <p style={{ color: "red", fontSize: 14 }}>{error}</p>}

        <button 
          type="submit"
          className="btn btn-primary w-100"
          style={{marginTop: 10, background: "#e14eca", border: "none"}}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

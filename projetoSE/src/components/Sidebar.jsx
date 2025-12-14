import { NavLink, useNavigate } from "react-router-dom";
import { FaChartPie, FaBell, FaUsers, FaSignOutAlt, FaFire } from "react-icons/fa";
import "../styles/sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userData");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__title">
        <FaFire className="sidebar__logo-icon" />
        <span>Detetor de Incêndio</span>
      </div>

      <nav className="sidebar__nav">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `sidebar__link${isActive ? " is-active" : ""}`
          }
        >
          <FaChartPie className="sidebar__icon" />
          <span className="sidebar__text">Dashboard</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            `sidebar__link${isActive ? " is-active" : ""}`
          }
        >
          <FaBell className="sidebar__icon" />
          <span className="sidebar__text">Alertas</span>
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `sidebar__link${isActive ? " is-active" : ""}`
            }
          >
            <FaUsers className="sidebar__icon" />
            <span className="sidebar__text">Utilizadores</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar__footer">
        <div className="user-info">
          <div className="user-avatar">
            {user.email ? user.email[0].toUpperCase() : "U"}
          </div>
          <div className="user-details">
            <span className="user-email" title={user.email}>{user.email}</span>
            <span className="user-role">{user.role === 'admin' ? 'Administrador' : 'Cliente'}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

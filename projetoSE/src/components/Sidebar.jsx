import { NavLink } from "react-router-dom";
import "../styles/sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
    <h4 className="sidebar__title">
    <NavLink to="/" className="sidebar__home">Dashboard</NavLink>
    </h4>

      <nav className="sidebar__nav">
        <NavLink
          to="/sensors"
          className={({ isActive }) =>
            `sidebar__link${isActive ? " is-active" : ""}`
          }
        >
          <span className="sidebar__text">Sensores</span>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `sidebar__link${isActive ? " is-active" : ""}`
          }
        >
          <span className="sidebar__text">Relatórios</span>
        </NavLink>
      </nav>
    </aside>
  );
}

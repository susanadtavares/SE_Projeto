import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h4 style={{color:'#fff', margin:'0 0 1rem'}}>Dashboard</h4>
      <nav>
        <NavLink to="/" end className={({isActive}) => isActive ? "active" : ""}>Dashboard</NavLink>
        <NavLink to="/sensors" className={({isActive}) => isActive ? "active" : ""}>Sensores</NavLink>
        <NavLink to="/reports" className={({isActive}) => isActive ? "active" : ""}>Relatórios</NavLink>
      </nav>
    </aside>
  );
}

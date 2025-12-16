import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import UsersManagement from "./pages/UsersManagement";
import Alerts from "./pages/Alerts";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./styles/black-dashboard.css";

// Componente para proteger rotas
const PrivateRoute = ({ children, allowedRoles }) => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Redireciona para home se não tiver permissão
  }

  return children;
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas */}
        <Route path="/" element={
          <PrivateRoute allowedRoles={['admin', 'client']}>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </PrivateRoute>
        } />
        
        <Route path="/users" element={
          <PrivateRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <UsersManagement />
            </DashboardLayout>
          </PrivateRoute>
        } />

        <Route path="/settings" element={
          <PrivateRoute allowedRoles={['admin', 'client']}>
            <DashboardLayout>
              <div className="card" style={{padding:16}}>Definições</div>
            </DashboardLayout>
          </PrivateRoute>
        } />

        <Route path="/alerts" element={
          <PrivateRoute allowedRoles={['admin', 'client']}>
            <DashboardLayout>
              <Alerts />
            </DashboardLayout>
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);


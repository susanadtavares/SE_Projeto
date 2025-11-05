import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import "./styles/black-dashboard.css"; // o teu CSS dark

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sensors" element={<div className="card" style={{padding:16}}>Lista de sensores</div>} />
          <Route path="/settings" element={<div className="card" style={{padding:16}}>Definições</div>} />
          <Route path="/reports" element={<div className="card" style={{padding:16}}>Relatórios</div>} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  </StrictMode>
);


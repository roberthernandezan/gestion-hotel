import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import "../styles/Popup.css";

function AdminHome() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-header">
        <h2>Panel de Administración</h2>
        <p>Bienvenido/a al panel de administración. Elige una sección:</p>
      </div>

      <div className="home-buttons-grid">
        <button
          className="home-button main-action"
          onClick={() => navigate("/admin/bebidas")}
        >
          Bebidas
        </button>
        <button
          className="home-button main-action"
          onClick={() => navigate("/huespedes")}
        >
          Huéspedes
        </button>
        <button
          className="home-button main-action"
          onClick={() => navigate("/admin/ordenes")}
        >
          Órdenes
        </button>
        <button
          className="home-button main-action"
          onClick={() => navigate("/admin/reportes")}
        >
          Reportes
        </button>
        <button
          className="home-button main-action"
          onClick={() => navigate("/admin/bares")}
        >
          Bares 
        </button>
        <button
          className="home-button main-action"
          onClick={() => navigate("/admin/empleados")}
        >
          Empleados
        </button>
      </div>
    </div>
  );
}

export default AdminHome;

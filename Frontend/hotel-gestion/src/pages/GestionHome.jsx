import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css"; 

function GestionHome() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-header">
        <h2>Gestión de Huéspedes</h2>
        <p>Bienvenido/a al panel de gestión de huéspedes. Elige una opción:</p>
      </div>
      <div className="home-buttons-grid">
        <button className="home-button main-action"
          onClick={() => navigate("/gestion/huespedes")} >
          Ver Huéspedes Registrados
        </button>
        <button className="home-button main-action"
          onClick={() => navigate("/gestion/habitaciones")} >
          Gestionar Habitaciones
        </button>
        <button className="home-button main-action"
          onClick={() => navigate("/gestion/registroestancias")} >
          Registro Estancias
        </button>
      </div>
    </div>

  );
}

export default GestionHome;

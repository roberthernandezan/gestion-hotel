import React from "react";
import "../styles/Eleccion.css";
import { useNavigate } from "react-router-dom";
import "../styles/Popup.css";

function Eleccion() {
  const navigate = useNavigate();

  return (
    <div className="eleccion-container">
      <div className="eleccion-content">
        <h1 className="eleccion-header">¿Qué gestión deseas realizar?</h1>
        <div className="eleccion-grid">
          <div className="eleccion-card" onClick={() => navigate("/bares")}>
            <h2 className="eleccion-name">Gestión de Órdenes</h2>
            <p className="eleccion-description">
              Administra las órdenes y sus consumiciones.
            </p>
          </div>
          <div className="eleccion-card" onClick={() => navigate("/gestion-login")}>
            <h2 className="eleccion-name">Gestión de Huéspedes</h2>
            <p className="eleccion-description">
              Gestiona huéspedes, habitaciones y registros.
            </p>
          </div>
          <div className="eleccion-card" onClick={() => navigate("/admin-login")}>
            <h2 className="eleccion-name">Gestión de Bares</h2>
            <p className="eleccion-description">
              Administra los bares y su funcionamiento.
            </p>
          </div>
          <div className="eleccion-card" onClick={() => navigate("/reabastecimiento")}>
            <h2 className="eleccion-name">Reabastecimiento de Ingredientes</h2>
            <p className="eleccion-description">
              Gestiona el stock de ingredientes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Eleccion;

import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext"; 
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { bar, empleado } = location.state || {};

  useEffect(() => {
    if (!bar || !empleado) {
      console.error("Datos incompletos: redirigiendo a /bares");
      logout();
      navigate("/bares"); 
    }
  }, [bar, empleado, navigate]);

  if (!bar || !empleado) {
    return null;
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h2>Bienvenido/a, {empleado.nombre}</h2>
        <p>Bar: {bar.nombre}</p>
        <p>Ubicación: {bar.ubicacion}</p>
      </div>
      <div className="home-buttons-grid">
        <button className="home-button main-action"
          onClick={() => navigate("/nueva-orden", { state: { bar, empleado },
            })}>
          Nueva Orden
        </button>
        <button className="home-button main-action"
          onClick={() => navigate("/ordenes", { state: { bar, empleado },
            })}>
          Órdenes
        </button>
        <button className="home-button main-action"
          onClick={() => navigate("/huespedes", { state: { bar } })
          }>
          Huéspedes
        </button>
      </div>
      <div className="home-footer">
        <p>
          {empleado.nombre} ({empleado.puesto})
        </p>
      </div>
    </div>
  );
}

export default Home;

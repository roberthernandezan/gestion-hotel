import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Bares.css";
import "../styles/Popup.css";

function Bar() {
  const [bares, setBares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/bares/")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Datos recibidos:", data);
        const baresActivos = data.filter(bar => bar.activo);
        setBares(baresActivos);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar los datos:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Cargando bares...</p>;
  if (error) return <p>Error al cargar los datos: {error}</p>;

  return (
    <div className="bar-container">
      <h1 className="bar-header">Selecciona un Bar</h1>
      <button className="bar-back-button" onClick={() => navigate("/")}>
        Volver
      </button>
      <div className="bar-grid">
        {bares.map((bar) => (
          <div
            key={bar.id_bar}
            className="bar-card"
            onClick={() => {
              const barSeleccionado = {
                id_bar: bar.id_bar,
                nombre: bar.nombre,
                ubicacion: bar.ubicacion,
              };
              console.log("Bar seleccionado:", barSeleccionado);
              navigate("/login", { state: { bar: barSeleccionado } });
            }}
          >
            <p className="bar-name">{bar.nombre}</p>
            <p className="bar-location">{bar.ubicacion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Bar;

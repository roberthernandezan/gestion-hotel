import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Habitaciones.css";
import "../styles/Popup.css";

function DetalleHabitacion() {
  const { numerohabitacion } = useParams();
  const navigate = useNavigate();
  const [huespedes, setHuespedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHuespedes = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/asignaciones-activas/${numerohabitacion}/`
      );
      if (!response.ok) {
        if (response.status === 404) {
          setHuespedes([]);
        } else {
          throw new Error(`Error al cargar los huéspedes: ${response.statusText}`);
        }
      } else {
        const data = await response.json();
        setHuespedes(data);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHuespedes();
  }, [numerohabitacion]);

  if (loading) return <p className="loading">Cargando huéspedes...</p>;

  return (
    <div className="gestion-habitaciones-container">
      <h1 className="habitaciones-header">
        Huéspedes en la Habitación {numerohabitacion}
      </h1>
      <div className="centered-button-container">
        <button
          className="habitaciones-back-button"
          onClick={() => navigate(-1)}
        >
          Volver
        </button>
      </div>
      {error ? (
        <p className="error">Error: {error}</p>
      ) : huespedes.length === 0 ? (
        <div className="no-data-container">
          <p>No hay huéspedes en esta habitación.</p>
        </div>
      ) : (
        <div className="habitaciones-grid">
          {huespedes.map((huesped) => (
            <div
              className="habitaciones-card clickable"
              key={huesped.id_asignacion}
              onClick={() => navigate(`/gestion/detalle-huesped/${huesped.id_huesped}`)}
            >
              <div className="habitaciones-name">{huesped.id_huesped_nombre}</div>
              <div className="habitaciones-details">
                Todo Incluido: {huesped.todoincluido ? "Sí" : "No"}
                <br />
                Fecha de Asignación:{" "}
                {new Date(huesped.fechaasignacion).toLocaleDateString()}
                <br />
                Pago Realizado: {huesped.pagorealizado ? "Sí" : "No"}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default DetalleHabitacion;

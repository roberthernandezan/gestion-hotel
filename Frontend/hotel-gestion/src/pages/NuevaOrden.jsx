import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext"; 
import "../styles/NuevaOrden.css";
import "../styles/Popup.css";

function NuevaOrden() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [mesa, setMesa] = useState("");
  const [habitacion, setHabitacion] = useState("");

  const [errorMesa, setErrorMesa] = useState(null);
  const [errorHabitacion, setErrorHabitacion] = useState(null);

  const [showAsignacionesPopup, setShowAsignacionesPopup] = useState(false);
  const [asignacionesDisponibles, setAsignacionesDisponibles] = useState([]);

  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const bar = location.state?.bar;
  const empleado = location.state?.empleado;

  if (!bar || !empleado) {
    console.error("Datos incompletos: redirigiendo a /bares");
    logout();
    navigate("/bares");
    return null;
  }

  const handleHabitacionSubmit = async (e) => {
    e.preventDefault();

    let valid = true;
    let asignacionId = null;

    if (!mesa || isNaN(mesa)) {
      setErrorMesa("Introduce un número válido para la mesa.");
      valid = false;
    } else {
      setErrorMesa(null);
    }

    if (!habitacion || isNaN(habitacion)) {
      setErrorHabitacion("Introduce un número de habitación válido.");
      valid = false;
    } else {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/asignaciones-activas/${habitacion}/`
        );
        if (!response.ok) {
          let errorText = "No hay asignaciones activas para esta habitación.";
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorText = errorData.error;
            }
          } catch (jsonError) {
          }
          throw new Error(errorText);
        }
        const data = await response.json();
        if (data.length === 0) {
          const backendError = "No hay asignaciones activas para esta habitación.";
          setPopupMessage(backendError);
          setIsPopupVisible(true);
          valid = false;
        } else if (data.length === 1) {
          setErrorHabitacion(null);
          asignacionId = data[0].id_asignacion;
        } else {
          setErrorHabitacion(null);
          setAsignacionesDisponibles(data);
          setShowAsignacionesPopup(true);
        }
      } catch (error) {
        console.error("Error al verificar las asignaciones:", error);
        setPopupMessage(error.message || "Error al verificar las asignaciones.");
        setIsPopupVisible(true);
        valid = false;
      }
    }

    if (valid && asignacionId) {
      navigate("/bebidas", {
        state: {
          asignacionId,
          bar,
          empleado,
        },
      });
    }
  };

  const handleSeleccionAsignacion = (idAsignacion) => {
    setShowAsignacionesPopup(false);
    navigate("/bebidas", {
      state: {
        asignacionId: idAsignacion,
        bar,
        empleado,
      },
    });
  };

  return (
    <div className="nuevaorden-container">
      <h1 className="nuevaorden-header">Crear Nueva Orden</h1>
      <form className="nuevaorden-fields" onSubmit={handleHabitacionSubmit}>
        <div className="nuevaorden-field">
          <label htmlFor="mesa">Número de Mesa</label>
          <input
            type="text"
            id="mesa"
            value={mesa}
            onChange={(e) => setMesa(e.target.value)}
            placeholder="Introduce un número de mesa"
          />
          {errorMesa && <p className="nuevaorden-error">{errorMesa}</p>}
        </div>
        <div className="nuevaorden-field">
          <label htmlFor="habitacion">Número de Habitación</label>
          <input
            type="text"
            id="habitacion"
            value={habitacion}
            onChange={(e) => setHabitacion(e.target.value)}
            placeholder="Introduce el número de habitación"
          />
          {errorHabitacion && (
            <p className="nuevaorden-error">{errorHabitacion}</p>
          )}
        </div>
        <div className="nuevaorden-buttons">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="nuevaorden-button volver-button"
          >
            Volver
          </button>
          <button type="submit" className="nuevaorden-button confirmar-button">
            Confirmar
          </button>
        </div>
      </form>
      <div className="nuevaorden-info">
        <p>
          {bar.nombre} // {empleado.nombre}
        </p>
      </div>

      {showAsignacionesPopup && (
        <div
          className="popup-overlay"
          onClick={() => setShowAsignacionesPopup(false)}
        >
          <div
            className="popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Asignaciones Activas</h2>
            <div className="popup-asignaciones-grid">
              {asignacionesDisponibles.map((asig) => (
                <div
                  key={asig.id_asignacion}
                  className="popup-asignacion-card"
                  onClick={() => handleSeleccionAsignacion(asig.id_asignacion)}
                >
                  <p>
                    <strong>Huésped:</strong> {asig.id_huesped_nombre}
                  </p>
                  <p>
                    <strong>Hab:</strong> {asig.numerohabitacion}
                  </p>
                </div>
              ))}
            </div>
            <button
              className="popup-cancel-button"
              onClick={() => setShowAsignacionesPopup(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {isPopupVisible && (
        <div
          className="popup-overlay"
          onClick={() => setIsPopupVisible(false)}
        >
          <div
            className="popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Error</h2>
            <p>{popupMessage}</p>
            <button
              className="popup-cancel-button"
              onClick={() => setIsPopupVisible(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NuevaOrden;

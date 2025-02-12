import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GestionBares.css";
import "../styles/Modal.css";
import "../styles/Popup.css";

function GestionBares() {
  const [bares, setBares] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [nuevoBar, setNuevoBar] = useState({ nombre: "", ubicacion: "" });
  const navigate = useNavigate();

  const fetchBares = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/bares/");
      if (!response.ok) {
        throw new Error("Error al cargar los bares");
      }
      const data = await response.json();
      setBares(data);
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  useEffect(() => {
    fetchBares();
  }, []);

  const handleAddBar = async () => {
    if (!nuevoBar.nombre.trim() || !nuevoBar.ubicacion.trim()) {
      setPopupMessage("Los campos Nombre y Ubicación no pueden estar vacíos");
      setIsPopupVisible(true);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/bares/nuevo/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoBar),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al añadir el bar.");
      }

      setShowModal(false);
      setNuevoBar({ nombre: "", ubicacion: "" });
      fetchBares();
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  const handleToggleActivo = async (id_bar, currentActivo) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/bares/${id_bar}/activo/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !currentActivo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el estado activo");
      }

      setBares((prevBares) =>
        prevBares.map((bar) =>
          bar.id_bar === id_bar
            ? { ...bar, activo: !currentActivo }
            : bar
        )
      );
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  return (
    <div className="gestion-bares-container">
      <h2 className="gestion-bares-header">Gestión de Bares</h2>
      <div className="center-back-button">
        <button
          className="gestion-bares-back-button"
          onClick={() => navigate(-1)}
        >
          Volver
        </button>
      </div>
      <div className="gestion-bares-grid">
        <div
          className="gestion-bares-card gestion-bares-add-card"
          onClick={() => setShowModal(true)}
        >
          <p className="gestion-bares-add-text">+ Añadir Bar</p>
        </div>

        {bares.map((bar) => (
          <div key={bar.id_bar} className="gestion-bares-card">
            <div className="gestion-bares-name">{bar.nombre}</div>
            <div className="gestion-bares-location">Ubicación: {bar.ubicacion}</div>
            <label className="gestion-bares-location">
              Activo:
              <input
                type="checkbox"
                checked={bar.activo}
                onChange={() => handleToggleActivo(bar.id_bar, bar.activo)}
              />
            </label>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>Añadir Nuevo Bar</h2>
            </header>
            <div className="modal-body">
              <label>
                Nombre del Bar:
                <input
                  type="text"
                  value={nuevoBar.nombre}
                  onChange={(e) =>
                    setNuevoBar({ ...nuevoBar, nombre: e.target.value })
                  }
                  placeholder="Escribe el nombre del bar"
                />
              </label>
              <label>
                Ubicación del Bar:
                <input
                  type="text"
                  value={nuevoBar.ubicacion}
                  onChange={(e) =>
                    setNuevoBar({ ...nuevoBar, ubicacion: e.target.value })
                  }
                  placeholder="Escribe la ubicación del bar"
                />
              </label>
            </div>
            <footer className="modal-footer">
              <button
                className="gestion-bares-back-button"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                className="gestion-bares-back-button"
                onClick={handleAddBar}
              >
                Guardar
              </button>
            </footer>
          </div>
        </div>
      )}

      {isPopupVisible && popupMessage && (
        <div className="popup-overlay">
          <div className="popup-content">
            <p>{popupMessage}</p>
            <button
              className="gestion-bares-back-button"
              onClick={() => {
                setPopupMessage("");
                setIsPopupVisible(false);
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionBares;

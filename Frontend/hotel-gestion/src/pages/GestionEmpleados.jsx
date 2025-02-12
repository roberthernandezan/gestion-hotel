import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Empleados.css";
import "../styles/Modal.css";
import "../styles/Popup.css";

function GestionEmpleados() {
  const [empleados, setEmpleados] = useState([]);
  const [nuevoEmpleado, setNuevoEmpleado] = useState({ nombre: "", puesto: "", password: "" });
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const navigate = useNavigate();

  const fetchEmpleados = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/empleados/");
      if (!response.ok) {
        throw new Error("Error al cargar los empleados");
      }
      const data = await response.json();
      setEmpleados(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const handleAddEmpleado = async () => {
    const { nombre, puesto, password } = nuevoEmpleado;

    if (!nombre.trim() || !puesto.trim() || !password.trim()) {
      setPopupMessage("Completa todos los campos");
      setIsPopupVisible(true);
      return;
    }
    if (!/^\d{4}$/.test(password)) {
      setPopupMessage("La contraseña debe ser exactamente de 4 cifras numéricas");
      setIsPopupVisible(true);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/empleados/nuevo/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoEmpleado),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al añadir el empleado");
      }

      setShowModal(false);
      setNuevoEmpleado({ nombre: "", puesto: "", password: "" });

      fetchEmpleados();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActivo = async (id_empleado, currentActivo) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/empleados/${id_empleado}/activo/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !currentActivo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el estado activo");
      }

      setEmpleados((prevEmpleados) =>
        prevEmpleados.map((empleado) =>
          empleado.id_empleado === id_empleado
            ? { ...empleado, activo: !currentActivo }
            : empleado
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="gestion-empleados-container">
      <h2 className="gestion-empleados-header">Gestión de Empleados</h2>
      <div className="volver-container">
        <button
          className="gestion-bares-back-button"
          onClick={() => navigate(-1)}
        >
          Volver
        </button>
      </div>
      <div className="gestion-empleados-grid">
        <div
          className="gestion-empleados-card gestion-empleados-add-card"
          onClick={() => setShowModal(true)}
        >
          <p className="gestion-empleados-add-text">+ Añadir Empleado</p>
        </div>

        {empleados.map((empleado) => (
          <div key={empleado.id_empleado} className="gestion-empleados-card">
            <p className="gestion-empleados-name">{empleado.nombre}</p>
            <p className="gestion-empleados-role">{empleado.puesto}</p>
            <p className="gestion-empleados-role">Pass: {empleado.password}</p>
            <label className="gestion-empleados-role">
              Activo:
              <input type="checkbox"
                checked={empleado.activo}
                onChange={() => handleToggleActivo(empleado.id_empleado, empleado.activo)}
              />
            </label>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>Añadir Nuevo Empleado</h2>
            </header>
            <div className="modal-body">
              <label>
                Nombre del empleado:
                <input
                  type="text"
                  value={nuevoEmpleado.nombre}
                  onChange={(e) =>
                    setNuevoEmpleado({ ...nuevoEmpleado, nombre: e.target.value })
                  }
                  placeholder="Nombre"
                />
              </label>
              <label>
                Posición del empleado:
                <input
                  type="text"
                  value={nuevoEmpleado.puesto}
                  onChange={(e) =>
                    setNuevoEmpleado({ ...nuevoEmpleado, puesto: e.target.value })
                  }
                  placeholder="Posición"
                />
              </label>
              <label>
                Contraseña (4 dígitos):
                <input
                  type="text"
                  value={nuevoEmpleado.password}
                  onChange={(e) =>
                    setNuevoEmpleado({ ...nuevoEmpleado, password: e.target.value })
                  }
                  placeholder="Contraseña"
                />
              </label>
            </div>
            <footer className="modal-footer">
              <button
                className="gestion-bares-back-button"
                onClick={handleAddEmpleado}
              >
                Guardar
              </button>
              <button
                className="gestion-bares-back-button cancelar"
                onClick={() => setShowModal(false)}
              >
                Cancelar
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

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default GestionEmpleados;

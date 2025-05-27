import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Habitaciones.css";
import "../styles//Modal.css";
import "../styles/Popup.css";

function Habitaciones() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [filteredHabitaciones, setFilteredHabitaciones] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOption, setFilterOption] = useState("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAddingHabitacion, setIsAddingHabitacion] = useState(false);
  const [newHabitacion, setNewHabitacion] = useState({
    numerohabitacion: "",
    capacidad: "",
    todoincluido: false,
  });

  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchHabitaciones();
  }, []);

  useEffect(() => {
    let filtered = habitaciones.filter((habitacion) =>
      habitacion.numerohabitacion.toString().includes(searchQuery)
    );

    if (filterOption === "ocupadas") {
      filtered = filtered.filter((habitacion) => habitacion.ocupada);
    } else if (filterOption === "llenas") {
      filtered = filtered.filter((habitacion) => habitacion.llena);
    }

    setFilteredHabitaciones(filtered);
  }, [searchQuery, filterOption, habitaciones]);

  const fetchHabitaciones = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/gestion/habitaciones/");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const sortedHabitaciones = data.sort(
        (a, b) => a.numerohabitacion - b.numerohabitacion
      );
      setHabitaciones(sortedHabitaciones);
      setFilteredHabitaciones(sortedHabitaciones);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAddHabitacion = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/habitaciones/nueva/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newHabitacion),
      });

      if (!response.ok) {
        throw new Error("Error al crear la habitación.");
      }

      setPopupMessage("Habitación creada exitosamente.");
      setIsPopupVisible(true);
      setIsAddingHabitacion(false);
      setNewHabitacion({ numerohabitacion: "", capacidad: "", todoincluido: false });
      fetchHabitaciones();
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  const handleCancelAdd = () => {
    setIsAddingHabitacion(false);
    setNewHabitacion({ numerohabitacion: "", capacidad: "", todoincluido: false });
  };

  const closePopup = () => {
    setIsPopupVisible(false);
  };

  const handleFilterChange = (option) => {
    setFilterOption(option);
  };

  if (loading) {
    return <p className="loading">Cargando habitaciones...</p>;
  }
  if (error) {
    return <p className="error">Error: {error}</p>;
  }

  return (
    <div className="gestion-habitaciones-container">
      <h1 className="habitaciones-header">Habitaciones</h1>
      <div className="centered-button-container">
        <button className="habitaciones-back-button" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
      <div className="filter-container">
        <div className="filter-row">
          <div className="search-bar">
            <input type="text"
              placeholder="Buscar por número de habitación"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="toggle-buttons">
            <button
              className={`toggle-button ${filterOption === "todas" ? "active" : ""}`}
              onClick={() => handleFilterChange("todas")} >
              Todas
            </button>
            <button
              className={`toggle-button ${filterOption === "ocupadas" ? "active" : ""}`}
              onClick={() => handleFilterChange("ocupadas")} >
              Ocupadas
            </button>
            <button
              className={`toggle-button ${filterOption === "llenas" ? "active" : ""}`}
              onClick={() => handleFilterChange("llenas")} >
              Llenas
            </button>
          </div>
        </div>
      </div>
      <div className="habitaciones-grid">
        <div className="habitaciones-card habitaciones-card-add-card"
          onClick={() => setIsAddingHabitacion(true)} >
          <h3 className="habitaciones-card-add-text">
            +Añadir Habitación
          </h3>
        </div>
        {filteredHabitaciones.map((habitacion) => (
          <div className="habitaciones-card"
            key={habitacion.numerohabitacion}
            onClick={() =>
              navigate(`/gestion/detalle-habitacion/${habitacion.numerohabitacion}`)
            } >
            <div className="habitaciones-name">
              Habitación {habitacion.numerohabitacion}
            </div>
            <div className="habitaciones-details">
              Capacidad: {habitacion.capacidad} personas <br />
              Ocupada: {habitacion.ocupada ? "Sí" : "No"} <br />
              Ocupación: {habitacion.numero_personas} personas <br />
              Llena: {habitacion.llena ? "Sí" : "No"} <br />
              Todo Incluido: {habitacion.todoincluido ? "Sí" : "No"}
            </div>
          </div>
        ))}
      </div>
      {isAddingHabitacion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>Añadir Habitación</h2>
            </header>
            <div className="modal-body">
              <label>
                Número de Habitación:
                <input
                  type="text"
                  value={newHabitacion.numerohabitacion}
                  onChange={(e) =>
                    setNewHabitacion({
                      ...newHabitacion,
                      numerohabitacion: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Capacidad:
                <input type="number"
                  value={newHabitacion.capacidad}
                  onChange={(e) =>
                    setNewHabitacion({
                      ...newHabitacion,
                      capacidad: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Todo Incluido:
                <input type="checkbox"
                  checked={newHabitacion.todoincluido}
                  onChange={(e) =>
                    setNewHabitacion({
                      ...newHabitacion,
                      todoincluido: e.target.checked,
                    })
                  }
                />
              </label>
            </div>
            <footer className="modal-footer">
              <button onClick={handleAddHabitacion} className="modal-footer-button">
                Guardar
              </button>
              <button onClick={handleCancelAdd} className="modal-footer-button">
                Cancelar
              </button>
            </footer>
          </div>
        </div>
      )}
      {isPopupVisible && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content">
            <p>{popupMessage}</p>
            <button onClick={closePopup}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Habitaciones;

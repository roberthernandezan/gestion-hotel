import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HuespedesRegistrados.css";
import "../styles//Modal.css";
import "../styles/Popup.css";

function HuespedesRegistrados() {
  const [huespedes, setHuespedes] = useState([]);
  const [filteredHuespedes, setFilteredHuespedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingHuesped, setIsAddingHuesped] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchCriteria, setSearchCriteria] = useState("nombre");
  const [sortCriteria, setSortCriteria] = useState("");
  const [toggleFilter, setToggleFilter] = useState("todos");
  const [newHuesped, setNewHuesped] = useState({
    nombre: "",
    edad: "",
    nacionalidad: "",
    repetidor: false,
    id_unico_huesped: "",
  });
  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = huespedes.filter((huesped) =>
      huesped[searchCriteria]
        ?.toString()
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );

    if (toggleFilter === "enHotel") {
      filtered = filtered.filter((huesped) => huesped.EnHotel);
    } else if (toggleFilter === "fueraHotel") {
      filtered = filtered.filter((huesped) => !huesped.EnHotel);
    }

    setFilteredHuespedes(filtered);
  }, [searchText, searchCriteria, toggleFilter, huespedes]);

  const fetchData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/gestion/huespedes/");
      if (!response.ok) {
        throw new Error("Error al cargar los datos de huéspedes.");
      }
      const data = await response.json();
      setHuespedes(data);
      setFilteredHuespedes(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSort = (criteria) => {
    setSortCriteria(criteria);
    const sorted = [...filteredHuespedes].sort((a, b) => {
      if (typeof a[criteria] === "string") {
        return a[criteria].localeCompare(b[criteria]);
      }
      return a[criteria] - b[criteria];
    });
    setFilteredHuespedes(sorted);
  };

  const handleAddHuesped = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/huespedes/nuevo/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newHuesped),
      });

      if (!response.ok) {
        throw new Error("Error al crear el huésped.");
      }

      setPopupMessage("Huésped creado exitosamente.");
      setIsPopupVisible(true);
      setIsAddingHuesped(false);
      setNewHuesped({
        nombre: "",
        edad: "",
        nacionalidad: "",
        repetidor: false,
        id_unico_huesped: "",
      });
      await fetchData();
    } catch (err) {
      setPopupMessage(`Error: ${err.message}`);
      setIsPopupVisible(true);
    }
  };

  const handleCancelAdd = () => {
    setIsAddingHuesped(false);
    setNewHuesped({
      nombre: "",
      edad: "",
      nacionalidad: "",
      repetidor: false,
      id_unico_huesped: "",
    });
  };

  const closePopup = () => {
    setIsPopupVisible(false);
  };

  if (loading) return <p className="loading">Cargando huéspedes...</p>;
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div className="huespedes-registrados-container ">
      <h1 className="huespedes-header">Huéspedes Registrados</h1>
      <div className="centered-button-container">
        <button className="huespedes-back-button" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
      <div className="toggle-buttons">
        <button className={`toggle-button ${toggleFilter === "todos" ? "active" : ""}`}
          onClick={() => setToggleFilter("todos")} >
          Todos
        </button>
        <button className={`toggle-button ${toggleFilter === "enHotel" ? "active" : ""}`}
          onClick={() => setToggleFilter("enHotel")} >
          En Hotel
        </button>
        <button className={`toggle-button ${toggleFilter === "fueraHotel" ? "active" : ""}`}
          onClick={() => setToggleFilter("fueraHotel")} >
          Fuera del Hotel
        </button>
      </div>
      <div className="filter-container">
        <div className="filter-row">
          <div className="search-bar">
            <select value={searchCriteria}
              onChange={(e) => setSearchCriteria(e.target.value)}
              className="sort-select"
            >
              <option value="nombre">Nombre</option>
              <option value="edad">Edad</option>
              <option value="nacionalidad">Nacionalidad</option>
            </select>
            <input type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={`Buscar por ${searchCriteria}...`}
              className="search-input"
            />
          </div>
          <div className="sort-bar">
            <label htmlFor="sort-criteria">Ordenar por:</label>
            <select id="sort-criteria"
              value={sortCriteria}
              onChange={(e) => handleSort(e.target.value)}
              className="sort-select"  >
              <option value="">Seleccione...</option>
              <option value="nombre">Nombre</option>
              <option value="edad">Edad</option>
              <option value="nacionalidad">Nacionalidad</option>
              <option value="repetidor">Repetidor</option>
            </select>
          </div>
        </div>
      </div>
      <div className="huespedes-grid">
        <div className="huespedes-card add-card"
          onClick={() => setIsAddingHuesped(true)} >
          <h3 className="habitaciones-card-add-text">+Añadir Huésped</h3>
        </div>
        {filteredHuespedes.map((huesped) => (
          <div className="huespedes-card"
            key={huesped.id_huesped}
            onClick={() => navigate(`/gestion/detalle-huesped/${huesped.id_huesped}`)} >
            <div className="huespedes-name">{huesped.nombre} ({huesped.nacionalidad})</div>
            <div className="huespedes-details">
              ID: {huesped.id_unico_huesped} <br />
              Edad: {huesped.edad} <br />
              {huesped.EnHotel ? "Checked-In" : "Checked-Out"} / 
              Repetidor: {huesped.repetidor ? "Sí" : "No"}<br />
              Activo: {huesped.activo ? "Sí" : "No"}
            </div>
          </div>
        ))}
      </div>
      {isAddingHuesped && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>Añadir Huésped</h2>
            </header>
            <div className="modal-body">
              <label>
                Nombre:
                <input type="text"
                  value={newHuesped.nombre}
                  onChange={(e) =>
                    setNewHuesped({ ...newHuesped, nombre: e.target.value })
                  }
                />
              </label>
              <label>
                Edad:
                <input type="number"
                  value={newHuesped.edad}
                  onChange={(e) =>
                    setNewHuesped({ ...newHuesped, edad: e.target.value })
                  }
                />
              </label>
              <label>
                Nacionalidad:
                <input type="text"
                  value={newHuesped.nacionalidad}
                  onChange={(e) =>
                    setNewHuesped({ ...newHuesped, nacionalidad: e.target.value })
                  }
                />
              </label>
              <label>
                ID Único:
                <input type="text"
                  value={newHuesped.id_unico_huesped}
                  onChange={(e) =>
                    setNewHuesped({ ...newHuesped, id_unico_huesped: e.target.value })
                  }
                />
              </label>
            </div>
            <footer className="modal-footer">
              <button onClick={handleAddHuesped} className="modal-footer-button">
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

export default HuespedesRegistrados;

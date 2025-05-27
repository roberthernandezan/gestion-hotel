import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import "../styles/Huespedes.css";
import "../styles//Modal.css";

function Huespedes() {
  const [asignaciones, setAsignaciones] = useState([]); 
  const [filteredAsignaciones, setFilteredAsignaciones] = useState([]); 
  const [searchText, setSearchText] = useState(""); 
  const [sortCriteria, setSortCriteria] = useState(""); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const navigate = useNavigate(); 

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/asignaciones-activas/")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error al cargar los datos: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setAsignaciones(data);
          setFilteredAsignaciones(data);
        } else {
          setAsignaciones([]);
          setFilteredAsignaciones([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSearch = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);

    const filtered = asignaciones.filter(
      (asignacion) =>
        asignacion.numerohabitacion?.toString().includes(text) ||
        asignacion.id_huesped_nombre.toLowerCase().includes(text)
    );
    setFilteredAsignaciones(filtered);
  };

  const handleSort = (criteria) => {
    setSortCriteria(criteria);

    const sorted = [...filteredAsignaciones].sort((a, b) => {
      switch (criteria) {
        case "habitacion":
          return (a.numerohabitacion || "").localeCompare(b.numerohabitacion || "");
        default:
          return 0;
      }
    });

    setFilteredAsignaciones(sorted);
  };

  if (loading) {
    return <p>Cargando asignaciones...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="huespedes-container">
      <h1 className="h-huespedes-header">Huésped</h1>
      <button onClick={() => navigate(-1)} className="back-button">
        Volver
      </button>

      <div className="filter-container">
        <div className="search-bar">
          <input
            type="text"
            value={searchText}
            onChange={handleSearch}
            placeholder="Buscar por habitación o nombre..."
            className="search-input"
          />
        </div>

        <div className="sort-bar">
          <label htmlFor="sort-criteria">Ordenar por:</label>
          <select
            id="sort-criteria"
            value={sortCriteria}
            onChange={(e) => handleSort(e.target.value)}
            className="sort-select"
          >
            <option value="">Seleccione...</option>
            <option value="habitacion">Habitación</option>
          </select>
        </div>
      </div>

      <div className="huespedes-grid">
        {filteredAsignaciones.length > 0 ? (
          filteredAsignaciones.map((asignacion) => (
            <div key={asignacion.id_asignacion} className="huesped-card">
              <p className= "huesped-name">{asignacion.id_huesped_nombre || "Desconocido"}</p>
              <div className="huesped-details">
                <strong>Habitación {asignacion.numerohabitacion || "No asignada"}</strong> <br />
                <strong>Fecha Check-In:</strong>{" "}
                {asignacion.fechaasignacion ? new Date(asignacion.fechaasignacion).toLocaleDateString("es-ES", {
                  day: "2-digit", month: "2-digit", year: "numeric", }) : "No asignada"} <br />          
              <strong>{asignacion.todoincluido ? "Todo incluido" : "Normal"}</strong>
              </div>
            </div>
          ))
        ) : (
          <p>No hay asignaciones disponibles que coincidan con la búsqueda.</p>
        )}
      </div>
    </div>
  );
}

export default Huespedes;

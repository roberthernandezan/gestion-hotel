import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Ordenes.css";

function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchCriteria, setSearchCriteria] = useState("habitacion");
  const [sortCriteria, setSortCriteria] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); 

  const { bar, empleado } = location.state || {};

  useEffect(() => {
    if (!bar || !empleado) {
      console.error("Datos faltantes. Redirigiendo...");
      navigate("/bares");
      return;
    }

    fetch(`http://127.0.0.1:8000/api/ordenes-activas/?bar_id=${bar.id_bar}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setOrdenes(data);
        setFilteredOrdenes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar órdenes:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [bar, empleado, navigate]);

  const handleSearch = (e) => {
    const text = e.target.value;
    setSearchText(text);

    const filtered = ordenes.filter((orden) => {
      switch (searchCriteria) {
        case "habitacion":
          return orden.habitacion?.toString().includes(text);
        case "id_orden":
          return orden.id_orden?.toString().includes(text);
        case "empleado":
          return orden.empleado_nombre
            ?.toLowerCase()
            .includes(text.toLowerCase());
        case "fecha":
          return new Date(orden.fechahora)
            .toLocaleDateString()
            .includes(text);
        default:
          return true;
      }
    });

    setFilteredOrdenes(filtered);
  };

  const handleSort = (criteria) => {
    setSortCriteria(criteria);

    const sorted = [...filteredOrdenes].sort((a, b) => {
      switch (criteria) {
        case "fecha":
          return new Date(a.fechahora) - new Date(b.fechahora);
        case "habitacion":
          return (a.habitacion || "").localeCompare(
            b.habitacion || ""
          );
        case "empleado":
          return a.empleado_nombre.localeCompare(b.empleado_nombre);
        case "id_orden":
          return a.id_orden - b.id_orden;
        default:
          return 0;
      }
    });

    setFilteredOrdenes(sorted);
  };

  const handleOrdenClick = (orden) => {
    navigate(`/ordenes/${orden.id_orden}`, {
      state: { bar, empleado, orden },
    });
  };

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p>Error al cargar los datos: {error}</p>;

  return (
    <div className="ordenes-container">
      <h1 className="ordenes-header">Órdenes Activas en {bar.nombre}</h1>
      <button onClick={() => navigate(-1)} className="back-button">
        Volver
      </button>

      <div className="filter-container">
        <div className="filter-row">
        <div className="search-bar">
            <select
              value={searchCriteria}
              onChange={(e) => setSearchCriteria(e.target.value)}
              className="sort-select"
            >
              <option value="habitacion">Habitación</option>
              <option value="id_orden">Número de Orden</option>
              <option value="empleado">Empleado</option>
              <option value="fecha">Fecha</option>
            </select>
            <input
              type="text"
              value={searchText}
              onChange={handleSearch}
              placeholder={`Buscar por ${searchCriteria}...`}
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
              <option value="fecha">Fecha</option>
              <option value="habitacion">Habitación</option>
              <option value="empleado">Empleado</option>
              <option value="id_orden">Número de Orden</option>
            </select>
          </div>
        </div>
      </div>
      <div className="ordenes-grid">
        {filteredOrdenes.length === 0 ? (
          <p>No hay órdenes activas que coincidan con la búsqueda.</p>
        ) : (
          filteredOrdenes.map((orden) => (
            <div
              key={orden.id_orden}
              className="orden-card clickable"
              onClick={() => handleOrdenClick(orden)}
            >
              <div className="orden-name">Orden {orden.id_orden} </div>
              <div className="orden-price">
                <strong>Habitación {orden.habitacion || "N/A"}</strong><br />
                <strong>Huésped: </strong>{orden.huesped_nombre || "N/A"} <br />
                <strong>Empleado:</strong> {orden.empleado_nombre}<br />
                <strong>Cuenta:</strong> {Number(orden.preciototal).toFixed(2)}€<br />
                <strong>Fecha:</strong>{" "}
                {new Date(orden.fechahora).toLocaleDateString()}<br />
                <strong>Hora:</strong>{" "}
                {new Date(orden.fechahora).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Ordenes;

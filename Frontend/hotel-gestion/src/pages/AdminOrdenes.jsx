import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Ordenes.css";

function AdminOrdenes() {
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchCriteria, setSearchCriteria] = useState("habitacion");
  const [sortCriteria, setSortCriteria] = useState("");
  const [filterActivity, setFilterActivity] = useState("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = "http://127.0.0.1:8000/api/ordenes-todas/";

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error al obtener las órdenes");
        }
        return res.json();
      })
      .then((data) => {
        setOrdenes(data);
        setFilteredOrdenes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleActivityFilter = (filter) => {
    setFilterActivity(filter);
    const filtered = ordenes.filter((orden) => {
      if (filter === "activas") return orden.actividad === true;
      if (filter === "inactivas") return orden.actividad === false;
      return true;
    });
    setFilteredOrdenes(filtered);
  };

  const handleSearch = (e) => {
    const text = e.target.value;
    setSearchText(text);

    const filtered = ordenes.filter((orden) => {
      switch (searchCriteria) {
        case "habitacion":
          return orden.habitacion?.toString().includes(text);
        case "bar":
          return orden.bar_nombre?.toLowerCase().includes(text.toLowerCase());
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
          return (a.habitacion || "").localeCompare(b.habitacion || "");
        case "bar":
          return a.bar_nombre.localeCompare(b.bar_nombre);
        case "empleado":
          return a.empleado_nombre.localeCompare(b.empleado_nombre);
        default:
          return 0;
      }
    });

    setFilteredOrdenes(sorted);
  };

  if (loading) {
    return <p className="loading">Cargando órdenes...</p>;
  }
  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="ordenes-container">
      <h1 className="ordenes-header">Órdenes Activas</h1>

      <button onClick={() => navigate(-1)} className="back-button">
        Volver
      </button>

      <div className="toggle-buttons">
        <button
          className={`toggle-button ${filterActivity === "activas" ? "active" : ""}`}
          onClick={() => handleActivityFilter("activas")}
        >
          Activas
        </button>
        <button
          className={`toggle-button ${filterActivity === "inactivas" ? "active" : ""}`}
          onClick={() => handleActivityFilter("inactivas")}
        >
          Inactivas
        </button>
        <button
          className={`toggle-button ${filterActivity === "todas" ? "active" : ""}`}
          onClick={() => handleActivityFilter("todas")}
        >
          Todas
        </button>
      </div>

      <div className="filter-container">
        <div className="filter-row">
          <div className="search-bar">
            <select
              value={searchCriteria}
              onChange={(e) => setSearchCriteria(e.target.value)}
              className="sort-select"
            >
              <option value="habitacion">Habitación</option>
              <option value="bar">Bar</option>
              <option value="empleado">Empleado</option>
              <option value="id_orden">Número de Orden</option>
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
              <option value="bar">Bar</option>
              <option value="id_orden">Número de Orden</option>
              <option value="empleado">Empleado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="ordenes-grid">
        {filteredOrdenes.length > 0 ? (
          filteredOrdenes.map((orden) => (
            <div
              className="orden-card"
              key={orden.id_orden}
              onClick={() =>
                navigate(`/ordenes/${orden.id_orden}`, {
                  state: { orden: orden, fromAdmin: true },
                })
              }
            >
              <div className="orden-name">Orden {orden.id_orden} ({orden.bar_nombre})</div>
              <div className="orden-price">
                <strong>Empleado:</strong> {orden.empleado_nombre} <br />
                <strong>Habitación {orden.habitacion || "N/A"} </strong><br />
                <strong>Huesped: </strong>{orden.huesped_nombre || "N/A"} <br />
                <strong>Precio:</strong> {orden.preciototal} € <br />
                <strong>Fecha:</strong> {new Date(orden.fechahora).toLocaleDateString()} <br />
                <strong>Hora:</strong> {new Date(orden.fechahora).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
                <br />
                <strong>Activo:</strong> {orden.actividad ? "Sí" : "No"}
              </div>
            </div>
          ))
        ) : (
          <p>No hay órdenes registradas.</p>
        )}
      </div>
    </div>
  );
}

export default AdminOrdenes;

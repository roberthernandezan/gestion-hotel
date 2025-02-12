import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RegistrosHistoricos.css"; 
import "../styles/Popup.css";

function RegistroEstancias() {
  const [estancias, setEstancias] = useState([]);
  const [filteredEstancias, setFilteredEstancias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [searchText, setSearchText] = useState("");
  const [searchCriteria, setSearchCriteria] = useState("huesped");
  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEstancias = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/registroestancias/", {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al obtener estancias.");
        }
        const data = await response.json();
        const estanciasData = Array.isArray(data) ? data : data.results;
        setEstancias(estanciasData);
        setFilteredEstancias(estanciasData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchEstancias();
  }, []);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    let sortableEstancias = [...estancias];
    if (sortConfig.key !== null) {
      sortableEstancias.sort((a, b) => {
        let aValue, bValue;
        switch (sortConfig.key) {
          case "id_registro":
            aValue = a.id_registro;
            bValue = b.id_registro;
            break;
          case "huesped":
            aValue = a.id_huesped.nombre.toLowerCase();
            bValue = b.id_huesped.nombre.toLowerCase();
            break;
          case "habitacion":
            aValue = a.numerohabitacion.numerohabitacion.toString();
            bValue = b.numerohabitacion.numerohabitacion.toString();
            break;
          case "timestamp":
            aValue = new Date(a.timestamp);
            bValue = new Date(b.timestamp);
            break;
          case "descripcion":
            aValue = a.descripcion.toLowerCase();
            bValue = b.descripcion.toLowerCase();
            break;
          default:
            aValue = "";
            bValue = "";
        }
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    setFilteredEstancias(sortableEstancias);
  }, [sortConfig, estancias]);

  const handleSearch = (e) => {
    const text = e.target.value;
    setSearchText(text);
    const filtered = estancias.filter((estancia) => {
      switch (searchCriteria) {
        case "habitacion":
          return estancia.numerohabitacion?.numerohabitacion.toString().toLowerCase().includes(text.toLowerCase());
        case "bar":
          return estancia.id_bar?.nombre.toLowerCase().includes(text.toLowerCase());
        case "empleado":
          return estancia.id_empleado?.nombre.toLowerCase().includes(text.toLowerCase());
        case "fecha":
          return new Date(estancia.timestamp).toLocaleDateString().includes(text);
        case "descripcion":
          return estancia.descripcion.toLowerCase().includes(text.toLowerCase());
        case "huesped":
        default:
          return estancia.id_huesped.nombre.toLowerCase().includes(text.toLowerCase());
      }
    });
    setFilteredEstancias(filtered);
  };

  const handleSearchCriteriaChange = (e) => {
    setSearchCriteria(e.target.value);
    setSearchText("");
    setFilteredEstancias(estancias);
  };

  const showPopup = (message) => {
    setPopupMessage(message);
    setIsPopupVisible(true);
  };

  if (loading) return <div className="hist-container"><p>Cargando estancias...</p></div>;
  if (error) return <div className="hist-container"><p>Error: {error}</p></div>;

  return (
    <div className="hist-container">
      <h2>Registro de Estancias</h2>
      <button onClick={() => navigate(-1)} className="registro-back-button">
        Volver
      </button>
      <div className="registros-search-container">
        <select
          value={searchCriteria}
          onChange={handleSearchCriteriaChange}
          className="registros-search-select"
        >
          <option value="huesped">Huésped</option>
          <option value="habitacion">Habitación</option>
          <option value="timestamp">Fecha</option>
          <option value="descripcion">Descripción</option>
        </select>
        <input
          type="text"
          value={searchText}
          onChange={handleSearch}
          placeholder={`Buscar por ${searchCriteria}`}
          className="registros-search-bar"
        />
      </div>
      <table className="hist-table">
        <thead>
          <tr>
            <th onClick={() => requestSort("id_registro")}>
              ID Registro {sortConfig.key === "id_registro" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
            </th>
            <th onClick={() => requestSort("huesped")}>
              Huésped {sortConfig.key === "huesped" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
            </th>
            <th onClick={() => requestSort("habitacion")}>
              Habitación {sortConfig.key === "habitacion" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
            </th>
            <th onClick={() => requestSort("timestamp")}>
              Fecha {sortConfig.key === "timestamp" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
            </th>
            <th onClick={() => requestSort("descripcion")}>
              Descripción {sortConfig.key === "descripcion" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredEstancias.map((estancia) => (
            <tr key={estancia.id_registro}>
              <td>{estancia.id_registro}</td>
              <td>
                {estancia.id_huesped.nombre} (ID: {estancia.id_huesped.id_huesped})
              </td>
              <td>{estancia.numerohabitacion.numerohabitacion}</td>
              <td>{new Date(estancia.timestamp).toLocaleString()}</td>
              <td>{estancia.descripcion}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {isPopupVisible && popupMessage && (
        <div className="popup-overlay">
          <div className="popup-content">
            <p>{popupMessage}</p>
            <button
              className="popup-content button"
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

export default RegistroEstancias;

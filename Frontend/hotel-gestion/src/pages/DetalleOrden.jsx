import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../styles/DetalleOrden.css";
import "../styles/Popup.css";
import "../styles/Modal.css";  

function DetalleOrden() {
  const { id_orden } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { bar, empleado, orden: ordenFromState, fromAdmin = false } = location.state || {};

  const [elementos, setElementos] = useState([]);
  const [orden, setOrden] = useState(ordenFromState || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

  const showPopup = (message) => {
    setPopupMessage(message);
    setIsPopupVisible(true);
  };

  useEffect(() => {
    const fetchElementos = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/ordenes/${id_orden}/elementos/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();
        setElementos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchOrden = async () => {
      if (!ordenFromState) {
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/ordenes-todas/${id_orden}/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
          }
          const data = await response.json();
          setOrden(data);
        } catch (err) {
          setError(err.message);
        }
      }
    };

    fetchElementos();
    fetchOrden();
  }, [id_orden, ordenFromState]);

  const handleDeleteConfirmed = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/ordenes/${id_orden}/elementos/${confirmDeleteId}/eliminar/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar el elemento");
      }
      setElementos((prev) =>
        prev.filter((elemento) => elemento.id_elemento !== confirmDeleteId)
      );
      showPopup("Elemento eliminado correctamente");
    } catch (error) {
      console.error("Error:", error);
      showPopup(`Hubo un error al eliminar el elemento: ${error.message}`);
    } finally {
      setIsConfirmModalVisible(false);
      setConfirmDeleteId(null);
    }
  };

  const handleEliminarElemento = (id_elemento) => {
    setConfirmDeleteId(id_elemento);
    setIsConfirmModalVisible(true);
  };

  if (loading) return <p>Cargando elementos de la orden...</p>;
  if (error) return <p>Error al cargar los datos: {error}</p>;

  return (
    <div className="detalle-orden-container">
      <h1 className="detalle-orden-header">Elementos de la Orden</h1>
      {orden && (
        <div className="detalle-orden-info">
          <p>
            <strong>Orden {orden.id_orden || "N/A"}</strong> <br />
            <strong>Huésped: </strong>{orden.huesped_nombre || "N/A"} <br />
            <strong>Habitación {orden.habitacion || "N/A"}</strong> <br />
            <strong>Todo Incluido: </strong>{orden.todoincluido ? "Sí" : "No"} <br />
            <strong>Fecha:</strong>{" "}
            {new Date(orden.fechahora).toLocaleDateString()} {", "}
            {new Date(orden.fechahora).toLocaleTimeString()}<br />
            <strong>Precio Total:</strong> {orden.preciototal || "0.00"}€<br />
            <strong>Activo:</strong> {orden.actividad ? "Sí" : "No"}
          </p>
        </div>
      )}
      <button onClick={() => navigate(-1)} className="detalle-orden-back">
        Volver
      </button>
      <div className="detalle-orden-grid">
        {elementos.length > 0 ? (
          elementos.map((elemento) => (
            <div key={elemento.id_elemento} className="detalle-orden-card">
              <p>
                <strong>{elemento.nombre}</strong>
              </p>
              <div className="orden-price">
                <strong>Cantidad:</strong> {elemento.cantidad} <br />
                <strong>Precio:</strong> {elemento.preciototal}€
              </div>
              {orden.actividad && fromAdmin && (
                <button
                  className="detalle-orden-delete-button"
                  onClick={() => handleEliminarElemento(elemento.id_elemento)}
                >
                  Eliminar
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="detalle-orden-description">
            No se encontraron elementos para esta orden.
          </div>
        )}
        {!fromAdmin && (
          <div
            className="detalle-orden-card consumicion-add-card"
            onClick={() => {
              const stateToPass = {
                bar,
                empleado,
                id_orden: orden.id_orden,
                asignacionId: orden.id_asignacion,
              };
              navigate("/bebidas", { state: stateToPass });
            }}
          >
            <p className="consumicion-add-text">+Añadir Consumiciones</p>
          </div>
        )}
      </div>

      {isConfirmModalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>Confirmar Eliminación</h2>
            </header>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar este elemento?</p>
            </div>
            <footer className="modal-footer">
              <button
                className="cancelar-button"
                onClick={() => {
                  setIsConfirmModalVisible(false);
                  setConfirmDeleteId(null);
                }}
              >
                Cancelar
              </button>
              <button className="guardar-button" onClick={handleDeleteConfirmed}>
                Confirmar
              </button>
            </footer>
          </div>
        </div>
      )}

      {isPopupVisible && (
        <div className="popup-overlay">
          <div className="popup-content">
            <p>{popupMessage}</p>
            <button className="bebidas-button" onClick={() => setIsPopupVisible(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetalleOrden;

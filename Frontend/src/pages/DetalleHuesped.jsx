import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/DetalleHuesped.css";
import "../styles/Modal.css";
import "../styles/Popup.css";

function DetalleHuesped() {
  const { id_huesped } = useParams();
  const navigate = useNavigate();

  const [huesped, setHuesped] = useState(null);
  const [asignacion, setAsignacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [habitaciones, setHabitaciones] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOption, setFilterOption] = useState("todas");

  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [ordenesPendientes, setOrdenesPendientes] = useState([]);

  useEffect(() => {
    if (id_huesped) {
      fetchHuesped();
      fetchAsignacionActiva();
    }
  }, [id_huesped]);

  const fetchHuesped = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/gestion/huespedes/${id_huesped}/`);
      if (!response.ok) throw new Error("Error al cargar los datos del huésped.");
      const data = await response.json();
      setHuesped(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAsignacionActiva = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/gestion/huespedes/${id_huesped}/asignacion-activa/`);
      if (response.ok) {
        const data = await response.json();
        setAsignacion(data);
      } else if (response.status === 404) {
        setAsignacion(null);
      } else {
        throw new Error("Error al cargar la asignación activa.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchHabitaciones = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/gestion/habitaciones/");
      if (!response.ok) throw new Error("Error al cargar las habitaciones.");
      const data = await response.json();
      setHabitaciones(data);
      setShowModal(true);
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  const handleCheckIn = async (numerohabitacion) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/asignaciones/nueva/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_huesped, numerohabitacion }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al realizar el check-in.");
      }

      setPopupMessage("Check-in realizado con éxito.");
      setIsPopupVisible(true);
      setShowModal(false);
      fetchAsignacionActiva();
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  const handleCheckOut = async () => {
    if (!asignacion) {
      setPopupMessage("No hay asignación para realizar check-out.");
      setIsPopupVisible(true);
      return;
    }

    if (!asignacion.pagorealizado) {
      setPopupMessage("No puede realizar el check-out mientras haya pagos pendientes.");
      setIsPopupVisible(true);
      return;
    }
    
    if (asignacion.todoincluido || asignacion.pagorealizado) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/ordenes/por-asignacion-todo-incluido/${asignacion.id_asignacion}/`,{
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al cerrar las órdenes.");
        }

        setPopupMessage("Órdenes cerradas correctamente.");
        setIsPopupVisible(true);

      } catch(err){
        setPopupMessage(err.message);
        setIsPopupVisible(true);
        return; 
      }
    }
    
    try {
      await doCheckout();
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  const handleMostrarPopupPago = async () => {
    if (!asignacion) {
      setPopupMessage("No hay asignación activa para realizar pagos.");
      setIsPopupVisible(true);
      return;
    }
    try {
      await fetchOrdenesPendientes(asignacion.id_asignacion);
      setShowPaymentPopup(true);
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  const fetchOrdenesPendientes = async (id_asignacion) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/ordenes/por-asignacion/${id_asignacion}/`);
      if (!response.ok) {
        throw new Error("Error al cargar órdenes pendientes de pago.");
      }
      const data = await response.json();
      setOrdenesPendientes(data);
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  const handlePagarOrden = async (id_orden) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/ordenes/cambiar-actividad/${id_orden}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actividad: false }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al pagar la orden.");
      }

      await fetchOrdenesPendientes(asignacion.id_asignacion);

      if (ordenesPendientes.length === 1) {
        setShowPaymentPopup(false);
      }

      await fetchAsignacionActiva();
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  const doCheckout = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/asignaciones/${asignacion.id_asignacion}/checkout/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al realizar el check-out.");
      }

      setPopupMessage("Check-out realizado con éxito.");
      setIsPopupVisible(true);
      setShowPaymentPopup(false);
      fetchAsignacionActiva();
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  const handleFilterChange = (option) => {
    setFilterOption(option);
  };

  const filteredHabitaciones = habitaciones.filter((habitacion) =>
    habitacion.numerohabitacion.toString().includes(searchQuery) &&
    (filterOption === "todas" ||
      (filterOption === "ocupadas" && habitacion.ocupada) ||
      (filterOption === "llenas" && habitacion.llena))
  );

  const closePopups = async () => {
    setShowModal(false);
    setIsPopupVisible(false);
    setShowPaymentPopup(false);

    if (asignacion) {
      await fetchOrdenesPendientes(asignacion.id_asignacion);
    }
  };

  const handleToggleActivo = async (currentActivo) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/huespedes/${id_huesped}/activo/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !currentActivo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el estado activo");
      }

      setHuesped((prevHuesped) => ({
        ...prevHuesped,
        activo: !currentActivo,
      }));
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  if (loading) return <p className="loading">Cargando detalles del huésped...</p>;
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div className="detalle-huesped-container">
      <h1 className="detalle-header">Detalle del Huésped</h1>
      {huesped && (
        <div className="detalle-info">
          <p><strong>Nombre:</strong> {huesped.nombre}</p>
          <p><strong>Edad:</strong> {huesped.edad}</p>
          <p><strong>Nacionalidad:</strong> {huesped.nacionalidad}</p>
          <p><strong>Repetidor:</strong> {huesped.repetidor ? "Sí" : "No"}</p>
          <p><strong>Activo:</strong>
            <input
              type="checkbox"
              checked={huesped.activo}
              onChange={(e) => {
                e.stopPropagation(); 
                handleToggleActivo(huesped.activo);
              }}
            /></p>
        </div>
      )}
      {asignacion ? (
        <div className="h-detalle-container">
          <h2 className="detalle-subheader">Asignación Activa</h2>
          <p><strong>Habitación:</strong> {asignacion.numerohabitacion}</p>
          <p> <strong>Fecha de Check-in:</strong>{" "}
            {new Date(asignacion.fechaasignacion).toLocaleDateString()}
          </p>
          <p><strong>Pago realizado:</strong> {asignacion.pagorealizado ? "Sí" : "No"}</p>
          <button className="detalle-button detalle-checkout" onClick={handleCheckOut}>
            Check-out
          </button>
          {!asignacion.pagorealizado && (
            <button className="detalle-button detalle-pagar"
              onClick={handleMostrarPopupPago} >
              Pagar
            </button>
          )}
        </div>
      ) : (
        <div>
          <p className="detalle-no-asignacion">No hay asignación activa.</p>
          <button className="detalle-button detalle-checkin" onClick={fetchHabitaciones}>
            Check-in
          </button>
        </div>
      )}
      <button className="detalle-button detalle-volver" onClick={() => navigate(-1)}>
        Volver
      </button>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>Seleccionar Habitación</h2>
            </header>
            <div className="modal-search">
              <input type="text"
                placeholder="Buscar por número de habitación"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="modal-filters">
              <button className={`toggle-button ${filterOption === "todas" ? "active" : ""}`}
                onClick={() => handleFilterChange("todas")} >
                Todas
              </button>
              <button className={`toggle-button ${filterOption === "ocupadas" ? "active" : ""}`}
                onClick={() => handleFilterChange("ocupadas")} >
                Ocupadas
              </button>
              <button className={`toggle-button ${filterOption === "llenas" ? "active" : ""}`}
                onClick={() => handleFilterChange("llenas")} >
                Llenas
              </button>
            </div>
            <div className="modal-body">
              <div className="scrollable-content">
                <div className="modal-habitaciones-grid">
                  {filteredHabitaciones.map((habitacion) => (
                    <div key={habitacion.numerohabitacion}
                      className="habitaciones-card"
                      onClick={() => handleCheckIn(habitacion.numerohabitacion)} >
                      <div className="habitaciones-name">
                        Habitación {habitacion.numerohabitacion}
                      </div>
                      <div className="habitaciones-details">
                        Capacidad: {habitacion.capacidad} pers.
                      </div>
                      <div className="habitaciones-details">
                        Ocupación: {habitacion.numero_personas} pers.
                      </div>
                      <div className="habitaciones-details">
                       {habitacion.todoincluido ? "Todo Incluido":"Normal"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <footer className="modal-footer">
              <button onClick={closePopups} className="modal-footer-button">
                Cancelar
              </button>
            </footer>
          </div>
        </div>
      )}
      {showPaymentPopup && (
        <div className="popup-overlay">
          <div className="popup-content-with-footer" onClick={(e) => e.stopPropagation()}>
            <h2>Órdenes Pendientes de Pago</h2>
            <div className="popup-body-scrollable">
              <div className="ordenes-pendientes-grid">
                {ordenesPendientes.map((orden) => (
                  <div key={orden.id_orden} className="orden-pendiente-card">
                    <p><strong>ID Orden:</strong> {orden.id_orden}</p>
                    <p><strong>Total:</strong> {orden.preciototal} €</p>
                    <button className="pay-order-button"
                      onClick={() => handlePagarOrden(orden.id_orden)} >
                      Pagar
                    </button>
                  </div>
                ))}
                {ordenesPendientes.length === 0 && (
                  <p className="no-ordenes">No hay órdenes pendientes.</p>
                )}
              </div>
            </div>
            <div className="popup-footer">
              <button className="popup-cancel-button" onClick={closePopups}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {isPopupVisible && (
        <div className="popup-overlay" onClick={closePopups}>
          <div className="popup-content">
            <p>{popupMessage}</p>
            <button onClick={closePopups}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetalleHuesped;

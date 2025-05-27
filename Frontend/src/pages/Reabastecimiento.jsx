import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Reabastecimiento.css";
import "../styles/Modal.css";
import "../styles/Popup.css";

function Reabastecimiento() {
  const [ingredientes, setIngredientes] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/ingredientes/")
      .then((response) => response.json())
      .then((data) => {
        const sortedData = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setIngredientes(sortedData);
      })
      .catch((error) => console.error("Error al cargar ingredientes:", error));
  }, []);

  const handleModalOpen = (ingrediente, accion) => {
    if (!ingrediente.id_ingredientes) {
      console.error("El ingrediente no tiene un ID definido:", ingrediente);
      return;
    }
    setModalData({ ingrediente, accion });
    setCantidad("");
  };

  const handleModalClose = () => {
    setModalData(null);
  };

  const handleSubmit = () => {
    if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
      setPopupMessage("Introduce una cantidad válida");
      setIsPopupVisible(true);
      return;
    }

    const tipomovimiento =
      modalData.accion === "Reabastecimiento" ? "Reabastecimiento" : "Pérdida";
    const requestBody = {
      tipomovimiento: tipomovimiento,
      cantidad: parseFloat(cantidad),
    };
    const url = `http://127.0.0.1:8000/api/ingredientes/${modalData.ingrediente.id_ingredientes}/movimiento/`;

    console.log("URL:", url);
    console.log("Method: POST");
    console.log("Headers:", { "Content-Type": "application/json" });
    console.log("Body:", JSON.stringify(requestBody));
    console.log("ID Ingrediente:", modalData.ingrediente.id_ingredientes);

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((error) => {
            console.error("Error del backend:", error);
            throw new Error(error.error || "Error al actualizar el ingrediente");
          });
        }
        return response.json();
      })
      .then(() => {
        setPopupMessage("Cantidad actualizada correctamente");
        setIsPopupVisible(true);
        handleModalClose();
        return fetch("http://127.0.0.1:8000/api/ingredientes/")
          .then((res) => res.json())
          .then((data) => {
            const sortedData = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
            setIngredientes(sortedData);
          });
      })
      .catch((error) => {
        setPopupMessage(error.message);
        setIsPopupVisible(true);
      });
  };

  const handleAddNew = () => {
    if (!modalData.ingrediente || !cantidad || parseFloat(cantidad) <= 0) {
      setPopupMessage("Selecciona un ingrediente y especifica una cantidad válida");
      setIsPopupVisible(true);
      return;
    }

    try {
      fetch("http://127.0.0.1:8000/api/ingredientes/" + modalData.ingrediente.id_ingredientes + "/movimiento/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipomovimiento: modalData.accion,
          cantidad: parseFloat(cantidad),
        }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((error) => {
              throw new Error(error.error || "Error al añadir el ingrediente.");
            });
          }
          return response.json();
        })
        .then(() => {
          setPopupMessage("Cantidad actualizada correctamente");
          setIsPopupVisible(true);
          setIsPopupVisible(false);
          setModalData(null);
          setCantidad("");
          fetch("http://127.0.0.1:8000/api/ingredientes/")
            .then((res) => res.json())
            .then((data) => {
              const sortedData = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
              setIngredientes(sortedData);
            });
        })
        .catch((error) => {
          setPopupMessage(error.message);
          setIsPopupVisible(true);
        });
    } catch (err) {
      setPopupMessage(err.message);
      setIsPopupVisible(true);
    }
  };

  return (
    <div className="reabastecimiento-container">
      <h1 className="reabastecimiento-header">Reabastecimiento de Ingredientes</h1>
      <button onClick={() => navigate(-1)} className="rebastecimiento-back-button">
        Volver
      </button>
      <div className="ingredientes-grid">
        {ingredientes.map((ingrediente) => (
          <div key={ingrediente.id_ingredientes} className="ingrediente-card">
            <p>
              <strong>{ingrediente.nombre}</strong>
            </p>
            <p>Stock Actual: {ingrediente.cantidadactual}</p>
            <p>Activo: {ingrediente.activo ? "Sí" : "No"}</p>
            <div className="card-buttons">
              <button onClick={() => handleModalOpen(ingrediente, "Reabastecimiento")}>
                Añadir
              </button>
              <button onClick={() => handleModalOpen(ingrediente, "Pérdida")}>
                Retirar
              </button>
            </div>
          </div>
        ))}
      </div>
      {modalData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>
              {modalData.accion === "Reabastecimiento" ? "Añadir" : "Retirar"} Cantidad
            </h2>
            <p>Ingrediente: {modalData.ingrediente.nombre}</p>
            <label>
              Cantidad:
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </label>
            <footer className="modal-footer">
              <button className="gestion-bares-back-button" onClick={handleSubmit}>
                Confirmar
              </button>
              <button className="gestion-bares-back-button cancelar" onClick={handleModalClose}>
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
    </div>
  );
}

export default Reabastecimiento;

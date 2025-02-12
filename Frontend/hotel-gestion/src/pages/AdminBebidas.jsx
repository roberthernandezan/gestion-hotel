import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Bebidas.css";
import "../styles//Modal.css";
import "../styles/Popup.css";

function AdminBebidas() {
  const [ingredientes, setIngredientes] = useState([]);
  const [cocktails, setCocktails] = useState([]);
  const [activeTab, setActiveTab] = useState("ingredientes");
  const [editingIngrediente, setEditingIngrediente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingIngrediente, setIsAddingIngrediente] = useState(false);
  const [isAddingCocktail, setIsAddingCocktail] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [newIngrediente, setNewIngrediente] = useState({
    nombre: "",
    litrosporunidad: "",
    precioporunidad: "",
    alcohol: false,
  });
  const [newCocktail, setNewCocktail] = useState({
    nombre: "",
    precioporunidad: "",
    tienereceta: false,
  });

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [resIng, resCock] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/ingredientes/"),
        fetch("http://127.0.0.1:8000/api/cocktails/"),
      ]);

      if (!resIng.ok || !resCock.ok) {
        throw new Error("Error al cargar datos de ingredientes/cócteles");
      }

      const ingData = await resIng.json();
      const cockData = await resCock.json();

      const sortedIngredientes = Array.isArray(ingData)
        ? ingData.sort((a, b) => a.nombre.localeCompare(b.nombre))
        : [];
      const sortedCocktails = Array.isArray(cockData)
        ? cockData.sort((a, b) => a.nombre.localeCompare(b.nombre))
        : [];

      setIngredientes(sortedIngredientes);
      setCocktails(sortedCocktails);
      setLoading(false);
    } catch (err) {
      setError("Error al cargar datos.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showPopup = (message) => {
    setPopupMessage(message);
    setIsPopupVisible(true);
  };

  const handleSave = async (data) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/ingredientes/${data.id_ingredientes}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al guardar los cambios.");
      }

      showPopup("Ingrediente guardado exitosamente.");
      setEditingIngrediente(null);
      fetchData();
    } catch (err) {
      showPopup(`Error: ${err.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingIngrediente(null);
  };

  const handleAddIngrediente = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/ingredientes/crear/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newIngrediente),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear el ingrediente.");
      }

      showPopup("Ingrediente creado exitosamente.");
      setIsAddingIngrediente(false);
      setNewIngrediente({ nombre: "", litrosporunidad: "", precioporunidad: "", alcohol: false });
      fetchData();
    } catch (err) {
      showPopup(`Error: ${err.message}`);
    }
  };

  const handleAddCocktail = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/cocktails/crear/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCocktail),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear el cocktail.");
      }

      showPopup("Cocktail creado exitosamente.");
      setIsAddingCocktail(false);
      setNewCocktail({ nombre: "", precioporunidad: "", tienereceta: false });
      fetchData();
    } catch (err) {
      showPopup(`Error: ${err.message}`);
    }
  };

  const closePopup = () => {
    setIsPopupVisible(false);
  };

  if (loading) return <p>Cargando datos...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="admin-bebidas-container ">
      <h1 className="bebidas-header">Bebidas</h1>
      <button onClick={() => navigate(-1)} className="bebidas-back">
        Volver
      </button>
      <div className="bebidas-buttons">
        <button
          className={`bebidas-button ${activeTab === "ingredientes" ? "active" : ""}`}
          onClick={() => setActiveTab("ingredientes")}
        >
          Ingredientes
        </button>
        <button
          className={`bebidas-button ${activeTab === "cocktails" ? "active" : ""}`}
          onClick={() => setActiveTab("cocktails")}
        >
          Cocktails
        </button>
      </div>

      <div className="bebidas-grid">
        {activeTab === "ingredientes" && (
          <>
            <div className="bebidas-card bebidas-add-card" onClick={() => setIsAddingIngrediente(true)}>
            <p className="bebidas-add-text">+ Añadir Ingrediente</p>                
            </div>
            {ingredientes.map((item) => (
              <div
                className="bebidas-card"
                key={item.id_ingredientes}
                onClick={() => setEditingIngrediente(item)}
              >
                <div className="bebidas-name">{item.nombre}</div>
                <div className="bebidas-price">
                  Precio: {item.precioporunidad}€
                  {item.alcohol ? " (Con Alcohol)" : " (Sin Alcohol)"}
                </div>
                <div className="bebidas-price">
                  L/unidad: {item.litrosporunidad}
                  <br />
                  Stock: {item.cantidadactual} L
                  <br />
                  {item.activo ? "Activo" : "Inactivo"}
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === "cocktails" && (
          <>
            <div className="bebidas-card bebidas-add-card" onClick={() => setIsAddingCocktail(true)}>
            <p className="bebidas-add-text">+ Añadir Cocktail</p>                
            </div>
            {cocktails.map((cocktail) => (
              <div
                className="bebidas-card"
                key={cocktail.id_cocktail}
                onClick={() => navigate(`/detalle-cocktail/${cocktail.id_cocktail}`)}
              >
                <div className="bebidas-name">{cocktail.nombre}</div>
                <div className="bebidas-price">
                  Precio: {cocktail.precioporunidad} €
                  <br />
                  {cocktail.tienereceta ? "Tiene Receta" : "Sin Receta"}
                  <br />
                  {cocktail.activo ? "Activo" : "Inactivo"}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {editingIngrediente && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>Editar Ingrediente</h2>
            </header>
            <div className="modal-body">
              <label>
                Nombre:
                <input
                  type="text"
                  value={editingIngrediente.nombre}
                  onChange={(e) =>
                    setEditingIngrediente({ ...editingIngrediente, nombre: e.target.value })
                  }
                />
              </label>
              <label>
                Litros/Unidad:
                <input
                  type="number"
                  value={editingIngrediente.litrosporunidad}
                  onChange={(e) =>
                    setEditingIngrediente({
                      ...editingIngrediente,
                      litrosporunidad: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Precio/Unidad:
                <input
                  type="number"
                  value={editingIngrediente.precioporunidad}
                  onChange={(e) =>
                    setEditingIngrediente({
                      ...editingIngrediente,
                      precioporunidad: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Alcohol:
                <input
                  type="checkbox"
                  checked={editingIngrediente.alcohol}
                  onChange={(e) =>
                    setEditingIngrediente({
                      ...editingIngrediente,
                      alcohol: e.target.checked,
                    })
                  }
                />
              </label>
              <label>
                Activo:
                <input
                  type="checkbox"
                  checked={editingIngrediente.activo}
                  onChange={(e) =>
                    setEditingIngrediente({
                      ...editingIngrediente,
                      activo: e.target.checked,
                    })
                  }
                />
              </label>
            </div>
            <footer className="modal-footer">
              <button
                onClick={() => handleSave(editingIngrediente)}
                className="modal-footer-button"
              >
                Guardar
              </button>
              <button onClick={handleCancelEdit} className="modal-footer-button">
                Cancelar
              </button>
            </footer>
          </div>
        </div>
      )}

      {isAddingIngrediente && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>Añadir Ingrediente</h2>
            </header>
            <div className="modal-body">
              <label>
                Nombre:
                <input
                  type="text"
                  value={newIngrediente.nombre}
                  onChange={(e) => setNewIngrediente({ ...newIngrediente, nombre: e.target.value })}
                />
              </label>
              <label>
                Litros/Unidad:
                <input
                  type="number"
                  value={newIngrediente.litrosporunidad}
                  onChange={(e) =>
                    setNewIngrediente({ ...newIngrediente, litrosporunidad: e.target.value })
                  }
                />
              </label>
              <label>
                Precio/Unidad:
                <input
                  type="number"
                  value={newIngrediente.precioporunidad}
                  onChange={(e) =>
                    setNewIngrediente({ ...newIngrediente, precioporunidad: e.target.value })
                  }
                />
              </label>
              <label>
                Alcohol:
                <input
                  type="checkbox"
                  checked={newIngrediente.alcohol}
                  onChange={(e) =>
                    setNewIngrediente({ ...newIngrediente, alcohol: e.target.checked })
                  }
                />
              </label>
            </div>
            <footer className="modal-footer">
              <button onClick={handleAddIngrediente} className="modal-footer-button">
                Guardar
              </button>
              <button onClick={() => setIsAddingIngrediente(false)} className="modal-footer-button">
                Cancelar
              </button>
            </footer>
          </div>
        </div>
      )}

      {isAddingCocktail && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>Añadir Cocktail</h2>
            </header>
            <div className="modal-body">
              <label>
                Nombre:
                <input
                  type="text"
                  value={newCocktail.nombre}
                  onChange={(e) => setNewCocktail({ ...newCocktail, nombre: e.target.value })}
                />
              </label>
              <label>
                Precio/Unidad:
                <input
                  type="number"
                  value={newCocktail.precioporunidad}
                  onChange={(e) =>
                    setNewCocktail({ ...newCocktail, precioporunidad: e.target.value })
                  }
                />
              </label>
            </div>
            <footer className="modal-footer">
              <button onClick={handleAddCocktail} className="modal-footer-button">
                Guardar
              </button>
              <button onClick={() => setIsAddingCocktail(false)} className="modal-footer-button">
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

export default AdminBebidas;

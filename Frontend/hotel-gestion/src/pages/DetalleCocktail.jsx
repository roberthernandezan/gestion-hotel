import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Bebidas.css";
import "../styles//Modal.css";
import "../styles/Popup.css";

function DetalleCocktail() {
  const { id_cocktail } = useParams();
  const navigate = useNavigate();

  const [cocktail, setCocktail] = useState(null);
  const [ingredientes, setIngredientes] = useState([]);
  const [ingredientesActivos, setIngredientesActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingIngrediente, setEditingIngrediente] = useState(null);
  const [editingPrice, setEditingPrice] = useState(false);
  const [idIngrediente, setIdIngrediente] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newActivo, setNewActivo] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const fetchData = async () => {
    try {
      const cocktailResponse = await fetch(
        `http://127.0.0.1:8000/api/cocktail-ingredientes/${id_cocktail}/`
      );
      const ingredientesResponse = await fetch(
        `http://127.0.0.1:8000/api/ingredientes/`
      );

      const cocktailData = await cocktailResponse.json();
      const ingredientesData = await ingredientesResponse.json();

      if (!cocktailResponse.ok || !ingredientesResponse.ok) {
        throw new Error("Error al cargar los datos.");
      }

      const sortedIngredientes = cocktailData.ingredientes
        ? cocktailData.ingredientes.sort((a, b) =>
            a.id_ingredientes_nombre.localeCompare(b.id_ingredientes_nombre)
          )
        : [];
      const activos = ingredientesData.filter((ing) => ing.activo);

      setCocktail(cocktailData);
      setIngredientes(sortedIngredientes);
      setIngredientesActivos(activos);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id_cocktail]);

  const handleSave = async () => {
    if (!cantidad || parseFloat(cantidad) <= 0) {
      setPopupMessage("La cantidad debe ser mayor que 0 y válida.");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/cocktailingredientes/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_cocktail: id_cocktail,
            id_ingredientes: editingIngrediente.id_ingredientes,
            cantidad: parseFloat(cantidad),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al insertar la nueva cantidad del ingrediente.");
      }

      setEditingIngrediente(null);
      setCantidad("");
      fetchData();
    } catch (err) {
      setPopupMessage(`Error: ${err.message}`);
    }
  };

  const handleAddNew = async () => {
    if (!idIngrediente || parseFloat(cantidad) <= 0) {
      setPopupMessage("Selecciona un ingrediente y especifica una cantidad válida.");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/cocktailingredientes/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_cocktail: id_cocktail,
            id_ingredientes: idIngrediente,
            cantidad: parseFloat(cantidad),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al añadir el ingrediente.");
      }

      setIsAdding(false);
      setCantidad("");
      setIdIngrediente(null);
      fetchData();
    } catch (err) {
      setPopupMessage(`Error: ${err.message}`);
    }
  };

  const updateCocktail = async () => {

    if (newPrice && parseFloat(newPrice) < 0) {
      setPopupMessage("El precio debe ser mayor o igual a 0.");
      return;
    }

    try {
      const data = {};
      if (newPrice) data.precioporunidad = parseFloat(newPrice);
      if (newActivo !== null) data.activo = newActivo;

      const response = await fetch(`http://127.0.0.1:8000/api/cocktails/${id_cocktail}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el cóctel.");
      }

      setEditingPrice(false);
      setNewPrice("");
      setNewActivo(null);
      fetchData();
    } catch (err) {
      setPopupMessage(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (idRegistro) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/cocktailingredientes/${idRegistro}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activo: false }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al desactivar el ingrediente.");
      }

      fetchData();
    } catch (err) {
      setPopupMessage(`Error: ${err.message}`);
    }
  };

  const handleCancel = () => {
    setEditingIngrediente(null);
    setCantidad("");
  };

  if (loading) {
    return <p>Cargando cóctel...</p>;
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  return (
    <div className="detalle-cocktail-container">
      <h2 className="bebidas-header">Detalle del Cóctel</h2>
      <div className="detalle-cocktail-subcontainer">
        <strong>{cocktail.nombre}</strong>  <br />
        <strong>Versión:</strong> {cocktail.version} <br />
        <strong>Precio:</strong> {cocktail.precioporunidad} € <br />
        <strong>Estado:</strong> {cocktail.activo ? "Activo" : "Inactivo"}
      </div>
      <button className="bebidas-back" onClick={() => setEditingPrice(true)}>
        Modificar
      </button>
      <button className="bebidas-back" onClick={() => navigate(-1)}>
        Volver
      </button>
      <h5 className="bebidas-subheader">Ingredientes</h5>
      <div className="bebidas-grid">
        <div className="bebidas-card bebidas-add-card" onClick={() => setIsAdding(true)}>
        <p className="bebidas-add-text">+ Añadir Ingrediente</p>                
        </div>
        {ingredientes.map((item) => (
          <div className="bebidas-card" key={item.id_registro}>
            <div className="bebidas-name">{item.id_ingredientes_nombre}</div>
            <div className="bebidas-price">Versión: {item.version}</div>
            <div className="bebidas-price">Cantidad: {item.cantidad} L</div>
            <button
              className="bebidas-button"
              onClick={() => setEditingIngrediente(item)}
            >
              Editar
            </button>
            <button
              className="bebidas-button"
              onClick={() => handleDelete(item.id_registro)}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {editingIngrediente && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>Editar Ingrediente</h2>
            </header>
            <div className="modal-body">
              <label>
                Nueva Cantidad:
                <input type="number"
                  step="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </label>
            </div>
            <footer className="modal-footer">
              <button className="bebidas-button" onClick={handleCancel}>
                Cancelar
              </button>
              <button className="bebidas-button" onClick={handleSave}>
                Guardar
              </button>
            </footer>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>Añadir Ingrediente</h2>
            </header>
            <div className="modal-body">
              <label>
                Ingrediente:
                <select
                  value={idIngrediente}
                  onChange={(e) => setIdIngrediente(e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {ingredientesActivos.map((ing) => (
                    <option
                      key={ing.id_ingredientes}
                      value={ing.id_ingredientes}
                    >
                      {ing.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cantidad:
                <input
                  type="number"
                  step="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </label>
            </div>
            <footer className="modal-footer">
              <button
                className="bebidas-button"
                onClick={() => setIsAdding(false)}
              >
                Cancelar
              </button>
              <button className="bebidas-button" onClick={handleAddNew}>
                Añadir
              </button>
            </footer>
          </div>
        </div>
      )}

      {editingPrice && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>Modificar Cóctel</h2>
            </header>
            <div className="modal-body">
              <label>
                Nuevo Precio:
                <input type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder={cocktail.precioporunidad}
                />
              </label>
              <label>
                Estado:
                <select
                  value={newActivo}
                  onChange={(e) =>
                    setNewActivo(e.target.value === "true" ? true : false)
                  }
                >
                  <option value="">{cocktail.activo ? "Activo" : "Inactivo"}</option>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </label>
            </div>
            <footer className="modal-footer">
              <button className="bebidas-button" onClick={updateCocktail}>
                Guardar
              </button>
              <button
                className="bebidas-button"
                onClick={() => setEditingPrice(false)}
              >
                Cancelar
              </button>
            </footer>
          </div>
        </div>
      )}

      {popupMessage && (
        <div className="popup-overlay">
          <div className="popup-content">
            <p>{popupMessage}</p>
            <button
              className="bebidas-button"
              onClick={() => setPopupMessage("")}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetalleCocktail;

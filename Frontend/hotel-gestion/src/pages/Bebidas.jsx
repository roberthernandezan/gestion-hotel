import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Consumiciones.css";
import "../styles/Popup.css";

function Consumiciones() {
  const location = useLocation();
  const navigate = useNavigate();

  const { bar, empleado, asignacionId, id_orden } = location.state || {};

  const [ingredientes, setIngredientes] = useState([]);
  const [cocktails, setCocktails] = useState([]);
  const [activeTab, setActiveTab] = useState("ingredientes"); 
  const [seleccionados, setSeleccionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorPopupVisible, setErrorPopupVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const [ordenData, setOrdenData] = useState(null);

  useEffect(() => {
    if (!bar || !empleado || !asignacionId) {
      console.error("Datos incompletos. Redirigiendo a /bares.");
      navigate("/bares");
      return;
    }

    const fetchData = async () => {
      try {
        const [ingredientesRes, cocktailsRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/ingredientes/"),
          fetch("http://127.0.0.1:8000/api/cocktails/"),
        ]);
        const allIngredientes = await ingredientesRes.json();
        const allCocktails = await cocktailsRes.json();

        const ingredientesActivos = allIngredientes.filter((ing) => ing.activo === true);

        const cocktailsConRecetaActivos = allCocktails.filter(
          (c) => c.activo === true && c.tienereceta === true
        );

        setIngredientes(ingredientesActivos);
        setCocktails(cocktailsConRecetaActivos);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setErrorMessage("Error al cargar datos.");
        setErrorPopupVisible(true);
        setLoading(false);
      }
    };

    fetchData();
  }, [bar, empleado, asignacionId, navigate]);

  const agregarALista = (item) => {
    setSeleccionados((prev) => {
      const existente = prev.find((el) => el.nombre === item.nombre);
      if (existente) {
        return prev.map((el) =>
          el.nombre === item.nombre ? { ...el, cantidad: el.cantidad + 1 } : el
        );
      }
      return [...prev, { ...item, cantidad: 1 }];
    });
  };

  const calcularTotal = () => {
    return seleccionados.reduce((acc, item) => acc + item.precioporunidad * item.cantidad, 0);
  };

  const procesarOrden = async () => {
    try {
      if (seleccionados.length === 0) {
        throw new Error("No se han seleccionado productos para la orden.");
      }

      const total = calcularTotal();

      const elementos = seleccionados.map((item) => ({
        id_orden: id_orden, 
        id_cocktail: item.id_cocktail || null,
        id_ingredientes: item.id_ingredientes || null,
        cantidad: item.cantidad,
        escocktail: !!item.id_cocktail,
      }));

      let response, data;

      if (id_orden) {
        response = await fetch(
          `http://127.0.0.1:8000/api/ordenes/${id_orden}/agregar-elemento/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(elementos),
          }
        );

        if (!response.ok) {
          const errorResponse = await response.json();
          console.error("Error al agregar a la orden existente:", errorResponse);
          throw new Error(errorResponse.error || "Error al agregar elementos a la orden existente.");
        }

        data = await response.json();

        setOrdenData({
          id_orden: id_orden,
          id_asignacion: asignacionId,
          bebidas: seleccionados,
        });

        setPopupVisible(true);
        setSeleccionados([]);
      } else {
        const payload = {
          id_asignacion: asignacionId,
          id_bar: bar.id_bar,
          id_empleado: empleado.id_empleado,
          preciototal: total,
          elementos: elementos,
        };

        response = await fetch("http://127.0.0.1:8000/api/crear-orden-con-elementos/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorResponse = await response.json();
          console.error("Error al crear la nueva orden:", errorResponse);
          throw new Error(errorResponse.error || "Error al crear la nueva orden.");
        }

        data = await response.json();

        setOrdenData({
          id_orden: data.id_orden,
          id_asignacion: asignacionId,
          bebidas: seleccionados,
        });

        setPopupVisible(true);
        setSeleccionados([]);
      }
    } catch (error) {
      console.error("Error al procesar la orden:", error);
      setErrorMessage(error.message || "Error al procesar la orden.");
      setErrorPopupVisible(true);
    }
  };

  const eliminarSeleccionado = (idx) => {
    setSeleccionados((prev) => {
      const nuevoArray = [...prev];
      const itemEliminado = nuevoArray[idx];
      nuevoArray.splice(idx, 1);

      return nuevoArray;
    });
  };

  const cerrarPopupYNavegar = () => {
    setPopupVisible(false);
    navigate(`/home`, {
      state: {
        bar,
        empleado,
        id_orden,
        asignacionId,
      },
    });
  };

  const cerrarErrorPopup = () => {
    setErrorPopupVisible(false);
    setErrorMessage("");
  };

  if (loading) return <p className="consumiciones-loading">Cargando datos...</p>;

  return (
    <div className="consumiciones-layout">
      <div className="consumiciones-content">
        <h1 className="consumiciones-header">Selecciona Consumiciones</h1>
        <button className="consumiciones-back" onClick={() => navigate(-1)}>
          Volver
        </button>
        <div className="consumiciones-tab-buttons">
          <button
            className={`consumiciones-tab-button ${activeTab === "ingredientes" ? "active" : ""}`}
            onClick={() => setActiveTab("ingredientes")}
          >
            Ingredientes
          </button>
          <button
            className={`consumiciones-tab-button ${activeTab === "cocktails" ? "active" : ""}`}
            onClick={() => setActiveTab("cocktails")}
          >
            Cocktails
          </button>
        </div>
        <div className="consumiciones-grid">
          {activeTab === "ingredientes" &&
            ingredientes.map((item) => (
              <div
                key={item.id_ingredientes}
                className="consumiciones-card"
                onClick={() => agregarALista(item)}
              >
                <div className="card-title">{item.nombre}</div>
                <div className="card-details">Precio: {item.precioporunidad}€</div>
                <div className="card-details">
                  {item.alcohol ? "Con Alcohol" : "Sin Alcohol"}
                </div>
                <div className="card-details">L/unidad: {item.litrosporunidad}</div>
                <div className="card-details">Stock: {item.cantidadactual} L</div>
              </div>
            ))}
          {activeTab === "cocktails" &&
            cocktails.map((item) => (
              <div
                key={item.id_cocktail}
                className="consumiciones-card"
                onClick={() => agregarALista(item)}
              >
                <div className="card-title">{item.nombre}</div>
                <div className="card-details">Precio: {item.precioporunidad}€</div>
              </div>
            ))}
        </div>
      </div>
      <div className="consumiciones-sidebar">
        <h3>Productos Seleccionados</h3>
        <ul>
          {seleccionados.map((item, idx) => (
            <li key={idx}>
              <span>
                {item.nombre} x {item.cantidad}
              </span>
              <button onClick={() => eliminarSeleccionado(idx)}>X</button>
            </li>
          ))}
        </ul>
        <div className="consumiciones-total">Total: {calcularTotal()} €</div>
        <button className="consumiciones-process-button" onClick={procesarOrden}>
          Procesar Orden
        </button>
      </div>

      {popupVisible && ordenData && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Orden Procesada</h2>
            <p>
              <strong>ID Orden:</strong> {ordenData.id_orden}
            </p>
            <p>
              <strong>Asignación ID:</strong> {ordenData.id_asignacion}
            </p>
            <h3>Bebidas Insertadas:</h3>
            <ul>
              {ordenData.bebidas.map((item, idx) => (
                <li key={idx}>
                  {item.nombre} x {item.cantidad}
                </li>
              ))}
            </ul>
            <button onClick={cerrarPopupYNavegar}>Cerrar y Continuar</button>
          </div>
        </div>
      )}

      {errorPopupVisible && (
        <div className="popup-overlay" onClick={cerrarErrorPopup}>
          <div className="popup-content error" onClick={(e) => e.stopPropagation()}>
            <h2>Error</h2>
            <p>{errorMessage}</p>
            <button className="popup-cancel-button" onClick={cerrarErrorPopup}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Consumiciones;

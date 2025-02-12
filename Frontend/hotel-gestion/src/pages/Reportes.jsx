import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Reportes.css";
import "../styles//Modal.css";

function Reportes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateReport = async (endpoint, filename) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/reportes/${endpoint}/`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al generar el reporte.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${filename}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEstadisticoReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/reportes/estadistico/", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al generar el reporte estadístico.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "reporte_estadistico.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePredictions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/reportes/predicciones/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al generar predicciones.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "predicciones_12_meses.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReabastecimientoReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/reportes/reabastecimiento/", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al generar el reporte de reabastecimiento.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "reporte_reabastecimiento.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHistorialOrdenes = () => {
    navigate("/admin/registroordenes");
  };

  const handleHistorialMovimientos = () => {
    navigate("/admin/registromovimientos");
  };

  return (
    <div className="reportes-container">
      <div className="reportes-header">
        <h1>Gestión de Reportes</h1>
      </div>
      <button onClick={() => window.history.back()} className="reportes-back-button">
        Volver
      </button>
      {error && <p className="reportes-error">{error}</p>}
      {loading ? (
        <p className="reportes-loading">Generando reporte, por favor espera...</p>
      ) : (
        <div className="reportes-content">
          <div className="reportes-section">
            <h2>Reportes Generales</h2>
            <button
              className="reportes-button"
              onClick={handleGenerateEstadisticoReport}
            >
              Reporte Estadístico
            </button>
            <br />
            <button
              className="reportes-button"
              onClick={() => handleGenerateReport("consumos-historicos", "consumos_historicos")}
            >
              Reporte de Consumo Histórico
            </button>
            <br />
            <button
              className="reportes-button"
              onClick={() => handleGenerateReport("stock-actual", "stock_actual")}
            >
              Reporte de Stock Actual
            </button>
            <h2>Predicciones</h2>
            <button className="reportes-button" onClick={handleGeneratePredictions}>
              Predicciones Anuales
            </button>
            <h2>Reabastecimiento</h2>
            <button className="reportes-button" onClick={handleGenerateReabastecimientoReport}>
              Reporte de Reabastecimiento
            </button>
            <h2>Historial</h2>
            <button className="reportes-button" onClick={handleHistorialOrdenes}>
              Registro Órdenes
            </button>
            <br />
            <button className="reportes-button" onClick={handleHistorialMovimientos}>
              Registro Movimientos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reportes;
